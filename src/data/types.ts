/**
 * Curriculum data types for IELTS Mentor.
 * Self-contained: no imports, no runtime dependencies.
 *
 * Conventions
 * - All calendar dates are ISO strings "YYYY-MM-DD" interpreted as local dates in Asia/Baku (UTC+4, no DST).
 * - All durations are in minutes.
 * - All user-facing strings are B1-friendly English.
 */

/** ISO calendar date "YYYY-MM-DD", local to Asia/Baku. */
export type ISODate = string;

/** Local time "HH:MM" (24h), Asia/Baku. */
export type LocalTime = string;

export type PhaseId = 1 | 2 | 3 | 4;

/** Week starts on Monday (as in the plan tables). */
export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/** Maps JS Date.getDay() (0 = Sunday) to Weekday. Use with the Asia/Baku local date. */
export const WEEKDAY_BY_JS_DAY: readonly Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/** The 8 colour categories from the plan's legend. */
export type Skill =
  | 'listening'
  | 'reading'
  | 'writing'
  | 'speaking'
  | 'grammar'
  | 'vocabulary' // vocabulary / Anki
  | 'test' // test / mock / analysis of a test
  | 'rest';

/** The four scored IELTS sections. */
export type ExamSkill = 'listening' | 'reading' | 'writing' | 'speaking';

export type ExamFormat = 'computer' | 'paper' | 'undecided';

export interface AppConfig {
  /** First day of the plan. Default 2026-11-23 (a Monday). */
  startDate: ISODate;
  /** Official IELTS Academic exam date (written parts). */
  examDate: ISODate;
  /** Speaking can be on a different day (paper tests: up to ~7 days before/after). Defaults to examDate. */
  speakingTestDate?: ISODate;
  /** Time the written exam starts; phase 4 morning tests should start at this time. */
  examStartTime: LocalTime;
  examFormat: ExamFormat;
  timezone: 'Asia/Baku';
  /** University requirements, filled in by the user (milestone "check university requirements"). */
  targetOverall: number; // e.g. 7.0
  targetMinPerSkill?: number; // e.g. 6.0 ("no section below 6.0")
  applicationDeadline?: ISODate;
}

export interface DateRange {
  start: ISODate; // inclusive
  end: ISODate; // inclusive
}

/** Band target as a range; a single value has min === max. */
export interface BandTarget {
  min: number;
  max: number;
}

/** Correct answers out of 40 (Listening / Reading). */
export interface RawScoreTarget {
  min: number;
  max: number;
}

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

export type ResourceKind = 'book' | 'test-book' | 'app' | 'website' | 'youtube' | 'podcast' | 'people' | 'tool';

export interface Resource {
  id: string;
  title: string;
  author?: string;
  kind: ResourceKind;
  skills: Skill[];
  phases: PhaseId[];
  /** Short English note shown in the app. */
  note?: string;
  /** For test books: number of complete Academic tests in the book/series range. */
  testCount?: number;
}

/** Reference from a block to a resource, with optional detail (e.g. "next 2 units"). */
export interface ResourceRef {
  resourceId: string;
  detail?: string;
}

// ---------------------------------------------------------------------------
// Daily schedule
// ---------------------------------------------------------------------------

/**
 * What kind of in-app tool a block maps to. The app can open the right screen from this.
 * 'external' = done outside the app (book, podcast, film); the app only tracks completion.
 */
export type ActivityKind =
  | 'murphy-units' // progress-based: next N units of Murphy (see grammar.ts)
  | 'hewings-units'
  | 'grammar-topic' // topic from a sequence in grammar.ts
  | 'grammar-own-errors' // phase 3: recurring errors from own essays (mistake notebook)
  | 'grammar-weekly-review'
  | 'vocab-new' // add new words (in context) to SRS
  | 'vocab-review' // SRS review
  | 'vocab-from-text' // words from today's article/passage -> SRS
  | 'vocab-topic' // topic vocabulary (essay topic / IELTS topics)
  | 'awl' // Academic Word List
  | 'listening-external' // BBC 6 Minute English, podcast, film, TED
  | 'listening-ielts-sections'
  | 'listening-full-test'
  | 'reading-article'
  | 'reading-passage'
  | 'reading-full-test'
  | 'writing-paragraph'
  | 'writing-task1'
  | 'writing-task2'
  | 'writing-task1-and-task2'
  | 'writing-model-compare'
  | 'writing-rewrite'
  | 'speaking-record'
  | 'speaking-part1'
  | 'speaking-part2'
  | 'speaking-part2-part3'
  | 'speaking-full-live' // with a live partner / teacher
  | 'speaking-mock'
  | 'mini-test' // phase 1 Saturday: in-app test on the week's grammar and words
  | 'lr-test' // full Listening + Reading
  | 'lrw-test' // Listening + Reading + Writing in a row
  | 'full-mock' // all 4 parts
  | 'mistake-analysis' // write causes into the mistake notebook
  | 'weak-skill' // phase 4: time on the lowest skill (from test log)
  | 'feedback' // get writing checked / speaking feedback from a human
  | 'rest'
  | 'final-week';

