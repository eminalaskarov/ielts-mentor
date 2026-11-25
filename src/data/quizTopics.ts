import type { PhaseId, QuizTopic, ReadingQuestionType, Weekday } from './types';
import { MURPHY_PLAN, MURPHY_SECTIONS, PHASE2_HEWINGS_TOPICS, PHASE2_LINKER_TOPICS, PHASE3_ERROR_TOPICS_FALLBACK } from './grammar';
import { READING_STRATEGY_ROTATION } from './rotations';

/**
 * Meta quiz topics: they appear in DayPlan.quizTopics but no quiz item is ever tagged with them.
 * resolveQuizTopics() replaces them with concrete topics. ('mixed-review' is NOT meta: content items
 * are tagged with it.)
 */
export const META_QUIZ_TOPICS = ['grammar-current', 'grammar-week-review', 'reading-question-type-current'] as const;
export type MetaQuizTopic = (typeof META_QUIZ_TOPICS)[number];

export function isMetaQuizTopic(t: QuizTopic): t is MetaQuizTopic {
  return (META_QUIZ_TOPICS as readonly string[]).includes(t);
}

export interface QuizResolveContext {
  /** null = before start / after exam. */
  phase: PhaseId | null;
  weekday: Weekday;
  /** 1-based week of the current phase (see curriculum-notes §2). */
  weekOfPhase: number;
  /** Murphy units completed so far (0–145). */
  murphyUnitsDone: number;
  /**
   * Phase 3: reading question types with the most logged mistakes, most frequent first (optional).
   * The plan's phase 3 reading blocks target your weakest question types.
   */
  topReadingMistakeTypes?: readonly ReadingQuestionType[];
  /** Phase 3+: concrete grammar topics from the mistake notebook, most frequent first (optional). */
  topGrammarErrorTopics?: readonly QuizTopic[];
}

/** Units in a normal Murphy week (plan: about 10). Used for the weekly review range. */
const WEEK_UNITS = MURPHY_PLAN.targetUnitsPerWeek;

/**
 * Concrete quiz topics that practise a reading question type.
 * Only T/F/NG, Y/N/NG and headings have dedicated banks. Completion types depend on the grammar of the
 * gap → word forms. Matching and multiple choice depend on recognising paraphrase → AWL synonyms.
 * Diagram labelling has no short-quiz equivalent (returns []).
 */
export const READING_TYPE_QUIZ_TOPICS: Record<ReadingQuestionType, QuizTopic[]> = {
  tfng: ['reading-tfng'],
  ynng: ['reading-ynng'],
  headings: ['reading-headings'],
  'matching-information': ['awl'],
  'matching-features': ['awl'],
  'matching-sentence-endings': ['awl'],
  'multiple-choice': ['awl'],
  'sentence-completion': ['vocab-word-forms'],
  'summary-completion': ['vocab-word-forms'],
  'note-table-flowchart-completion': ['vocab-word-forms'],
  'short-answer': ['vocab-word-forms'],
  'diagram-labelling': [],
};

const clampIndex = (i: number, len: number) => Math.max(0, Math.min(i, len - 1));
const weekIndex = (weekOfPhase: number) => Math.max(0, Math.floor(weekOfPhase) - 1);

function murphySectionForUnit(unit: number) {
  const u = Math.max(1, Math.min(MURPHY_PLAN.totalUnits, unit));
  return MURPHY_SECTIONS.find((s) => u >= s.units.from && u <= s.units.to) ?? MURPHY_SECTIONS[MURPHY_SECTIONS.length - 1];
}

