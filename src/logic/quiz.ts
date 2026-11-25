/** Daily quiz selection and answer checking. Pure. */
import { MURPHY_SECTIONS, resolveQuizTopics } from '../data';
import type { PhaseId, QuizTopic, ReadingQuestionType, Weekday } from '../data';
import type { QuizItem } from '../content/types';

/** Deterministic 32-bit hash of a string. */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Seeded PRNG (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(list: readonly T[], seed: string): T[] {
  const r = rng(hashString(seed));
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface QuizTopicContext {
  phase: PhaseId | null;
  weekday: Weekday;
  weekOfPhase: number;
  murphyUnitsDone: number;
  /** From the Mistakes notebook (see logic/context quizSignals). */
  topReadingMistakeTypes?: readonly ReadingQuestionType[];
  topGrammarErrorTopics?: readonly QuizTopic[];
}

/** Murphy section for the next unit to study. */
export function currentMurphySection(unitsDone: number) {
  const next = Math.min(145, unitsDone + 1);
  return MURPHY_SECTIONS.find((s) => next >= s.units.from && next <= s.units.to) ?? MURPHY_SECTIONS[MURPHY_SECTIONS.length - 1];
}

/**
 * Expand meta topics (grammar-current, reading-question-type-current, …) into concrete topics.
 * Delegates to the curriculum's resolveQuizTopics() so there is one rule set (curriculum-notes §2a).
 */
export function expandTopics(topics: QuizTopic[], c: QuizTopicContext): QuizTopic[] {
  return resolveQuizTopics(topics, c);
}

/** Skill family of a quiz topic, used to pick sensible fallbacks when a topic has few items. */
export const QUIZ_TOPIC_GROUP: Record<QuizTopic, string> = {
  'grammar-current': 'grammar',
  'grammar-week-review': 'grammar',
  tenses: 'grammar',
  articles: 'grammar',
  passive: 'grammar',
  conditionals: 'grammar',
  'complex-sentences': 'grammar',
  linkers: 'grammar',
  'common-errors': 'grammar',
  'vocab-collocations': 'vocabulary',
  'vocab-word-forms': 'vocabulary',
  awl: 'vocabulary',
  'topic-vocab': 'vocabulary',
  'reading-tfng': 'reading',
  'reading-ynng': 'reading',
  'reading-headings': 'reading',
  'reading-question-type-current': 'reading',
  'listening-spelling-numbers': 'listening',
  'task1-language': 'writing',
  'task1-overview': 'writing',
  'task2-structure': 'writing',
  'speaking-language': 'speaking',
  'exam-strategy': 'exam',
  'mixed-review': 'mixed',
};

export interface SelectOptions {
  items: QuizItem[];
  topics: QuizTopic[];
  phase: PhaseId | null;
  seed: string;
  size: number;
  /** Item ids already answered at least once (prefer unseen). */
  seenIds?: Set<string>;
  /** Item ids to exclude entirely (e.g. today's first set). */
  excludeIds?: Set<string>;
  /** Item ids shown in the last 14 days: used only when there is nothing else. */
  recentIds?: Set<string>;
}

/**
 * Pick `size` items. Order of preference (each tier: unseen first, then seen):
 *   1. today's topics
 *   2. same skill family as today's topics, current phase, then earlier phases
 *   3. other topics, current phase, then earlier phases
 * Items shown in the last 14 days come only after all of the above. Deterministic for a given seed.
 */
export function selectQuiz(o: SelectOptions): QuizItem[] {
  const maxPhase = o.phase ?? 1;
  const pool = o.items.filter((q) => q.phase <= maxPhase && !o.excludeIds?.has(q.id));
  const seen = o.seenIds ?? new Set<string>();
  const recent = o.recentIds ?? new Set<string>();
  const topicSet = new Set(o.topics);
  const groups = new Set(o.topics.map((t) => QUIZ_TOPIC_GROUP[t]));
  const tierOf = (q: QuizItem): number => {
    if (topicSet.has(q.topic)) return 0;
    const same = groups.has(QUIZ_TOPIC_GROUP[q.topic]);
    const cur = q.phase === maxPhase;
    if (same) return cur ? 1 : 2;
    return cur ? 3 : 4;
  };
  const buckets: QuizItem[][] = Array.from({ length: 20 }, () => []);
  for (const q of pool) {
    const idx = (recent.has(q.id) ? 10 : 0) + tierOf(q) * 2 + (seen.has(q.id) ? 1 : 0);
    buckets[idx].push(q);
  }
  const out: QuizItem[] = [];
  for (let i = 0; i < buckets.length && out.length < o.size; i++) {
    if (buckets[i].length) out.push(...seededShuffle(buckets[i], `${o.seed}|${i}`));
  }
  return out.slice(0, o.size);
}

export type QuizAnswer = number | string;

/** Normalise free text for comparison: trim, lower case, straight quotes, single spaces, no final full stop. */
export function normaliseText(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/[.!]+$/, '');
}

export function tfngOptions(q: Extract<QuizItem, { kind: 'tfng' }>): { value: string; label: string }[] {
  return q.variant === 'ynng'
    ? [
        { value: 'Y', label: 'Yes' },
        { value: 'N', label: 'No' },
        { value: 'NG', label: 'Not Given' },
      ]
    : [
        { value: 'T', label: 'True' },
        { value: 'F', label: 'False' },
        { value: 'NG', label: 'Not Given' },
      ];
}

export function checkAnswer(q: QuizItem, a: QuizAnswer): boolean {
  switch (q.kind) {
    case 'mcq':
    case 'headings':
      return a === q.answerIndex;
    case 'gap':
      return typeof a === 'string' && q.answers.some((x) => normaliseText(x) === normaliseText(a));
    case 'tfng':
      return a === q.answer;
  }
}

/** Human-readable correct answer. */
export function correctAnswerText(q: QuizItem): string {
  switch (q.kind) {
    case 'mcq':
    case 'headings':
      return q.options[q.answerIndex];
    case 'gap':
      return q.answers[0];
    case 'tfng':
      return tfngOptions(q).find((o) => o.value === q.answer)?.label ?? q.answer;
  }
}

export function answerText(q: QuizItem, a: QuizAnswer): string {
  if (q.kind === 'mcq' || q.kind === 'headings') return typeof a === 'number' ? (q.options[a] ?? '') : String(a);
  if (q.kind === 'tfng') return tfngOptions(q).find((o) => o.value === a)?.label ?? String(a);
  return String(a);
}

export function resultTier(correct: number, total: number): string {
  if (total === 0) return '';
  const p = correct / total;
  if (p >= 1) return 'Perfect round.';
  if (p >= 0.7) return 'Nice work.';
  if (p >= 0.4) return 'Good start. The mistakes below are the useful part.';
  return 'This one was tough. That’s how we find what to practice.';
}

export const QUIZ_TOPIC_LABEL: Record<QuizTopic, string> = {
  'grammar-current': 'Grammar',
  'grammar-week-review': 'Grammar review',
  tenses: 'Tenses',
  articles: 'Articles',
  passive: 'Passive',
  conditionals: 'Conditionals',
  'complex-sentences': 'Complex sentences',
  linkers: 'Linking words',
  'common-errors': 'Common errors',
  'vocab-collocations': 'Collocations',
  'vocab-word-forms': 'Word forms',
  awl: 'Academic words',
  'topic-vocab': 'Topic words',
  'reading-tfng': 'True / False / Not Given',
  'reading-ynng': 'Yes / No / Not Given',
  'reading-headings': 'Matching headings',
  'reading-question-type-current': 'Reading',
  'listening-spelling-numbers': 'Spelling and numbers',
  'task1-language': 'Task 1 language',
  'task1-overview': 'Task 1 overview',
  'task2-structure': 'Task 2 structure',
  'speaking-language': 'Speaking language',
  'exam-strategy': 'Exam strategy',
  'mixed-review': 'Mixed review',
};

/**
 * Display order of an item's options, as ORIGINAL option indices (answers are always stored and
 * checked by original index, so saved attempts and stats are unaffected). mcq and headings options
 * are shuffled with a seed per attempt + item: stable across re-renders and when an attempt is
 * resumed, but the correct answer is not always in the same position. Other kinds keep their order.
 */
export function optionOrder(q: QuizItem, attemptId: string): number[] {
  if (q.kind !== 'mcq' && q.kind !== 'headings') return [];
  const idx = q.options.map((_, i) => i);
  return seededShuffle(idx, `${attemptId}|${q.id}|options`);
}
