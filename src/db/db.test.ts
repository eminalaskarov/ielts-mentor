import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, getSettings, updateSettings } from './db';
import { addUserCard, purgeExpiredRecordings, rateCard, saveMistake, saveRecording, setBlockDone } from './actions';
import { buildBackup } from './backupIo';
import { parseBackup } from '../logic/backup';
import { resolveDay } from '../logic/plan';
import { RECORDING_TTL_MS } from '../logic/recordings';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe('db', () => {
  it('all indexed queries used by the UI work', async () => {
    await db.mistakes.orderBy('createdAt').reverse().toArray();
    await db.recordings.orderBy('createdAt').reverse().toArray();
    await db.tests.orderBy('date').toArray();
    await db.snapshots.orderBy('createdAt').last();
    await db.essays.where('status').equals('done').reverse().sortBy('finishedAt');
    await db.essays.where('date').aboveOrEqual('2026-11-23').toArray();
    await db.quizAttempts.where('date').equals('2026-11-25').toArray();
    await db.liveSessions.where('date').aboveOrEqual('2026-11-23').count();
    await db.reviews.where('date').aboveOrEqual('2026-01-01').toArray();
    await db.recordings.where('expiresAt').belowOrEqual(Date.now()).toArray();
  });

  it('settings merge with defaults', async () => {
    expect((await getSettings()).examDate).toBe('2027-11-20');
    await updateSettings({ murphyUnitsDone: 4 });
    expect((await getSettings()).murphyUnitsDone).toBe(4);
  });

  it('ticking a Murphy block moves the unit pointer, unticking undoes it', async () => {
    const day = resolveDay('2026-11-23', { startDate: '2026-11-23', examDate: '2027-11-20' });
    const b = day.blocks[0];
    await setBlockDone('2026-11-23', b, true);
    expect((await getSettings()).murphyUnitsDone).toBe(2);
    await setBlockDone('2026-11-23', b, false);
    expect((await getSettings()).murphyUnitsDone).toBe(0);
  });

  it('rating a card stores SRS state and a review', async () => {
    const id = await addUserCard({ headword: 'increase', pos: 'noun', definition: 'a rise', example: 'A sharp increase.', collocations: [], tags: [] });
    const card = (await db.cards.get(id))!;
    await rateCard(card, 3, Date.now());
    expect((await db.cards.get(id))!.srs.state).toBe('learning');
    expect(await db.reviews.count()).toBe(1);
  });

  it('recording audio is deleted after 24 h, self-review stays', async () => {
    const created = Date.now() - RECORDING_TTL_MS - 1000;
    await saveRecording({ id: 'r1', createdAt: created, date: '2026-11-24', part: 2, promptTitle: 'x', mime: 'audio/mp4', size: 3, durationMs: 1000 }, new Blob(['abc']));
    await db.recordings.update('r1', { review: { checklist: { a: true }, scores: {}, notes: 'n' } });
    expect(await purgeExpiredRecordings()).toBe(1);
    expect(await db.audio.get('r1')).toBeUndefined();
    const meta = await db.recordings.get('r1');
    expect(meta?.audioDeleted).toBe(true);
    expect(meta?.review?.notes).toBe('n');
  });

  it('backup round-trips through JSON', async () => {
    await saveMistake({ date: '2026-11-25', skill: 'reading', what: 'x', correction: 'y', cause: 'misread' });
    const file = await buildBackup(false);
    const parsed = parseBackup(JSON.stringify(file));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.preview.mistakes).toBe(1);
  });
});
