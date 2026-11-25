/**
 * Day status and streaks (mentor rules "day-status", "streaks", "never-two-in-a-row"; ux-spec §5.1).
 * Pure functions.
 *
 * Kept day = at least one planned (non-rest) block checked OR a word-card review done that day.
 * Phase 3–4 Sundays, final-week day −1 and exam day are kept automatically.
 * One missed day does not break the streak ("held", golden rule 8), at most 1 grace day per 7 days.
 * A second missed day in a row resets the current streak to 0. Best streak is kept forever.
 */
import type { ISODate } from '../data';
import { addDays, daysBetween } from './dates';

export type DayStatus = 'done' | 'partial' | 'missed' | 'kept-rest' | 'pending' | 'ignored';

export interface DayStatusInput {
  /** 'pre-start' / 'post-exam' are ignored. */
  kind: 'pre-start' | 'study' | 'rest' | 'final-week' | 'post-exam';
  autoKept: boolean;
  /** Ids of countable (non-rest, non-extra) blocks for the day. */
  countableIds: string[];
  /** Ids of all blocks marked done that day (any). */
  doneIds: string[];
  /** A word-card review happened that day. */
  reviewed: boolean;
  /** True when the date is today (day not over yet). */
  isToday: boolean;
}

export function dayStatus(d: DayStatusInput): DayStatus {
  if (d.kind === 'pre-start' || d.kind === 'post-exam') return 'ignored';
  const done = new Set(d.doneIds);
  const doneCountable = d.countableIds.filter((id) => done.has(id)).length;
  if (d.countableIds.length > 0 && doneCountable === d.countableIds.length) return 'done';
  if (doneCountable > 0) return 'partial';
  if (d.autoKept) return 'kept-rest';
  if (d.kind === 'rest') {
    // Rest day (phase 1–2 Sunday): kept when the vocabulary review is done.
    if (d.reviewed || d.doneIds.length > 0) return 'kept-rest';
    return d.isToday ? 'pending' : 'missed';
  }
  if (d.reviewed || d.doneIds.length > 0) return 'partial';
  return d.isToday ? 'pending' : 'missed';
}

export function isKept(s: DayStatus): boolean {
  return s === 'done' || s === 'partial' || s === 'kept-rest';
}

export interface StreakResult {
  current: number;
  best: number;
  /** The latest evaluated day was a missed day that was forgiven (streak is "on hold"). */
  onHold: boolean;
  /** The last kept day came right after a forgiven missed day ("Streak saved"). */
  saved: boolean;
  /** Number of consecutive missed days ending yesterday (0 if yesterday was kept). */
  missedRun: number;
}

/**
 * statuses: map date → status for every date from the plan start to today.
 * Today counts only if already kept (a pending today never breaks anything).
 */
export function computeStreak(statuses: Map<ISODate, DayStatus>, from: ISODate, today: ISODate, graceWindowDays = 7): StreakResult {
  let current = 0;
  let best = 0;
  let missRun = 0;
  let lastGrace: ISODate | null = null;
  let onHold = false;
  let saved = false;
  const n = daysBetween(from, today);
  for (let i = 0; i <= n; i++) {
    const date = addDays(from, i);
    const s = statuses.get(date) ?? (date === today ? 'pending' : 'missed');
    if (s === 'ignored' || s === 'pending') continue;
    if (isKept(s)) {
      saved = missRun === 1 && onHold;
      current += 1;
      missRun = 0;
      onHold = false;
      best = Math.max(best, current);
    } else {
      missRun += 1;
      saved = false;
      const graceOk = missRun === 1 && (lastGrace === null || daysBetween(lastGrace, date) >= graceWindowDays);
      if (graceOk && current > 0) {
        lastGrace = date;
        onHold = true;
      } else {
        current = 0;
        onHold = false;
      }
    }
  }
  // missedRun ending yesterday
  let missedRun = 0;
  for (let i = 1; i <= n; i++) {
    const s = statuses.get(addDays(today, -i));
    if (s === 'missed') missedRun++;
    else if (s === 'ignored' || s === undefined) break;
    else break;
  }
  return { current, best, onHold, saved, missedRun };
}

/** Consecutive days with a word-card review, ending today (or yesterday if today not done yet). */
export function vocabStreak(reviewDates: Set<ISODate>, today: ISODate): number {
  let d = reviewDates.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (reviewDates.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}
