/** React hooks over the DB + pure logic. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { DEFAULT_SETTINGS, db } from '../db/db';
import type { Settings } from '../db/db';
import { addDays, bakuDate } from '../logic/dates';
import { computeAppState, DayStatusCache, RECENT_REVIEW_DAYS } from './compute';
import type { AppState } from './compute';
import type { ISODate } from '../data';

export function useSettings(): Settings | undefined {
  return useLiveQuery(async () => {
    const row = await db.kv.get('settings');
    return { ...DEFAULT_SETTINGS, ...((row?.value as Partial<Settings>) ?? {}) };
  }, []);
}

export function useKV<T>(key: string, fallback: T): T {
  const v = useLiveQuery(async () => (await db.kv.get(key))?.value as T | undefined, [key]);
  return v === undefined ? fallback : v;
}

/** Current epoch ms, refreshed every `ms` and when the app becomes visible. */
export function useNow(ms = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = window.setInterval(tick, ms);
    const vis = () => document.visibilityState === 'visible' && tick();
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('pageshow', tick);
    window.addEventListener('focus', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', vis);
      window.removeEventListener('pageshow', tick);
      window.removeEventListener('focus', tick);
    };
  }, [ms]);
  return now;
}

/**
 * Today's Baku date. When the date changes (midnight, or returning from the background) it updates
 * directly unless a full-screen flow is active (`hold`); then `stale` becomes true and the flow keeps
 * using its date until it ends, after which the date refreshes automatically.
 */
export function useToday(hold = false): { today: ISODate; stale: boolean; refresh: () => void } {
  const [today, setToday] = useState(() => bakuDate());
  const [stale, setStale] = useState(false);
  const todayRef = useRef(today);
  todayRef.current = today;
  const holdRef = useRef(hold);
  holdRef.current = hold;
  useEffect(() => {
    const check = () => {
      const d = bakuDate();
      if (d !== todayRef.current) {
        if (!holdRef.current) {
          setToday(d);
          setStale(false);
        } else setStale(true);
      }
    };
    const id = window.setInterval(check, 30_000);
    const vis = () => document.visibilityState === 'visible' && check();
    const show = () => check();
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('pageshow', show);
    window.addEventListener('focus', show);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', vis);
      window.removeEventListener('pageshow', show);
      window.removeEventListener('focus', show);
    };
  }, []);
  // A held flow just ended: catch up with the real date.
  useEffect(() => {
    if (!hold && bakuDate() !== todayRef.current) {
      setToday(bakuDate());
      setStale(false);
    }
  }, [hold]);
  return {
    today,
    stale,
    refresh: () => {
      setToday(bakuDate());
      setStale(false);
    },
  };
}

export type { AppState } from './compute';

/** Distinct review dates from the `date` index (keys only — cheap even with tens of thousands of reviews). */
export async function loadReviewDates(): Promise<ISODate[]> {
  return (await db.reviews.orderBy('date').uniqueKeys()) as ISODate[];
}

export async function loadRecentReviews(today: ISODate) {
  return db.reviews.where('date').aboveOrEqual(addDays(today, -RECENT_REVIEW_DAYS)).toArray();
}

export function useAppState(today: ISODate): AppState | undefined {
  const settings = useSettings();
  const logs = useLiveQuery(() => db.blockLogs.toArray(), []);
  const tests = useLiveQuery(() => db.tests.toArray(), []);
  const essays = useLiveQuery(() => db.essays.where('status').equals('done').toArray(), []);
  const mistakes = useLiveQuery(() => db.mistakes.toArray(), []);
  const recentReviews = useLiveQuery(() => loadRecentReviews(today), [today]);
  const reviewDates = useLiveQuery(() => loadReviewDates(), []);
  const cards = useLiveQuery(() => db.cards.toArray(), []);
  const now = useNow(60_000);
  const cache = useRef(new DayStatusCache());

  return useMemo(() => {
    if (!settings || !logs || !tests || !essays || !mistakes || !recentReviews || !reviewDates || !cards) return undefined;
    return computeAppState({ settings, logs, tests, essays, mistakes, recentReviews, reviewDates, cards }, today, now, cache.current);
  }, [settings, logs, tests, essays, mistakes, recentReviews, reviewDates, cards, today, now]);
}
