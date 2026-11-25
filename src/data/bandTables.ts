import type { BandTable, ExamSkill } from './types';

/**
 * Raw score (correct answers out of 40) → band, IELTS ACADEMIC.
 * APPROXIMATE: based on the commonly published conversion tables. The real table changes slightly
 * from test to test. Always show "≈" next to converted bands.
 */
export const LISTENING_BAND_TABLE: BandTable = {
  skill: 'listening',
  module: 'academic',
  approximate: true,
  note: 'Approximate. The official conversion changes a little from test to test.',
  rows: [
    { minCorrect: 39, maxCorrect: 40, band: 9.0 },
    { minCorrect: 37, maxCorrect: 38, band: 8.5 },
    { minCorrect: 35, maxCorrect: 36, band: 8.0 },
    { minCorrect: 32, maxCorrect: 34, band: 7.5 },
    { minCorrect: 30, maxCorrect: 31, band: 7.0 },
    { minCorrect: 26, maxCorrect: 29, band: 6.5 },
    { minCorrect: 23, maxCorrect: 25, band: 6.0 },
    { minCorrect: 18, maxCorrect: 22, band: 5.5 },
    { minCorrect: 16, maxCorrect: 17, band: 5.0 },
    { minCorrect: 13, maxCorrect: 15, band: 4.5 },
    { minCorrect: 10, maxCorrect: 12, band: 4.0 },
    { minCorrect: 8, maxCorrect: 9, band: 3.5 },
    { minCorrect: 6, maxCorrect: 7, band: 3.0 },
    { minCorrect: 4, maxCorrect: 5, band: 2.5 },
    { minCorrect: 2, maxCorrect: 3, band: 2.0 },
    { minCorrect: 1, maxCorrect: 1, band: 1.0 },
    { minCorrect: 0, maxCorrect: 0, band: 0 },
  ],
};

export const ACADEMIC_READING_BAND_TABLE: BandTable = {
  skill: 'reading',
  module: 'academic',
  approximate: true,
  note: 'Approximate, Academic Reading only (General Training uses a different table).',
  rows: [
    { minCorrect: 39, maxCorrect: 40, band: 9.0 },
    { minCorrect: 37, maxCorrect: 38, band: 8.5 },
    { minCorrect: 35, maxCorrect: 36, band: 8.0 },
    { minCorrect: 33, maxCorrect: 34, band: 7.5 },
    { minCorrect: 30, maxCorrect: 32, band: 7.0 },
    { minCorrect: 27, maxCorrect: 29, band: 6.5 },
    { minCorrect: 23, maxCorrect: 26, band: 6.0 },
    { minCorrect: 19, maxCorrect: 22, band: 5.5 },
    { minCorrect: 15, maxCorrect: 18, band: 5.0 },
    { minCorrect: 13, maxCorrect: 14, band: 4.5 },
    { minCorrect: 10, maxCorrect: 12, band: 4.0 },
    { minCorrect: 8, maxCorrect: 9, band: 3.5 },
    { minCorrect: 6, maxCorrect: 7, band: 3.0 },
    { minCorrect: 4, maxCorrect: 5, band: 2.5 },
    { minCorrect: 2, maxCorrect: 3, band: 2.0 },
    { minCorrect: 1, maxCorrect: 1, band: 1.0 },
    { minCorrect: 0, maxCorrect: 0, band: 0 },
  ],
};

export const BAND_TABLES = {
  listening: LISTENING_BAND_TABLE,
  reading: ACADEMIC_READING_BAND_TABLE,
} as const;

/** Approximate band for a raw score 0–40. Returns null for invalid input. */
export function rawToBand(skill: 'listening' | 'reading', correct: number): number | null {
  if (!Number.isInteger(correct) || correct < 0 || correct > 40) return null;
  const row = BAND_TABLES[skill].rows.find((r) => correct >= r.minCorrect && correct <= r.maxCorrect);
  return row ? row.band : null;
}

/** Lowest raw score that reaches a band (e.g. reading 7.0 → 30). */
export function minRawForBand(skill: 'listening' | 'reading', band: number): number | null {
  const rows = BAND_TABLES[skill].rows.filter((r) => r.band >= band);
  return rows.length ? Math.min(...rows.map((r) => r.minCorrect)) : null;
}

/** Round to the nearest half band; .25 rounds up to .5 and .75 rounds up to the next whole band (IELTS rule). */
export function roundToHalfBand(x: number): number {
  return Math.round(x * 2 + 1e-9) / 2;
}

/**
 * Overall band = average of the 4 parts, rounded with the IELTS rule.
 * Example: 6.5 + 6.5 + 5.5 + 7.0 = 25.5 / 4 = 6.375 → 6.5.
 */
export function overallBand(bands: Record<ExamSkill, number>): number {
  const avg = (bands.listening + bands.reading + bands.writing + bands.speaking) / 4;
  return roundToHalfBand(avg);
}

/**
 * Self-estimated Writing band from Task 1 and Task 2 estimates.
 * Task 2 counts twice as much as Task 1. APPROXIMATE — examiners' exact method is not public.
 */
export function estimateWritingBand(task1: number, task2: number): number {
  return roundToHalfBand((task1 + 2 * task2) / 3);
}

/**
 * Average of the 4 criterion scores for one Writing task or for Speaking (self-estimate).
 * Rounded DOWN to the half band on purpose: self-estimates are usually too high, and a cautious number
 * is safer for planning. APPROXIMATE.
 */
export function criteriaToBand(scores: number[]): number {
  if (scores.length === 0) return 0;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.floor(avg * 2 + 1e-9) / 2;
}
