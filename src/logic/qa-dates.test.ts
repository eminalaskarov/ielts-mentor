/** QA: date edge cases across the whole plan year (Asia/Baku, device-timezone independent). */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG, SCHEDULES, CHECKPOINTS } from '../data';
import { addDays, bakuDate, bakuMidnightMs, bakuTime, dateRange, daysBetween, lastFridayOfMonth, weekdayOf, weeksBetween, isISODate } from './dates';
import { countableBlocks, phaseForDate, resolveDay } from './plan';

const cfg = { startDate: DEFAULT_CONFIG.startDate, examDate: DEFAULT_CONFIG.examDate };
const ctx = { murphyUnitsDone: 0, weakSkill: null, weakFocus: false };
afterEach(() => vi.useRealTimers());

describe('Baku clock', () => {
  it('rolls over at 20:00 UTC (00:00 Baku), not at device midnight', () => {
    expect(bakuDate(Date.parse('2026-11-23T19:59:59Z'))).toBe('2026-11-23');
    expect(bakuDate(Date.parse('2026-11-23T20:00:00Z'))).toBe('2026-11-24');
    expect(bakuDate(Date.parse('2026-11-22T20:00:00Z'))).toBe('2026-11-23');
    expect(bakuTime(Date.parse('2026-11-23T20:00:00Z'))).toBe('00:00');
  });
  it('same instant -> same Baku date regardless of process TZ (run with TZ=Pacific/Kiritimati / America/Los_Angeles too)', () => {
    // 2027-03-01 00:30 Baku == 2027-02-28 20:30 UTC (still Feb 28 in UTC/Europe/US)
    expect(bakuDate(Date.parse('2027-02-28T20:30:00Z'))).toBe('2027-03-01');
    expect(phaseForDate(bakuDate(Date.parse('2027-02-28T20:30:00Z')), cfg)).toBe(2);
    expect(bakuDate(Date.parse('2027-06-30T20:00:00Z'))).toBe('2027-07-01');
    expect(bakuDate(Date.parse('2027-09-30T20:00:00Z'))).toBe('2027-10-01');
  });
  it('fake timers: Date.now() drives bakuDate default', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2027-03-01T19:59:00Z')); // 23:59 Baku on 1 Mar
    expect(bakuDate()).toBe('2027-03-01');
    vi.setSystemTime(new Date('2027-03-01T20:01:00Z'));
    expect(bakuDate()).toBe('2027-03-02');
  });
  it('bakuMidnightMs round-trips for every date in the year (no DST drift)', () => {
    for (const d of dateRange('2026-11-01', '2027-12-05')) {
      expect(bakuDate(bakuMidnightMs(d))).toBe(d);
      expect(bakuDate(bakuMidnightMs(d) - 1)).toBe(addDays(d, -1));
    }
  });
  it('addDays/daysBetween are exact across month ends and 2027 (non-leap) Feb', () => {
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(daysBetween('2026-11-23', '2027-11-20')).toBe(362);
    expect(isISODate('2027-02-29')).toBe(false);
  });
});