export interface Block {
  /** Stable id, e.g. "p1-mon-1". Used for completion records and flex rules. */
  id: string;
  /** 1-based order within the day. */
  order: number;
  skill: Skill;
  /** Planned minutes. If the plan gives a range (e.g. 30–40), this is the lower value. */
  minutes: number;
  minutesMax?: number;
  /** Short title, e.g. "Grammar". */
  title: string;
  /** What to do, in B1-friendly English. */
  task: string;
  activity: ActivityKind;
  resources?: ResourceRef[];
  /** True if the minutes were not given in the plan and were chosen by the methodologist. */
  minutesAssumed?: boolean;
  /** True for blocks that may be redirected to the weakest skill when behind target (see rules.ts). */
  flex?: boolean;
  /** Optional time-of-day hint (phase 4: "morning, at exam time"). */
  timeOfDay?: 'morning' | 'afternoon' | 'any';
  /** Methodologist note: interpretation / tip shown as a hint. */
  hint?: string;
}

export interface DayPlan {
  weekday: Weekday;
  isRestDay: boolean;
  blocks: Block[];
  /** Topics the daily in-app quiz should draw from today (see QuizTopic). */
  quizTopics: QuizTopic[];
}

export interface WeeklySchedule {
  phase: PhaseId;
  days: Record<Weekday, DayPlan>;
}

/** Topics for the daily original quiz; content-author tags questions with these. */
export type QuizTopic =
  | 'grammar-current' // the grammar topic the learner is on now (Murphy section / phase 2 sequence)
  | 'grammar-week-review'
  | 'tenses'
  | 'articles'
  | 'passive'
  | 'conditionals'
  | 'complex-sentences'
  | 'linkers'
  | 'common-errors'
  | 'vocab-collocations'
  | 'vocab-word-forms'
  | 'awl'
  | 'topic-vocab'
  | 'reading-tfng'
  | 'reading-ynng'
  | 'reading-headings'
  | 'reading-question-type-current'
  | 'listening-spelling-numbers'
  | 'task1-language'
  | 'task1-overview'
  | 'task2-structure'
  | 'speaking-language'
  | 'exam-strategy'
  | 'mixed-review';

// ---------------------------------------------------------------------------
// Phases
// ---------------------------------------------------------------------------

export interface Phase {
  id: PhaseId;
  name: string; // "Foundation"
  /** Default dates. Phase 1 start follows config.startDate; phase 4 end follows config.examDate. */
  range: DateRange;
  dailyHours: { min: number; max: number };
  levelFrom: string;
  levelTo: string;
  targetBand: BandTarget;
  summary: string;
  goals: string[];
  /** "Important notes" from the plan, rewritten in English. */
  notes: string[];
  resourceIds: string[];
  /** Target new SRS words per week (methodologist assumption to reach 3000–4000/year). */
  newWordsPerWeek: number;
}

// ---------------------------------------------------------------------------
// Rotations and sequences
// ---------------------------------------------------------------------------

export type Task1ChartType = 'line' | 'bar' | 'pie' | 'table' | 'process' | 'map';

export interface Task1RotationItem {
  week: number; // 1..6 within the cycle
  chart: Task1ChartType;
  label: string;
  focus: string; // what to practise
}

export type Task2EssayType = 'opinion' | 'discussion' | 'adv-disadv' | 'problem-solution' | 'two-part';

export type ReadingQuestionType =
  | 'tfng'
  | 'ynng'
  | 'headings'
  | 'matching-information'
  | 'matching-features'
  | 'matching-sentence-endings'
  | 'sentence-completion'
  | 'summary-completion'
  | 'note-table-flowchart-completion'
  | 'diagram-labelling'
  | 'multiple-choice'
  | 'short-answer';

