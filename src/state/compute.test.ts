/** A year of data: state computation stays fast and only recent reviews are loaded. */
import 'fake-indexeddb/auto';
import { beforeAll, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, db } from '../db/db';
import type { BlockLog, CardRec, ReviewRec } from '../db/db';
import { addDays, dateRange } from '../logic/dates';
import { resolveDay } from '../logic/plan';
import { computeAppState, DayStatusCache, RECENT_REVIEW_DAYS } from './compute';
import type { StateInputs } from './compute';
import { loadRecentReviews, loadReviewDates } from './hooks';

const START = '2026-11-23';
const TODAY = '2027-11-15';
const settings = { ...DEFAULT_SETTINGS, onboarded: true, startDate: START, examDate: '2027-11-20', firstUseDate: START };
const days = dateRange(START, TODAY);
const now = Date.parse(`${TODAY}T12:00:00+04:00`);

function makeCards(n: number): CardRec[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `u-${i}`, source: 'user', headword: `w${i}`, pos: 'noun', definition: 'd', example: 'e', collocations: [], tags: [], createdAt: 0,
    srs: { state: 'review', step: 0, interval: 10, ease: 2.5, reps: 5, lapses: 0, due: addDays(TODAY, (i % 30) - 10), dueAt: 0 },
  }));
}

function makeReviews(n: number): ReviewRec[] {
  return Array.from({ length: n }, (_, i) => {
    const date = days[Math.floor((i / n) * days.length)];
    return { cardId: `u-${i % 4000}`, at: Date.parse(`${date}T10:00:00+04:00`), date, rating: (i % 7 === 0 ? 1 : 3) as 1 | 3, prevState: i % 10 === 0 ? ('new' as const) : ('review' as const) };
  });
}

function makeLogs(): BlockLog[] {
  const out: BlockLog[] = [];
  for (const d of days) {
    const rd = resolveDay(d, settings);
    for (const b of rd.blocks.slice(0, 3)) out.push({ id: `${d}|${b.id}`, date: d, blockId: b.id, skill: b.displaySkill, done: true, minutes: b.minutes, doneAt: 0 });
  }
  return out;
}

describe('year of data (~30k reviews)', () => {
  const REVIEWS = 30_000;
  let inputs: StateInputs;

  beforeAll(async () => {
    await Promise.all(db.tables.map((t) => t.clear()));
    await db.reviews.bulkAdd(makeReviews(REVIEWS));
    const [recentReviews, reviewDates] = [await loadRecentReviews(TODAY), await loadReviewDates()];
    inputs = { settings, logs: makeLogs(), tests: [], essays: [], mistakes: [], recentReviews, reviewDates, cards: makeCards(4000) };
  }, 60_000);

  it('loads only recent reviews and distinct review dates', () => {
    expect(inputs.recentReviews.length).toBeLessThan(REVIEWS / 8);
    expect(inputs.recentReviews.every((r) => r.date >= addDays(TODAY, -RECENT_REVIEW_DAYS))).toBe(true);
    expect(inputs.reviewDates.length).toBe(new Set(makeReviews(REVIEWS).map((r) => r.date)).size);
    expect(inputs.reviewDates.length).toBeLessThanOrEqual(days.length);
  });

  it('computes the full state quickly; recomputing with the cache (every rating / minute tick) is faster', () => {
    const cache = new DayStatusCache();
    const t0 = performance.now();
    const s1 = computeAppState(inputs, TODAY, now, cache);
    const cold = performance.now() - t0;
    expect(s1.statuses.size).toBe(days.length);
    expect(s1.streak.current).toBeGreaterThan(300);
    expect(cache.size).toBe(days.length - 1);

    const runs = 5;
    const t1 = performance.now();
    for (let i = 0; i < runs; i++) computeAppState({ ...inputs, cards: [...inputs.cards] }, TODAY, now + i * 60_000, cache);
    const warm = (performance.now() - t1) / runs;
    console.log(`perf: cold ${cold.toFixed(1)} ms, warm ${warm.toFixed(1)} ms (${REVIEWS} reviews, 4000 cards, ${days.length} days)`);
    // Generous limits so CI noise cannot fail it, but far below what a UI would notice per tap.
    expect(cold).toBeLessThan(1500);
    expect(warm).toBeLessThan(150);
    expect(computeAppState(inputs, TODAY, now, cache).streak).toEqual(s1.streak);
  });

  it('cached past-day statuses are invalidated when that day changes', () => {
    const cache = new DayStatusCache();
    const d = days[10];
    computeAppState(inputs, TODAY, now, cache);
    const before = computeAppState(inputs, TODAY, now, cache).statuses.get(d);
    expect(before).not.toBe('missed');
    const logs = inputs.logs.filter((l) => l.date !== d);
    const reviewDates = inputs.reviewDates.filter((x) => x !== d);
    const after = computeAppState({ ...inputs, logs, reviewDates }, TODAY, now, cache).statuses.get(d);
    const fresh = computeAppState({ ...inputs, logs, reviewDates }, TODAY, now).statuses.get(d);
    expect(after).toBe(fresh);
    expect(after === 'missed' || after === 'kept-rest').toBe(true);
  });
});
