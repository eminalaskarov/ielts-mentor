import type { GrammarSection, GrammarWeekTopic } from './types';
import { PHASE_CALENDAR } from './config';

/**
 * Grammar topic sequence by phase.
 * Phase 1: Murphy, English Grammar in Use (Intermediate) — in book order, progress-based.
 * Phase 2: Monday = Advanced Grammar in Use (Hewings) topic of the week; Thursday = complex sentences & linkers.
 * Phase 3: Friday = recurring errors from own essays (from the mistake notebook), with a fallback rotation.
 * Phase 4: no new grammar.
 *
 * IMPORTANT: Murphy unit ranges are APPROXIMATE (5th edition, 145 units). Other editions differ slightly.
 * The app should let the user correct their current unit; it tracks units done, not topics by number.
 *
 * quizTopics here are always CONCRETE topics (never the meta topics 'grammar-current' etc.), because
 * resolveQuizTopics() expands 'grammar-current' INTO these lists. Sections without a dedicated quiz topic
 * use the closest concrete ones (e.g. modals → common-errors, verb patterns / prepositions →
 * vocab-collocations, adjectives and adverbs → vocab-word-forms + task1-language).
 */

export const MURPHY_PLAN = {
  totalUnits: 145,
  /** Plan: "about 10 units a week, the book is finished in February". */
  targetUnitsPerWeek: 10,
  finishBy: PHASE_CALENDAR.phase1End,
  /** Days with new units in the phase 1 schedule. Friday = weekly review, no new units. */
  newUnitDays: ['mon', 'tue', 'wed', 'thu'] as const,
  /** Plan table says 2 new units per day. */
  defaultUnitsPerSession: 2,
  /** Suggested when the learner is behind the pace line (see rules.ts "murphy-pace"). */
  catchUpUnitsPerSession: 3,
} as const;

export const MURPHY_SECTIONS: GrammarSection[] = [
  { id: 'm-present-past', title: 'Present and past tenses', units: { from: 1, to: 6 }, quizTopics: ['tenses'], priority: true },
  { id: 'm-perfect', title: 'Present perfect and past', units: { from: 7, to: 18 }, quizTopics: ['tenses'], priority: true },
  { id: 'm-future', title: 'Future', units: { from: 19, to: 25 }, quizTopics: ['tenses'], priority: true },
  { id: 'm-modals', title: 'Modal verbs', units: { from: 26, to: 37 }, quizTopics: ['common-errors'], priority: false },
  { id: 'm-if-wish', title: 'If and wish (conditionals)', units: { from: 38, to: 41 }, quizTopics: ['conditionals'], priority: true },
  { id: 'm-passive', title: 'The passive', units: { from: 42, to: 46 }, quizTopics: ['passive'], priority: true },
  { id: 'm-reported', title: 'Reported speech', units: { from: 47, to: 48 }, quizTopics: ['tenses'], priority: false },
  { id: 'm-questions', title: 'Questions and auxiliary verbs', units: { from: 49, to: 52 }, quizTopics: ['tenses', 'common-errors'], priority: false },
  { id: 'm-ing-to', title: '-ing and to (verb patterns)', units: { from: 53, to: 68 }, quizTopics: ['vocab-collocations', 'common-errors'], priority: false },
  { id: 'm-articles', title: 'Articles and nouns', units: { from: 69, to: 81 }, quizTopics: ['articles'], priority: true },
  { id: 'm-pronouns', title: 'Pronouns and determiners', units: { from: 82, to: 91 }, quizTopics: ['articles', 'common-errors'], priority: false },
  { id: 'm-relative', title: 'Relative clauses', units: { from: 92, to: 97 }, quizTopics: ['complex-sentences'], priority: false },
  { id: 'm-adj-adv', title: 'Adjectives and adverbs (including comparison)', units: { from: 98, to: 112 }, quizTopics: ['vocab-word-forms', 'task1-language'], priority: false },
  { id: 'm-conjunctions', title: 'Conjunctions and prepositions', units: { from: 113, to: 120 }, quizTopics: ['linkers'], priority: false },
  { id: 'm-prepositions', title: 'Prepositions', units: { from: 121, to: 136 }, quizTopics: ['vocab-collocations', 'common-errors'], priority: false },
  { id: 'm-phrasal', title: 'Phrasal verbs', units: { from: 137, to: 145 }, quizTopics: ['vocab-collocations'], priority: false },
];

