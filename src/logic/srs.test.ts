import { describe, expect, it } from 'vitest';
import { bucketOf, isDue, newSrsState, previewLabels, schedule, shouldPauseNewWords } from './srs';

const T0 = Date.parse('2026-11-23T08:00:00Z'); // 12:00 Baku
const MIN = 60_000;
const DAY = 86_400_000;

describe('SRS (SM-2 style)', () => {
  it('new card: Again 1m, Hard 6m, Good 10m, Easy 4d', () => {
    const s = newSrsState(T0);
    expect(previewLabels(s, T0)).toEqual({ 1: '1m', 2: '6m', 3: '10m', 4: '4d' });
  });
  it('learning → graduate to 1 day, then grows by ease', () => {
    let s = schedule(newSrsState(T0), 3, T0); // step 1 (10m)
    expect(s.state).toBe('learning');
    expect(isDue(s, T0 + 9 * MIN)).toBe(false);
    expect(isDue(s, T0 + 10 * MIN)).toBe(true);
    s = schedule(s, 3, T0 + 10 * MIN);
    expect(s.state).toBe('review');
    expect(s.interval).toBe(1);
    expect(s.due).toBe('2026-11-24');
    s = schedule(s, 3, T0 + DAY);
    expect(s.interval).toBe(3); // max(1*1.2, 2)… good = max(hard+1, 1*2.5) = 3 after rounding
    s = schedule(s, 3, T0 + 4 * DAY);
    expect(s.interval).toBe(8);
  });
  it('Again on a review card → relearning, lapse, ease down, interval halved', () => {
    let s = schedule(newSrsState(T0), 4, T0); // easy: 4 days
    expect(s.interval).toBe(4);
    s = schedule(s, 1, T0 + 4 * DAY);
    expect(s.state).toBe('relearning');
    expect(s.lapses).toBe(1);
    expect(s.ease).toBeCloseTo(2.3);
    expect(s.interval).toBe(2);
    s = schedule(s, 3, T0 + 4 * DAY + 10 * MIN);
    expect(s.state).toBe('review');
    expect(s.interval).toBe(2);
  });
  it('ease never drops below 1.3', () => {
    let s = schedule(newSrsState(T0), 4, T0);
    for (let i = 0; i < 10; i++) {
      s = schedule(s, 1, T0 + i * DAY);
      s = schedule(s, 3, T0 + i * DAY + 10 * MIN);
    }
    expect(s.ease).toBeGreaterThanOrEqual(1.3);
  });
  it('review due by Baku calendar date', () => {
    const s = schedule(newSrsState(T0), 4, T0); // due 2026-11-27
    expect(isDue(s, Date.parse('2026-11-26T19:59:00Z'))).toBe(false);
    expect(isDue(s, Date.parse('2026-11-26T20:00:00Z'))).toBe(true);
  });
  it('buckets', () => {
    expect(bucketOf(newSrsState(T0))).toBe('new');
    const s = { ...schedule(newSrsState(T0), 4, T0), interval: 30 };
    expect(bucketOf(s)).toBe('mature');
  });
  it('vocab-load pause rule', () => {
    expect(shouldPauseNewWords(201, null)).toBe(true);
    expect(shouldPauseNewWords(50, 0.75)).toBe(true);
    expect(shouldPauseNewWords(50, 0.9)).toBe(false);
  });
});
