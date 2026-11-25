/**
 * Spaced repetition: a simplified Anki-style SM-2 scheduler. Pure and deterministic (no fuzz).
 * - New cards go through learning steps (1 min, 10 min), then graduate to 1 day (Easy: 4 days).
 * - Review cards: Hard ×1.2, Good ×ease, Easy ×ease×1.3. Again → relearning (10 min), interval halved.
 * - Ease starts at 2.5, min 1.3.
 * Review due dates are Asia/Baku calendar dates; learning steps use epoch ms.
 */
import type { ISODate } from '../data';
import { addDays, bakuDate, daysBetween } from './dates';

export type Rating = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy
export type CardState = 'new' | 'learning' | 'review' | 'relearning';

export interface SrsState {
  state: CardState;
  /** Index into learning/relearning steps. */
  step: number;
  /** Review interval in days (0 while new/learning). */
  interval: number;
  ease: number;
  reps: number;
  lapses: number;
  /** Calendar due date (Baku). */
  due: ISODate;
  /** Exact due time in ms (used for learning/relearning steps; for review = Baku midnight of `due`). */
  dueAt: number;
  lastReviewedAt?: number;
}

export const LEARNING_STEPS_MIN = [1, 10];
export const RELEARNING_STEPS_MIN = [10];
export const GRADUATING_INTERVAL = 1;
export const EASY_INTERVAL = 4;
export const START_EASE = 2.5;
export const MIN_EASE = 1.3;
export const MAX_INTERVAL = 3650;
/** "Learned" threshold in days (ux-spec: remembered for 3 weeks). */
export const LEARNED_INTERVAL = 21;

const MIN = 60_000;

export function newSrsState(now: number): SrsState {
  return { state: 'new', step: 0, interval: 0, ease: START_EASE, reps: 0, lapses: 0, due: bakuDate(now), dueAt: now };
}

function learningAt(s: SrsState, steps: number[], step: number, delayMin: number, now: number, state: CardState): SrsState {
  const dueAt = now + delayMin * MIN;
  return { ...s, state, step, dueAt, due: bakuDate(dueAt), reps: s.reps + 1, lastReviewedAt: now, interval: steps === LEARNING_STEPS_MIN ? 0 : s.interval };
}

function toReview(s: SrsState, interval: number, now: number, easeDelta = 0): SrsState {
  const ivl = Math.min(MAX_INTERVAL, Math.max(1, Math.round(interval)));
  const due = addDays(bakuDate(now), ivl);
  return {
    ...s,
    state: 'review',
    step: 0,
    interval: ivl,
    ease: Math.max(MIN_EASE, s.ease + easeDelta),
    due,
    dueAt: dueMsForDate(due),
    reps: s.reps + 1,
    lastReviewedAt: now,
  };
}

/** Baku midnight in ms for a date (review cards become due at local midnight). */
function dueMsForDate(date: ISODate): number {
  return Date.parse(`${date}T00:00:00+04:00`);
}

export function schedule(s: SrsState, rating: Rating, now: number): SrsState {
  if (s.state === 'new' || s.state === 'learning' || s.state === 'relearning') {
    const relearn = s.state === 'relearning';
    const steps = relearn ? RELEARNING_STEPS_MIN : LEARNING_STEPS_MIN;
    const state: CardState = relearn ? 'relearning' : 'learning';
    const step = s.state === 'new' ? 0 : s.step;
    if (rating === 1) return learningAt(s, steps, 0, steps[0], now, state);
    if (rating === 2) {
      const cur = steps[step] ?? steps[steps.length - 1];
      const next = steps[step + 1];
      const delay = next !== undefined ? Math.round((cur + next) / 2) : Math.round(cur * 1.5);
      return learningAt(s, steps, step, delay, now, state);
    }
    if (rating === 3) {
      if (step + 1 < steps.length) return learningAt(s, steps, step + 1, steps[step + 1], now, state);
      return toReview(s, relearn ? Math.max(1, s.interval) : GRADUATING_INTERVAL, now);
    }
    // Easy
    return toReview(s, relearn ? Math.max(1, s.interval) + 1 : EASY_INTERVAL, now);
  }

  // Review card
  const today = bakuDate(now);
  const overdue = Math.max(0, daysBetween(s.due, today));
  if (rating === 1) {
    const interval = Math.max(1, Math.round(s.interval * 0.5));
    const dueAt = now + RELEARNING_STEPS_MIN[0] * MIN;
    return {
      ...s,
      state: 'relearning',
      step: 0,
      interval,
      ease: Math.max(MIN_EASE, s.ease - 0.2),
      lapses: s.lapses + 1,
      reps: s.reps + 1,
      dueAt,
      due: bakuDate(dueAt),
      lastReviewedAt: now,
    };
  }
  const hard = Math.max(s.interval + 1, s.interval * 1.2);
  if (rating === 2) return toReview(s, hard, now, -0.15);
  const good = Math.max(hard + 1, (s.interval + overdue / 2) * s.ease);
  if (rating === 3) return toReview(s, good, now);
  const easy = Math.max(good + 1, (s.interval + overdue) * s.ease * 1.3);
  return toReview(s, easy, now, 0.15);
}

/** Short label for the next interval, e.g. "1m", "10m", "1d", "3mo". */
export function intervalLabel(from: SrsState, to: SrsState, now: number): string {
  void from;
  if (to.state === 'learning' || to.state === 'relearning') {
    const m = Math.round((to.dueAt - now) / MIN);
    return m < 60 ? `${m}m` : `${Math.round(m / 60)}h`;
  }
  const d = to.interval;
  if (d < 30) return `${d}d`;
  if (d < 365) return `${Math.round(d / 30)}mo`;
  return `${(d / 365).toFixed(1)}y`;
}

export function previewLabels(s: SrsState, now: number): Record<Rating, string> {
  return {
    1: intervalLabel(s, schedule(s, 1, now), now),
    2: intervalLabel(s, schedule(s, 2, now), now),
    3: intervalLabel(s, schedule(s, 3, now), now),
    4: intervalLabel(s, schedule(s, 4, now), now),
  };
}

/** Is a (non-new) card due now? Learning cards by exact time; review cards by calendar date. */
export function isDue(s: SrsState, now: number): boolean {
  if (s.state === 'new') return false;
  if (s.state === 'review') return s.due <= bakuDate(now);
  return s.dueAt <= now;
}

export type CardBucket = 'new' | 'learning' | 'young' | 'mature';

export function bucketOf(s: SrsState): CardBucket {
  if (s.state === 'new') return 'new';
  if (s.state === 'learning' || s.state === 'relearning') return 'learning';
  return s.interval >= LEARNED_INTERVAL ? 'mature' : 'young';
}

export function isLearned(s: SrsState): boolean {
  return s.state === 'review' && s.interval >= LEARNED_INTERVAL;
}

/**
 * Retention = share of review-card answers that were not "Again" (last 30 days).
 * Returns null if fewer than 20 such answers.
 */
export function retention(reviews: { rating: Rating; prevState: CardState }[]): number | null {
  const r = reviews.filter((x) => x.prevState === 'review');
  if (r.length < 20) return null;
  return r.filter((x) => x.rating > 1).length / r.length;
}

/** Rule "vocab-load": pause new words if too many reviews are due or retention is low. */
export function shouldPauseNewWords(dueCount: number, ret: number | null, maxDue = 200, minRetention = 0.8): boolean {
  return dueCount > maxDue || (ret !== null && ret < minRetention);
}