/** Phase 2 Monday: Advanced Grammar in Use topic of the week. Find matching units via the book's contents page. */
export const PHASE2_HEWINGS_TOPICS: GrammarWeekTopic[] = [
  { week: 1, topic: 'Present and past tenses (review)', detail: 'Present perfect vs past simple — important for describing data over time.', quizTopics: ['tenses'] },
  { week: 2, topic: 'Past perfect and perfect continuous', detail: 'Showing which action happened first; "had been rising".', quizTopics: ['tenses'] },
  { week: 3, topic: 'Future forms', detail: 'will, going to, future continuous and future perfect for predictions ("by 2050 … will have …").', quizTopics: ['tenses'] },
  { week: 4, topic: 'Modals of possibility', detail: 'may, might, could, must, can’t — for careful (hedged) claims.', quizTopics: ['task2-structure', 'common-errors'] },
  { week: 5, topic: 'Modals of obligation and advice', detail: 'should, ought to, have to, need to — for Task 2 solutions.', quizTopics: ['task2-structure', 'common-errors'] },
  { week: 6, topic: 'The passive in all tenses', detail: 'Needed for process diagrams and formal writing.', quizTopics: ['passive'] },
  { week: 7, topic: 'Passive with reporting verbs', detail: '"It is believed that …", "X is thought to …".', quizTopics: ['passive'] },
  { week: 8, topic: 'Articles', detail: 'a/an/the/no article with general and specific nouns, uncountable nouns.', quizTopics: ['articles'] },
  { week: 9, topic: 'Quantifiers and determiners', detail: 'few / a few, little / a little, much / many, each / every, most / most of.', quizTopics: ['articles', 'common-errors'] },
  { week: 10, topic: 'Relative clauses', detail: 'Defining and non-defining; which, who, whose, where; commas.', quizTopics: ['complex-sentences'] },
  { week: 11, topic: 'Participle clauses and reduced relatives', detail: '"The number of people living in cities …".', quizTopics: ['complex-sentences'] },
  { week: 12, topic: 'Noun clauses', detail: 'that-clauses and wh-clauses as subject or object ("What matters is …").', quizTopics: ['complex-sentences'] },
  { week: 13, topic: 'Conditionals', detail: 'Zero to third, and mixed conditionals.', quizTopics: ['conditionals'] },
  { week: 14, topic: 'Alternatives to if', detail: 'unless, provided that, as long as, otherwise, without.', quizTopics: ['conditionals'] },
  { week: 15, topic: 'Comparatives and superlatives', detail: 'Comparing data: "twice as many as", "far higher than", "the lowest".', quizTopics: ['task1-language'] },
  { week: 16, topic: 'Adverbs of degree', detail: 'slightly, considerably, dramatically, relatively.', quizTopics: ['task1-language'] },
  { week: 17, topic: 'Organising information', detail: 'it / there sentences, cleft sentences, simple inversion ("Not only … but also").', quizTopics: ['complex-sentences'] },
  { week: 18, topic: 'Review of key topics', detail: 'Tenses, articles, passive and conditionals.', quizTopics: ['tenses', 'articles', 'passive', 'conditionals'] },
];