describe('whole-year sweep 2026-11-23 .. 2027-11-30', () => {
  const days = dateRange('2026-11-23', '2027-11-30');
  it('resolves every day without exception, with a valid plan', () => {
    expect(days.length).toBe(373);
    const ids = new Set<string>();
    for (const d of days) {
      const r = resolveDay(d, cfg, ctx);
      if (d > cfg.examDate) {
        expect(r.kind).toBe('post-exam');
        continue;
      }
      expect(r.phase, d).not.toBeNull();
      expect(r.dayNumber).toBe(daysBetween(cfg.startDate, d) + 1);
      expect(r.weekday).toBe(weekdayOf(d));
      expect(r.blocks.length, d).toBeGreaterThan(0);
      for (const b of r.blocks) {
        expect(b.minutes, `${d} ${b.id}`).toBeGreaterThanOrEqual(0);
        expect(b.title, `${d} ${b.id}`).toBeTruthy();
        expect(b.id, `${d}`).toBeTruthy();
      }
      // block ids unique within the day (blockLogs key is date|blockId)
      expect(new Set(r.blocks.map((b) => b.id)).size, `dup block id ${d}`).toBe(r.blocks.length);
      expect(r.label).not.toMatch(/undefined|NaN/);
      expect(JSON.stringify(r)).not.toMatch(/undefined|NaN/);
      ids.add(r.phase + r.kind);
    }
  });
  it('phase is monotonic non-decreasing and covers 1..4', () => {
    let prev = 0;
    for (const d of dateRange('2026-11-23', '2027-11-20')) {
      const p = phaseForDate(d, cfg)!;
      expect(p).toBeGreaterThanOrEqual(prev);
      prev = p;
    }
    expect(prev).toBe(4);
  });
  it('Sundays outside the final week are rest days; phase 1-2 Sundays have a vocab review, phase 3-4 auto-kept', () => {
    for (const d of days) {
      if (d > cfg.examDate || weekdayOf(d) !== 'sun') continue;
      const r = resolveDay(d, cfg, ctx);
      if (r.kind === 'final-week') continue;
      expect(r.kind, d).toBe('rest');
      expect(r.autoKept).toBe(r.phase! >= 3);
      // brief: Sunday = rest + 15 min vocab review (also phase 3 per user decision)
      const review = r.blocks.filter((b) => b.activity.startsWith('vocab') && !b.extra);
      expect(review.length, `${d} needs a vocab review block`).toBeGreaterThan(0);
      expect(review.reduce((s, b) => s + b.minutes, 0), d).toBe(15);
    }
  });
  it('Mon-Sat are never rest days outside final week', () => {
    for (const d of days) {
      if (d > cfg.examDate || weekdayOf(d) === 'sun') continue;
      const r = resolveDay(d, cfg, ctx);
      if (r.kind === 'final-week') continue;
      expect(r.kind, d).toBe('study');
      expect(countableBlocks(r).length, d).toBeGreaterThan(0);
    }
  });
  it('checkpoints: each is on a Saturday inside its window; Feb/Jun/Sep are the last Saturday of their month', () => {
    for (const c of CHECKPOINTS.filter((x) => !x.useExamDate)) {
      expect(weekdayOf(c.date), c.id).toBe('sat');
      expect(c.date >= c.window.start && c.date <= c.window.end, c.id).toBe(true);
      const r = resolveDay(c.date, cfg, ctx);
      expect(r.checkpoint?.id, c.id).toBe(c.id);
      expect(r.blocks.some((b) => b.checkpointId === c.id)).toBe(true);
    }
    for (const id of ['cp-feb-2027', 'cp-jun-2027', 'cp-sep-2027']) {
      const c = CHECKPOINTS.find((x) => x.id === id)!;
      expect(addDays(c.date, 7).slice(0, 7), id).not.toBe(c.date.slice(0, 7));
    }
  });
  it('final week: exam-7 .. exam, exam day flagged, nothing after', () => {
    const exam = cfg.examDate;
    expect(resolveDay(addDays(exam, -8), cfg, ctx).kind).not.toBe('final-week');
    for (let n = 7; n >= 0; n--) {
      const r = resolveDay(addDays(exam, -n), cfg, ctx);
      expect(r.kind).toBe('final-week');
      expect(r.daysToExam).toBe(n);
      expect(r.finalWeekStage, `n=${n}`).toBeDefined();
    }
    expect(resolveDay(exam, cfg, ctx).label).toBe('Exam day');
    expect(resolveDay(addDays(exam, 1), cfg, ctx).kind).toBe('post-exam');
  });
  it('final week still works if the user moves the exam date (e.g. onto a Sunday, or into phase 3)', () => {
    for (const exam of ['2027-11-21', '2027-09-18', '2027-03-01', '2027-02-27', '2026-12-05']) {
      const c = { startDate: '2026-11-23', examDate: exam };
      for (const d of dateRange('2026-11-23', addDays(exam, 3))) {
        expect(() => resolveDay(d, c, ctx), `${exam} ${d}`).not.toThrow();
      }
      expect(resolveDay(exam, c, ctx).label).toBe('Exam day');
    }
  });
  it('monthly mistake review falls on the last Friday of each month and nowhere else', () => {
    for (const d of days) {
      if (d > cfg.examDate) continue;
      const r = resolveDay(d, cfg, ctx);
      if (r.kind === 'final-week') continue;
      expect(r.monthlyMistakeReview, d).toBe(d === lastFridayOfMonth(d));
      if (r.monthlyMistakeReview) expect(weekdayOf(d)).toBe('fri');
    }
  });
  it('Task 1 rotation: weeksBetween is Monday-based (Sunday 7 Mar belongs to the week of 1 Mar)', () => {
    expect(weeksBetween('2027-03-01', '2027-03-07')).toBe(0);
    expect(weeksBetween('2027-03-01', '2027-03-08')).toBe(1);
    expect(weeksBetween('2027-03-01', '2027-02-28')).toBe(-1);
  });
  it('weak-skill focus + Murphy pointer at extremes never throws over the whole year', () => {
    for (const units of [0, 73, 145]) {
      for (const weak of ['listening', 'reading', 'writing', 'speaking'] as const) {
        for (const d of days) {
          if (d > cfg.examDate) continue;
          resolveDay(d, cfg, { murphyUnitsDone: units, weakSkill: weak, weakFocus: true, task1ChartScores: { line: 5, bar: 6, pie: 6, table: 6, process: 6, map: 6 } as never });
        }
      }
    }
  });
  it('schedules exist for every phase/weekday', () => {
    for (const p of [1, 2, 3, 4] as const) for (const w of ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const) expect(SCHEDULES[p].days[w]).toBeDefined();
  });
});

describe('start-date / config robustness', () => {
  it('starting later than phase boundary skips phases cleanly', () => {
    const c = { startDate: '2027-07-01', examDate: '2027-11-20' };
    expect(phaseForDate('2027-07-01', c)).toBe(3);
    expect(resolveDay('2027-07-01', c, ctx).dayNumber).toBe(1);
  });
  it('before-start day returns empty blocks, not an exception', () => {
    const r = resolveDay('2026-11-22', cfg, ctx);
    expect(r.blocks).toEqual([]);
  });
});
