/** Fix pass 2: restore safety, date repair, import atomicity, audio base64, timer pruning (fake-indexeddb). */
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db, getSettings, updateSettings } from './db';
import { saveEssay, saveMistake, saveRecording } from './actions';
import { buildBackup, createSnapshot, latestSnapshot, pruneSnapshots, replaceWithBackup, restoreSnapshot } from './backupIo';
import { parseBackup } from '../logic/backup';
import { pruneTimers } from '../ui/TimerView';

const mistake = (what: string) => saveMistake({ date: '2026-11-25', skill: 'reading', what, correction: 'c', cause: 'misread' });
const whats = async () => (await db.mistakes.toArray()).map((m) => m.what).sort();

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
  await updateSettings({ onboarded: true, firstUseDate: '2026-11-23' });
});
afterEach(() => vi.restoreAllMocks());

describe('restore keeps a way back (item 1)', () => {
  it('restoreSnapshot first saves the current data as "Before restore" and keeps the restored copy', async () => {
    await mistake('old');
    const first = await createSnapshot('Before import');
    await mistake('new since snapshot');
    expect(await restoreSnapshot(first)).toBe(true);
    expect(await whats()).toEqual(['old']);
    expect(await db.snapshots.get(first)).toBeDefined();
    const before = await latestSnapshot();
    expect(before?.reason).toBe('Before restore');
    // The work done after the first snapshot is recoverable from the new copy.
    expect(await restoreSnapshot(before!.id)).toBe(true);
    expect(await whats()).toEqual(['new since snapshot', 'old']);
  });

  it('latestSnapshot never offers a copy older than 7 days; pruneSnapshots removes them', async () => {
    const now = Date.now();
    await db.snapshots.put({ id: 'old', createdAt: now - 8 * 86_400_000, reason: 'Before import', data: '{}' });
    expect(await latestSnapshot(now)).toBeUndefined();
    await db.snapshots.put({ id: 'edge', createdAt: now - 7 * 86_400_000 + 1000, reason: 'Before import', data: '{}' });
    expect((await latestSnapshot(now))?.id).toBe('edge');
    expect(await latestSnapshot(now + 2000)).toBeUndefined();
    expect(await pruneSnapshots(now)).toBe(1);
    expect(await db.snapshots.get('old')).toBeUndefined();
    expect(await db.snapshots.get('edge')).toBeDefined();
  });

  it('a damaged safety copy is refused before anything changes', async () => {
    await mistake('keep');
    await db.snapshots.put({ id: 'bad', createdAt: Date.now(), reason: 'Before import', data: JSON.stringify({ app: 'ielts-mentor', schemaVersion: 1, tables: { kv: 'nope' } }) });
    await expect(restoreSnapshot('bad')).rejects.toThrow();
    expect(await whats()).toEqual(['keep']);
    expect(await db.snapshots.count()).toBe(1);
  });
});

describe('date order is repairable, not fatal (item 3)', () => {
  it('a backup with startDate after examDate imports with all data kept and dates flagged', async () => {
    await mistake('mine');
    const f = await buildBackup(false);
    f.tables.kv = [{ key: 'settings', value: { onboarded: true, startDate: '2027-12-01', examDate: '2027-11-20' } }];
    const p = parseBackup(JSON.stringify(f));
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    expect(p.preview.datesRepaired).toBe(true);
    expect(p.preview.mistakes).toBe(1);
    await replaceWithBackup(p.file);
    const s = await getSettings();
    expect(s.startDate).toBe('2027-12-01');
    expect(s.examDate > s.startDate).toBe(true);
    expect(s.examDateEstimated).toBe(true);
    expect(await whats()).toEqual(['mine']);
  });

  it('equal dates and a start after the DEFAULT exam date (exam missing) are repaired too', () => {
    const mk = (value: unknown) => JSON.stringify({ app: 'ielts-mentor', schemaVersion: 1, tables: { kv: [{ key: 'settings', value }] } });
    const eq = parseBackup(mk({ startDate: '2027-05-01', examDate: '2027-05-01' }));
    expect(eq.ok && eq.preview.datesRepaired).toBe(true);
    const noExam = parseBackup(mk({ startDate: '2028-01-10' }));
    expect(noExam.ok && noExam.preview.datesRepaired).toBe(true);
    if (noExam.ok) expect(((noExam.file.tables.kv[0] as { value: { examDate: string } }).value.examDate > '2028-01-10')).toBe(true);
    const fine = parseBackup(mk({ startDate: '2026-11-23', examDate: '2027-11-20' }));
    expect(fine.ok && fine.preview.datesRepaired).toBe(false);
  });

  it('a real export after "Start from Day 1 today" is always importable', async () => {
    await updateSettings({ startDate: '2027-11-25', examDate: '2027-11-20' }); // what the old onboarding bug could save
    const p = parseBackup(JSON.stringify(await buildBackup(false)));
    expect(p.ok).toBe(true);
  });
});

