// QA: year-long simulation of the daily quiz with the real selector (prints stats; asserts sane lower bounds).
import { describe, expect, it } from 'vitest';
import { QUIZ_ITEMS } from '../content';
import { DEFAULT_CONFIG } from '../data/config';
import { addDays } from './dates';
import { resolveDay } from './plan';
import { expandTopics, QUIZ_TOPIC_GROUP, selectQuiz } from './quiz';

describe('year-long daily quiz simulation', () => {
  it('repetition and topic coverage', () => {
    const seen = new Set<string>();
    const history: { date: string; ids: string[] }[] = [];
    const stat: Record<number, { days: number; offDays: number; offItems: number; items: number; offGroupItems: number; repDays: number; repItems: number }> = {};
    let date = '2026-11-23';
    let days = 0, repDays = 0, repItems = 0, total = 0, anyOffDays = 0;
    const emptyDays: string[] = [];
    const examDate = DEFAULT_CONFIG.examDate;
    for (; date <= examDate; date = addDays(date, 1)) {
      const units = Math.min(145, Math.floor((days * 10) / 7));
      const day = resolveDay(date, DEFAULT_CONFIG, { murphyUnitsDone: units, weakSkill: null, weakFocus: false });
      const topics = expandTopics(day.quizTopics, { phase: day.phase, weekday: day.weekday, weekOfPhase: day.weekOfPhase, murphyUnitsDone: units });
      const from = addDays(date, -14);
      const recentIds = new Set(history.filter((h) => h.date >= from).flatMap((h) => h.ids));
      const items = selectQuiz({ items: QUIZ_ITEMS, topics, phase: day.phase ?? 1, seed: `${date}|daily|0`, size: 5, seenIds: seen, recentIds });
      if (items.length < 5) emptyDays.push(date);
      const ph = day.phase ?? 0;
      const s = (stat[ph] ??= { days: 0, offDays: 0, offItems: 0, items: 0, offGroupItems: 0, repDays: 0, repItems: 0 });
      const ts = new Set(topics);
      const groups = new Set(topics.map((t) => QUIZ_TOPIC_GROUP[t]));
      let off = 0, rep = 0;
      for (const q of items) {
        if (!ts.has(q.topic)) off++;
        if (!groups.has(QUIZ_TOPIC_GROUP[q.topic])) s.offGroupItems++;
        if (recentIds.has(q.id)) rep++;
      }
      s.days++; s.items += items.length; s.offItems += off; s.repItems += rep;
      if (off) { s.offDays++; anyOffDays++; }
      if (rep) { s.repDays++; repDays++; }
      repItems += rep; total += items.length;
      items.forEach((q) => seen.add(q.id));
      history.push({ date, ids: items.map((q) => q.id) });
      days++;
    }
    const ever = new Set(history.flatMap((h) => h.ids));
    expect(ever.size).toBeGreaterThan(800);
    expect(emptyDays).toEqual([]);
    expect(repItems).toBe(0);
    expect(anyOffDays).toBe(0);
  });
});
