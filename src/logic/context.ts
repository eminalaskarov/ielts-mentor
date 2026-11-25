/** Builds the plan context (learner progress signals) from stored records. Pure. */
import type { ExamSkill, ISODate, PhaseId, QuizTopic, ReadingQuestionType, Task1ChartType } from '../data';
import { PHASE3_ERROR_TOPICS_FALLBACK, READING_TYPE_QUIZ_TOPICS } from '../data';
import { READING_TYPE_LABEL } from './plan';
import type { Essay, Mistake, Settings, TestLog } from '../db/db';
import { addDays } from './dates';
import { computeWeakSkill, targetForPhase } from './assessment';
import type { WeakSkillResult } from './assessment';
import type { PlanContext } from './plan';

export function task1ChartScores(essays: Essay[]): Partial<Record<Task1ChartType, number>> {
  const acc: Partial<Record<Task1ChartType, number[]>> = {};
  for (const e of essays) {
    if (e.kind !== 'task1' || e.status !== 'done' || !e.chartType || typeof e.band !== 'number') continue;
    (acc[e.chartType] ??= []).push(e.band);
  }
  const out: Partial<Record<Task1ChartType, number>> = {};
  for (const [k, v] of Object.entries(acc)) out[k as Task1ChartType] = v!.reduce((a, b) => a + b, 0) / v!.length;
  return out;
}

function topTags(mistakes: Mistake[], skill: string, since: ISODate | null, min: number): string[] {
  const counts = new Map<string, number>();
  for (const m of mistakes) {
    if (m.skill !== skill || !m.tag) continue;
    if (since && m.date < since) continue;
    counts.set(m.tag, (counts.get(m.tag) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, n]) => n >= min).sort((a, b) => b[1] - a[1]).map(([t]) => t);
}

export function weakFromTests(tests: TestLog[], phase: PhaseId | null, minPerSkill: number | null): WeakSkillResult {
  return computeWeakSkill(
    tests.map((t) => ({ id: t.id, date: t.date, listening: t.listening, reading: t.reading, writing: t.writing, speaking: t.speaking, checkpointId: t.checkpointId })),
    targetForPhase(phase),
    minPerSkill,
  );
}

export function buildPlanContext(o: {
  settings: Settings;
  today: ISODate;
  phase: PhaseId | null;
  tests: TestLog[];
  essays: Essay[];
  mistakes: Mistake[];
}): { ctx: PlanContext; weak: WeakSkillResult } {
  const weak = weakFromTests(o.tests, o.phase, o.settings.targetMinPerSkill);
  const weakSkill: ExamSkill | null = weak.weakSkill;
  return {
    weak,
    ctx: {
      murphyUnitsDone: o.settings.murphyUnitsDone,
      weakSkill,
      weakFocus: weakSkill !== null,
      task1ChartScores: task1ChartScores(o.essays),
      grammarErrorTopic: topTags(o.mistakes, 'grammar', addDays(o.today, -28), 3)[0] ?? null,
      readingWeakTypes: topTags(o.mistakes, 'reading', null, 1).slice(0, 2),
    },
  };
}

/** Signals from the Mistakes notebook for the quiz topic resolver (curriculum-notes §2a). */
export interface QuizSignals {
  topReadingMistakeTypes: ReadingQuestionType[];
  topGrammarErrorTopics: QuizTopic[];
}

const GRAMMAR_TAG_TOPICS: Record<string, QuizTopic[]> = {
  ...Object.fromEntries(PHASE3_ERROR_TOPICS_FALLBACK.map((t) => [t.topic.toLowerCase(), t.quizTopics])),
  tenses: ['tenses'],
  'word order': ['common-errors'],
};

function readingTypeOfTag(tag: string): ReadingQuestionType | null {
  if (tag in READING_TYPE_QUIZ_TOPICS) return tag as ReadingQuestionType;
  const hit = Object.entries(READING_TYPE_LABEL).find(([, label]) => label.toLowerCase() === tag.toLowerCase());
  return hit && hit[0] in READING_TYPE_QUIZ_TOPICS ? (hit[0] as ReadingQuestionType) : null;
}

/**
 * Top 2 reading question types (all time, most mistakes first) and the grammar quiz topics behind the
 * most frequent grammar/writing mistake tags of the last 28 days. Tags may be stored as labels or ids.
 */
export function quizSignals(mistakes: Mistake[], today: ISODate): QuizSignals {
  const reading: ReadingQuestionType[] = [];
  for (const tag of topTags(mistakes, 'reading', null, 1)) {
    const t = readingTypeOfTag(tag);
    if (t && !reading.includes(t)) reading.push(t);
    if (reading.length === 2) break;
  }
  const since = addDays(today, -28);
  const counts = new Map<string, number>();
  for (const m of mistakes) {
    if ((m.skill !== 'grammar' && m.skill !== 'writing') || !m.tag || m.date < since) continue;
    counts.set(m.tag, (counts.get(m.tag) ?? 0) + 1);
  }
  const grammar: QuizTopic[] = [];
  for (const [tag] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
    for (const q of GRAMMAR_TAG_TOPICS[tag.toLowerCase()] ?? []) if (!grammar.includes(q)) grammar.push(q);
  }
  return { topReadingMistakeTypes: reading, topGrammarErrorTopics: grammar };
}
