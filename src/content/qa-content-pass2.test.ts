/** Content fix pass 2: invariants that must keep holding (positional references, answer patterns, tagging, passage length). */
import { describe, expect, it } from 'vitest';
import { QUIZ_ITEMS, VOCAB_CARDS } from './index';
import { QUIZ_GRAMMAR } from './quiz-grammar';
import { QUIZ_PHASE34 } from './quiz-phase34';
import { QUIZ_READING } from './quiz-reading';
import { QUIZ_TASK1 } from './quiz-task1';
import { QUIZ_VOCAB } from './quiz-vocab';
import { VOCAB_AWL } from './vocab-awl';
import { VOCAB_EXTRA } from './vocab-extra';
import { VOCAB_PHASE1 } from './vocab-phase1';
import { VOCAB_PHASE34 } from './vocab-phase34';
import type { QuizItem } from './types';

/** The app shuffles option order at display time, so explanations must never refer to an option by position or letter. */
const POSITIONAL = [
  /\b(options?|choices?|answers?)\s*\(?\s*([1-4]|[A-D]|one|two|three|four)\b/i,
  /\b(the\s+)?(first|second|third|fourth|last|final)\s+(option|answer|choice|heading|one)s?\b/i,
  /\b(both|either|neither)\s+[A-D]\s+(and|or|nor)\s+[A-D]\b/,
  /\(\s*[A-D]\s*\)|\b[A-D]\)\s/,
];
const ngPos = (items: QuizItem[]) => {
  const groups = new Map<string, string[]>();
  for (const q of items) if (q.kind === 'tfng') groups.set(q.passage, [...(groups.get(q.passage) ?? []), q.answer]);
  const pos = { first: 0, middle: 0, last: 0 };
  for (const a of groups.values()) {
    const i = a.indexOf('NG');
    if (i < 0) continue;
    if (i === 0) pos.first++; else if (i === a.length - 1) pos.last++; else pos.middle++;
  }
  return { groups: groups.size, ...pos };
};

describe('content fix pass 2', () => {
  it('no explanation refers to an option by number, letter or position', () => {
    const bad = QUIZ_ITEMS.filter((q) => POSITIONAL.some((re) => re.test(q.explanation))).map((q) => q.id);
    expect(bad).toEqual([]);
  });
  it('NG is not always the last statement of a passage', () => {
    const a = ngPos([...QUIZ_READING]);
    const b = ngPos(QUIZ_PHASE34);
    console.log('NG position, pass A (phase 1-2):', JSON.stringify(a), '| phase 3-4:', JSON.stringify(b));
    for (const r of [a, b]) {
      expect(r.last / r.groups).toBeLessThan(0.5);
      expect(r.first).toBeGreaterThan(0);
      expect(r.middle).toBeGreaterThan(0);
    }
  });
  it('mcq/heading key positions are spread (no position above 40%)', () => {
    for (const [name, items] of [['grammar', QUIZ_GRAMMAR], ['vocab', QUIZ_VOCAB], ['reading', QUIZ_READING], ['task1', QUIZ_TASK1], ['phase34', QUIZ_PHASE34]] as const) {
      const c: Record<number, number> = {};
      let n = 0;
      for (const q of items) if (q.kind === 'mcq' || q.kind === 'headings') { c[q.answerIndex] = (c[q.answerIndex] ?? 0) + 1; n++; }
      console.log(`key positions ${name}:`, JSON.stringify(c));
      for (const k of Object.keys(c)) expect(c[Number(k)] / n, `${name} key ${k}`).toBeLessThan(0.4);
    }
  });
  it('phase 3-4 tagging: q34 phase 4 only for exam-strategy; v34 cards never phase 4', () => {
    for (const q of QUIZ_PHASE34) if (q.phase === 4) expect(q.topic, q.id).toBe('exam-strategy');
    expect(VOCAB_PHASE34.filter((c) => c.phase === 4)).toEqual([]);
  });
  it('phase 3-4 true/false passages are exam-like (>= 110 words)', () => {
    for (const q of QUIZ_PHASE34) if (q.kind === 'tfng') expect(q.passage.split(/\s+/).length, q.id).toBeGreaterThanOrEqual(110);
  });
  it('ynng explanations/statements do not assume the writer\'s gender', () => {
    const re = /\b(she|her|hers|he|his|him)\b/i;
    const bad = QUIZ_ITEMS.filter((q) => q.kind === 'tfng' && q.variant === 'ynng' && (re.test(q.statement) || re.test(q.explanation))).map((q) => q.id);
    expect(bad).toEqual([]);
  });
  it('prints CEFR / phase distribution per file', () => {
    const rows: Record<string, Record<string, number>> = {};
    const add = (file: string, phase: number, cefr: string) => { const r = (rows[file] ??= {}); const k = `p${phase}/${cefr}`; r[k] = (r[k] ?? 0) + 1; };
    for (const [f, items] of [['quiz-grammar', QUIZ_GRAMMAR], ['quiz-vocab', QUIZ_VOCAB], ['quiz-reading', QUIZ_READING], ['quiz-task1', QUIZ_TASK1], ['quiz-phase34', QUIZ_PHASE34]] as const) for (const q of items) add(f, q.phase, q.cefr);
    for (const [f, cards] of [['vocab-phase1', VOCAB_PHASE1], ['vocab-awl', VOCAB_AWL], ['vocab-extra', VOCAB_EXTRA], ['vocab-phase34', VOCAB_PHASE34]] as const) for (const c of cards) add(f, c.phase, c.cefr);
    for (const [f, r] of Object.entries(rows)) console.log(f.padEnd(14), JSON.stringify(Object.fromEntries(Object.entries(r).sort())));
    expect(Object.keys(rows).length).toBe(9);
    expect(VOCAB_CARDS.length).toBeGreaterThan(700);
  });
});
