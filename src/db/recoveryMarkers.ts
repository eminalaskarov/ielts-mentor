/**
 * Small markers in localStorage (readable even when IndexedDB data is what breaks the app):
 * - replacedAt: when data was last replaced by an import or a safety-copy restore.
 * - firstCrashAt: first time the root error screen appeared since the app last started fine.
 */
const REPLACED_KEY = 'ielts-mentor:replacedAt';
const CRASH_KEY = 'ielts-mentor:firstCrashAt';

function read(key: string): number | null {
  try {
    const v = Number(globalThis.localStorage?.getItem(key));
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

function write(key: string, v: number | null): void {
  try {
    if (v === null) globalThis.localStorage?.removeItem(key);
    else globalThis.localStorage?.setItem(key, String(v));
  } catch {
    /* private mode / unavailable: markers are best effort */
  }
}

export const getReplacedAt = () => read(REPLACED_KEY);
export const setReplacedAt = (ms = Date.now()) => write(REPLACED_KEY, ms);
export const getFirstCrashAt = () => read(CRASH_KEY);
/** Records the crash time only if none is recorded yet. Returns the first crash time. */
export function noteCrash(ms = Date.now()): number {
  const cur = read(CRASH_KEY);
  if (cur !== null) return cur;
  write(CRASH_KEY, ms);
  return ms;
}
export const clearCrash = () => write(CRASH_KEY, null);
