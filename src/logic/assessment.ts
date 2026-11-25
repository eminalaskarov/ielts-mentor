/**
 * Test results → bands, weak skill (rule "behind-target"), checkpoint status. Pure.
 */
import { MENTOR_RULES, PHASE_BY_ID, overallBand, rawToBand, roundToHalfBand } from '../data';
import type { Checkpoint, ExamSkill, ISODate, PhaseId } from '../data';

export const EXAM_SKILLS: ExamSkill[] = ['listening', 'reading', 'writing', 'speaking'];

const BT = MENTOR_RULES.find((r) => r.id === 'behind-target')!;
const TIE_ORDER = (BT.params.tieOrder as string[]) as ExamSkill[];
const RUNNING_N = Number(BT.params.runningAverageTests ?? 3);
const MIN_TESTS = Number(BT.params.minTestsForRunningCheck ?? 2);
const BIG_GAP = Number(BT.params.bigGap ?? 1);

export interface TestBands {
  id: string;
  date: ISODate;
  listening?: number | null;
  reading?: number | null;
  writing?: number | null;
  speaking?: number | null;
  checkpointId?: string | null;
}

/** Band from raw score; null for empty/invalid. */
export function bandFromRaw(skill: 'listening' | 'reading', raw: number | null | undefined): number | null {
  if (raw === null || raw === undefined || Number.isNaN(raw)) return null;
  return rawToBand(skill, raw);
}

/** Overall band if all 4 parts are present, else null. */
export function overallOf(t: TestBands): number | null {
  const { listening: l, reading: r, writing: w, speaking: s } = t;
  if (l == null || r == null || w == null || s == null) return null;
  return overallBand({ listening: l, reading: r, writing: w, speaking: s });
}

/** Average of the parts that are present (rounded to half band) — for partial tests like L+R. */
export function partialAverage(t: TestBands): number | null {
  const v = EXAM_SKILLS.map((k) => t[k]).filter((x): x is number => typeof x === 'number');
  if (v.length === 0) return null;
  return roundToHalfBand(v.reduce((a, b) => a + b, 0) / v.length);
}

export interface SkillEstimate {
  band: number | null;
  /** How many tests contributed. */
  n: number;
  source: 'checkpoint' | 'running' | 'single' | 'none';
}

/**
 * Per skill: the latest checkpoint result if it is the latest test with that skill;
 * otherwise the average of the last 3 tests (needs ≥ 2). With exactly 1 test: 'single' (shown, not used for focus).
 */
export function skillEstimates(tests: TestBands[]): Record<ExamSkill, SkillEstimate> {
  const sorted = [...tests].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const out = {} as Record<ExamSkill, SkillEstimate>;
  for (const k of EXAM_SKILLS) {
    const withSkill = sorted.filter((t) => typeof t[k] === 'number');
    if (withSkill.length === 0) {
      out[k] = { band: null, n: 0, source: 'none' };
      continue;
    }
    const latest = withSkill[0];
    if (latest.checkpointId) {
      out[k] = { band: latest[k] as number, n: 1, source: 'checkpoint' };
      continue;
    }
    if (withSkill.length >= MIN_TESTS) {
      const last = withSkill.slice(0, RUNNING_N).map((t) => t[k] as number);
      out[k] = { band: roundToHalfBand(last.reduce((a, b) => a + b, 0) / last.length), n: last.length, source: 'running' };
      continue;
    }
    out[k] = { band: latest[k] as number, n: 1, source: 'single' };
  }
  return out;
}

export interface WeakSkillResult {
  weakSkill: ExamSkill | null;
  gaps: Partial<Record<ExamSkill, number>>;
  /** Largest gap is ≥ 1.0 band. */
  bigGap: boolean;
  /** At least one skill had usable data. */
  hasData: boolean;
  target: number;
}

/** Running target = current phase target minimum (phase 1 → 5.5 … phase 4 → 7.0). */
export function targetForPhase(phase: PhaseId | null): number {
  return PHASE_BY_ID[phase ?? 1].targetBand.min;
}

export function computeWeakSkill(tests: TestBands[], target: number, minPerSkill?: number | null): WeakSkillResult {
  const est = skillEstimates(tests);
  const gaps: Partial<Record<ExamSkill, number>> = {};
  let hasData = false;
  for (const k of EXAM_SKILLS) {
    const e = est[k];
    if (e.band === null || e.source === 'single' || e.source === 'none') continue;
    hasData = true;
    const g1 = target - e.band;
    const g2 = minPerSkill ? minPerSkill - e.band : -Infinity;
    gaps[k] = Math.max(g1, g2);
  }
  let weakSkill: ExamSkill | null = null;
  let maxGap = 0;
  for (const k of TIE_ORDER) {
    const g = gaps[k];
    if (g !== undefined && g > maxGap + 1e-9) {
      maxGap = g;
      weakSkill = k;
    }
  }
  return { weakSkill, gaps, bigGap: maxGap >= BIG_GAP - 1e-9, hasData, target };
}

export type CheckpointStatus = 'on-track' | 'close' | 'behind' | 'not-tested';

/** ux-spec 4.7: On track (≥ target), Close (within 0.5), Behind (> 0.5 below). */
export function checkpointStatus(result: number | null, cp: Pick<Checkpoint, 'targetBand'>): CheckpointStatus {
  if (result === null) return 'not-tested';
  if (result >= cp.targetBand.min) return 'on-track';
  if (cp.targetBand.min - result <= 0.5) return 'close';
  return 'behind';
}

/** The checkpoint whose window contains the date (if any). */
export function checkpointForDate(date: ISODate, cps: Checkpoint[]): Checkpoint | undefined {
  return cps.find((c) => date >= c.window.start && date <= c.window.end);
}

/** Result band for a checkpoint from a test: overall if complete, else average of tested skills. */
export function checkpointResultBand(t: TestBands, cp: Pick<Checkpoint, 'skillsTested'>): number | null {
  if (cp.skillsTested.length === 4) {
    const o = overallOf(t);
    if (o !== null) return o;
  }
  const v = cp.skillsTested.map((k) => t[k]).filter((x): x is number => typeof x === 'number');
  if (v.length === 0) return partialAverage(t);
  return roundToHalfBand(v.reduce((a, b) => a + b, 0) / v.length);
}

/** Cambridge test-book guard (rule "test-book-guard"): books 14–19 in phase 1–2. */
export function isReservedBook(book: string | null | undefined, phase: PhaseId | null): boolean {
  if (!book) return false;
  const m = /cambridge\D*(\d{1,2})/i.exec(book);
  if (!m) return false;
  const n = Number(m[1]);
  return n >= 14 && n <= 19 && (phase ?? 1) < 3;
}
