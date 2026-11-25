/** QA: backup export/import safety (fake-indexeddb). */
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, getSettings, updateSettings } from './db';
import { addUserCard, rateCard, saveEssay, saveMistake, saveRecording, saveTest, setBlockDone, purgeExpiredRecordings, saveLiveSession, kvSetMilestonesNoop } from './qa-helpers';
import { buildBackup, createSnapshot, eraseAll, latestSnapshot, replaceWithBackup, restoreSnapshot } from './backupIo';
import { BACKUP_TABLES, parseBackup } from '../logic/backup';
import { resolveDay } from '../logic/plan';
import { RECORDING_TTL_MS } from '../logic/recordings';
import { kvSet } from './db';

void kvSetMilestonesNoop;

async function dump() {
  const out: Record<string, unknown[]> = {};
  for (const t of BACKUP_TABLES) out[t] = (await (db as never as Record<string, { toArray(): Promise<unknown[]> }>)[t].toArray()).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return out;
}

async function seed() {
  await updateSettings({ onboarded: true, firstUseDate: '2026-11-23', murphyUnitsDone: 6, examDate: '2027-11-20' });
  await kvSet('milestones', { done: { a: '2027-01-01' }, snoozedUntil: {}, dismissed: {} });
  const day = resolveDay('2026-11-23', { startDate: '2026-11-23', examDate: '2027-11-20' });
  await setBlockDone('2026-11-23', day.blocks[0], true);
  const id = await addUserCard({ headword: 'sharp', pos: 'adjective', definition: 'x', example: 'a sharp increase', collocations: ['sharp rise'], tags: ['t'], translationAz: 'kəskin' });
  await rateCard((await db.cards.get(id))!, 3, Date.now());
  await saveMistake({ date: '2026-11-25', skill: 'reading', what: 'w', correction: 'c', cause: 'misread', tag: 'tfng' });
  await saveEssay({ id: 'e1', kind: 'task2', status: 'done', date: '2026-11-25', startedAt: 1, promptText: 'p', text: 'hello ünïcödé "quotes" \n newline', words: 3, timed: true, durationMs: 5, scores: { ta: 6, cc: 6, lr: 6, gra: 6 } });
  await saveTest({ id: 't1', date: '2026-11-25', createdAt: 1, type: 'lr', source: 's', listeningRaw: 20, readingRaw: 21, weakAreas: [], notes: '', official: false });
  await saveLiveSession({ date: '2026-11-25', minutes: 30, withWhom: 'x', notes: '' });
  await db.quizAttempts.put({ id: '2026-11-25|daily|1', date: '2026-11-25', kind: 'daily', itemIds: ['q-tenses-0001'], answers: { 'q-tenses-0001': { given: 1, correct: true } }, startedAt: 1 });
  await saveRecording({ id: 'r1', createdAt: Date.now(), date: '2026-11-25', part: 2, promptTitle: 'p', mime: 'audio/mp4', size: 3, durationMs: 1000 }, new Blob(['abc'], { type: 'audio/mp4' }));
  await db.recordings.update('r1', { review: { checklist: { a: true }, scores: { fluency: 6 }, notes: 'n' } });
}

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe('backup round trip', () => {
  it('export -> wipe -> import yields identical data in every table', async () => {
    await seed();
    const before = await dump();
    const json = JSON.stringify(await buildBackup(false));
    await eraseAll();
    expect((await dump()).cards.length).toBe(0);
    const p = parseBackup(json);
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    await replaceWithBackup(p.file);
    const after = await dump();
    // recording audio is not in a no-audio backup -> only audioDeleted flips
    const rec = after.recordings[0] as { audioDeleted: boolean };
    expect(rec.audioDeleted).toBe(true);
    (before.recordings[0] as { audioDeleted: boolean }).audioDeleted = true;
    expect(after).toEqual(before);
    expect((await getSettings()).onboarded).toBe(true);
    expect((await getSettings()).murphyUnitsDone).toBe(8); // 6 + 2 from the ticked Murphy block
  });

  it('with audio: blob bytes survive the round trip', async () => {
    await seed();
    const json = JSON.stringify(await buildBackup(true));
    await eraseAll();
    const p = parseBackup(json);
    if (!p.ok) throw new Error('parse');
    await replaceWithBackup(p.file);
    const a = await db.audio.get('r1');
    expect(a).toBeDefined();
    expect(await new Response(a!.blob).text()).toBe('abc');
    expect((await db.recordings.get('r1'))!.audioDeleted).toBe(false);
  });

  it('import onto a device that already has different data replaces it fully (no merge leftovers)', async () => {
    await seed();
    const json = JSON.stringify(await buildBackup(false));
    await db.mistakes.clear();
    await saveMistake({ id: 'extra', date: '2026-12-01', skill: 'writing', what: 'z', correction: 'z', cause: 'other' });
    const p = parseBackup(json);
    if (!p.ok) throw new Error('parse');
    await replaceWithBackup(p.file);
    expect(await db.mistakes.get('extra')).toBeUndefined();
    expect(await db.mistakes.count()).toBe(1);
  });

  it('does not export snapshots or leak them into the file', async () => {
    await seed();
    await createSnapshot('x');
    const f = await buildBackup(false);
    expect(Object.keys(f.tables)).not.toContain('snapshots');
    expect(JSON.stringify(f)).not.toContain('"reason":"x"');
  });

  it('large year of data: 4000 cards + 3000 reviews export/import', async () => {
    const now = Date.now();
    const cards = Array.from({ length: 4000 }, (_, i) => ({ id: `u-${i}`, source: 'user' as const, headword: 'w' + i, pos: 'noun', definition: 'd', example: 'e', collocations: [], tags: [], createdAt: now, srs: { state: 'new' as const, step: 0, interval: 0, ease: 2.5, reps: 0, lapses: 0, due: '2026-11-25', dueAt: now } }));
    await db.cards.bulkPut(cards);
    await db.reviews.bulkAdd(Array.from({ length: 3000 }, (_, i) => ({ cardId: `u-${i}`, at: now, date: '2026-11-25', rating: 3 as const, prevState: 'new' as const })));
    const json = JSON.stringify(await buildBackup(false));
    await eraseAll();
    const p = parseBackup(json);
    if (!p.ok) throw new Error('parse');
    await replaceWithBackup(p.file);
    expect(await db.cards.count()).toBe(4000);
    expect(await db.reviews.count()).toBe(3000);
  });
});

