/** Timer UI + hook. State is persisted in IndexedDB (kv) so a running timer survives relaunch. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { db, kvDelete, kvGet, kvSet } from '../db/db';
import { elapsedMs, endsAt, idleTimer, isStaleTimerEntry, isTimeUp, pauseTimer, remainingMs, resetTimer, startTimer } from '../logic/timer';
import type { TimerState } from '../logic/timer';
import { addDays, bakuDate, bakuTime, formatClock } from '../logic/dates';
import { Icon } from './Icon';

export function useTimer(storageKey: string | null, durationMs: number) {
  const [t, setT] = useState<TimerState>(() => idleTimer(durationMs));
  const [now, setNow] = useState(() => Date.now());
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const loaded = !storageKey || loadedKey === storageKey;
  const tRef = useRef(t);
  /** The user changed the timer before the saved state finished loading — their action wins. */
  const touchedRef = useRef<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!storageKey) return;
    kvGet<TimerState | null>(`timer:${storageKey}`, null).then((saved) => {
      if (!alive) return;
      if (touchedRef.current !== storageKey) {
        const next = saved && saved.status !== 'idle' ? saved : idleTimer(durationMs);
        tRef.current = next;
        setT(next);
      }
      setLoadedKey(storageKey);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const update = useCallback(
    (fn: (cur: TimerState) => TimerState) => {
      const next = fn(tRef.current);
      tRef.current = next;
      setT(next);
      if (storageKey) {
        touchedRef.current = storageKey;
        // Idle timers are not stored (no stale kv entries after reset/finish).
        void (next.status === 'idle' ? kvDelete(`timer:${storageKey}`) : kvSet(`timer:${storageKey}`, next));
      }
    },
    [storageKey],
  );

  useEffect(() => {
    if (t.status !== 'running') return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    const vis = () => setNow(Date.now());
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('pageshow', vis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', vis);
      window.removeEventListener('pageshow', vis);
    };
  }, [t.status]);

  return {
    t,
    loaded,
    now,
    remaining: remainingMs(t, now),
    elapsed: elapsedMs(t, now),
    timeUp: isTimeUp(t, now),
    endsAt: endsAt(t, now),
    start: () => update((cur) => startTimer(cur, Date.now())),
    pause: () => update((cur) => pauseTimer(cur, Date.now())),
    reset: () => update((cur) => resetTimer(cur)),
    setDuration: (ms: number) => update(() => idleTimer(ms)),
    /** Start a fresh countdown right away (e.g. Speaking prep → talk). */
    restart: (ms: number) => update(() => startTimer(idleTimer(ms), Date.now())),
  };
}

/** Remove stale timer entries (call on launch). */
export async function pruneTimers(now = Date.now()): Promise<number> {
  const today = bakuDate(now);
  const yesterday = addDays(today, -1);
  const rows = await db.kv.where('key').startsWith('timer:').toArray();
  // Owners of writing timers: open drafts (grouped by sessionId, like the writing screen does).
  const drafts = await db.essays.where('status').equals('draft').toArray();
  const owners = new Set(drafts.map((d) => d.sessionId ?? d.id));
  const stale = rows.filter((r) => isStaleTimerEntry(r.key, r.value, now, today, yesterday, owners)).map((r) => r.key);
  if (stale.length) await db.kv.bulkDelete(stale);
  return stale.length;
}

export async function clearTimer(storageKey: string): Promise<void> {
  await kvDelete(`timer:${storageKey}`);
}

export function TimerView({ storageKey, minutes, label, countUp }: { storageKey: string; minutes: number; label?: string; countUp?: boolean }) {
  const timer = useTimer(storageKey, countUp ? 0 : minutes * 60_000);
  const { t } = timer;
  const display = countUp ? timer.elapsed : timer.remaining;
  const warn = !countUp && t.status !== 'idle' && timer.remaining <= 5 * 60_000 && !timer.timeUp;
  return (
    <div className="card stack" style={{ alignItems: 'center' }}>
      {label && <p className="subhead">{label}</p>}
      <div className={`timer-digits${warn ? ' warn' : ''}${timer.timeUp ? ' over' : ''}`} role="timer" aria-live="off">
        {timer.timeUp ? 'Time’s up' : formatClock(display)}
      </div>
      {warn && <p className="footnote" style={{ color: 'var(--warning)' }}>5 min left</p>}
      {timer.endsAt && <p className="footnote">Ends at {bakuTime(timer.endsAt)}</p>}
      <div className="row" style={{ justifyContent: 'center' }}>
        {t.status === 'running' ? (
          <button className="btn" onClick={timer.pause}>
            <Icon name="pause" size={18} /> Pause
          </button>
        ) : (
          <button className="btn" onClick={timer.start}>
            <Icon name="play" size={18} /> {t.status === 'paused' ? 'Resume' : 'Start'}
          </button>
        )}
        {t.status !== 'idle' && (
          <button className="btn plain" onClick={timer.reset}>
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

/** Minutes used so far on a persisted timer (for "I spent" defaults). */
export async function timerMinutes(storageKey: string): Promise<number | null> {
  const s = await kvGet<TimerState | null>(`timer:${storageKey}`, null);
  if (!s || s.status === 'idle') return null;
  return Math.round(elapsedMs(s, Date.now()) / 60_000);
}
