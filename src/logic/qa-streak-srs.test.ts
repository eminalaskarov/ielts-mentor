/** QA: streak rules, SRS scheduling, deck queue limits. */
import { describe, expect, it } from 'vitest';
import { addDays, bakuDate, bakuMidnightMs } from './dates';
import { computeStreak, vocabStreak } from './streak';
import type { DayStatus } from './streak';
import { EASY_INTERVAL, MAX_INTERVAL, MIN_EASE, isDue, newSrsState, schedule, shouldPauseNewWords } from './srs';
import type { Rating, SrsState } from './srs';
import { buildQueue } from './deck';
import type { CardRec } from '../db/db';

const F = '2026-11-23';
function run(pattern: string) {
  const m = new Map<string, DayStatus>();
  [...pattern].forEach((c, i) => m.set(addDays(F, i), c === 'k' ? 'done' : c === 'm' ? 'missed' : c === 'p' ? 'pending' : c === 'r' ? 'kept-rest' : 'ignored'));
  return computeStreak(m, F, addDays(F, pattern.length - 1));
}

describe('streak rules', () => {
  it('one missed day is forgiven, streak continues', () => {
    const r = run('kkkmk');
    expect(r.current).toBe(4);
    expect(r.best).toBe(4);
  });
  it('two missed days in a row reset current to 0 but best is kept', () => {
    const r = run('kkkkkmmk');
    expect(r.best).toBe(5);
    expect(r.current).toBe(1);
  });
  it('after 2 consecutive misses and still missing, current is 0', () => {
    expect(run('kkkmm').current).toBe(0);
    expect(run('kkkmmm').current).toBe(0);
  });
  it('only 1 grace per 7 days: second isolated miss within 7 days resets', () => {
    expect(run('kkmkkm').current).toBe(0); // 2nd miss 3 days after grace
    expect(run('kkmkkkkkkmk').current).toBeGreaterThan(0); // 7+ days apart
  });
  it('7-day boundary: miss on day i and i+6 resets, i and i+7 is forgiven', () => {
    expect(run('kmkkkkkmk').current).toBe(0 + 1); // i=1, next miss at 7 (6 apart) -> reset, then 1 kept
    expect(run('kmkkkkkkmk').current).toBe(8); // 7 apart -> forgiven: 1+6+... count kept days
  });
  it('miss on day 1 (no streak yet) just stays 0', () => {
    expect(run('mk').current).toBe(1);
    expect(run('m').current).toBe(0);
  });
  it('pending today never breaks; missing today only matters after the day ends', () => {
    expect(run('kkkp').current).toBe(3);
    expect(run('kkkmp').current).toBe(3);
  });
  it('ignored (pre-start/post-exam) days are skipped', () => {
    expect(run('iikk').current).toBe(2);
  });
  it('a missed day with no recorded status is treated as missed (not a crash)', () => {
    const r = computeStreak(new Map(), F, addDays(F, 3));
    expect(r.current).toBe(0);
  });
  it('best streak never decreases as days are appended', () => {
    let best = 0;
    const pat = 'kkkkmmkkkkkkkmkkmmmkk';
    for (let i = 1; i <= pat.length; i++) {
      const r = run(pat.slice(0, i));
      expect(r.best).toBeGreaterThanOrEqual(best);
      expect(r.best).toBeGreaterThanOrEqual(r.current);
      best = r.best;
    }
  });
  it('a full year of alternating pattern terminates quickly and is sane', () => {
    const pat = 'kkkkkkm'.repeat(52);
    const r = run(pat);
    expect(r.current).toBeGreaterThan(0);
    expect(r.best).toBe(r.current);
  });
  it('vocabStreak counts back from yesterday if today not reviewed yet', () => {
    const s = new Set(['2026-11-23', '2026-11-24']);
    expect(vocabStreak(s, '2026-11-25')).toBe(2);
    expect(vocabStreak(s, '2026-11-27')).toBe(0);
  });
});

