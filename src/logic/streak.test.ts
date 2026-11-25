import { describe, expect, it } from 'vitest';
import { addDays } from './dates';
import { computeStreak, dayStatus, vocabStreak } from './streak';
import type { DayStatus } from './streak';

function build(from: string, pattern: string): Map<string, DayStatus> {
  // k = kept, m = missed, p = pending (today), i = ignored
  const m = new Map<string, DayStatus>();
  [...pattern].forEach((c, i) => {
    m.set(addDays(from, i), c === 'k' ? 'done' : c === 'm' ? 'missed' : c === 'p' ? 'pending' : 'ignored');
  });
  return m;
}
const F = '2026-11-23';
const todayOf = (p: string) => addDays(F, p.length - 1);

describe('dayStatus', () => {
  const base = { kind: 'study' as const, autoKept: false, countableIds: ['a', 'b', 'c'], doneIds: [], reviewed: false, isToday: false };
  it('done / partial / missed / pending', () => {
    expect(dayStatus({ ...base, doneIds: ['a', 'b', 'c'] })).toBe('done');
    expect(dayStatus({ ...base, doneIds: ['a'] })).toBe('partial');
    expect(dayStatus({ ...base, reviewed: true })).toBe('partial');
    expect(dayStatus(base)).toBe('missed');
    expect(dayStatus({ ...base, isToday: true })).toBe('pending');
  });
  it('rest day needs vocab review unless auto-kept', () => {
    const rest = { ...base, kind: 'rest' as const, countableIds: ['v'] };
    expect(dayStatus({ ...rest, doneIds: ['v'] })).toBe('done');
    expect(dayStatus({ ...rest, reviewed: true })).toBe('kept-rest');
    expect(dayStatus(rest)).toBe('missed');
    expect(dayStatus({ ...rest, autoKept: true })).toBe('kept-rest');
  });
  it('pre-start ignored', () => {
    expect(dayStatus({ ...base, kind: 'pre-start' })).toBe('ignored');
  });
});

describe('computeStreak', () => {
  it('counts consecutive kept days; pending today does not break', () => {
    const p = 'kkkkp';
    const r = computeStreak(build(F, p), F, todayOf(p));
    expect(r.current).toBe(4);
    expect(r.best).toBe(4);
    expect(r.missedRun).toBe(0);
  });
  it('one missed day is held (grace), then saved', () => {
    const p1 = 'kkkmp';
    const r1 = computeStreak(build(F, p1), F, todayOf(p1));
    expect(r1.current).toBe(3);
    expect(r1.onHold).toBe(true);
    expect(r1.missedRun).toBe(1);
    const p2 = 'kkkmk';
    const r2 = computeStreak(build(F, p2), F, todayOf(p2));
    expect(r2.current).toBe(4);
    expect(r2.saved).toBe(true);
  });
  it('two missed days in a row reset to 0; best is kept', () => {
    const p = 'kkkkkmmp';
    const r = computeStreak(build(F, p), F, todayOf(p));
    expect(r.current).toBe(0);
    expect(r.best).toBe(5);
    expect(r.missedRun).toBe(2);
  });
  it('only 1 grace day per 7 days', () => {
    const p = 'kkmkkmkp';
    const r = computeStreak(build(F, p), F, todayOf(p));
    // second miss (3 days after the first grace) resets
    expect(r.current).toBe(1);
    const p2 = 'kkmkkkkkkmkp';
    const r2 = computeStreak(build(F, p2), F, todayOf(p2));
    expect(r2.current).toBe(9);
  });
});

describe('vocabStreak', () => {
  it('counts back from today or yesterday', () => {
    const s = new Set(['2026-11-23', '2026-11-24', '2026-11-25']);
    expect(vocabStreak(s, '2026-11-25')).toBe(3);
    expect(vocabStreak(s, '2026-11-26')).toBe(3);
    expect(vocabStreak(s, '2026-11-27')).toBe(0);
  });
});
