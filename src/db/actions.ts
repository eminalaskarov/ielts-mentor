/** All writes to the DB go through these small functions. */
import { db, getSettings, kvGet, kvSet, updateSettings, uid } from './db';
import type { BlockLog, CardRec, Essay, LiveSession, Mistake, RecordingMeta, TestLog } from './db';
import type { PlanBlock } from '../logic/plan';
import type { ISODate } from '../data';
import { MURPHY_PLAN } from '../data';
import { bakuDate } from '../logic/dates';
import { newSrsState, schedule } from '../logic/srs';
import type { Rating, SrsState } from '../logic/srs';
import type { VocabCard } from '../content/types';
import { expiresAtFor, isExpired } from '../logic/recordings';
import type { MilestoneState } from '../logic/milestones';

// ---------------------------------------------------------------------------
// First use
// ---------------------------------------------------------------------------

export async function markUsedToday(): Promise<void> {
  const s = await getSettings();
  if (!s.firstUseDate) await updateSettings({ firstUseDate: bakuDate() });
}

// ---------------------------------------------------------------------------
// Blocks
// ---------------------------------------------------------------------------

export async function setBlockDone(date: ISODate, block: PlanBlock, done: boolean, minutes?: number): Promise<void> {
  const id = `${date}|${block.id}`;
  await db.transaction('rw', db.blockLogs, db.kv, async () => {
    const prev = await db.blockLogs.get(id);
    let murphyUnitsAdded = prev?.murphyUnitsAdded ?? 0;
    if (block.activity === 'murphy-units' && block.murphyUnits) {
      const s = await getSettings();
      if (done && !prev?.done) {
        murphyUnitsAdded = block.murphyUnits.count;
        await updateSettings({ murphyUnitsDone: Math.min(MURPHY_PLAN.totalUnits, s.murphyUnitsDone + murphyUnitsAdded) });
      } else if (!done && prev?.done && prev.murphyUnitsAdded) {
        await updateSettings({ murphyUnitsDone: Math.max(0, s.murphyUnitsDone - prev.murphyUnitsAdded) });
        murphyUnitsAdded = 0;
      }
    }
    const row: BlockLog = {
      id,
      date,
      blockId: block.id,
      skill: block.displaySkill,
      done,
      minutes: minutes ?? prev?.minutes ?? block.minutes,
      doneAt: Date.now(),
      murphyUnitsAdded,
      extra: block.extra,
      detail: done && !prev?.done ? block.detail : (prev?.detail ?? block.detail),
    };
    await db.blockLogs.put(row);
  });
}

/**
 * Tick a block known only by id (e.g. the plan changed since the flow was opened and the block can't
 * be re-resolved). Never touches the Murphy pointer.
 */
export async function setBlockDoneById(date: ISODate, blockId: string, skill: BlockLog['skill'], minutes: number): Promise<void> {
  const id = `${date}|${blockId}`;
  await db.transaction('rw', db.blockLogs, async () => {
    const prev = await db.blockLogs.get(id);
    await db.blockLogs.put({ murphyUnitsAdded: 0, ...prev, id, date, blockId, skill: prev?.skill ?? skill, done: true, minutes, doneAt: Date.now() });
  });
}

export async function setBlockMinutes(date: ISODate, blockId: string, minutes: number): Promise<void> {
  await db.blockLogs.update(`${date}|${blockId}`, { minutes });
}

// ---------------------------------------------------------------------------
// Word cards
// ---------------------------------------------------------------------------

export function cardFromContent(v: VocabCard, now: number): CardRec {
  return {
    id: v.id,
    source: 'builtin',
    headword: v.headword,
    pos: v.pos,
    definition: v.definition,
    example: v.example,
    collocations: v.collocations,
    translationAz: v.translationAz,
    topic: v.topic,
    awl: v.awl,
    tags: v.awl ? ['awl'] : [],
    createdAt: now,
    srs: newSrsState(now),
  };
}

export async function addUserCard(input: Omit<CardRec, 'id' | 'source' | 'createdAt' | 'srs'>): Promise<string> {
  const now = Date.now();
  const id = uid('u');
  await db.cards.put({ ...input, id, source: 'user', createdAt: now, srs: newSrsState(now) });
  return id;
}

export async function updateCard(id: string, patch: Partial<CardRec>): Promise<void> {
  await db.cards.update(id, patch);
}

export async function deleteCard(id: string): Promise<void> {
  await db.transaction('rw', db.cards, db.reviews, async () => {
    await db.cards.delete(id);
    await db.reviews.where('cardId').equals(id).delete();
  });
}

/**
 * Rate a card. Built-in cards that are not yet in the DB are created on first rating.
 * Returns the previous record (for one-level undo) and the review id.
 */