const T0 = Date.parse('2026-11-25T08:00:00Z');
function rate(s: SrsState, r: Rating, now: number) {
  return schedule(s, r, now);
}
function graduate(now = T0): SrsState {
  let s = newSrsState(now);
  s = rate(s, 3, now); // step 1 (10 min)
  s = rate(s, 3, now + 10 * 60_000);
  return s;
}

describe('SRS scheduling', () => {
  it('new -> Good -> Good graduates to review with 1 day interval', () => {
    const s = graduate();
    expect(s.state).toBe('review');
    expect(s.interval).toBe(1);
    expect(s.due).toBe('2026-11-26');
  });
  it('new -> Easy graduates to 4 days', () => {
    const s = rate(newSrsState(T0), 4, T0);
    expect(s.state).toBe('review');
    expect(s.interval).toBe(EASY_INTERVAL);
  });
  it('Again on learning card resets to 1 min and is due within the same session', () => {
    const s = rate(newSrsState(T0), 1, T0);
    expect(s.state).toBe('learning');
    expect(s.dueAt - T0).toBe(60_000);
    expect(isDue(s, T0 + 59_000)).toBe(false);
    expect(isDue(s, T0 + 60_000)).toBe(true);
  });
  it('review intervals: Hard < Good < Easy, all strictly greater than previous interval', () => {
    let s = graduate();
    for (let i = 0; i < 6; i++) {
      const now = bakuMidnightMs(s.due) + 3600_000;
      const h = rate(s, 2, now), g = rate(s, 3, now), e = rate(s, 4, now);
      expect(h.interval).toBeGreaterThan(s.interval);
      expect(g.interval).toBeGreaterThan(h.interval);
      expect(e.interval).toBeGreaterThan(g.interval);
      s = g;
    }
  });
  it('ease never drops below 1.3 even after 50 lapses/hards', () => {
    let s = graduate();
    let now = T0;
    for (let i = 0; i < 50; i++) {
      now = bakuMidnightMs(s.due) + 3600_000;
      s = rate(s, 1, now); // relearn
      s = rate(s, 3, now + 11 * 60_000); // back to review
      now = bakuMidnightMs(s.due) + 3600_000;
      s = rate(s, 2, now);
      expect(s.ease).toBeGreaterThanOrEqual(MIN_EASE);
    }
    expect(s.ease).toBeCloseTo(MIN_EASE, 5);
    expect(s.interval).toBeGreaterThanOrEqual(1);
  });
  it('interval is capped at MAX_INTERVAL and due date stays a valid ISO date', () => {
    let s = graduate();
    for (let i = 0; i < 40; i++) {
      s = rate(s, 4, bakuMidnightMs(s.due) + 1000);
      expect(s.interval).toBeLessThanOrEqual(MAX_INTERVAL);
      expect(s.due).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(s.interval).toBe(MAX_INTERVAL);
  });
  it('lapse counts and relearning interval is halved but >= 1', () => {
    const s = graduate();
    const l = rate(s, 1, bakuMidnightMs(s.due) + 1000);
    expect(l.state).toBe('relearning');
    expect(l.lapses).toBe(1);
    expect(l.interval).toBeGreaterThanOrEqual(1);
  });
  it('due dates use Baku calendar: reviewed at 22:00 UTC (02:00 Baku next day)', () => {
    const now = Date.parse('2026-11-25T22:00:00Z'); // 26 Nov 02:00 Baku
    const s = rate(rate(newSrsState(now), 3, now), 3, now + 600_000);
    expect(s.due).toBe('2026-11-27'); // reviewed on 26th Baku + 1 day
    // not due until Baku midnight of the 27th = 2026-11-26T20:00Z
    expect(isDue(s, Date.parse('2026-11-26T19:59:00Z'))).toBe(false);
    expect(isDue(s, Date.parse('2026-11-26T20:00:00Z'))).toBe(true);
  });
  it('review card due today (Baku) is due even at 00:01 Baku', () => {
    const s = graduate();
    expect(isDue(s, bakuMidnightMs(s.due) + 60_000)).toBe(true);
    expect(isDue(s, bakuMidnightMs(s.due) - 60_000)).toBe(false);
  });
  it('overdue review gets credit (longer interval than on-time) but stays bounded', () => {
    const s = graduate();
    const onTime = rate(s, 3, bakuMidnightMs(s.due) + 1000);
    const late = rate(s, 3, bakuMidnightMs(addDays(s.due, 30)) + 1000);
    expect(late.interval).toBeGreaterThanOrEqual(onTime.interval);
    expect(late.interval).toBeLessThan(200);
  });
  it('schedule never mutates its input', () => {
    const s = graduate();
    const copy = JSON.stringify(s);
    rate(s, 3, T0 + 1e9);
    expect(JSON.stringify(s)).toBe(copy);
  });
  it('pause-new rule', () => {
    expect(shouldPauseNewWords(201, null)).toBe(true);
    expect(shouldPauseNewWords(10, 0.7)).toBe(true);
    expect(shouldPauseNewWords(10, null)).toBe(false);
  });
});

function card(id: string, srs: SrsState, createdAt = 0): CardRec {
  return { id, source: 'user', headword: id, pos: 'noun', definition: '', example: '', collocations: [], tags: [], createdAt, srs };
}
describe('deck queue limits', () => {
  const now = Date.parse('2026-12-01T08:00:00Z');
  const dueCard = (i: number) => card(`d${i}`, { ...graduate(now - 5 * 86400_000), state: 'review', interval: 1, due: '2026-12-01', dueAt: bakuMidnightMs('2026-12-01') });
  const builtins = Array.from({ length: 50 }, (_, i) => ({ id: `v-${String(i).padStart(4, '0')}`, phase: 1 as const, cefr: 'B1' as const, headword: 'w' + i, pos: 'noun' as const, definition: '', collocations: ['x'], example: '' }));
  it('maxReviews caps due list, dueTotal reports the real count', () => {
    const cards = Array.from({ length: 130 }, (_, i) => dueCard(i));
    const q = buildQueue({ cards, builtins: [], phase: 1, now, newPerDay: 20, newIntroducedToday: 0, maxReviews: 100, pauseNew: false });
    expect(q.due.length).toBe(100);
    expect(q.dueTotal).toBe(130);
  });
  it('new-per-day limit respects already introduced today, and pause', () => {
    const base = { cards: [], builtins, phase: 1 as const, now, newPerDay: 20, maxReviews: 100 };
    expect(buildQueue({ ...base, newIntroducedToday: 0, pauseNew: false }).fresh.length).toBe(20);
    expect(buildQueue({ ...base, newIntroducedToday: 15, pauseNew: false }).fresh.length).toBe(5);
    expect(buildQueue({ ...base, newIntroducedToday: 25, pauseNew: false }).fresh.length).toBe(0);
    expect(buildQueue({ ...base, newIntroducedToday: 0, pauseNew: true }).fresh.length).toBe(0);
  });
  it('phase gating: phase-2 built-ins not offered in phase 1; started built-ins not offered again', () => {
    const mixed = [...builtins, { ...builtins[0], id: 'v-9999', phase: 2 as const }];
    const q = buildQueue({ cards: [], builtins: mixed, phase: 1, now, newPerDay: 100, newIntroducedToday: 0, maxReviews: 100, pauseNew: false });
    expect(q.fresh.some((c) => c.id === 'v-9999')).toBe(false);
    const started = card('v-0000', newSrsState(now));
    const q2 = buildQueue({ cards: [started], builtins, phase: 1, now, newPerDay: 100, newIntroducedToday: 0, maxReviews: 100, pauseNew: false });
    expect(q2.fresh.filter((c) => c.id === 'v-0000').length).toBe(1); // only the DB copy (state new), not duplicated
  });
  it('bakuDate sanity used by newIntroducedToday', () => {
    expect(bakuDate(now)).toBe('2026-12-01');
  });
});
