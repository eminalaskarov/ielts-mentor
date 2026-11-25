import type { AppConfig, DateRange, PhaseId } from './types';

/**
 * Default configuration. The user can change startDate, examDate, examFormat etc. in Settings.
 * examDate default is an ASSUMPTION (the plan only says "November 2027"): Saturday 2027-11-20.
 */
export const DEFAULT_CONFIG: AppConfig = {
  startDate: '2026-11-23',
  examDate: '2027-11-20',
  examStartTime: '09:00',
  examFormat: 'undecided',
  timezone: 'Asia/Baku',
  targetOverall: 7.0,
};

/** Asia/Baku is UTC+4 all year (no daylight saving since 2016). */
export const BAKU_UTC_OFFSET_MINUTES = 240;

/**
 * Fixed calendar boundaries from the plan.
 * Phase 1: start → end of February; Phase 2: March–June; Phase 3: July–September; Phase 4: October → exam.
 */
export const PHASE_CALENDAR = {
  phase1End: '2027-02-28',
  phase2Start: '2027-03-01',
  phase2End: '2027-06-30',
  phase3Start: '2027-07-01',
  phase3End: '2027-09-30',
  phase4Start: '2027-10-01',
} as const;

/** Task 1 rotation week 1 starts on the Monday of the first phase 2 week. */
export const TASK1_ROTATION_ANCHOR = '2027-03-01';

/** Number of days in the "final week" override (exam day minus 7 … exam day). */
export const FINAL_WEEK_DAYS = 7;

/**
 * Resolve phase date ranges from config. Pure function, ISO string comparison only.
 * - Phase 1 starts at config.startDate (if it is after 2027-02-28, phase 1 is empty and skipped).
 * - Phase 4 ends at config.examDate.
 * Returns only non-empty phases.
 */
export function resolvePhaseRanges(config: Pick<AppConfig, 'startDate' | 'examDate'>): Record<PhaseId, DateRange | null> {
  const c = PHASE_CALENDAR;
  const clamp = (r: DateRange): DateRange | null => {
    const start = r.start < config.startDate ? config.startDate : r.start;
    const end = r.end > config.examDate ? config.examDate : r.end;
    return start <= end ? { start, end } : null;
  };
  return {
    1: clamp({ start: config.startDate, end: c.phase1End }),
    2: clamp({ start: c.phase2Start, end: c.phase2End }),
    3: clamp({ start: c.phase3Start, end: c.phase3End }),
    4: clamp({ start: c.phase4Start, end: config.examDate }),
  };
}
