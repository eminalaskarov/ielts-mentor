import { describe, expect, it } from 'vitest';
import { addDays, bakuDate, daysBetween, formatClock, lastFridayOfMonth, mondayOf, weekdayOf, weeksBetween, isISODate } from './dates';

describe('dates (Asia/Baku)', () => {
  it('bakuDate switches at Baku midnight (20:00 UTC)', () => {
    expect(bakuDate(Date.parse('2026-11-22T19:59:59Z'))).toBe('2026-11-22');
    expect(bakuDate(Date.parse('2026-11-22T20:00:00Z'))).toBe('2026-11-23');
  });
  it('weekday of plan start is Monday', () => {
    expect(weekdayOf('2026-11-23')).toBe('mon');
    expect(weekdayOf('2026-11-29')).toBe('sun');
    expect(weekdayOf('2027-11-20')).toBe('sat');
  });
  it('day arithmetic across month/year and leap boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(daysBetween('2026-11-23', '2027-11-20')).toBe(362);
  });
  it('mondayOf and weeksBetween', () => {
    expect(mondayOf('2026-11-29')).toBe('2026-11-23');
    expect(mondayOf('2026-11-30')).toBe('2026-11-30');
    expect(weeksBetween('2027-03-01', '2027-03-07')).toBe(0);
    expect(weeksBetween('2027-03-01', '2027-03-08')).toBe(1);
    expect(weeksBetween('2027-03-01', '2027-02-28')).toBe(-1);
  });
  it('lastFridayOfMonth', () => {
    expect(lastFridayOfMonth('2026-11-02')).toBe('2026-11-27');
    expect(lastFridayOfMonth('2027-02-10')).toBe('2027-02-26');
    expect(lastFridayOfMonth('2027-04-01')).toBe('2027-04-30');
  });
  it('formatClock and isISODate', () => {
    expect(formatClock(20 * 60_000)).toBe('20:00');
    expect(formatClock(3_600_000 + 1000)).toBe('1:00:01');
    expect(isISODate('2027-02-29')).toBe(false);
    expect(isISODate('2028-02-29')).toBe(true);
  });
});
