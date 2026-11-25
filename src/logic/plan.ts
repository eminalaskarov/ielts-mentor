/**
 * Resolves "what to do on a given date" from the curriculum data (src/data) and a small context
 * of learner progress. Pure: no I/O, no clock. See docs/curriculum-notes.md §2.
 */
import {
  CHECKPOINTS,
  FINAL_WEEK,
  FINAL_WEEK_DAYS,
  FLEX_POLICIES,
  MURPHY_PLAN,
  PHASE1_SPEAKING_TOPICS,
  PHASE2_HEWINGS_TOPICS,
  PHASE2_LINKER_TOPICS,
  PHASE3_ERROR_TOPICS_FALLBACK,
  PHASE3_VOCAB_TOPICS,
  READING_STRATEGY_ROTATION,
  SCHEDULES,
  TASK1_CHART_LABEL,
  TASK1_ROTATION_ANCHOR,
  TASK2_TYPE_ROTATION,
  WEAK_SKILL_PRACTICE,
  resolvePhaseRanges,
  task1ForWeek,
} from '../data';
import type {
  ActivityKind,
  AppConfig,
  Block,
  Checkpoint,
  ExamSkill,
  FinalWeekStage,
  ISODate,
  PhaseId,
  QuizTopic,
  Skill,
  Task1ChartType,
  Task2EssayType,
  Weekday,
} from '../data';
import { addDays, daysBetween, lastFridayOfMonth, monthKey, weekdayOf, weeksBetween } from './dates';
import { murphyPace } from './murphy';

export type BlockAction =
  | 'timer'
  | 'quiz'
  | 'review'
  | 'writing-task1'
  | 'writing-task2'
  | 'writing-full'
  | 'writing-paragraph'
  | 'writing-history'
  | 'speaking-part1'
  | 'speaking-part2'
  | 'speaking-part3'
  | 'speaking-free'
  | 'speaking-live'
  | 'test'
  | 'mistakes'
  | 'none';

export interface PlanBlock extends Block {
  /** Colour/icon to show (weak-skill blocks take the weak skill's colour). */
  displaySkill: Skill;
  /** Resolved detail line, e.g. "Units 13–14", "Line graph". */
  detail?: string;
  /** Optional block: not required for "done", never counted as missed. */
  extra?: boolean;
  action: BlockAction;
  quizSize?: number;
  task1Chart?: Task1ChartType;
  task2Type?: Task2EssayType;
  murphyUnits?: { from: number; to: number; count: number };
  speakingTopic?: string;
  checkpointId?: string;
}

export type DayKind = 'pre-start' | 'study' | 'rest' | 'final-week' | 'post-exam';

export interface ResolvedDay {
  date: ISODate;
  kind: DayKind;
  phase: PhaseId | null;
  weekday: Weekday;
  /** 1-based day of the plan (0 or negative before start). */
  dayNumber: number;
  /** 1-based week of the current phase (0 if no phase). */
  weekOfPhase: number;
  /** Monday-weeks since 2027-03-01 (negative before). */
  weeksSinceAnchor: number;
  blocks: PlanBlock[];
  quizTopics: QuizTopic[];
  /** Rest day that counts as kept automatically (phase 3–4 Sunday, final-week day −1, exam day). */
  autoKept: boolean;
  finalWeekStage?: FinalWeekStage;
  daysToExam: number;
  checkpoint?: Checkpoint;
  /** Last Friday of the month: monthly mistake review is due. */
  monthlyMistakeReview: boolean;
  /** Short title for the day, e.g. "Phase 1 · Day 2". */
  label: string;
}

export interface PlanContext {
  /** Murphy units the learner has completed (pointer, 0–145). */
  murphyUnitsDone: number;
  /** Weakest skill from the test log (rule behind-target); null = no data. */
  weakSkill: ExamSkill | null;
  /** Weak-skill focus on (split flex blocks). */
  weakFocus: boolean;
  /** Average self-score per Task 1 chart type (only types with ≥1 attempt). */
  task1ChartScores?: Partial<Record<Task1ChartType, number>>;
  /** Most frequent grammar tag in the mistake notebook (last 28 days, ≥3 items). */
  grammarErrorTopic?: string | null;
  /** The reading question types with most mistakes (phase 3 Thursday). */
  readingWeakTypes?: string[];
}