describe('import atomicity (item 4)', () => {
  it('onboarded:true is written in the same transaction as the data', async () => {
    await updateSettings({ onboarded: false });
    const f = await buildBackup(false);
    f.tables.kv = [{ key: 'settings', value: { onboarded: false, startDate: '2026-11-23', examDate: '2027-11-20' } }];
    const p = parseBackup(JSON.stringify(f));
    if (!p.ok) throw new Error('parse');
    await replaceWithBackup(p.file);
    expect((await getSettings()).onboarded).toBe(true);
  });

  it('if the write fails, neither the data nor onboarded change', async () => {
    await updateSettings({ onboarded: false, murphyUnitsDone: 3 });
    await mistake('keep');
    await saveRecording({ id: 'r1', createdAt: Date.now(), date: '2026-11-25', part: 2, promptTitle: 'p', mime: 'audio/mp4', size: 3, durationMs: 1 }, new Blob(['abc']));
    const f = await buildBackup(true);
    f.tables.mistakes = [];
    f.tables.kv = [{ key: 'settings', value: { onboarded: false, murphyUnitsDone: 9 } }];
    const p = parseBackup(JSON.stringify(f));
    if (!p.ok) throw new Error('parse');
    vi.spyOn(db.audio, 'put').mockImplementation(() => Promise.reject(new Error('disk full')) as never);
    await expect(replaceWithBackup(p.file)).rejects.toThrow();
    const s = await getSettings();
    expect(s.onboarded).toBe(false);
    expect(s.murphyUnitsDone).toBe(3);
    expect(await whats()).toEqual(['keep']);
  });
});

describe('import atomicity: failing onboarded write', () => {
  it('if writing onboarded fails, the imported data is rolled back too', async () => {
    await updateSettings({ onboarded: false });
    await mistake('keep');
    const f = await buildBackup(false);
    f.tables.mistakes = [];
    const p = parseBackup(JSON.stringify(f));
    if (!p.ok) throw new Error('parse');
    const orig = db.kv.put.bind(db.kv);
    vi.spyOn(db.kv, 'put').mockImplementation(((row: { key: string; value: { onboarded?: boolean } }) =>
      row.key === 'settings' && row.value?.onboarded === true ? Promise.reject(new Error('fail')) : orig(row as never)) as never);
    await expect(replaceWithBackup(p.file)).rejects.toThrow();
    vi.restoreAllMocks();
    expect(await whats()).toEqual(['keep']);
    expect((await getSettings()).onboarded).toBe(false);
  });
});

describe('audio base64 is checked before any snapshot or write (item 9)', () => {
  const withAudio = async (data: string) => {
    const f = await buildBackup(true);
    f.tables.recordings = [{ id: 'r1', createdAt: Date.now(), expiresAt: Date.now() + 1000, date: '2026-11-25', part: 2, promptTitle: 'p', mime: 'audio/mp4', size: 3, durationMs: 1, audioDeleted: false }];
    f.audio = [{ id: 'r1', mime: 'audio/mp4', data }];
    return parseBackup(JSON.stringify(f));
  };
  it.each([
    ['not base64 characters', 'ab$c'],
    ['length not a multiple of 4', 'YWJ'],
    ['padding in the middle', 'YQ==YWJj'],
    ['too much padding', 'Y==='],
    ['whitespace', 'YWJj YWJj'],
  ])('rejects %s', async (_n, data) => {
    await mistake('keep');
    const r = await withAudio(data);
    expect(r).toEqual({ ok: false, error: 'damaged' });
    expect(await db.snapshots.count()).toBe(0);
    expect(await whats()).toEqual(['keep']);
  });
  it.each([['YWJj'], ['YQ=='], ['YWI='], ['']])('accepts %s', async (data) => {
    expect((await withAudio(data)).ok).toBe(true);
  });
});

describe('pruneTimers (item 7)', () => {
  const run = (startedAt: number) => ({ status: 'running', durationMs: 60_000, startedAt, pausedAt: null, pausedAccumMs: 0 });
  it('keeps writing timers while their draft exists, prunes them when the draft is gone, never prunes paused', async () => {
    const now = Date.now();
    const old = now - 10 * 86_400_000;
    await saveEssay({ id: 'e1', sessionId: 'w-live', kind: 'task2', status: 'draft', date: '2026-11-20', startedAt: old, promptText: 'p', text: '', words: 0, timed: true, durationMs: 0 });
    await saveEssay({ id: 'w-solo', kind: 'task1', status: 'draft', date: '2026-11-20', startedAt: old, promptText: 'p', text: '', words: 0, timed: true, durationMs: 0 });
    await db.kv.bulkPut([
      { key: 'timer:write:w-live', value: run(old) },
      { key: 'timer:write:w-solo', value: run(old) },
      { key: 'timer:write:w-gone', value: run(now - 60_000) },
      { key: 'timer:write:w-paused', value: { ...run(old), status: 'paused', pausedAt: old + 1000 } },
      { key: 'timer:block:2026-01-01:x', value: { ...run(old), status: 'paused', pausedAt: old + 1000 } },
      { key: 'timer:block:2026-01-01:y', value: run(old) },
      { key: 'timer:practice:reading:20', value: run(now - 60_000) },
    ]);
    expect(await pruneTimers(now)).toBe(2);
    const left = (await db.kv.where('key').startsWith('timer:').primaryKeys()).sort();
    expect(left).toEqual(['timer:block:2026-01-01:x', 'timer:practice:reading:20', 'timer:write:w-live', 'timer:write:w-paused', 'timer:write:w-solo']);
  });
});
