import { describe, expect, it } from 'vitest';
import { checkpointStatus, computeWeakSkill, isReservedBook, overallOf, skillEstimates } from './assessment';

describe('assessment', () => {
  it('overall uses IELTS rounding', () => {
    expect(overallOf({ id: 'a', date: '2027-01-01', listening: 6.5, reading: 6.5, writing: 5.5, speaking: 7 })).toBe(6.5);
    expect(overallOf({ id: 'a', date: '2027-01-01', listening: 6.5, reading: 6.5 })).toBeNull();
  });
  it('running average needs 2 tests; checkpoint result wins', () => {
    const one = skillEstimates([{ id: '1', date: '2027-03-06', reading: 5 }]);
    expect(one.reading.source).toBe('single');
    const two = skillEstimates([
      { id: '1', date: '2027-03-06', reading: 5 },
      { id: '2', date: '2027-03-13', reading: 6 },
    ]);
    expect(two.reading).toEqual({ band: 5.5, n: 2, source: 'running' });
    const cp = skillEstimates([
      { id: '1', date: '2027-03-06', reading: 5 },
      { id: '2', date: '2027-06-26', reading: 6.5, checkpointId: 'cp-jun-2027' },
    ]);
    expect(cp.reading.source).toBe('checkpoint');
  });
  it('weak skill: largest gap, ties → writing > speaking > reading > listening', () => {
    const tests = [
      { id: '1', date: '2027-04-03', listening: 5.5, reading: 5.5, writing: 5.5, speaking: 6 },
      { id: '2', date: '2027-04-10', listening: 5.5, reading: 5.5, writing: 5.5, speaking: 6 },
    ];
    const r = computeWeakSkill(tests, 6.0);
    expect(r.weakSkill).toBe('writing');
    expect(r.bigGap).toBe(false);
    const on = computeWeakSkill(tests, 5.5);
    expect(on.weakSkill).toBeNull();
    const min = computeWeakSkill(tests, 5.5, 6.0);
    expect(min.weakSkill).toBe('writing');
  });
  it('checkpoint status', () => {
    const cp = { targetBand: { min: 6, max: 6.5 } };
    expect(checkpointStatus(6, cp)).toBe('on-track');
    expect(checkpointStatus(5.5, cp)).toBe('close');
    expect(checkpointStatus(5, cp)).toBe('behind');
    expect(checkpointStatus(null, cp)).toBe('not-tested');
  });
  it('Cambridge 14–19 guard in phases 1–2', () => {
    expect(isReservedBook('Cambridge IELTS 15', 2)).toBe(true);
    expect(isReservedBook('Cambridge IELTS 15', 3)).toBe(false);
    expect(isReservedBook('Cambridge 12', 1)).toBe(false);
  });
});