export const DEFAULT_PLAN_CONTEXT: PlanContext = { murphyUnitsDone: 0, weakSkill: null, weakFocus: false };

export const SKILL_LABEL: Record<Skill, string> = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
  grammar: 'Grammar',
  vocabulary: 'Vocabulary',
  test: 'Test',
  rest: 'Rest',
};

/**
 * Minutes the original block keeps when weak-skill focus splits it (from FLEX_POLICIES explanations).
 * The rest of the block's minutes go to a weak-skill sub-block.
 */
export const FLEX_KEEP_MINUTES: Record<string, number> = {
  'p1-sat-2': 30,
  'p2-wed-3': 15,
  'p2-sat-2': 0,
  'p3-wed-3': 15,
  'p3-fri-3': 20,
};

export function activityAction(activity: ActivityKind): BlockAction {
  switch (activity) {
    case 'vocab-new':
    case 'vocab-review':
    case 'vocab-from-text':
    case 'vocab-topic':
    case 'awl':
      return 'review';
    case 'mini-test':
      return 'quiz';
    case 'writing-task1':
      return 'writing-task1';
    case 'writing-task2':
      return 'writing-task2';
    case 'writing-task1-and-task2':
      return 'writing-full';
    case 'writing-paragraph':
      return 'writing-paragraph';
    case 'writing-model-compare':
    case 'writing-rewrite':
    case 'feedback':
      return 'writing-history';
    case 'speaking-record':
      return 'speaking-free';
    case 'speaking-part1':
      return 'speaking-part1';
    case 'speaking-part2':
      return 'speaking-part2';
    case 'speaking-part2-part3':
      return 'speaking-part3';
    case 'speaking-full-live':
    case 'speaking-mock':
      return 'speaking-live';
    case 'lr-test':
    case 'lrw-test':
    case 'full-mock':
    case 'listening-full-test':
    case 'reading-full-test':
      return 'test';
    case 'mistake-analysis':
      return 'mistakes';
    case 'rest':
      return 'none';
    default:
      return 'timer';
  }
}

/** Which phase contains the date (null if outside start..exam). */
export function phaseForDate(date: ISODate, config: Pick<AppConfig, 'startDate' | 'examDate'>): PhaseId | null {
  const ranges = resolvePhaseRanges(config);
  for (const p of [1, 2, 3, 4] as PhaseId[]) {
    const r = ranges[p];
    if (r && date >= r.start && date <= r.end) return p;
  }
  return null;
}

/** Checkpoints with the exam checkpoint bound to config.examDate. */
export function resolvedCheckpoints(config: Pick<AppConfig, 'examDate'>): Checkpoint[] {
  return CHECKPOINTS.map((c) =>
    c.useExamDate ? { ...c, date: config.examDate, window: { start: config.examDate, end: config.examDate } } : c,
  );
}

