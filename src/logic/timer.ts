/**
 * Timestamp-based timer state (ux-spec §6.3). Never counts ticks: remaining time is always computed from
 * startedAt + paused time, so it survives backgrounding, lock screen and relaunch. Pure.
 */
export type TimerStatus = 'idle' | 'running' | 'paused';

export interface TimerState {
  status: TimerStatus;
  /** Countdown length; 0 = count up (stopwatch). */
  durationMs: number;
  startedAt: number | null;
  pausedAt: number | null;
  pausedAccumMs: number;
}

export function idleTimer(durationMs: number): TimerState {
  return { status: 'idle', durationMs, startedAt: null, pausedAt: null, pausedAccumMs: 0 };
}

export function startTimer(t: TimerState, now: number): TimerState {
  if (t.status === 'running') return t;
  if (t.status === 'paused') return resumeTimer(t, now);
  return { ...t, status: 'running', startedAt: now, pausedAt: null, pausedAccumMs: 0 };
}

export function pauseTimer(t: TimerState, now: number): TimerState {
  if (t.status !== 'running') return t;
  return { ...t, status: 'paused', pausedAt: now };
}

export function resumeTimer(t: TimerState, now: number): TimerState {
  if (t.status !== 'paused' || t.pausedAt === null) return t;
  return { ...t, status: 'running', pausedAccumMs: t.pausedAccumMs + (now - t.pausedAt), pausedAt: null };
}

export function resetTimer(t: TimerState): TimerState {
  return idleTimer(t.durationMs);
}

export function elapsedMs(t: TimerState, now: number): number {
  if (t.startedAt === null) return 0;
  const end = t.status === 'paused' && t.pausedAt !== null ? t.pausedAt : now;
  return Math.max(0, end - t.startedAt - t.pausedAccumMs);
}

/** Remaining ms for a countdown (may be negative = overtime). For stopwatch returns elapsed. */
export function remainingMs(t: TimerState, now: number): number {
  if (t.durationMs <= 0) return elapsedMs(t, now);
  return t.durationMs - elapsedMs(t, now);
}

export function isTimeUp(t: TimerState, now: number): boolean {
  return t.durationMs > 0 && t.status !== 'idle' && remainingMs(t, now) <= 0;
}

/** Epoch ms when a running countdown ends (for "Ends at 19:42"). */
export function endsAt(t: TimerState, now: number): number | null {
  if (t.status !== 'running' || t.durationMs <= 0) return null;
  return now + remainingMs(t, now);
}

/**
 * Which persisted timer entries may be removed on launch.
 * - idle / malformed entries carry no state → stale.
 * - paused timers are NEVER pruned (the user deliberately parked them).
 * - `timer:write:<sessionId>`: kept while a writing draft with that session exists; pruned when its
 *   owner is gone (only decided when `writeOwners` is given — otherwise the time rule applies).
 * - other running timers: pruned when started more than 3 days ago, or a block timer of a day
 *   before yesterday.
 */
export function isStaleTimerEntry(
  key: string,
  value: unknown,
  now: number,
  today: string,
  yesterday: string,
  writeOwners?: ReadonlySet<string>,
): boolean {
  const v = value as Partial<TimerState> | null;
  if (!v || typeof v !== 'object' || v.status === 'idle' || v.status === undefined) return true;
  if (v.status === 'paused') return false;
  if (v.status !== 'running') return true;
  const w = /^timer:write:(.+)$/.exec(key);
  if (w && writeOwners) return !writeOwners.has(w[1]);
  if (typeof v.startedAt === 'number' && now - v.startedAt > 3 * 86_400_000) return true;
  const m = /^timer:block:(\d{4}-\d{2}-\d{2}):/.exec(key);
  if (m && m[1] !== today && m[1] !== yesterday) return true;
  return false;
}
