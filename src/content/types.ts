/**
 * Content contract shared by content-author (writes the banks) and pwa-developer (reads them).
 * Change only by agreement — both sides depend on it.
 */
import type { ExamSkill, PhaseId, QuizTopic, Task1ChartType, Task2EssayType } from '../data/types';

export type Cefr = 'B1' | 'B1+' | 'B2' | 'B2+' | 'C1';

interface ItemBase {
  /** Stable, unique, never reused, e.g. "q-tenses-0001". Progress records reference it. */
  id: string;
  phase: PhaseId; // earliest phase this item is suitable for
  cefr: Cefr;
  topic: QuizTopic;
  /** Short English explanation shown after answering (B1-friendly). */
  explanation: string;
}

export interface McqQuestion extends ItemBase {
  kind: 'mcq';
  prompt: string; // may contain "___" for a gap
  options: string[]; // 3–4 options
  answerIndex: number;
}

export interface GapQuestion extends ItemBase {
  kind: 'gap';
  prompt: string; // contains exactly one "___"
  /** Accepted answers, compared case-insensitively after trimming. */
  answers: string[];
}

export interface TfngQuestion extends ItemBase {
  kind: 'tfng';
  /** 'tfng' = True/False/Not Given, 'ynng' = Yes/No/Not Given */
  variant: 'tfng' | 'ynng';
  passage: string; // short original passage (60–200 words)
  statement: string;
  answer: 'T' | 'F' | 'NG' | 'Y' | 'N';
}

export interface HeadingsQuestion extends ItemBase {
  kind: 'headings';
  paragraph: string;
  options: string[]; // candidate headings
  answerIndex: number;
}

export type QuizItem = McqQuestion | GapQuestion | TfngQuestion | HeadingsQuestion;

export interface VocabCard {
  id: string; // e.g. "v-0001"
  phase: PhaseId;
  cefr: Cefr;
  headword: string;
  pos: 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'phrasal verb' | 'linker';
  definition: string; // simple English
  translationAz?: string; // optional learning aid
  collocations: string[]; // at least 1
  example: string; // sentence using the word in context
  topic?: string; // e.g. "environment"
  awl?: boolean; // Academic Word List headword
}

export interface SpeakingPrompt {
  id: string;
  part: 1 | 2 | 3;
  phase: PhaseId;
  topic: string;
  /** Part 1/3: questions. Part 2: the cue card task line. */
  questions: string[];
  /** Part 2 only: the "You should say:" bullet points. */
  bullets?: string[];
  usefulLanguage?: string[];
  /** Part 3 only: id of the Part 2 cue card this discussion set follows (for full mock tests). */
  linkedTo?: string;
}

export interface WritingPrompt {
  id: string;
  task: 1 | 2;
  phase: PhaseId;
  /** Task 1 only. */
  chartType?: Task1ChartType;
  /** Task 1 only: plain-text/table description of the data so it can be rendered without images. */
  dataDescription?: string;
  /** Task 2 only. */
  essayType?: Task2EssayType;
  topic: string;
  prompt: string;
  modelAnswer?: string; // original, band-7-level
  modelAnswerNotes?: string[]; // why it works
}

export type SkillTag = ExamSkill;
