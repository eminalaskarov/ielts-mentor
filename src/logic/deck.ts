/** Word-card queue building (built-in starter deck + own words). Pure. */
import type { ISODate, PhaseId } from '../data';
import type { VocabCard } from '../content/types';
import type { CardRec } from '../db/db';
import { bucketOf, isDue, isLearned } from './srs';
import type { CardBucket } from './srs';

export interface QueueInput {
  cards: CardRec[];
  builtins: VocabCard[];
  phase: PhaseId | null;
  now: number;
  newPerDay: number;
  newIntroducedToday: number;
  maxReviews: number;
  pauseNew: boolean;
}

export interface Queue {
  /** Learning + review cards due now (capped at maxReviews). */
  due: CardRec[];
  /** Total due before the cap. */
  dueTotal: number;
  /** New cards (own words first, then the built-in deck) allowed today. */
  fresh: (CardRec | VocabCard)[];
  /** Built-in cards not yet started (for "learn more"). */
  builtinRemaining: number;
}

export function buildQueue(q: QueueInput): Queue {
  const dueAll = q.cards
    .filter((c) => isDue(c.srs, q.now))
    .sort((a, b) => a.srs.dueAt - b.srs.dueAt);
  const due = dueAll.slice(0, q.maxReviews);
  const inDb = new Set(q.cards.map((c) => c.id));
  const maxPhase = q.phase ?? 1;
  const builtinPool = q.builtins
    .filter((v) => v.phase <= maxPhase && !inDb.has(v.id))
    .sort((a, b) => a.phase - b.phase || (a.id < b.id ? -1 : 1));
  const userNew = q.cards.filter((c) => c.srs.state === 'new').sort((a, b) => a.createdAt - b.createdAt);
  const allowance = q.pauseNew ? 0 : Math.max(0, q.newPerDay - q.newIntroducedToday);
  const fresh = [...userNew, ...builtinPool].slice(0, allowance);
  return { due, dueTotal: dueAll.length, fresh, builtinRemaining: builtinPool.length };
}

export function deckCounts(cards: CardRec[]): Record<CardBucket, number> & { learned: number; total: number } {
  const out = { new: 0, learning: 0, young: 0, mature: 0, learned: 0, total: cards.length };
  for (const c of cards) {
    out[bucketOf(c.srs)]++;
    if (isLearned(c.srs)) out.learned++;
  }
  return out;
}

/** Cards due on a future date (for "Tomorrow: 31 cards due"). */
export function dueOnDate(cards: CardRec[], date: ISODate): number {
  return cards.filter((c) => c.srs.state !== 'new' && c.srs.due <= date).length;
}

/** Cloze sentence: the example with the headword hidden (null if the word is not found). */
export function clozeOf(example: string, headword: string): string | null {
  const word = headword.trim();
  if (!word) return null;
  const esc = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b${esc}\\w*`, 'i');
  if (!re.test(example)) return null;
  return example.replace(re, '_____');
}
