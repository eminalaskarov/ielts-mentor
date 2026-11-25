import type { Resource } from './types';

/**
 * Resources named in the plan. The app only REFERENCES these (title, units, completion);
 * it never reproduces their content.
 */
export const RESOURCES: Resource[] = [
  // Grammar
  {
    id: 'murphy',
    title: 'English Grammar in Use (Intermediate)',
    author: 'Raymond Murphy',
    kind: 'book',
    skills: ['grammar'],
    phases: [1],
    note: 'About 10 units a week finishes the book (145 units) by the end of February. Unit numbers can differ a little between editions.',
  },
  {
    id: 'hewings',
    title: 'Advanced Grammar in Use',
    author: 'Martin Hewings',
    kind: 'book',
    skills: ['grammar'],
    phases: [2],
    note: 'Use the contents page to find the units for each weekly topic.',
  },
  // Vocabulary
  {
    id: 'oxford-word-skills',
    title: 'Oxford Word Skills (Intermediate)',
    kind: 'book',
    skills: ['vocabulary'],
    phases: [1],
    note: 'Or English Vocabulary in Use (Upper-Intermediate). Choose one.',
  },
  {
    id: 'evu-upper',
    title: 'English Vocabulary in Use (Upper-Intermediate)',
    kind: 'book',
    skills: ['vocabulary'],
    phases: [1],
    note: 'Alternative to Oxford Word Skills.',
  },
  {
    id: 'collocations-in-use',
    title: 'Collocations in Use (Intermediate)',
    kind: 'book',
    skills: ['vocabulary'],
    phases: [2, 3, 4],
  },
  {
    id: 'awl',
    title: 'Academic Word List (570 word families)',
    author: 'Averil Coxhead',
    kind: 'website',
    skills: ['vocabulary'],
    phases: [2, 3, 4],
    note: 'Built into the app as word cards (headwords only, with original example sentences).',
  },
  {
    id: 'srs',
    title: 'Vocabulary review (built-in, Anki-style)',
    kind: 'tool',
    skills: ['vocabulary'],
    phases: [1, 2, 3, 4],
    note: 'The app has its own spaced-repetition review. You do not need the Anki app, but you can use it too.',
  },
  // Listening
  {
    id: 'bbc-6min',
    title: 'BBC Learning English — 6 Minute English',
    kind: 'podcast',
    skills: ['listening', 'vocabulary'],
    phases: [1, 2],
  },
  {
    id: 'news-in-levels',
    title: 'News in Levels (level 2–3)',
    kind: 'website',
    skills: ['reading', 'listening'],
    phases: [1],
  },
  {
    id: 'podcasts',
    title: 'English podcasts with transcripts',
    kind: 'podcast',
    skills: ['listening'],
    phases: [1, 2, 3, 4],
  },
  {
    id: 'ted',
    title: 'TED Talks',
    kind: 'website',
    skills: ['listening'],
    phases: [2, 3, 4],
  },
  {
    id: 'series-films',
    title: 'TV series or films in English with English subtitles',
    kind: 'website',
    skills: ['listening'],
    phases: [1, 2, 3, 4],
  },
  // IELTS tests (golden rule 7: keep 14–19 for phases 3 and 4)
  {
    id: 'cambridge-10-13',
    title: 'Cambridge IELTS 10–13 (Academic)',
    kind: 'test-book',
    skills: ['test', 'listening', 'reading', 'writing', 'speaking'],
    phases: [1, 2],
    testCount: 16,
    note: 'Practice tests for phase 2 and the February checkpoint.',
  },
  {
    id: 'cambridge-14-19',
    title: 'Cambridge IELTS 14–19 (Academic)',
    kind: 'test-book',
    skills: ['test', 'listening', 'reading', 'writing', 'speaking'],
    phases: [3, 4],
    testCount: 24,
    note: 'The most realistic tests. Save them for phases 3 and 4 (golden rule 7).',
  },
  {
    id: 'extra-practice-tests',
    title: 'Other practice tests (older Cambridge books, free official practice tests from IELTS partners)',
    kind: 'test-book',
    skills: ['test', 'listening', 'reading'],
    phases: [2, 3, 4],
    note: 'The plan uses more tests than books 10–19 contain. Use these for extra weekday practice so the newest books last.',
  },
  // Strategy
  {
    id: 'strategy-channels',
    title: 'IELTS Liz, IELTS Simon, E2 IELTS, ieltsadvantage',
    kind: 'youtube',
    skills: ['listening', 'reading', 'writing', 'speaking'],
    phases: [2, 3, 4],
  },
  // People
  {
    id: 'feedback-people',
    title: 'Writing feedback: IELTS teacher, course, or someone with exam experience',
    kind: 'people',
    skills: ['writing'],
    phases: [3, 4],
  },
  {
    id: 'speaking-partner',
    title: 'Speaking partner: teacher, iTalki / Cambly, or a high-level friend',
    kind: 'people',
    skills: ['speaking'],
    phases: [1, 2, 3, 4],
  },
  {
    id: 'official-mock',
    title: 'Official mock test (British Council / IDP)',
    kind: 'people',
    skills: ['test'],
    phases: [4],
  },
];

export const RESOURCE_BY_ID: Record<string, Resource> = Object.fromEntries(RESOURCES.map((r) => [r.id, r]));
