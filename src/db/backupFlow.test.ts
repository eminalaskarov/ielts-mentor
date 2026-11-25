/** Backup hand-off, dry run and live-audio safety (fake-indexeddb). */
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db, getSettings, updateSettings } from './db';
import { saveRecording } from './actions';
import { buildBackup, createSnapshot, dryRunState, latestSnapshot, prepareBackup, replaceWithBackup, restoreSnapshot, shareBackupFile } from './backupIo';
import { parseBackup } from '../logic/backup';
import { RECORDING_TTL_MS } from '../logic/recordings';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
  await updateSettings({ onboarded: true, firstUseDate: '2026-11-23' });
});
afterEach(() => vi.unstubAllGlobals());

describe('share hand-off', () => {
  it('calls navigator.share synchronously and does not mark the backup done by itself', async () => {
    const p = await prepareBackup(false);
    let called = false;
    let resolveShare!: () => void;
    vi.stubGlobal('navigator', {
      canShare: () => true,
      share: () => {
        called = true;
        return new Promise<void>((r) => (resolveShare = r));
      },
    });
    const pending = shareBackupFile(p);
    expect(called).toBe(true); // nothing awaited before share()
    resolveShare();
    expect(await pending).toBe('shared');
    expect((await getSettings()).lastBackupAt).toBeNull();
  });

  it('cancelled share sheet = cancelled', async () => {
    const p = await prepareBackup(false);
    vi.stubGlobal('navigator', { canShare: () => true, share: () => Promise.reject(Object.assign(new Error('x'), { name: 'AbortError' })) });
    expect(await shareBackupFile(p)).toBe('cancelled');
  });

  it('no share support = download fallback (caller must ask the user to confirm)', async () => {
    const p = await prepareBackup(false);
    const clicks: string[] = [];
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:x', revokeObjectURL: () => {} });
    vi.stubGlobal('document', { createElement: () => ({ click: () => clicks.push('click'), remove: () => {} }), body: { appendChild: () => {} } });
    expect(await shareBackupFile(p)).toBe('downloaded');
    expect(clicks).toEqual(['click']);
  });
});

describe('import safety', () => {
  it('a backup that passes parsing but would crash the state computation is refused before anything changes', async () => {
    const f = await buildBackup(false);
    const p = parseBackup(JSON.stringify(f));
    if (!p.ok) throw new Error('parse');
    expect(() => dryRunState(p.file)).not.toThrow();
    // Simulate an unexpected shape that slipped through validation.
    (p.file.tables.cards as unknown[]).push({ id: 'x', headword: 'x', collocations: [], tags: [], srs: null });
    await db.mistakes.put({ id: 'keep', date: '2026-11-25', createdAt: 1, skill: 'reading', what: 'w', correction: 'c', cause: 'other', reviewedMonths: [], stillTricky: false, fixed: false });
    await expect(replaceWithBackup(p.file)).rejects.toThrow();
    expect(await db.mistakes.get('keep')).toBeDefined();
    expect(await db.snapshots.count()).toBe(0);
  });

  it('snapshots include only audio that is still within 24 h', async () => {
    const now = Date.now();
    await saveRecording({ id: 'fresh', createdAt: now, date: '2026-11-25', part: 2, promptTitle: 'p', mime: 'audio/mp4', size: 3, durationMs: 1 }, new Blob(['new']));
    await saveRecording({ id: 'old', createdAt: now - RECORDING_TTL_MS - 1000, date: '2026-11-24', part: 2, promptTitle: 'p', mime: 'audio/mp4', size: 3, durationMs: 1 }, new Blob(['old']));
    await createSnapshot('x');
    const snap = await latestSnapshot();
    const data = JSON.parse(snap!.data) as { audio?: { id: string }[] };
    expect(data.audio?.map((a) => a.id)).toEqual(['fresh']);
    await db.audio.clear();
    await restoreSnapshot(snap!.id);
    expect(await new Response((await db.audio.get('fresh'))!.blob).text()).toBe('new');
    expect((await db.recordings.get('fresh'))!.audioDeleted).toBe(false);
    expect((await db.recordings.get('old'))!.audioDeleted).toBe(true);
  });

  it('import keeps live audio only for recordings that are still in the restored data', async () => {
    await saveRecording({ id: 'r1', createdAt: Date.now(), date: '2026-11-25', part: 2, promptTitle: 'p', mime: 'audio/mp4', size: 3, durationMs: 1 }, new Blob(['abc']));
    const f = await buildBackup(false);
    f.tables.recordings = [];
    const p = parseBackup(JSON.stringify(f));
    if (!p.ok) throw new Error('parse');
    await replaceWithBackup(p.file);
    expect(await db.audio.get('r1')).toBeUndefined();
  });
});
