/** Regression tests for the step-4 fix pass (quiz fallback, plurals, cue cards, timers, mistake signals). */
import { describe, expect, it } from 'vitest';
import type { QuizItem } from '../content/types';
import type { Mistake } from '../db/db';
import { expandTopics, selectQuiz } from './quiz';
import { plural, splitCueBullets } from './text';
import { quizSignals } from './context';
import { isStaleTimerEntry } from './timer';
import { relativeDays } from './dates';
import { resolveQuizTopics } from '../data';

const mcq = (id: string, topic: QuizItem['topic'], phase: 1 | 2 | 3 | 4 = 1): QuizItem =>
  ({ id, kind: 'mcq', topic, phase, prompt: 'p', options: ['a', 'b'], answerIndex: 0, explanation: 'e' }) as unknown as QuizItem;

describe('quiz selection fallback', () => {
  const items = [
    mcq('t1', 'tenses'),
    mcq('g-art', 'articles'),
    mcq('g-pas', 'passive'),
    mcq('g-old', 'conditionals', 1),
    mcq('r1', 'reading-tfng'),
    mcq('r2', 'reading-headings'),
    mcq('v1', 'awl'),
    mcq('v2', 'vocab-collocations'),
  ];

  it('few on-topic items: fills with the same skill family before other skills', () => {
    const sel = selectQuiz({ items, topics: ['tenses'], phase: 1, seed: 's', size: 4 }).map((q) => q.id);
    expect(sel[0]).toBe('t1');
    expect(new Set(sel.slice(1))).toEqual(new Set(['g-art', 'g-pas', 'g-old']));
  });

  it('prefers the current phase within the same skill family', () => {
    const its = [mcq('t', 'tenses', 2), mcq('p1', 'articles', 1), mcq('p2', 'passive', 2), mcq('r', 'reading-tfng', 2)];
    const sel = selectQuiz({ items: its, topics: ['tenses'], phase: 2, seed: 's', size: 3 }).map((q) => q.id);
    expect(sel).toEqual(['t', 'p2', 'p1']);
  });

  it('no on-topic items at all: still picks the same skill first', () => {
    const sel = selectQuiz({ items, topics: ['reading-ynng'], phase: 1, seed: 'x', size: 2 }).map((q) => q.id);
    expect(new Set(sel)).toEqual(new Set(['r1', 'r2']));
  });

  it('avoids items seen in the last 14 days when alternatives exist, but uses them when nothing else is left', () => {
    const recentIds = new Set(['t1', 'g-art']);
    const sel = selectQuiz({ items, topics: ['tenses'], phase: 1, seed: 's', size: 6, recentIds }).map((q) => q.id);
    expect(sel).not.toContain('t1');
    expect(sel).not.toContain('g-art');
    const all = selectQuiz({ items, topics: ['tenses'], phase: 1, seed: 's', size: items.length, recentIds }).map((q) => q.id);
    expect(all.slice(-2).sort()).toEqual(['g-art', 't1']);
  });

  it('unseen before seen inside a tier; deterministic', () => {
    const seenIds = new Set(['g-art']);
    const a = selectQuiz({ items, topics: ['tenses'], phase: 1, seed: 'k', size: 4, seenIds }).map((q) => q.id);
    expect(a[3]).toBe('g-art');
    expect(selectQuiz({ items, topics: ['tenses'], phase: 1, seed: 'k', size: 4, seenIds }).map((q) => q.id)).toEqual(a);
  });
});

describe('expandTopics delegates to the curriculum resolver', () => {
  it('same result as resolveQuizTopics, including mistake signals', () => {
    const c = { phase: 3 as const, weekday: 'thu' as const, weekOfPhase: 2, murphyUnitsDone: 145, topReadingMistakeTypes: ['ynng' as const], topGrammarErrorTopics: ['passive' as const] };
    const t = ['grammar-current', 'reading-question-type-current'] as const;
    expect(expandTopics([...t], c)).toEqual(resolveQuizTopics(t, c));
    expect(expandTopics([...t], c)).toContain('reading-ynng');
    expect(expandTopics([...t], c)).toContain('passive');
  });
});

describe('quizSignals from the Mistakes notebook', () => {
  const m = (skill: Mistake['skill'], tag: string, date = '2027-06-10'): Mistake => ({
    id: Math.random().toString(36), date, createdAt: 0, skill, what: 'w', correction: 'c', cause: 'grammar', tag, reviewedMonths: [], stillTricky: false, fixed: false,
  });
  it('maps reading labels/ids to question types (top 2) and grammar tags to quiz topics (last 28 days)', () => {
    const list = [m('reading', 'Yes / No / Not Given'), m('reading', 'Yes / No / Not Given'), m('reading', 'headings'), m('reading', 'Multiple choice'), m('grammar', 'Passive forms'), m('grammar', 'Passive forms'), m('writing', 'Tenses'), m('grammar', 'Articles', '2027-01-01')];
    const s = quizSignals(list, '2027-06-15');
    expect(s.topReadingMistakeTypes).toEqual(['ynng', 'headings']);
    expect(s.topGrammarErrorTopics[0]).toBe('passive');
    expect(s.topGrammarErrorTopics).toContain('tenses');
    expect(s.topGrammarErrorTopics).not.toContain('articles');
  });
});

describe('plural', () => {
  it('singular only for exactly 1', () => {
    expect(plural(1, 'word')).toBe('1 word');
    expect(plural(0, 'word')).toBe('0 words');
    expect(plural(2, 'day')).toBe('2 days');
    expect(plural(1200, 'card')).toBe('1,200 cards');
    expect(plural(3, 'person', 'people')).toBe('3 people');
  });
  it('relativeDays', () => {
    expect(relativeDays('2027-01-01', '2027-01-03')).toBe('in 2 days');
    expect(relativeDays('2027-01-03', '2027-01-01')).toBe('2 days ago');
  });
});

describe('Part 2 cue card', () => {
  it('"and explain" line is separated from the bullet points', () => {
    expect(splitCueBullets(['who it is', 'how you know them', 'and explain why you like them'])).toEqual({ points: ['who it is', 'how you know them'], explain: ['and explain why you like them'] });
    expect(splitCueBullets(['a', 'b'])).toEqual({ points: ['a', 'b'], explain: [] });
  });
});

describe('stale timer entries', () => {
  const now = Date.parse('2027-03-10T12:00:00+04:00');
  const run = (startedAt: number) => ({ status: 'running', durationMs: 60_000, startedAt, pausedAt: null, pausedAccumMs: 0 });
  it('idle, very old and old block timers are stale; current ones are kept', () => {
    expect(isStaleTimerEntry('timer:practice:reading:20', { ...run(now), status: 'idle' }, now, '2027-03-10', '2027-03-09')).toBe(true);
    expect(isStaleTimerEntry('timer:practice:reading:20', run(now - 4 * 86_400_000), now, '2027-03-10', '2027-03-09')).toBe(true);
    expect(isStaleTimerEntry('timer:block:2027-03-07:x', run(now - 1000), now, '2027-03-10', '2027-03-09')).toBe(true);
    expect(isStaleTimerEntry('timer:block:2027-03-09:x', run(now - 1000), now, '2027-03-10', '2027-03-09')).toBe(false);
    expect(isStaleTimerEntry('timer:write:w-1', run(now - 3600_000), now, '2027-03-10', '2027-03-09')).toBe(false);
    expect(isStaleTimerEntry('timer:x', null, now, '2027-03-10', '2027-03-09')).toBe(true);
  });
});
