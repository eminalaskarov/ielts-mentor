import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../data';
import { phaseForDate, resolveDay, task1ChartForDate } from './plan';
import { murphyPace } from './murphy';

const cfg = { startDate: DEFAULT_CONFIG.startDate, examDate: DEFAULT_CONFIG.examDate };
const ctx = { murphyUnitsDone: 0, weakSkill: null, weakFocus: false };

describe('phase boundaries', () => {
  it.each([
    ['2026-11-22', null],
    ['2026-11-23', 1],
    ['2027-02-28', 1],
    ['2027-03-01', 2],
    ['2027-06-30', 2],
    ['2027-07-01', 3],
    ['2027-09-30', 3],
    ['2027-10-01', 4],
    ['2027-11-20', 4],
    ['2027-11-21', null],
  ])('%s → phase %s', (d, p) => {
    expect(phaseForDate(d, cfg)).toBe(p);
  });
});

describe('resolveDay', () => {
  it('before start / after exam', () => {
    expect(resolveDay('2026-11-22', cfg, ctx).kind).toBe('pre-start');
    expect(resolveDay('2027-11-21', cfg, ctx).kind).toBe('post-exam');
  });
  it('phase 1 Monday: 3 blocks with Murphy units 1–2', () => {
    const d = resolveDay('2026-11-23', cfg, ctx);
    expect(d.kind).toBe('study');
    expect(d.phase).toBe(1);
    expect(d.dayNumber).toBe(1);
    expect(d.blocks.map((b) => b.id)).toEqual(['p1-mon-1', 'p1-mon-2', 'p1-mon-3']);
    expect(d.blocks[0].murphyUnits).toEqual({ from: 1, to: 2, count: 2 });
  });
  it('Sunday is a rest day; phase 3 Sunday is auto-kept', () => {
    const s1 = resolveDay('2026-11-29', cfg, ctx);
    expect(s1.kind).toBe('rest');
    expect(s1.autoKept).toBe(false);
    const s3 = resolveDay('2027-07-04', cfg, ctx);
    expect(s3.kind).toBe('rest');
    expect(s3.autoKept).toBe(true);
  });
  it('Feb checkpoint replaces the Saturday test block', () => {
    const d = resolveDay('2027-02-27', cfg, ctx);
    expect(d.checkpoint?.id).toBe('cp-feb-2027');
    expect(d.blocks[0].id).toBe('cp-feb-2027-test');
    expect(d.blocks[1].id).toBe('p1-sat-2');
  });
  it('final week overrides from exam − 7', () => {
    expect(resolveDay('2027-11-12', cfg, ctx).kind).toBe('study');
    const d7 = resolveDay('2027-11-13', cfg, ctx);
    expect(d7.kind).toBe('final-week');
    expect(d7.finalWeekStage?.id).toBe('fw-7-4');
    expect(resolveDay('2027-11-16', cfg, ctx).finalWeekStage?.id).toBe('fw-7-4');
    expect(resolveDay('2027-11-17', cfg, ctx).finalWeekStage?.id).toBe('fw-3-2');
    const d1 = resolveDay('2027-11-19', cfg, ctx);
    expect(d1.finalWeekStage?.id).toBe('fw-1');
    expect(d1.autoKept).toBe(true);
    expect(resolveDay('2027-11-20', cfg, ctx).finalWeekStage?.id).toBe('fw-0');
  });
  it('Task 1 rotation starts on 2027-03-01 with line graphs', () => {
    expect(task1ChartForDate('2027-02-28')).toBeNull();
    expect(task1ChartForDate('2027-03-03')).toBe('line');
    expect(task1ChartForDate('2027-03-10')).toBe('bar');
    expect(task1ChartForDate('2027-04-14')).toBe('line');
    expect(resolveDay('2027-03-03', cfg, ctx).blocks[0].task1Chart).toBe('line');
  });
  it('weak-skill focus splits flex blocks', () => {
    const d = resolveDay('2027-03-03', cfg, { murphyUnitsDone: 145, weakSkill: 'reading', weakFocus: true });
    const ids = d.blocks.map((b) => b.id);
    expect(ids).toContain('p2-wed-3');
    expect(ids).toContain('p2-wed-3-weak');
    const keep = d.blocks.find((b) => b.id === 'p2-wed-3')!;
    const weak = d.blocks.find((b) => b.id === 'p2-wed-3-weak')!;
    expect(keep.minutes + weak.minutes).toBe(40);
    expect(weak.displaySkill).toBe('reading');
  });
  it('phase 4 weak-skill block takes the weak skill colour', () => {
    const d = resolveDay('2027-10-05', cfg, { murphyUnitsDone: 145, weakSkill: 'speaking', weakFocus: true });
    expect(d.weekday).toBe('tue');
    expect(d.blocks[0].displaySkill).toBe('speaking');
    expect(d.blocks[0].task).toContain('Speaking');
  });
  it('monthly mistake review on the last Friday', () => {
    const d = resolveDay('2026-11-27', cfg, ctx);
    expect(d.monthlyMistakeReview).toBe(true);
    expect(d.blocks.at(-1)?.extra).toBe(true);
    expect(resolveDay('2026-11-20', { ...cfg, startDate: '2026-11-01' }, ctx).monthlyMistakeReview).toBe(false);
  });
  it('a later start date still resolves phases', () => {
    const late = { startDate: '2027-04-07', examDate: '2027-11-20' };
    expect(phaseForDate('2027-04-07', late)).toBe(2);
    expect(resolveDay('2027-04-07', late, ctx).dayNumber).toBe(1);
  });
});

describe('murphy pace', () => {
  it('2 units on day 1, 3 units when 4+ behind', () => {
    expect(murphyPace('2026-11-23', cfg, 0).unitsToday).toBe(2);
    const later = murphyPace('2027-01-11', cfg, 10);
    expect(later.behindBy).toBeGreaterThanOrEqual(4);
    expect(later.unitsToday).toBe(3);
  });
  it('finished at 145', () => {
    expect(murphyPace('2027-01-11', cfg, 145).finished).toBe(true);
  });
});
