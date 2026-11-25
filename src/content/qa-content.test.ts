/** QA: content bank integrity. */
import { describe, expect, it } from 'vitest';
import { QUIZ_ITEMS, SPEAKING_PROMPTS, VOCAB_CARDS, WRITING_PROMPTS } from './index';
import { PHASE2_HEWINGS_TOPICS, PHASE2_LINKER_TOPICS, MURPHY_SECTIONS, SCHEDULES } from '../data';
import type { QuizTopic } from '../data';
import { dateRange } from '../logic/dates';
import { expandTopics, selectQuiz, checkAnswer, correctAnswerText } from '../logic/quiz';
import { resolveDay } from '../logic/plan';
import { clozeOf } from '../logic/deck';

const cfg = { startDate: '2026-11-23', examDate: '2027-11-20' };
const dupes = (ids: string[]) => ids.filter((x, i) => ids.indexOf(x) !== i);

describe('content bank integrity', () => {
  it('quiz ids unique, stable format, non-empty fields', () => {
    expect(QUIZ_ITEMS.length).toBeGreaterThan(100);
    expect(dupes(QUIZ_ITEMS.map((q) => q.id))).toEqual([]);
    for (const q of QUIZ_ITEMS) {
      expect(q.id, q.id).toMatch(/^q(34)?-[a-z0-9-]+-\d{4}$/);
      expect(q.id.startsWith(`q-${q.topic}-`) || q.id.startsWith(`q34-${q.topic}-`), q.id).toBe(true);
      expect(q.explanation.trim().length, q.id).toBeGreaterThan(5);
      expect([1, 2, 3, 4]).toContain(q.phase);
      expect(q.topic).toBeTruthy();
    }
  });
  it('every quiz item has a valid answer key', () => {
    for (const q of QUIZ_ITEMS) {
      if (q.kind === 'mcq' || q.kind === 'headings') {
        expect(Number.isInteger(q.answerIndex), q.id).toBe(true);
        expect(q.answerIndex, q.id).toBeGreaterThanOrEqual(0);
        expect(q.answerIndex, q.id).toBeLessThan(q.options.length);
        expect(q.options.length, q.id).toBeGreaterThanOrEqual(3);
        expect(q.options.length, q.id).toBeLessThanOrEqual(6);
        expect(new Set(q.options.map((o) => o.trim().toLowerCase())).size, `${q.id} duplicate options`).toBe(q.options.length);
        expect(q.options.every((o) => o.trim().length > 0), q.id).toBe(true);
        if (q.kind === 'mcq') expect(q.prompt.trim().length, q.id).toBeGreaterThan(3);
        expect(checkAnswer(q, q.answerIndex), q.id).toBe(true);
        expect(checkAnswer(q, (q.answerIndex + 1) % q.options.length), q.id).toBe(false);
      } else if (q.kind === 'gap') {
        expect(q.answers.length, q.id).toBeGreaterThan(0);
        expect(q.answers.every((a) => a.trim().length > 0), q.id).toBe(true);
        expect(q.prompt.split('___').length - 1, `${q.id} must have exactly one ___`).toBe(1);
        expect(checkAnswer(q, q.answers[0]), q.id).toBe(true);
        expect(checkAnswer(q, '  ' + q.answers[0].toUpperCase() + ' '), q.id).toBe(true);
        expect(checkAnswer(q, ''), q.id).toBe(false);
      } else {
        const ok = q.variant === 'ynng' ? ['Y', 'N', 'NG'] : ['T', 'F', 'NG'];
        expect(ok, `${q.id} answer ${q.answer} invalid for ${q.variant}`).toContain(q.answer);
        expect(q.passage.trim().length, q.id).toBeGreaterThan(40);
        expect(q.statement.trim().length, q.id).toBeGreaterThan(5);
        expect(checkAnswer(q, q.answer), q.id).toBe(true);
      }
      expect(correctAnswerText(q), q.id).toBeTruthy();
    }
  });
  it('no duplicate prompts (same question twice with different ids)', () => {
    const keys = QUIZ_ITEMS.map((q) => `${q.kind}|${'prompt' in q ? q.prompt : q.kind === 'tfng' ? q.passage + q.statement : q.paragraph}|${'options' in q ? q.options.join('/') : 'answers' in q ? q.answers.join('/') : ''}`);
    const d = dupes(keys);
    expect(d.slice(0, 5)).toEqual([]);
  });
  it('vocab ids unique and cards complete', () => {
    expect(dupes(VOCAB_CARDS.map((v) => v.id))).toEqual([]);
    for (const v of VOCAB_CARDS) {
      expect(v.id).toMatch(/^v(34)?-\d{4}$/);
      expect(v.headword.trim(), v.id).toBeTruthy();
      expect(v.definition.trim(), v.id).toBeTruthy();
      expect(v.collocations.length, v.id).toBeGreaterThanOrEqual(1);
      expect(v.example.trim().length, v.id).toBeGreaterThan(8);
    }
    expect(dupes(VOCAB_CARDS.map((v) => v.headword.toLowerCase() + '|' + v.pos)).slice(0, 10)).toEqual([]);
  });
  it('cloze: share of cards whose example does not contain the headword is small (UI must fall back when clozeOf is null)', () => {
    const miss = VOCAB_CARDS.filter((v) => clozeOf(v.example, v.headword) === null);
    console.log(`QA info: ${miss.length}/${VOCAB_CARDS.length} cards have no cloze (e.g. ${miss.slice(0, 5).map((v) => v.headword).join(', ')})`);
    expect(miss.length / VOCAB_CARDS.length).toBeLessThan(0.1);
  });
  it('speaking / writing prompt ids unique and well-formed', () => {
    expect(dupes(SPEAKING_PROMPTS.map((p) => p.id))).toEqual([]);
    expect(dupes(WRITING_PROMPTS.map((p) => p.id))).toEqual([]);
    for (const p of SPEAKING_PROMPTS) {
      expect(p.questions.length, p.id).toBeGreaterThan(0);
      if (p.part === 2) expect(p.bullets?.length, p.id).toBeGreaterThan(0);
    }
    for (const p of WRITING_PROMPTS) {
      expect(p.prompt.trim(), p.id).toBeTruthy();
      if (p.task === 1) expect(p.chartType, p.id).toBeTruthy();
      if (p.task === 2) expect(p.essayType, p.id).toBeTruthy();
    }
  });
});

