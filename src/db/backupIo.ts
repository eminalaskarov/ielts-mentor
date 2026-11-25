/** Export / import of all data as JSON, with a safety snapshot before replacing. */
import { DEFAULT_SETTINGS, db, updateSettings, uid } from './db';
import type { AudioRec, BlockLog, CardRec, Essay, KV, Mistake, RecordingMeta, ReviewRec, Settings, Snapshot, TestLog } from './db';
import type { Table } from 'dexie';
import { BACKUP_APP_ID, BACKUP_SCHEMA_VERSION, BACKUP_TABLES, backupFileName, upgradeBackup } from '../logic/backup';
import type { BackupFile, BackupTable } from '../logic/backup';
import { addDays, bakuDate } from '../logic/dates';
import { isExpired } from '../logic/recordings';
import { computeAppState, RECENT_REVIEW_DAYS } from '../state/compute';
import { SNAPSHOT_KEEP_MS, snapshotIsFresh } from '../logic/recovery';
import { setReplacedAt } from './recoveryMarkers';

export const APP_VERSION = '1.0.0';

function tableOf(name: BackupTable): Table<unknown, unknown> {
  return (db as unknown as Record<string, Table<unknown, unknown>>)[name];
}

async function blobToBase64(b: Blob): Promise<string> {
  const buf = new Uint8Array(await b.arrayBuffer());
  let s = '';
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(s);
}

