import type { Checkpoint } from './types';
import { DEFAULT_CONFIG } from './config';

/**
 * Checkpoints ("Yoxlama nöqtələri") from the plan.
 * Dates: the plan says "end of month"; we pick the last Saturday (test day) of that month.
 * The Saturday checkpoint test REPLACES that Saturday's normal test block.
 * A result logged inside `window` counts for the checkpoint (lets the user move it by a few days).
 *
 * Exception: the October official mock is on Saturday 2027-10-23, NOT the last Saturday (10-30).
 * The plan says "October 2027" (not "end of October"), and an earlier mock is better for the learner:
 * official mock results and Writing/Speaking feedback can take several days, and 10-23 leaves about
 * 3 weeks of phase 4 practice to act on them before the final week (exam - 7 days = 11-13 by default).
 * 10-30 would leave only 2 weeks. The window still covers all of October, because the real mock date
 * depends on the test centre.
 *
 * Raw targets are checked against bandTables.ts (source of truth). Invariant for every checkpoint with a
 * rawTarget: rawToBand(skill, rawTarget.min) === targetBand.min and
 * rawToBand(skill, rawTarget.max) === targetBand.max, for BOTH Listening and Academic Reading.
 */
export const CHECKPOINTS: Checkpoint[] = [
  {
    id: 'cp-feb-2027',
    label: 'End of February 2027',
    date: '2027-02-27',
    window: { start: '2027-02-15', end: '2027-03-07' },
    phase: 1,
    // Plan: "~5.5, 20–23 correct". In the band tables 20–22 ≈ 5.5 and 23 ≈ 6.0, so the plan's range
    // spans 5.5 up to the first 6.0 score (the same pattern as June 23–27 and September 27–30).
    // targetBand.min (5.5) is what the "behind target" rule uses.
    targetBand: { min: 5.5, max: 6.0 },
    rawTarget: { min: 20, max: 23 },
    skillsTested: ['listening', 'reading'],
    howToCheck: 'Do the Listening and Reading parts of one Cambridge test (books 10–13). Target: 20–23 correct answers in each. 20–22 is about 5.5, and 23 is already about 6.0.',
    resourceIds: ['cambridge-10-13'],
  },
  {
    id: 'cp-jun-2027',
    label: 'End of June 2027',
    date: '2027-06-26',
    window: { start: '2027-06-14', end: '2027-07-04' },
    phase: 2,
    targetBand: { min: 6.0, max: 6.5 },
    rawTarget: { min: 23, max: 27 },
    skillsTested: ['listening', 'reading', 'writing'],
    howToCheck: 'Do a full test and get your Writing checked by a teacher. Target: 23–27 correct answers in Listening and Reading.',
    resourceIds: ['cambridge-10-13', 'feedback-people'],
  },
  {
    id: 'cp-sep-2027',
    label: 'End of September 2027',
    date: '2027-09-25',
    window: { start: '2027-09-13', end: '2027-10-03' },
    phase: 3,
    targetBand: { min: 6.5, max: 7.0 },
    rawTarget: { min: 27, max: 30 },
    skillsTested: ['listening', 'reading', 'writing', 'speaking'],
    howToCheck: 'Full mock exam with all 4 parts. Ask a teacher or partner to score your Writing and Speaking. Target: 27–30 correct in Listening and Reading.',
    resourceIds: ['cambridge-14-19', 'feedback-people', 'speaking-partner'],
  },
  {
    id: 'cp-oct-2027',
    label: 'October 2027 — official mock',
    date: '2027-10-23',
    window: { start: '2027-10-01', end: '2027-10-31' },
    phase: 4,
    targetBand: { min: 7.0, max: 7.5 },
    // Plan gives no raw scores here ("7.0+"). 30 ≈ 7.0 and 33 ≈ 7.5 in both Listening and Academic Reading.
    rawTarget: { min: 30, max: 33 },
    skillsTested: ['listening', 'reading', 'writing', 'speaking'],
    howToCheck: 'Official mock test (British Council / IDP). Target: 7.0 or higher (about 30 or more correct answers in Listening and Reading).',
    resourceIds: ['official-mock'],
    official: true,
  },
  {
    id: 'cp-exam',
    label: 'November 2027 — IELTS Academic exam',
    date: DEFAULT_CONFIG.examDate,
    window: { start: DEFAULT_CONFIG.examDate, end: DEFAULT_CONFIG.examDate },
    phase: 4,
    targetBand: { min: 7.0, max: 7.5 },
    skillsTested: ['listening', 'reading', 'writing', 'speaking'],
    howToCheck: 'The official IELTS Academic exam.',
    resourceIds: [],
    official: true,
    useExamDate: true,
  },
];

/**
 * Raw-score targets for the final goal (from the plan's exam table).
 * Listening: 30 correct ≈ 7.0, 32 ≈ 7.5. Reading (Academic): 30 ≈ 7.0, 33 ≈ 7.5.
 */
export const FINAL_RAW_TARGETS = {
  listening: { band7: 30, band7_5: 32 },
  reading: { band7: 30, band7_5: 33 },
} as const;
