/** Small builders so content files stay compact. IDs are assigned by position: APPEND ONLY, never reorder or delete. */
import type { PhaseId, QuizTopic } from '../data/types';
import type { Cefr, QuizItem, VocabCard } from './types';

type Raw = QuizItem extends infer U ? (U extends QuizItem ? Omit<U, 'id'> : never) : never;

export const mcq = (
  topic: QuizTopic, phase: PhaseId, cefr: Cefr, prompt: string, options: string[], answerIndex: number, explanation: string,
): Raw => ({ kind: 'mcq', topic, phase, cefr, prompt, options, answerIndex, explanation });

export const gap = (
  topic: QuizTopic, phase: PhaseId, cefr: Cefr, prompt: string, answers: string[], explanation: string,
): Raw => ({ kind: 'gap', topic, phase, cefr, prompt, answers, explanation });

export const tfng = (
  topic: QuizTopic, phase: PhaseId, cefr: Cefr, passage: string, statement: string,
  answer: 'T' | 'F' | 'NG' | 'Y' | 'N', explanation: string, variant: 'tfng' | 'ynng' = 'tfng',
): Raw => ({ kind: 'tfng', variant, topic, phase, cefr, passage, statement, answer, explanation });

export const heading = (
  topic: QuizTopic, phase: PhaseId, cefr: Cefr, paragraph: string, options: string[], answerIndex: number, explanation: string,
): Raw => ({ kind: 'headings', topic, phase, cefr, paragraph, options, answerIndex, explanation });

/** Assign ids "q-<topic>-NNNN" with a per-topic counter. Each topic must live in only one file. */
export function withIds(raws: Raw[]): QuizItem[] {
  const n: Record<string, number> = {};
  return raws.map((r) => {
    n[r.topic] = (n[r.topic] ?? 0) + 1;
    return { ...r, id: `q-${r.topic}-${String(n[r.topic]).padStart(4, '0')}` } as QuizItem;
  });
}

type V = Omit<VocabCard, 'id' | 'phase' | 'cefr'>;
/** v(headword, pos, definition, collocations, example, topic?, translationAz?) */
export const v = (
  headword: string, pos: VocabCard['pos'], definition: string, collocations: string[], example: string,
  topic?: string, translationAz?: string,
): V => ({ headword, pos, definition, collocations, example, ...(topic ? { topic } : {}), ...(translationAz ? { translationAz } : {}) });

export function vocabIds(raws: V[], start: number, phase: PhaseId, cefr: Cefr, awl = false): VocabCard[] {
  return raws.map((r, i) => ({
    ...r, id: `v-${String(start + i).padStart(4, '0')}`, phase, cefr, ...(awl ? { awl: true } : {}),
  }));
}

/** Deterministic position of the correct option (spreads keys over all positions). */
const keyPos = (seed: string, n: number): number => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % n;
};
const place = (seed: string, optionsCorrectFirst: string[]): { options: string[]; answerIndex: number } => {
  const [correct, ...wrong] = optionsCorrectFirst;
  const k = keyPos(seed, optionsCorrectFirst.length);
  const options = [...wrong.slice(0, k), correct, ...wrong.slice(k)];
  return { options, answerIndex: k };
};

/** mcq where options are written CORRECT FIRST; the helper moves the correct option to a spread-out position. */
export const mcqc = (
  topic: QuizTopic, phase: PhaseId, cefr: Cefr, prompt: string, optionsCorrectFirst: string[], explanation: string,
): Raw => ({ kind: 'mcq', topic, phase, cefr, prompt, ...place(prompt, optionsCorrectFirst), explanation });

/** headings where options are written CORRECT FIRST. */
export const headingc = (
  topic: QuizTopic, phase: PhaseId, cefr: Cefr, paragraph: string, optionsCorrectFirst: string[], explanation: string,
): Raw => ({ kind: 'headings', topic, phase, cefr, paragraph, ...place(paragraph, optionsCorrectFirst), explanation });