export async function rateCard(card: CardRec, rating: Rating, now = Date.now(), date: ISODate = bakuDate(now)): Promise<{ prev: CardRec | null; reviewId: number }> {
  return db.transaction('rw', db.cards, db.reviews, async () => {
    const existing = await db.cards.get(card.id);
    const base = existing ?? card;
    const next: SrsState = schedule(base.srs, rating, now);
    await db.cards.put({ ...base, srs: next });
    const reviewId = (await db.reviews.add({ cardId: card.id, at: now, date, rating, prevState: base.srs.state })) as number;
    return { prev: existing ?? null, reviewId };
  });
}

export async function undoRating(cardId: string, prev: CardRec | null, reviewId: number): Promise<void> {
  await db.transaction('rw', db.cards, db.reviews, async () => {
    if (prev) await db.cards.put(prev);
    else await db.cards.delete(cardId);
    await db.reviews.delete(reviewId);
  });
}

// ---------------------------------------------------------------------------
// Mistakes
// ---------------------------------------------------------------------------

export async function saveMistake(m: Omit<Mistake, 'id' | 'createdAt' | 'reviewedMonths' | 'stillTricky' | 'fixed'> & Partial<Mistake>): Promise<string> {
  const id = m.id ?? uid('m');
  const prev = m.id ? await db.mistakes.get(m.id) : undefined;
  await db.mistakes.put({
    reviewedMonths: [],
    stillTricky: false,
    fixed: false,
    createdAt: Date.now(),
    ...prev,
    ...m,
    id,
  } as Mistake);
  return id;
}

export async function deleteMistake(id: string): Promise<void> {
  await db.mistakes.delete(id);
}

// ---------------------------------------------------------------------------
// Essays
// ---------------------------------------------------------------------------

export async function saveEssay(e: Essay): Promise<void> {
  await db.essays.put(e);
}

export async function deleteEssay(id: string): Promise<void> {
  await db.essays.delete(id);
}

// ---------------------------------------------------------------------------
// Recordings (audio auto-deletes after 24 h)
// ---------------------------------------------------------------------------

export async function saveRecording(meta: Omit<RecordingMeta, 'expiresAt' | 'audioDeleted'>, blob: Blob): Promise<void> {
  await db.transaction('rw', db.recordings, db.audio, async () => {
    await db.recordings.put({ ...meta, expiresAt: expiresAtFor(meta.createdAt), audioDeleted: false });
    await db.audio.put({ id: meta.id, blob });
  });
}

export async function deleteRecordingAudio(id: string): Promise<void> {
  await db.transaction('rw', db.recordings, db.audio, async () => {
    await db.audio.delete(id);
    await db.recordings.update(id, { audioDeleted: true });
  });
}

export async function deleteRecording(id: string): Promise<void> {
  await db.transaction('rw', db.recordings, db.audio, async () => {
    await db.audio.delete(id);
    await db.recordings.delete(id);
  });
}

/** Delete audio of recordings older than 24 h. Self-review results stay. */
export async function purgeExpiredRecordings(now = Date.now()): Promise<number> {
  const expired = await db.recordings.where('expiresAt').belowOrEqual(now).toArray();
  let n = 0;
  for (const r of expired) {
    if (!r.audioDeleted || (await db.audio.get(r.id))) {
      if (isExpired(r, now)) {
        await deleteRecordingAudio(r.id);
        n++;
      }
    }
  }
  return n;
}

// ---------------------------------------------------------------------------
// Tests and live sessions
// ---------------------------------------------------------------------------

export async function saveTest(t: TestLog): Promise<void> {
  await db.tests.put(t);
}

export async function deleteTest(id: string): Promise<void> {
  await db.tests.delete(id);
}

export async function saveLiveSession(s: Omit<LiveSession, 'id' | 'createdAt'>): Promise<void> {
  await db.liveSessions.put({ ...s, id: uid('live'), createdAt: Date.now() });
}

// ---------------------------------------------------------------------------
// Milestones / UI state
// ---------------------------------------------------------------------------

export const EMPTY_MILESTONES: MilestoneState = { done: {}, snoozedUntil: {}, dismissed: {} };

export async function updateMilestones(fn: (s: MilestoneState) => MilestoneState): Promise<void> {
  const cur = await kvGet<MilestoneState>('milestones', EMPTY_MILESTONES);
  await kvSet('milestones', fn({ ...EMPTY_MILESTONES, ...cur }));
}

export async function markMistakeReviewDone(month: string): Promise<void> {
  const cur = await kvGet<string[]>('mistakeReviewDone', []);
  if (!cur.includes(month)) await kvSet('mistakeReviewDone', [...cur, month]);
}
