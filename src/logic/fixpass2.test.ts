/** Fix pass 2: pure rules (recovery, onboarding dates, timer pruning, quiz option shuffle). */
import { describe, expect, it } from 'vitest';
import { QUIZ_ITEMS } from '../content';
import type { QuizItem } from '../content/types';
import { changesLostText, formatDateTime, shouldOfferSafetyCopy } from './recovery';
import { effectiveStartDate, onboardingDatesValid } from './onboarding';
import { isStaleTimerEntry } from './timer';
import { answerText, checkAnswer, optionOrder } from './quiz';
import { isBase64 } from './backup';

describe('recovery rules (items 1, 2)', () => {
  const now = Date.UTC(2027, 2, 10, 12, 0);
  const snap = { createdAt: now - 3600_000, reason: 'Before import' };
  it('confirm text names date and time in Asia/Baku', () => {
    expect(formatDateTime(Date.UTC(2027, 2, 10, 10, 30))).toBe('10 Mar 2027, 14:30');
    expect(changesLostText(Date.UTC(2027, 2, 10, 10, 30))).toBe('Changes made after 10 Mar 2027, 14:30 will be lost.');
    // Baku midnight boundary: 20:00 UTC is 00:00 the next day.
    expect(formatDateTime(Date.UTC(2027, 2, 10, 20, 0))).toBe('11 Mar 2027, 00:00');
  });
  it('offers the safety copy only when the crash started after the latest import', () => {
    const replacedAt = now - 3500_000;
    expect(shouldOfferSafetyCopy({ snapshot: snap, replacedAt, firstCrashAt: now - 60_000, now })).toBe(true);
    expect(shouldOfferSafetyCopy({ snapshot: snap, replacedAt, firstCrashAt: replacedAt, now })).toBe(true);
    expect(shouldOfferSafetyCopy({ snapshot: snap, replacedAt, firstCrashAt: replacedAt - 1, now })).toBe(false);
    expect(shouldOfferSafetyCopy({ snapshot: snap, replacedAt: null, firstCrashAt: now, now })).toBe(false);
    expect(shouldOfferSafetyCopy({ snapshot: snap, replacedAt, firstCrashAt: null, now })).toBe(false);
    expect(shouldOfferSafetyCopy({ snapshot: null, replacedAt, firstCrashAt: now, now })).toBe(false);
    expect(shouldOfferSafetyCopy({ snapshot: { ...snap, reason: 'Manual' }, replacedAt, firstCrashAt: now, now })).toBe(false);
    expect(shouldOfferSafetyCopy({ snapshot: { ...snap, createdAt: replacedAt + 1 }, replacedAt, firstCrashAt: now, now })).toBe(false);
    const old = { ...snap, createdAt: now - 8 * 86_400_000 };
    expect(shouldOfferSafetyCopy({ snapshot: old, replacedAt: old.createdAt + 1, firstCrashAt: now, now })).toBe(false);
  });
});

describe('onboarding saves a valid start date (item 3)', () => {
  const today = '2026-11-25';
  it('"Start from Day 1 today" validates today against the exam date', () => {
    expect(effectiveStartDate('2026-11-01', 'day1', today)).toBe(today);
    expect(effectiveStartDate('2026-11-01', 'calendar', today)).toBe('2026-11-01');
    expect(effectiveStartDate('2026-12-01', 'day1', today)).toBe('2026-12-01');
    // Past start, exam between it and today: valid as typed, invalid for what is saved.
    expect(onboardingDatesValid('2026-11-01', '2026-11-20', 'calendar', today)).toBe(true);
    expect(onboardingDatesValid('2026-11-01', '2026-11-20', 'day1', today)).toBe(false);
    expect(onboardingDatesValid('2026-11-01', today, 'day1', today)).toBe(false); // same day
    expect(onboardingDatesValid('2026-11-01', '2026-11-26', 'day1', today)).toBe(true);
    expect(onboardingDatesValid('bad', '2027-11-20', 'calendar', today)).toBe(false);
  });
});