function base64ToBlob(data: string, mime: string): Blob {
  const bin = atob(data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export type AudioEntry = { id: string; mime: string; data: string };
export type FullBackup = BackupFile & { audio?: AudioEntry[] };

/**
 * includeAudio: true = all audio, 'live' = only audio of recordings that have not expired yet
 * (≤ 24 h old; used for safety snapshots), false = none.
 */
export async function buildBackup(includeAudio: boolean | 'live', now = Date.now()): Promise<FullBackup> {
  const tables = {} as Record<BackupTable, unknown[]>;
  const blobs: { meta: RecordingMeta; audio: AudioRec }[] = [];
  // One read transaction: every table (and the audio) comes from the same moment.
  await db.transaction('r', [...BACKUP_TABLES.map(tableOf), db.audio], async () => {
    for (const t of BACKUP_TABLES) tables[t] = await tableOf(t).toArray();
    if (!includeAudio) return;
    for (const m of tables.recordings as RecordingMeta[]) {
      if (includeAudio === 'live' && isExpired(m, now)) continue;
      const a = await db.audio.get(m.id);
      if (a) blobs.push({ meta: m, audio: a });
    }
  });
  const file: FullBackup = {
    app: BACKUP_APP_ID,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date(now).toISOString(),
    appVersion: APP_VERSION,
    includesAudio: includeAudio !== false,
    tables,
  };
  if (includeAudio) {
    // Base64 after the transaction (awaiting blob reads inside it would let it auto-commit).
    const out: AudioEntry[] = [];
    for (const { meta, audio } of blobs) out.push({ id: meta.id, mime: meta.mime || audio.blob.type, data: await blobToBase64(audio.blob) });
    file.audio = out;
  }
  return file;
}

// ---------------------------------------------------------------------------
// Export: two steps so the share sheet opens directly from the user's tap
// (iOS rejects navigator.share() if anything slow was awaited before it).
// ---------------------------------------------------------------------------

export interface PreparedBackup {
  file: File;
  blob: Blob;
  name: string;
  size: number;
}

/** Step 1: build the file (may take a moment with audio). */
export async function prepareBackup(includeAudio = false): Promise<PreparedBackup> {
  const data = await buildBackup(includeAudio);
  const json = JSON.stringify(data);
  const name = backupFileName(bakuDate());
  const blob = new Blob([json], { type: 'application/json' });
  return { file: new File([blob], name, { type: 'application/json' }), blob, name, size: blob.size };
}

export type ShareOutcome = 'shared' | 'cancelled' | 'downloaded';

export function canShareFile(file: File): boolean {
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  try {
    return !!nav.share && !!nav.canShare && nav.canShare({ files: [file] });
  } catch {
    return false;
  }
}

function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * Step 2: call directly from a tap handler. navigator.share is invoked synchronously (nothing is
 * awaited before it). 'shared' = the share sheet completed (the file was handed off);
 * 'downloaded' = fallback download started (we cannot know whether it was saved — ask the user);
 * 'cancelled' = user closed the share sheet.
 */
export function shareBackupFile(p: PreparedBackup): Promise<ShareOutcome> {
  if (canShareFile(p.file)) {
    let sharing: Promise<void>;
    try {
      sharing = navigator.share({ files: [p.file], title: 'IELTS Mentor backup' });
    } catch {
      download(p.blob, p.name);
      return Promise.resolve('downloaded');
    }
    return sharing.then(
      () => 'shared' as const,
      (e: unknown) => {
        if ((e as DOMException)?.name === 'AbortError') return 'cancelled' as const;
        download(p.blob, p.name);
        return 'downloaded' as const;
      },
    );
  }
  download(p.blob, p.name);
  return Promise.resolve('downloaded');
}

/** Only call when a file was really handed off (share resolved, or the user confirmed the download saved). */
export async function markBackedUp(now = Date.now()): Promise<void> {
  await updateSettings({ lastBackupAt: now });
}

// ---------------------------------------------------------------------------
// Import / restore
// ---------------------------------------------------------------------------

async function writeAll(file: FullBackup, opts: { onboarded?: boolean } = {}): Promise<void> {
  const all = [...BACKUP_TABLES.map(tableOf), db.audio];
  await db.transaction('rw', all, async () => {
    const fileAudio = new Map((file.audio ?? []).map((a) => [a.id, a]));
    const restoredRecs = new Set(((file.tables.recordings ?? []) as { id: string }[]).map((r) => r.id));
    // Keep live audio already on this phone for recordings that remain after the restore and whose
    // audio is not in the file (a no-audio backup must not wipe today's recordings).
    const keep = (await db.audio.toArray()).filter((a) => restoredRecs.has(a.id) && !fileAudio.has(a.id));
    for (const t of BACKUP_TABLES) {
      await tableOf(t).clear();
      const rows = file.tables[t] ?? [];
      if (rows.length) await tableOf(t).bulkPut(rows);
    }
    await db.audio.clear();
    for (const a of fileAudio.values()) if (restoredRecs.has(a.id)) await db.audio.put({ id: a.id, blob: base64ToBlob(a.data, a.mime) });
    if (keep.length) await db.audio.bulkPut(keep);
    // audioDeleted must match reality.
    const metas = await db.recordings.toArray();
    const have = new Set((await db.audio.toCollection().primaryKeys()) as string[]);
    for (const m of metas) {
      const has = have.has(m.id);
      if (m.audioDeleted !== !has) await db.recordings.update(m.id, { audioDeleted: !has });
    }
    // Same transaction: the restored data and "onboarded" commit together or not at all.
    if (opts.onboarded) {
      const row = await db.kv.get('settings');
      await db.kv.put({ key: 'settings', value: { ...DEFAULT_SETTINGS, ...((row?.value as Partial<Settings>) ?? {}), onboarded: true } });
    }
  });
}

/** Settings as the app would see them after importing this file. */
function settingsOf(file: FullBackup): Settings {
  const row = (file.tables.kv as KV[]).find((r) => r.key === 'settings');
  return { ...DEFAULT_SETTINGS, ...((row?.value as Partial<Settings>) ?? {}) };
}

/**
 * Run the full Today/streak/queue computation on the file's data before touching the DB.
 * Throws if the data would crash the app.
 */
export function dryRunState(file: FullBackup, now = Date.now()): void {
  const t = file.tables;
  const today = bakuDate(now);
  const reviews = t.reviews as ReviewRec[];
  computeAppState(
    {
      settings: settingsOf(file),
      logs: t.blockLogs as BlockLog[],
      tests: t.tests as TestLog[],
      essays: (t.essays as Essay[]).filter((e) => e.status === 'done'),
      mistakes: t.mistakes as Mistake[],
      recentReviews: reviews.filter((r) => r.date >= addDays(today, -RECENT_REVIEW_DAYS)),
      reviewDates: [...new Set(reviews.map((r) => r.date))].sort(),
      cards: t.cards as CardRec[],
    },
    today,
    now,
  );
}

/** Store a snapshot of the current data (with audio that is still ≤ 24 h old) for "Undo import". */
export async function createSnapshot(reason: string, now = Date.now()): Promise<string> {
  return (await snapshotNow(reason, now)).id;
}

async function snapshotNow(reason: string, now: number): Promise<{ id: string; createdAt: number }> {
  const file = await buildBackup('live', now);
  const id = uid('snap');
  // Strictly newer than any existing copy, so "latest" is unambiguous even within one millisecond.
  const last = await db.snapshots.orderBy('createdAt').last();
  const createdAt = Math.max(now, (last?.createdAt ?? 0) + 1);
  await db.snapshots.put({ id, createdAt, reason, data: JSON.stringify(file) });
  await pruneSnapshots(now);
  return { id, createdAt };
}

/** Delete safety copies older than 7 days (also called on launch). */
export async function pruneSnapshots(now = Date.now()): Promise<number> {
  return db.snapshots.where('createdAt').below(now - SNAPSHOT_KEEP_MS).delete();
}

export async function replaceWithBackup(file: BackupFile): Promise<void> {
  try {
    dryRunState(file);
  } catch (e) {
    throw new Error(`Backup data failed the dry run: ${(e as Error)?.message ?? e}`);
  }
  const snap = await snapshotNow('Before import', Date.now());
  await writeAll(file, { onboarded: true });
  setReplacedAt(Math.max(Date.now(), snap.createdAt));
}

/** Newest safety copy that is still within the 7-day window (older ones are never offered). */
export async function latestSnapshot(now = Date.now()): Promise<Snapshot | undefined> {
  const s = await db.snapshots.orderBy('createdAt').last();
  return s && snapshotIsFresh(s.createdAt, now) ? s : undefined;
}

/**
 * Go back to a safety copy. The current data is first saved as a new "Before restore" copy, so a
 * restore can itself be undone; the restored copy is kept as well.
 */
export async function restoreSnapshot(id: string): Promise<boolean> {
  const snap = await db.snapshots.get(id);
  if (!snap) return false;
  const file = upgradeBackup(JSON.parse(snap.data) as Record<string, unknown>) as unknown as FullBackup;
  for (const t of BACKUP_TABLES) if (!Array.isArray(file.tables?.[t])) throw new Error(`Safety copy is damaged (${t})`);
  const before = await snapshotNow('Before restore', Date.now());
  await writeAll(file, { onboarded: true });
  setReplacedAt(Math.max(Date.now(), before.createdAt));
  return true;
}

export async function eraseAll(): Promise<void> {
  const all = [...BACKUP_TABLES.map(tableOf), db.audio, db.snapshots];
  await db.transaction('rw', all, async () => {
    for (const t of all) await t.clear();
  });
}

/** Ask the browser to keep our storage (installed iOS PWAs usually get it). */
export async function requestPersistence(): Promise<boolean | null> {
  try {
    if (!navigator.storage?.persist) return null;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}

export async function storageInfo(): Promise<{ usage: number | null; quota: number | null; persisted: boolean | null }> {
  try {
    const est = navigator.storage?.estimate ? await navigator.storage.estimate() : null;
    const persisted = navigator.storage?.persisted ? await navigator.storage.persisted() : null;
    return { usage: est?.usage ?? null, quota: est?.quota ?? null, persisted };
  } catch {
    return { usage: null, quota: null, persisted: null };
  }
}
