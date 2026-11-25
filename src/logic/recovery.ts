/** Safety-copy (snapshot) rules for "Undo import" and the crash recovery screen. Pure. */
import { bakuDate, bakuTime, formatShort } from './dates';

export const SNAPSHOT_KEEP_DAYS = 7;
export const SNAPSHOT_KEEP_MS = SNAPSHOT_KEEP_DAYS * 86_400_000;

/** Reasons of snapshots taken right before data was replaced (import or restore). */
export const REPLACE_REASONS = ['Before import', 'Before restore'] as const;

export function snapshotIsFresh(createdAt: number, now: number): boolean {
  return createdAt >= now - SNAPSHOT_KEEP_MS && createdAt <= now + 60_000;
}

/** "25 Nov 2026, 14:30" (Asia/Baku). */
export function formatDateTime(ms: number): string {
  return `${formatShort(bakuDate(ms))}, ${bakuTime(ms)}`;
}

/** The warning sentence both confirm dialogs use. */
export function changesLostText(createdAt: number): string {
  return `Changes made after ${formatDateTime(createdAt)} will be lost.`;
}

/**
 * The crash screen offers the safety copy only when it is plausibly the cure: the snapshot is fresh,
 * was taken right before the most recent import/restore (replacedAt), and the app started crashing
 * after that replacement. A crash that began before the import is not caused by it.
 */
export function shouldOfferSafetyCopy(o: {
  snapshot: { createdAt: number; reason: string } | null | undefined;
  replacedAt: number | null;
  firstCrashAt: number | null;
  now: number;
}): boolean {
  const { snapshot, replacedAt, firstCrashAt, now } = o;
  if (!snapshot || replacedAt === null || firstCrashAt === null) return false;
  if (!snapshotIsFresh(snapshot.createdAt, now)) return false;
  if (!(REPLACE_REASONS as readonly string[]).includes(snapshot.reason)) return false;
  if (snapshot.createdAt > replacedAt) return false; // a newer snapshot is not the pre-import data
  return firstCrashAt >= replacedAt;
}