describe('schedule <-> content coverage', () => {
  const byTopic = (t: QuizTopic) => QUIZ_ITEMS.filter((q) => q.topic === t).length;
  it('every concrete quiz topic referenced in phase 1-2 schedules/grammar tables has >=1 item (or is a meta topic)', () => {
    const META = new Set<QuizTopic>(['grammar-current', 'grammar-week-review', 'reading-question-type-current', 'mixed-review']);
    const topics = new Set<QuizTopic>();
    for (const p of [1, 2] as const) for (const d of Object.values(SCHEDULES[p].days)) d.quizTopics.forEach((t) => topics.add(t));
    MURPHY_SECTIONS.forEach((s) => s.quizTopics.forEach((t) => topics.add(t)));
    [...PHASE2_HEWINGS_TOPICS, ...PHASE2_LINKER_TOPICS].forEach((s) => s.quizTopics.forEach((t) => topics.add(t)));
    const empty = [...topics].filter((t) => !META.has(t) && byTopic(t) === 0);
    expect(empty, 'topics with no quiz items').toEqual([]);
  });
  it('same check for phases 3-4 and final week (informational: phase 3-4 may rely on fallback)', () => {
    const topics = new Set<QuizTopic>();
    for (const p of [3, 4] as const) for (const d of Object.values(SCHEDULES[p].days)) d.quizTopics.forEach((t) => topics.add(t));
    topics.add('exam-strategy');
    const empty = [...topics].filter((t) => !['grammar-current', 'grammar-week-review', 'reading-question-type-current', 'mixed-review'].includes(t) && byTopic(t) === 0);
    expect(empty, 'phase 3-4 topics with no items').toEqual([]);
  });
  it('every day of phase 1-2 yields a full daily quiz (10 items) with at least some on-topic items', () => {
    for (const d of dateRange('2026-11-23', '2027-06-30')) {
      const r = resolveDay(d, cfg);
      if (r.kind === 'pre-start') continue;
      const topics = expandTopics(r.quizTopics, { phase: r.phase, weekday: r.weekday, weekOfPhase: r.weekOfPhase, murphyUnitsDone: 0 });
      const sel = selectQuiz({ items: QUIZ_ITEMS, topics, phase: r.phase, seed: d, size: 10 });
      expect(sel.length, d).toBe(10);
      expect(new Set(sel.map((q) => q.id)).size, d).toBe(10);
      if (r.kind !== 'rest') expect(sel.some((q) => topics.includes(q.topic)), `${d} no on-topic item for ${topics}`).toBe(true);
    }
  });
  it('quiz selection is deterministic for a seed (reload shows same quiz)', () => {
    const a = selectQuiz({ items: QUIZ_ITEMS, topics: ['tenses'], phase: 1, seed: '2026-11-23', size: 10 }).map((q) => q.id);
    const b = selectQuiz({ items: QUIZ_ITEMS, topics: ['tenses'], phase: 1, seed: '2026-11-23', size: 10 }).map((q) => q.id);
    expect(a).toEqual(b);
  });
  it('phase 1 pool size: enough distinct items for ~13 weeks of daily 10-question quizzes? (informational count)', () => {
    const p1 = QUIZ_ITEMS.filter((q) => q.phase <= 1).length;
    const p2 = QUIZ_ITEMS.filter((q) => q.phase <= 2).length;
    console.log(`QA info: quiz items ${QUIZ_ITEMS.length} (phase<=1: ${p1}, phase<=2: ${p2}); vocab ${VOCAB_CARDS.length}; days phase1 = 98, phase2 = 122`);
    expect(p1).toBeGreaterThan(0);
  });
});