export interface GrammarSection {
  id: string;
  title: string;
  /** Approximate unit numbers in English Grammar in Use (Intermediate, 5th ed.). Check your edition. */
  units: { from: number; to: number };
  quizTopics: QuizTopic[];
  /** Plan says: give extra attention (tenses, articles, passive, conditionals). */
  priority: boolean;
}

export interface GrammarWeekTopic {
  week: number; // 1-based week of the phase
  topic: string;
  detail: string;
  quizTopics: QuizTopic[];
}

// ---------------------------------------------------------------------------
// Checkpoints, milestones, final week
// ---------------------------------------------------------------------------

export interface Checkpoint {
  id: string;
  label: string; // "End of February 2027"
  /** Recommended day to take the check (a Saturday = test day). */
  date: ISODate;
  /** Window in which a logged result counts for this checkpoint. */
  window: DateRange;
  phase: PhaseId;
  targetBand: BandTarget;
  /** Listening / Reading raw score targets (out of 40) if the plan gives them. */
  rawTarget?: RawScoreTarget;
  skillsTested: ExamSkill[];
  howToCheck: string;
  /** Which test sources are allowed (golden rule 7). */
  resourceIds: string[];
  official?: boolean;
  /** If true, date/window come from config.examDate (the real exam), not from the fields above. */
  useExamDate?: boolean;
}

export type MilestoneKind =
  | 'setup'
  | 'university'
  | 'registration'
  | 'booking'
  | 'feedback'
  | 'format'
  | 'checkpoint'
  | 'countdown'
  | 'results';

export interface Milestone {
  id: string;
  kind: MilestoneKind;
  title: string;
  description: string;
  /** Show from this date. 'start' / 'exam' relative forms are resolved with config. */
  showFrom: ISODate | { relativeTo: 'start' | 'exam'; days: number };
  /** Becomes "overdue" after this date. */
  dueBy?: ISODate | { relativeTo: 'start' | 'exam'; days: number };
  /** If true, the user must tick it as done; it stays visible until then. */
  requiresAction: boolean;
  /** Only show when examFormat matches. */
  onlyForFormat?: ExamFormat;
  /** True if this milestone was added by the methodologist (not literally in the plan). */
  derived?: boolean;
}

export interface FinalWeekStage {
  id: string;
  /** Days before the exam, inclusive (e.g. 7..4). 0 = exam day. */
  daysBefore: { from: number; to: number };
  title: string;
  todo: string[];
  avoid: string[];
  blocks: Block[];
}

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

/** Contexts where the app may show a golden rule. */
export type RuleTrigger =
  | 'daily-rotation' // general "rule of the day"
  | 'rest-day'
  | 'vocab-review-due'
  | 'after-missed-day'
  | 'catch-up-attempt' // user tries to do a very long session / many days at once
  | 'after-test-logged'
  | 'monthly-mistake-review'
  | 'speaking-block'
  | 'writing-block'
  | 'low-feedback-count'
  | 'cambridge-book-chosen' // user picks a test book
  | 'phase-start';

export interface GoldenRule {
  id: number; // 1..8 as in the plan
  title: string;
  text: string;
  triggers: RuleTrigger[];
}

export interface MentorRule {
  id: string;
  title: string;
  /** Plain description of when it fires and what it does. */
  description: string;
  /** Machine-readable parameters for the implementation. */
  params: Record<string, number | string | boolean | string[]>;
  /** Message templates. Placeholders in {curly} braces. */
  messages: Record<string, string>;
  /** Golden rule(s) this rule implements. */
  goldenRuleIds?: number[];
}

/** Blocks that can be redirected to the weakest skill when behind target. */
export interface FlexPolicy {
  phase: PhaseId;
  blockIds: string[];
  /** Minutes per week that move to the weak skill. */
  minutesPerWeek: number;
  explanation: string;
}

// ---------------------------------------------------------------------------
// Band tables and criteria
// ---------------------------------------------------------------------------

export interface RawBandRow {
  minCorrect: number;
  maxCorrect: number;
  band: number;
}

export interface BandTable {
  skill: 'listening' | 'reading';
  module: 'academic';
  approximate: true;
  note: string;
  rows: RawBandRow[]; // sorted from highest band to lowest
}

export interface CriterionLevel {
  band: number; // 5 | 6 | 7 | 8 (summaries for the levels this learner moves through)
  summary: string;
}

export interface Criterion {
  id: string;
  name: string;
  appliesTo: 'writing-task1' | 'writing-task2' | 'writing-both' | 'speaking';
  question: string; // what the examiner asks themself
  levels: CriterionLevel[];
  selfCheck: string[]; // yes/no checklist items
}