function clampIndex<T>(list: readonly T[], i: number): T {
  return list[Math.max(0, Math.min(list.length - 1, i))];
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** Task 1 chart type for a date (rotation; null before 2027-03-01). */
export function task1ChartForDate(date: ISODate): Task1ChartType | null {
  return task1ForWeek(weeksBetween(TASK1_ROTATION_ANCHOR, date))?.chart ?? null;
}

export function task2TypeForDate(date: ISODate): (typeof TASK2_TYPE_ROTATION)[number] {
  return TASK2_TYPE_ROTATION[mod(weeksBetween(TASK1_ROTATION_ANCHOR, date), TASK2_TYPE_ROTATION.length)];
}

function toPlanBlock(b: Block, weakSkill: ExamSkill | null): PlanBlock {
  const displaySkill: Skill = b.activity === 'weak-skill' ? (weakSkill ?? 'writing') : b.skill;
  return { ...b, displaySkill, action: activityAction(b.activity) };
}

function finalWeekStageFor(daysToExam: number): FinalWeekStage | undefined {
  return FINAL_WEEK.find((s) => daysToExam <= s.daysBefore.from && daysToExam >= s.daysBefore.to);
}

/** Resolve the plan for one date. */
export function resolveDay(
  date: ISODate,
  config: Pick<AppConfig, 'startDate' | 'examDate'>,
  ctx: PlanContext = DEFAULT_PLAN_CONTEXT,
): ResolvedDay {
  const weekday = weekdayOf(date);
  const dayNumber = daysBetween(config.startDate, date) + 1;
  const daysToExam = daysBetween(date, config.examDate);
  const weeksSinceAnchor = weeksBetween(TASK1_ROTATION_ANCHOR, date);
  const base = {
    date,
    weekday,
    dayNumber,
    daysToExam,
    weeksSinceAnchor,
    monthlyMistakeReview: false,
    autoKept: false,
  };

  if (date < config.startDate) {
    return { ...base, kind: 'pre-start', phase: null, weekOfPhase: 0, blocks: [], quizTopics: ['mixed-review'], label: 'Before your plan starts' };
  }
  if (date > config.examDate) {
    return { ...base, kind: 'post-exam', phase: null, weekOfPhase: 0, blocks: [], quizTopics: ['mixed-review'], label: 'After the exam' };
  }

  const phase = phaseForDate(date, config) ?? 4;
  const range = resolvePhaseRanges(config)[phase];
  const weekOfPhase = range ? weeksBetween(range.start, date) + 1 : 1;

  // Final week override (exam − 7 … exam day).
  if (daysToExam >= 0 && daysToExam <= FINAL_WEEK_DAYS) {
    const stage = finalWeekStageFor(daysToExam);
    if (stage) {
      return {
        ...base,
        kind: 'final-week',
        phase,
        weekOfPhase,
        blocks: stage.blocks.map((b) => toPlanBlock(b, ctx.weakSkill)),
        quizTopics: ['exam-strategy', 'mixed-review'],
        autoKept: daysToExam <= 1,
        finalWeekStage: stage,
        label: daysToExam === 0 ? 'Exam day' : `Final week · ${daysToExam} day${daysToExam === 1 ? '' : 's'} to go`,
      };
    }
  }

  const plan = SCHEDULES[phase].days[weekday];
  let blocks: PlanBlock[] = plan.blocks.map((b) => toPlanBlock(b, ctx.weakSkill));

  // 1. Checkpoint overlay.
  const checkpoint = resolvedCheckpoints(config).find((c) => c.date === date && !c.useExamDate);
  if (checkpoint) {
    const fullTest = checkpoint.skillsTested.length === 4;
    const cpBlock: PlanBlock = {
      id: `${checkpoint.id}-test`,
      order: 1,
      skill: 'test',
      displaySkill: 'test',
      minutes: fullTest ? 175 : checkpoint.skillsTested.length === 3 ? 160 : 90,
      title: 'Checkpoint test',
      task: checkpoint.howToCheck,
      activity: 'lr-test',
      action: 'test',
      checkpointId: checkpoint.id,
      detail: checkpoint.label,
    };
    if (blocks[0] && blocks[0].skill === 'test') blocks = [cpBlock, ...blocks.slice(1)];
    else blocks = [cpBlock, ...blocks.map((b) => ({ ...b, order: b.order + 1 }))];
  }

  // 2. Details per activity.
  const pace = phase === 1 ? murphyPace(date, config, ctx.murphyUnitsDone) : null;
  blocks = blocks.map((b) => fillDetails(b, { phase, weekday, weekOfPhase, date, ctx, pace }));

  // 3. Weak-skill focus: split flex blocks.
  if (ctx.weakFocus && ctx.weakSkill) {
    const policy = FLEX_POLICIES.find((p) => p.phase === phase);
    const out: PlanBlock[] = [];
    for (const b of blocks) {
      const keep = FLEX_KEEP_MINUTES[b.id];
      if (policy && policy.blockIds.includes(b.id) && keep !== undefined) {
        const weakMinutes = b.minutes - keep;
        if (keep > 0) out.push({ ...b, minutes: keep, minutesMax: undefined });
        if (weakMinutes > 0) {
          out.push({
            id: `${b.id}-weak`,
            order: b.order,
            skill: ctx.weakSkill,
            displaySkill: ctx.weakSkill,
            minutes: weakMinutes,
            title: `Focus: ${SKILL_LABEL[ctx.weakSkill]}`,
            task: WEAK_SKILL_PRACTICE[ctx.weakSkill],
            activity: 'weak-skill',
            action: weakSkillAction(ctx.weakSkill),
            hint: policy.explanation,
          });
        }
      } else out.push(b);
    }
    blocks = out.map((b, i) => ({ ...b, order: i + 1 }));
  }

  // 4. Monthly mistake review (last Friday of the month) — optional extra item.
  const monthlyMistakeReview = date === lastFridayOfMonth(date);
  if (monthlyMistakeReview) {
    blocks = [
      ...blocks,
      {
        id: `mmr-${monthKey(date)}`,
        order: blocks.length + 1,
        skill: 'test',
        displaySkill: 'test',
        minutes: 20,
        title: 'Mistake notebook review',
        task: 'Monthly review: go through your mistake notebook. Which mistakes come back again and again?',
        activity: 'mistake-analysis',
        action: 'mistakes',
        extra: true,
      },
    ];
  }

  const isRest = plan.isRestDay;
  return {
    ...base,
    kind: isRest ? 'rest' : 'study',
    phase,
    weekOfPhase,
    blocks,
    quizTopics: plan.quizTopics,
    autoKept: isRest && phase >= 3,
    checkpoint,
    monthlyMistakeReview,
    label: isRest ? `Phase ${phase} · Rest` : `Phase ${phase} · Day ${dayNumber}`,
  };
}

function weakSkillAction(skill: ExamSkill): BlockAction {
  if (skill === 'writing') return 'writing-task1';
  if (skill === 'speaking') return 'speaking-part2';
  return 'timer';
}

interface FillCtx {
  phase: PhaseId;
  weekday: Weekday;
  weekOfPhase: number;
  date: ISODate;
  ctx: PlanContext;
  pace: ReturnType<typeof murphyPace> | null;
}

function fillDetails(b: PlanBlock, f: FillCtx): PlanBlock {
  const { phase, weekday, weekOfPhase, date, ctx, pace } = f;
  switch (b.activity) {
    case 'murphy-units': {
      if (!pace) return b;
      if (pace.finished) return { ...b, detail: 'You finished the book. Review the units you found hard.' };
      const from = ctx.murphyUnitsDone + 1;
      const to = Math.min(MURPHY_PLAN.totalUnits, ctx.murphyUnitsDone + pace.unitsToday);
      const count = to - from + 1;
      return {
        ...b,
        task: `Study ${count} new Murphy unit${count === 1 ? '' : 's'} and do the exercises.`,
        detail: from === to ? `Unit ${from}` : `Units ${from}–${to}`,
        murphyUnits: { from, to, count },
      };
    }
    case 'hewings-units': {
      const t = clampIndex(PHASE2_HEWINGS_TOPICS, weekOfPhase - 1);
      return { ...b, detail: t.topic, hint: t.detail };
    }
    case 'grammar-topic': {
      const t = clampIndex(PHASE2_LINKER_TOPICS, weekOfPhase - 1);
      return { ...b, detail: t.topic, hint: t.detail };
    }
    case 'grammar-own-errors': {
      if (ctx.grammarErrorTopic) return { ...b, detail: `From your notebook: ${ctx.grammarErrorTopic}` };
      const t = PHASE3_ERROR_TOPICS_FALLBACK[mod(weekOfPhase - 1, PHASE3_ERROR_TOPICS_FALLBACK.length)];
      return { ...b, detail: t.topic, hint: t.detail };
    }
    case 'writing-task1': {
      let chart = task1ChartForDate(date);
      if (phase === 3 && weekday === 'fri') {
        const s = ctx.task1ChartScores ?? {};
        const types = Object.keys(TASK1_CHART_LABEL) as Task1ChartType[];
        if (types.every((t) => s[t] !== undefined)) {
          chart = types.reduce((lo, t) => ((s[t] as number) < (s[lo] as number) ? t : lo), types[0]);
        }
      }
      return chart ? { ...b, task1Chart: chart, detail: TASK1_CHART_LABEL[chart] } : b;
    }
    case 'writing-task1-and-task2': {
      const chart = task1ChartForDate(date);
      const t2 = task2TypeForDate(date);
      return { ...b, task1Chart: chart ?? undefined, task2Type: t2.type, detail: `${chart ? TASK1_CHART_LABEL[chart] : 'Task 1'} + ${t2.label}` };
    }
    case 'writing-task2': {
      const t2 = task2TypeForDate(date);
      return { ...b, task2Type: t2.type, detail: t2.label, hint: b.hint ?? t2.structureTip };
    }
    case 'reading-passage': {
      if (phase === 2 && weekday === 'thu') {
        const r = READING_STRATEGY_ROTATION[mod(weekOfPhase - 1, READING_STRATEGY_ROTATION.length)];
        return { ...b, detail: `${readingTypeLabel(r.main)} + ${readingTypeLabel(r.alwaysAlso)}`, hint: r.tip };
      }
      if (phase === 3 && weekday === 'thu' && ctx.readingWeakTypes && ctx.readingWeakTypes.length > 0) {
        return { ...b, detail: `Your weak types: ${ctx.readingWeakTypes.slice(0, 2).join(', ')}` };
      }
      return b;
    }
    case 'vocab-topic': {
      if (phase === 3) return { ...b, detail: `Topic: ${PHASE3_VOCAB_TOPICS[mod(weekOfPhase - 1, PHASE3_VOCAB_TOPICS.length)]}` };
      return b;
    }
    case 'speaking-record': {
      if (phase === 1 && weekday === 'fri') {
        const topic = PHASE1_SPEAKING_TOPICS[mod(weekOfPhase - 1, PHASE1_SPEAKING_TOPICS.length)];
        return { ...b, speakingTopic: topic, detail: `Topic: ${topic}` };
      }
      return b;
    }
    case 'mini-test':
      return { ...b, quizSize: 10 };
    case 'weak-skill': {
      const skill = ctx.weakSkill;
      const label = skill ? SKILL_LABEL[skill] : 'Writing';
      return {
        ...b,
        task: b.task.replace('{weakSkill}', label),
        detail: skill ? WEAK_SKILL_PRACTICE[skill] : 'No test data yet, so Writing (usually the lowest part).',
        action: weakSkillAction(skill ?? 'writing'),
      };
    }
    default:
      return b;
  }
}

export const READING_TYPE_LABEL: Record<string, string> = {
  tfng: 'True / False / Not Given',
  ynng: 'Yes / No / Not Given',
  headings: 'Matching headings',
  'matching-information': 'Matching information',
  'matching-features': 'Matching features',
  'matching-sentence-endings': 'Sentence endings',
  'sentence-completion': 'Sentence completion',
  'summary-completion': 'Summary completion',
  'note-table-flowchart-completion': 'Notes / table / flow-chart',
  'diagram-labelling': 'Diagram labelling',
  'multiple-choice': 'Multiple choice',
  'short-answer': 'Short answers',
};

function readingTypeLabel(t: string): string {
  return READING_TYPE_LABEL[t] ?? t;
}

/** Planned minutes of the required (non-extra) blocks. */
export function plannedMinutes(blocks: PlanBlock[]): number {
  return blocks.filter((b) => !b.extra).reduce((s, b) => s + b.minutes, 0);
}

/** Blocks that count for completion (not rest, not extra, not zero-minute exam marker). */
export function countableBlocks(day: Pick<ResolvedDay, 'blocks'>): PlanBlock[] {
  return day.blocks.filter((b) => !b.extra && b.skill !== 'rest');
}

/** The date of the next day that is a study day (for "Tomorrow: …"). */
export function nextDay(date: ISODate): ISODate {
  return addDays(date, 1);
}
