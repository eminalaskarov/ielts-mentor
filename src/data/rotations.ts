import type { ReadingQuestionType, Task1ChartType, Task1RotationItem, Task2EssayType } from './types';

/**
 * Writing Task 1 weekly rotation (plan, phase 2): line → bar → pie → table → process → map, then repeat.
 * Week 1 = the Monday-based week that starts on TASK1_ROTATION_ANCHOR (2027-03-01).
 * The rotation keeps running in phases 3 and 4 (used for the Wednesday Task 1 + Task 2 session and as
 * the fallback for the phase 3 Friday "weakest chart type" block).
 */
export const TASK1_ROTATION: Task1RotationItem[] = [
  { week: 1, chart: 'line', label: 'Line graph', focus: 'Describe trends over time: rise, fall, peak, stay stable. Compare the lines.' },
  { week: 2, chart: 'bar', label: 'Bar chart', focus: 'Compare categories. Group similar bars; do not describe every bar one by one.' },
  { week: 3, chart: 'pie', label: 'Pie chart', focus: 'Describe proportions with fractions and percentages. Compare the biggest and smallest parts.' },
  { week: 4, chart: 'table', label: 'Table', focus: 'Select the key numbers. Find the highest, lowest and the main differences.' },
  { week: 5, chart: 'process', label: 'Process diagram', focus: 'Describe stages in order with the passive and sequence words (first, next, finally).' },
  { week: 6, chart: 'map', label: 'Map', focus: 'Describe changes in a place: what was built, removed or extended. Use location words.' },
];

export const TASK1_CHART_LABEL: Record<Task1ChartType, string> = {
  line: 'Line graph',
  bar: 'Bar chart',
  pie: 'Pie chart',
  table: 'Table',
  process: 'Process diagram',
  map: 'Map',
};

/** weeksSinceAnchor: 0 for the week of 2027-03-01. Negative values (phase 1) return null — no Task 1 in phase 1. */
export function task1ForWeek(weeksSinceAnchor: number): Task1RotationItem | null {
  if (weeksSinceAnchor < 0) return null;
  return TASK1_ROTATION[weeksSinceAnchor % TASK1_ROTATION.length];
}

/**
 * Task 2 essay type rotation (methodologist addition — the plan does not name essay types).
 * Used to vary the Friday (phase 2) / Monday (phase 3) essay prompt. Opinion essays come twice per cycle
 * because the plan describes Task 2 as an opinion essay and it is the most common type.
 */
export const TASK2_TYPE_ROTATION: { type: Task2EssayType; label: string; structureTip: string }[] = [
  { type: 'opinion', label: 'Opinion (agree / disagree)', structureTip: 'Give your opinion in the introduction and keep the same opinion to the end.' },
  { type: 'discussion', label: 'Discuss both views', structureTip: 'One body paragraph for each view. Give your own opinion if the question asks for it.' },
  { type: 'adv-disadv', label: 'Advantages and disadvantages', structureTip: 'One paragraph for advantages, one for disadvantages. Answer "Do the advantages outweigh…?" if asked.' },
  { type: 'opinion', label: 'Opinion (agree / disagree)', structureTip: 'Give your opinion in the introduction and keep the same opinion to the end.' },
  { type: 'problem-solution', label: 'Problems and solutions', structureTip: 'Paragraph 1: causes/problems. Paragraph 2: matching solutions.' },
  { type: 'two-part', label: 'Two-part question', structureTip: 'Answer each question in its own body paragraph.' },
];

/**
 * Phase 2 Thursday reading strategy rotation (methodologist interpretation of "1 passage + question type strategy").
 * Plan: TFNG and Matching Headings are the hardest — give them time EVERY week, so each week has one of them
 * as `alwaysAlso`, plus a rotating main type.
 */
export const READING_STRATEGY_ROTATION: { week: number; main: ReadingQuestionType; alwaysAlso: 'tfng' | 'headings'; tip: string }[] = [
  { week: 1, main: 'tfng', alwaysAlso: 'headings', tip: 'True = the text says the same. False = the text says the opposite. Not Given = the text does not say.' },
  { week: 2, main: 'headings', alwaysAlso: 'tfng', tip: 'Read the first and last sentence of each paragraph. Find the main idea, not a detail.' },
  { week: 3, main: 'multiple-choice', alwaysAlso: 'headings', tip: 'Find the part of the text first, then remove wrong options one by one.' },
  { week: 4, main: 'summary-completion', alwaysAlso: 'tfng', tip: 'Check the word limit and the grammar of the gap (noun? verb? plural?).' },
  { week: 5, main: 'matching-information', alwaysAlso: 'headings', tip: 'The answers are not in text order. Scan for names, numbers and key words.' },
  { week: 6, main: 'ynng', alwaysAlso: 'tfng', tip: 'Yes / No / Not Given is about the writer’s opinion, not facts.' },
  { week: 7, main: 'sentence-completion', alwaysAlso: 'headings', tip: 'Answers are usually in text order. Copy words exactly from the text.' },
  { week: 8, main: 'matching-features', alwaysAlso: 'tfng', tip: 'Underline every name in the text first, then match statements.' },
  { week: 9, main: 'note-table-flowchart-completion', alwaysAlso: 'headings', tip: 'Use the headings of the table or notes to find the right part of the text.' },
  { week: 10, main: 'matching-sentence-endings', alwaysAlso: 'tfng', tip: 'Check that the full sentence is grammatical and matches the meaning in the text.' },
  { week: 11, main: 'short-answer', alwaysAlso: 'headings', tip: 'Keep within the word limit. Answers are usually in text order.' },
  { week: 12, main: 'diagram-labelling', alwaysAlso: 'tfng', tip: 'Find the paragraph that describes the object, then follow the description part by part.' },
];

/** Phase 3 Friday topic vocabulary rotation (plan lists exactly these 4 topics). */
export const PHASE3_VOCAB_TOPICS = ['Education', 'Environment', 'Technology', 'Health'] as const;

/** Phase 1 Friday speaking topics ("everyday topics: family, work, hobbies"), rotated weekly. Last 4 are methodologist additions in the same style. */
export const PHASE1_SPEAKING_TOPICS = [
  'Family',
  'Work or studies',
  'Hobbies and free time',
  'Your home and neighbourhood',
  'Food and cooking',
  'Your daily routine',
  'Friends',
] as const;