function grammarCurrent(c: QuizResolveContext): QuizTopic[] {
  const w = weekIndex(c.weekOfPhase);
  switch (c.phase) {
    case 2: {
      // Thursday grammar block = complex sentences & linkers; other days = Hewings topic of the week.
      const list = c.weekday === 'thu' ? PHASE2_LINKER_TOPICS : PHASE2_HEWINGS_TOPICS;
      return list[clampIndex(w, list.length)].quizTopics;
    }
    case 3:
      if (c.topGrammarErrorTopics && c.topGrammarErrorTopics.length > 0) return [...c.topGrammarErrorTopics.slice(0, 2), 'common-errors'];
      return PHASE3_ERROR_TOPICS_FALLBACK[w % PHASE3_ERROR_TOPICS_FALLBACK.length].quizTopics;
    case 4:
      return c.topGrammarErrorTopics && c.topGrammarErrorTopics.length > 0 ? [...c.topGrammarErrorTopics.slice(0, 2), 'common-errors'] : ['common-errors'];
    default:
      // Phase 1 (and pre-start / post-exam): the Murphy section of the NEXT unit to study.
      return murphySectionForUnit(c.murphyUnitsDone + 1).quizTopics;
  }
}

function grammarWeekReview(c: QuizResolveContext): QuizTopic[] {
  const w = weekIndex(c.weekOfPhase);
  switch (c.phase) {
    case 2:
      return [
        ...PHASE2_HEWINGS_TOPICS[clampIndex(w, PHASE2_HEWINGS_TOPICS.length)].quizTopics,
        ...PHASE2_LINKER_TOPICS[clampIndex(w, PHASE2_LINKER_TOPICS.length)].quizTopics,
      ];
    case 3:
    case 4:
      return grammarCurrent(c);
    default: {
      // Phase 1: every Murphy section touched by the last ~10 units done (this week's work), plus the
      // plan's priority topics (tenses, articles, passive, conditionals) the learner has already reached.
      const done = Math.max(0, Math.min(MURPHY_PLAN.totalUnits, c.murphyUnitsDone));
      if (done === 0) return murphySectionForUnit(1).quizTopics;
      const out: QuizTopic[] = [];
      for (let u = Math.max(1, done - WEEK_UNITS + 1); u <= done; u++) out.push(...murphySectionForUnit(u).quizTopics);
      for (const s of MURPHY_SECTIONS) if (s.priority && s.units.from <= done) out.push(...s.quizTopics);
      return out;
    }
  }
}

function readingTypeCurrent(c: QuizResolveContext): QuizTopic[] {
  const rot = READING_STRATEGY_ROTATION[weekIndex(c.weekOfPhase) % READING_STRATEGY_ROTATION.length];
  const fromTypes = (types: readonly ReadingQuestionType[]) => types.flatMap((t) => READING_TYPE_QUIZ_TOPICS[t]);
  switch (c.phase) {
    case 2:
      // This week's strategy focus + the T/F/NG or headings type that is practised every week.
      return fromTypes([rot.main, rot.alwaysAlso]);
    case 3: {
      // Plan, phase 3: work on your weakest question types (top 2 by logged mistakes).
      const weak = (c.topReadingMistakeTypes ?? []).slice(0, 2);
      const topics = fromTypes(weak.length > 0 ? weak : [rot.main, rot.alwaysAlso]);
      return topics.length > 0 ? topics : ['reading-tfng', 'reading-headings'];
    }
    default:
      // Phase 1 / 4 / outside the plan: the two hardest types named in the plan.
      return ['reading-tfng', 'reading-headings'];
  }
}

/**
 * Expand a DayPlan's quizTopics into CONCRETE topics (no meta topics in the result), keeping order and
 * removing duplicates. Concrete input topics are passed through unchanged. Pure; never returns [] for a
 * non-empty input (falls back to 'mixed-review').
 */
export function resolveQuizTopics(topics: readonly QuizTopic[], c: QuizResolveContext): QuizTopic[] {
  const out: QuizTopic[] = [];
  const add = (list: readonly QuizTopic[]) => {
    for (const t of list) if (!isMetaQuizTopic(t) && !out.includes(t)) out.push(t);
  };
  for (const t of topics) {
    if (t === 'grammar-current') add(grammarCurrent(c));
    else if (t === 'grammar-week-review') add(grammarWeekReview(c));
    else if (t === 'reading-question-type-current') add(readingTypeCurrent(c));
    else add([t]);
  }
  if (out.length === 0 && topics.length > 0) out.push('mixed-review');
  return out;
}