describe('rejecting bad files (no data change)', () => {
  const good = async () => JSON.stringify(await buildBackup(false));
  const cases: [string, (g: string) => string][] = [
    ['empty string', () => ''],
    ['plain text', () => 'hello'],
    ['truncated JSON', (g) => g.slice(0, Math.floor(g.length / 2))],
    ['JSON null', () => 'null'],
    ['JSON array', () => '[]'],
    ['foreign JSON', () => JSON.stringify({ app: 'other', tables: {} })],
    ['no app field', () => JSON.stringify({ schemaVersion: 1, tables: {} })],
    ['newer schema', (g) => g.replace('"schemaVersion":1', '"schemaVersion":99')],
    ['schemaVersion missing', () => JSON.stringify({ app: 'ielts-mentor', tables: {} })],
    ['schemaVersion string', () => JSON.stringify({ app: 'ielts-mentor', schemaVersion: '1', tables: {} })],
    ['tables missing', () => JSON.stringify({ app: 'ielts-mentor', schemaVersion: 1 })],
    ['table not an array', () => JSON.stringify({ app: 'ielts-mentor', schemaVersion: 1, tables: { cards: {} } })],
  ];
  it.each(cases)('parseBackup rejects: %s', async (_n, mk) => {
    await seed();
    const before = await dump();
    const r = parseBackup(mk(await good()));
    expect(r.ok).toBe(false);
    expect(await dump()).toEqual(before);
  });

  it('schemaVersion 0 / negative / NaN-like (older or bogus) is not silently accepted as current', () => {
    for (const v of [0, -1]) {
      const r = parseBackup(JSON.stringify({ app: 'ielts-mentor', schemaVersion: v, tables: {} }));
      // Documented expectation: only known versions (>=1) accepted.
      expect(r.ok, `schemaVersion ${v}`).toBe(false);
    }
  });

  it('rows that are not valid for their table (null / missing key) abort the import atomically', async () => {
    await seed();
    const before = await dump();
    const f = await buildBackup(false);
    (f.tables.cards as unknown[]).push(null);
    const p = parseBackup(JSON.stringify(f));
    if (!p.ok) {
      expect(await dump()).toEqual(before);
      return;
    }
    await expect(replaceWithBackup(p.file)).rejects.toBeDefined();
    expect(await dump()).toEqual(before);
  });

  it('structurally wrong but array-shaped rows should be rejected by parseBackup (otherwise UI may crash later)', async () => {
    const f = await buildBackup(false);
    f.tables.cards = [{ id: 'x' }]; // no srs, no headword
    f.tables.blockLogs = [{ foo: 1 }];
    const r = parseBackup(JSON.stringify(f));
    expect(r.ok, 'BUG: card without srs/headword accepted').toBe(false);
  });

  it('settings with bad dates in kv is rejected or sanitised (otherwise Today screen can crash)', async () => {
    const f = await buildBackup(false);
    f.tables.kv = [{ key: 'settings', value: { startDate: 'garbage', examDate: null } }];
    const r = parseBackup(JSON.stringify(f));
    expect(r.ok, 'BUG: settings.startDate garbage accepted').toBe(false);
  });
});

