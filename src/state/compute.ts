/**
 * Pure app-state computation (no React, no DB). Used by the useAppState hook, by the backup import
 * dry-run (a file that would crash this is rejected before anything is replaced) and by the
 * performance test with a year of data.
 */
import type { BlockLog, CardRec, Essay, Mistake, ReviewRec, Settings, TestLog } from '../db/db';
import { addDays, dateRange } from '../logic/dates';
import { countableBlocks, phaseForDate, resolveDay, resolvedCheckpoints } from '../logic/plan';
import type { PlanContext, ResolvedDay } from '../logic/plan';
import { computeStreak, dayStatus, vocabStreak } from '../logic/streak';
import type { DayStatus, StreakResult } from '../logic/streak';
import { buildPlanContext, quizSignals } from '../logic/context';
import type { QuizSignals } from '../logic/context';
import type { WeakSkillResult } from '../logic/assessment';
import { buildQueue } from '../logic/deck';
import type { Queue } from '../logic/deck';
import { retention, shouldPauseNewWords } from '../logic/srs';
import { VOCAB_CARDS } from '../content';
import type { ISODate } from '../data';

/** Reviews older than this are not needed for anything except the review-date set. */
export const RECENT_REVIEW_DAYS = 30;

export interface StateInputs {
  settings: Settings;
  logs: BlockLog[];
  tests: TestLog[];
  essays: Essay[];
  mistakes: Mistake[];
  /** Reviews with date >= today − RECENT_REVIEW_DAYS (retention, new cards introduced today). */
  recentReviews: ReviewRec[];
  /** Every distinct date that has at least one review (from the `date` index, keys only). */
  reviewDates: ISODate[];
  cards: CardRec[];
}

export interface AppState {
  settings: Settings;
  today: ISODate;
  ctx: PlanContext;
  weak: WeakSkillResult;
  day: ResolvedDay;
  logsByDate: Map<ISODate, BlockLog[]>;
  doneToday: Set<string>;
  statuses: Map<ISODate, DayStatus>;
  streak: StreakResult;
  vocabStreak: number;
  reviewDates: Set<ISODate>;
  cards: CardRec[];
  queue: Queue;
  /** Paused new words (rule vocab-load). */
  pauseNew: boolean;
  checkpointsLogged: Set<string>;
  /** Mistake-notebook signals for the quiz topic resolver. */
  quizSignals: QuizSignals;
}

/**
 * Cache of past-day statuses. A past day's status only changes when the plan config/context,
 * its ticked blocks or its review flag change, so each entry stores that signature.
 */
export class DayStatusCache {
  private m = new Map<ISODate, { sig: string; status: DayStatus }>();
  get(date: ISODate, sig: string, compute: () => DayStatus): DayStatus {
    const hit = this.m.get(date);
    if (hit && hit.sig === sig) return hit.status;
    const status = compute();
    this.m.set(date, { sig, status });
    return status;
  }
  get size(): number {
    return this.m.size;
  }
}

export function computeAppState(inp: StateInputs, today: ISODate, now: number, cache: DayStatusCache = new DayStatusCache()): AppState {
  const { settings, logs, tests, essays, mistakes, recentReviews, cards } = inp;
  const config = { startDate: settings.startDate, examDate: settings.examDate };
  const phase = phaseForDate(today, config);
  const { ctx, weak } = buildPlanContext({ settings, today, phase, tests, essays, mistakes });
  const day = resolveDay(today, config, ctx);

  const logsByDate = new Map<ISODate, BlockLog[]>();
  for (const l of logs) {
    const arr = logsByDate.get(l.date);
    if (arr) arr.push(l);
    else logsByDate.set(l.date, [l]);
  }
  const reviewDates = new Set(inp.reviewDates);
  const doneOn = (d: ISODate) => (logsByDate.get(d) ?? []).filter((l) => l.done).map((l) => l.blockId);

  const ctxKey = JSON.stringify([config, ctx]);
  const statuses = new Map<ISODate, DayStatus>();
  const from = settings.startDate < today ? settings.startDate : today;
  const evalFrom = settings.firstUseDate && settings.firstUseDate > from ? settings.firstUseDate : from;
  for (const d of dateRange(from, today)) {
    if (d < evalFrom) {
      statuses.set(d, 'ignored');
      continue;
    }
    const doneIds = doneOn(d);
    const reviewed = reviewDates.has(d);
    const compute = () => {
      const rd = d === today ? day : resolveDay(d, config, ctx);
      return dayStatus({
        kind: rd.kind,
        autoKept: rd.autoKept,
        countableIds: countableBlocks(rd).map((b) => b.id),
        doneIds,
        reviewed,
        isToday: d === today,
      });
    };
    statuses.set(d, d === today ? compute() : cache.get(d, `${ctxKey}|${doneIds.join(',')}|${reviewed ? 1 : 0}`, compute));
  }
  const streak = computeStreak(statuses, from, today);

  const since = addDays(today, -RECENT_REVIEW_DAYS);
  const recent = recentReviews.filter((r) => r.date >= since);
  const ret = retention(recent);
  const dueAll = cards.filter((c) => c.srs.state !== 'new' && (c.srs.state === 'review' ? c.srs.due <= today : c.srs.dueAt <= now)).length;
  const pauseNew = shouldPauseNewWords(dueAll, ret);
  const newIntroducedToday = recent.filter((r) => r.date === today && r.prevState === 'new').length;
  const queue = buildQueue({
    cards,
    builtins: VOCAB_CARDS,
    phase: phase ?? (today < settings.startDate ? 1 : 4),
    now,
    newPerDay: settings.newCardsPerDay,
    newIntroducedToday,
    maxReviews: settings.maxReviews,
    pauseNew,
  });

  const cps = resolvedCheckpoints(config);
  const checkpointsLogged = new Set(tests.map((t) => t.checkpointId).filter((x): x is string => !!x && cps.some((c) => c.id === x)));

  return {
    settings,
    today,
    ctx,
    weak,
    day,
    logsByDate,
    doneToday: new Set(doneOn(today)),
    statuses,
    streak,
    vocabStreak: vocabStreak(reviewDates, today),
    reviewDates,
    cards,
    queue,
    pauseNew,
    checkpointsLogged,
    quizSignals: quizSignals(mistakes, today),
  };
}