describe('timer pruning rules (item 7)', () => {
  const now = Date.UTC(2027, 2, 10, 12);
  const today = '2027-03-10';
  const yesterday = '2027-03-09';
  const run = (startedAt: number) => ({ status: 'running', durationMs: 60_000, startedAt, pausedAt: null, pausedAccumMs: 0 });
  const paused = (startedAt: number) => ({ ...run(startedAt), status: 'paused', pausedAt: startedAt + 1000 });
  const old = now - 30 * 86_400_000;
  it('never prunes paused timers', () => {
    expect(isStaleTimerEntry('timer:practice:x', paused(old), now, today, yesterday)).toBe(false);
    expect(isStaleTimerEntry('timer:block:2027-01-01:b', paused(old), now, today, yesterday)).toBe(false);
    expect(isStaleTimerEntry('timer:write:w-1', paused(old), now, today, yesterday, new Set())).toBe(false);
  });
  it('writing timers follow their draft', () => {
    const owners = new Set(['w-1']);
    expect(isStaleTimerEntry('timer:write:w-1', run(old), now, today, yesterday, owners)).toBe(false);
    expect(isStaleTimerEntry('timer:write:w-2', run(now - 1000), now, today, yesterday, owners)).toBe(true);
    // Without owner info only long-stale running timers go.
    expect(isStaleTimerEntry('timer:write:w-2', run(now - 1000), now, today, yesterday)).toBe(false);
    expect(isStaleTimerEntry('timer:write:w-2', run(old), now, today, yesterday)).toBe(true);
  });
  it('3-day boundary for running timers', () => {
    expect(isStaleTimerEntry('timer:practice:x', run(now - 3 * 86_400_000), now, today, yesterday)).toBe(false);
    expect(isStaleTimerEntry('timer:practice:x', run(now - 3 * 86_400_000 - 1), now, today, yesterday)).toBe(true);
    expect(isStaleTimerEntry('timer:practice:x', { status: 'weird' }, now, today, yesterday)).toBe(true);
  });
});

describe('base64 check (item 9)', () => {
  it('accepts only strict base64', () => {
    for (const s of ['', 'YQ==', 'YWI=', 'YWJj', 'a+/9']) expect(isBase64(s)).toBe(true);
    for (const s of ['YQ=', 'Y', 'YQ=a', 'Y===', '-_ab', 'YW Jj', 'YWJj\n']) expect(isBase64(s)).toBe(false);
  });
});

describe('quiz option shuffle (item 10)', () => {
  type Choice = Extract<QuizItem, { kind: 'mcq' | 'headings' }>;
  const choice = QUIZ_ITEMS.filter((q): q is Choice => q.kind === 'mcq' || q.kind === 'headings');
  it('has mcq and headings items to test with', () => {
    expect(choice.some((q) => q.kind === 'mcq')).toBe(true);
    expect(choice.some((q) => q.kind === 'headings')).toBe(true);
  });
  it('is a permutation of the original indices and stable per attempt (re-render / resume)', () => {
    for (const q of choice) {
      const a = optionOrder(q, '2027-03-10|daily|1');
      expect([...a].sort((x, y) => x - y)).toEqual(q.options.map((_, i) => i));
      expect(optionOrder(q, '2027-03-10|daily|1')).toEqual(a);
    }
  });
  it('the correct answer is not in a predictable position', () => {
    const positions = new Map<number, number>();
    for (const q of choice) {
      const pos = optionOrder(q, 'attempt-x').indexOf(q.answerIndex);
      positions.set(pos, (positions.get(pos) ?? 0) + 1);
    }
    expect(positions.size).toBeGreaterThanOrEqual(3);
    const max = Math.max(...positions.values());
    expect(max / choice.length).toBeLessThan(0.5);
    // Different attempts give different orders for most items.
    const q = choice.find((x) => x.options.length >= 4)!;
    const orders = new Set(['a', 'b', 'c', 'd', 'e', 'f'].map((s) => optionOrder(q, s).join(',')));
    expect(orders.size).toBeGreaterThan(1);
  });
  it('answers stay stored and checked by ORIGINAL option index', () => {
    for (const q of choice.slice(0, 50)) {
      const order = optionOrder(q, 'attempt-y');
      // The user taps the displayed row at position p; the stored value is order[p].
      const p = order.indexOf(q.answerIndex);
      const stored = order[p];
      expect(checkAnswer(q, stored)).toBe(true);
      expect(answerText(q, stored)).toBe(q.options[q.answerIndex]);
      const wrongPos = p === 0 ? 1 : 0;
      expect(checkAnswer(q, order[wrongPos])).toBe(false);
    }
  });
  it('other kinds are not reordered', () => {
    const other = QUIZ_ITEMS.find((q) => q.kind === 'tfng' || q.kind === 'gap');
    if (other) expect(optionOrder(other, 'a')).toEqual([]);
  });
});