describe('safety snapshot and undo', () => {
  it('import creates a snapshot; undo restores previous data exactly', async () => {
    await seed();
    const before = await dump();
    const other = await buildBackup(false);
    other.tables.mistakes = [];
    other.tables.cards = [];
    const p = parseBackup(JSON.stringify(other));
    if (!p.ok) throw new Error('parse');
    await replaceWithBackup(p.file);
    expect(await db.cards.count()).toBe(0);
    const snap = await latestSnapshot();
    expect(snap?.reason).toBe('Before import');
    expect(await restoreSnapshot(snap!.id)).toBe(true);
    const after = await dump();
    // Live (<24 h) audio is now kept by import and included in snapshots, so the recording keeps its audio (audioDeleted stays false).
    expect(await db.audio.get('r1')).toBeDefined();
    expect(after).toEqual(before);
    // Fix pass 2: the restored copy is kept, and the replaced data is saved as "Before restore".
    expect(await db.snapshots.get(snap!.id)).toBeDefined();
    expect((await latestSnapshot())?.reason).toBe('Before restore');
  });

  it('undo import must not destroy audio recorded in the last 24 h (audio is excluded from snapshots)', async () => {
    await seed();
    expect(await db.audio.get('r1')).toBeDefined();
    const other = await buildBackup(false);
    const p = parseBackup(JSON.stringify(other));
    if (!p.ok) throw new Error('parse');
    await replaceWithBackup(p.file);
    // Import of a no-audio backup removes live audio (documented? at least recoverable by undo):
    const snap = await latestSnapshot();
    await restoreSnapshot(snap!.id);
    expect(await db.audio.get('r1'), 'BUG: audio lost after import+undo').toBeDefined();
  });

  it('import of a no-audio backup should not delete recordings that are still within 24 h', async () => {
    await seed();
    const other = await buildBackup(false);
    const p = parseBackup(JSON.stringify(other));
    if (!p.ok) throw new Error('parse');
    await replaceWithBackup(p.file);
    expect(await db.audio.get('r1'), 'BUG: fresh recording audio wiped by import').toBeDefined();
  });

  it('restoreSnapshot with unknown id returns false and changes nothing', async () => {
    await seed();
    const before = await dump();
    expect(await restoreSnapshot('nope')).toBe(false);
    expect(await dump()).toEqual(before);
  });

  it('snapshots older than 7 days are pruned, newer kept', async () => {
    await db.snapshots.put({ id: 'old', createdAt: Date.now() - 8 * 86400_000, reason: 'r', data: '{}' });
    await db.snapshots.put({ id: 'mid', createdAt: Date.now() - 6 * 86400_000, reason: 'r', data: '{}' });
    await createSnapshot('new');
    expect(await db.snapshots.get('old')).toBeUndefined();
    expect(await db.snapshots.get('mid')).toBeDefined();
  });
});

describe('recording 24 h expiry', () => {
  it('audio deleted exactly at 24 h, not before; review checklist kept; idempotent', async () => {
    const t0 = Date.now();
    await saveRecording({ id: 'a', createdAt: t0, date: '2026-11-25', part: 1, promptTitle: 'p', mime: 'audio/mp4', size: 3, durationMs: 1 }, new Blob(['abc']));
    await db.recordings.update('a', { review: { checklist: { x: true }, scores: {}, notes: 'keep' } });
    expect(await purgeExpiredRecordings(t0 + RECORDING_TTL_MS - 1)).toBe(0);
    expect(await db.audio.get('a')).toBeDefined();
    expect(await purgeExpiredRecordings(t0 + RECORDING_TTL_MS)).toBe(1);
    expect(await db.audio.get('a')).toBeUndefined();
    expect(await purgeExpiredRecordings(t0 + RECORDING_TTL_MS + 1000)).toBe(0);
    const m = await db.recordings.get('a');
    expect(m!.audioDeleted).toBe(true);
    expect(m!.review!.notes).toBe('keep');
  });
  it('a restored backup containing expired audio is purged at next launch', async () => {
    const t0 = Date.now() - 2 * RECORDING_TTL_MS;
    await saveRecording({ id: 'b', createdAt: t0, date: '2026-11-23', part: 2, promptTitle: 'p', mime: 'audio/mp4', size: 3, durationMs: 1 }, new Blob(['abc']));
    const json = JSON.stringify(await buildBackup(true));
    await eraseAll();
    const p = parseBackup(json);
    if (!p.ok) throw new Error('parse');
    await replaceWithBackup(p.file);
    expect(await purgeExpiredRecordings()).toBe(1);
    expect(await db.audio.get('b')).toBeUndefined();
  });
});

describe('persistence across "reload" (new Dexie connection)', () => {
  it('data written is readable from a freshly opened connection to the same DB', async () => {
    await seed();
    const { AppDB } = await import('./db');
    const db2 = new AppDB();
    expect(await db2.cards.count()).toBe(1);
    expect(await db2.essays.get('e1')).toMatchObject({ text: expect.stringContaining('ünïcödé') });
    db2.close();
  });
  it('schema version 1 DB opens (upgrade path is a no-op today; add a migration test when version 2 is added)', async () => {
    expect(db.verno).toBe(1);
  });
});