/** Phase 2 Thursday: complex sentences and linking words. */
export const PHASE2_LINKER_TOPICS: GrammarWeekTopic[] = [
  { week: 1, topic: 'Simple, compound and complex sentences', detail: 'What makes a sentence complex; mixing sentence types.', quizTopics: ['complex-sentences'] },
  { week: 2, topic: 'Joining clauses correctly', detail: 'and / but / so; avoiding run-on sentences and fragments.', quizTopics: ['complex-sentences'] },
  { week: 3, topic: 'Adding ideas', detail: 'moreover, furthermore, in addition, as well as.', quizTopics: ['linkers'] },
  { week: 4, topic: 'Contrast', detail: 'however, although, whereas, while, despite / in spite of.', quizTopics: ['linkers'] },
  { week: 5, topic: 'Cause', detail: 'because, since, as, because of, due to, owing to.', quizTopics: ['linkers'] },
  { week: 6, topic: 'Result', detail: 'therefore, as a result, consequently, which means that.', quizTopics: ['linkers'] },
  { week: 7, topic: 'Examples', detail: 'for example, for instance, such as.', quizTopics: ['linkers'] },
  { week: 8, topic: 'Purpose', detail: 'in order to, so that, so as to.', quizTopics: ['linkers'] },
  { week: 9, topic: 'Concession', detail: 'even though, admittedly, nevertheless.', quizTopics: ['linkers'] },
  { week: 10, topic: 'Condition', detail: 'unless, as long as, provided that.', quizTopics: ['linkers', 'conditionals'] },
  { week: 11, topic: 'Sequence (for processes)', detail: 'first, then, after that, once, before being …', quizTopics: ['linkers', 'task1-language'] },
  { week: 12, topic: 'Comparing data', detail: 'compared with, in contrast, similarly, likewise.', quizTopics: ['linkers', 'task1-language'] },
  { week: 13, topic: 'Combining with relative clauses', detail: 'Two short sentences → one sentence with which / who.', quizTopics: ['complex-sentences'] },
  { week: 14, topic: 'Combining with participle clauses', detail: '"Having finished …", "…, resulting in …".', quizTopics: ['complex-sentences'] },
  { week: 15, topic: 'Referencing', detail: 'this, these, such, the former / the latter — linking without repeating words.', quizTopics: ['linkers'] },
  { week: 16, topic: 'Opinion and hedging', detail: 'it could be argued that, tend to, it seems that.', quizTopics: ['task2-structure'] },
  { week: 17, topic: 'Introductions and conclusions', detail: 'Paraphrasing the question, thesis statement, summarising.', quizTopics: ['task2-structure'] },
  { week: 18, topic: 'Natural cohesion', detail: 'Do not start every sentence with a linker; use a range of linking devices.', quizTopics: ['linkers'] },
];

/**
 * Phase 3 Friday: "recurring mistakes in your own essays".
 * Primary source = grammar mistakes in the mistake notebook (most frequent tag in the last 4 weeks).
 * Fallback rotation (if fewer than 3 logged grammar mistakes): common errors at the B2 → 7.0 level.
 */
export const PHASE3_ERROR_TOPICS_FALLBACK: GrammarWeekTopic[] = [
  { week: 1, topic: 'Articles', detail: 'Missing "the" with specific nouns; "the" with general plural nouns.', quizTopics: ['articles', 'common-errors'] },
  { week: 2, topic: 'Subject–verb agreement', detail: '"The number of … is", "People are", long subjects.', quizTopics: ['common-errors'] },
  { week: 3, topic: 'Tense consistency', detail: 'Keep past tenses for past data; present for general truths.', quizTopics: ['tenses', 'common-errors'] },
  { week: 4, topic: 'Countable / uncountable and plurals', detail: 'information, research, advice, equipment; "a number of" vs "an amount of".', quizTopics: ['common-errors'] },
  { week: 5, topic: 'Sentence boundaries', detail: 'Run-on sentences, comma splices and fragments.', quizTopics: ['complex-sentences', 'common-errors'] },
  { week: 6, topic: 'Word form', detail: 'economy / economic / economical; increase (n.) vs increase (v.).', quizTopics: ['vocab-word-forms', 'common-errors'] },
  { week: 7, topic: 'Prepositions', detail: 'increase by / to / in; depend on; responsible for.', quizTopics: ['common-errors'] },
  { week: 8, topic: 'Passive forms', detail: 'Correct be + past participle; when not to use the passive.', quizTopics: ['passive', 'common-errors'] },
  { week: 9, topic: 'Punctuation with linkers', detail: 'Put a comma after "However," and do not join two sentences with only a comma and "however".', quizTopics: ['linkers', 'common-errors'] },
  { week: 10, topic: 'Conditionals in arguments', detail: '"If governments invested …, they would …".', quizTopics: ['conditionals', 'common-errors'] },
];
