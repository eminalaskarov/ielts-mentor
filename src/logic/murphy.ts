/** Murphy pace (rule "murphy-pace"): expected units vs units done in phase 1. Pure. */
import { MENTOR_RULES, MURPHY_PLAN, WEEKDAY_BY_JS_DAY, resolvePhaseRanges } from '../data';
import type { AppConfig, ISODate } from '../data';
import { addDays, daysBetween, jsDay } from './dates';

const BEHIND_THRESHOLD = Number(MENTOR_RULES.find((r) => r.id === 'murphy-pace')?.params.behindThreshold ?? 4);

function isNewUnitDay(date: ISODate): boolean {
  return (MURPHY_PLAN.newUnitDays as readonly string[]).includes(WEEKDAY_BY_JS_DAY[jsDay(date)]);
}

function countSessions(from: ISODate, toExclusive: ISODate): number {
  let n = 0;
  const days = daysBetween(from, toExclusive);
  for (let i = 0; i < days; i++) if (isNewUnitDay(addDays(from, i))) n++;
  return n;
}

export interface MurphyPace {
  /** Units expected to be done before this date. */
  expected: number;
  behindBy: number;
  unitsToday: number;
  finished: boolean;
}

export function murphyPace(date: ISODate, config: Pick<AppConfig, 'startDate' | 'examDate'>, unitsDone: number): MurphyPace {
  const total = MURPHY_PLAN.totalUnits;
  const finished = unitsDone >= total;
  const r = resolvePhaseRanges(config)[1];
  if (!r) return { expected: 0, behindBy: 0, unitsToday: MURPHY_PLAN.defaultUnitsPerSession, finished };
  const all = countSessions(r.start, addDays(r.end, 1));
  const end = date > r.end ? addDays(r.end, 1) : date;
  const soFar = date < r.start ? 0 : countSessions(r.start, end);
  const expected = all > 0 ? Math.floor((total * soFar) / all) : 0;
  const behindBy = Math.max(0, expected - unitsDone);
  const unitsToday = behindBy >= BEHIND_THRESHOLD ? MURPHY_PLAN.catchUpUnitsPerSession : MURPHY_PLAN.defaultUnitsPerSession;
  return { expected, behindBy, unitsToday, finished };
}
