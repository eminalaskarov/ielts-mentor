import type { Phase, PhaseId } from './types';
import { DEFAULT_CONFIG, PHASE_CALENDAR } from './config';

/**
 * The 4 phases from docs/ielts-plan.txt.
 * Default ranges shown here; use resolvePhaseRanges(config) for the real ranges
 * (phase 1 starts at config.startDate, phase 4 ends at config.examDate).
 */
export const PHASES: Phase[] = [
  {
    id: 1,
    name: 'Foundation',
    range: { start: DEFAULT_CONFIG.startDate, end: PHASE_CALENDAR.phase1End },
    dailyHours: { min: 2, max: 2 },
    levelFrom: 'B1',
    levelTo: 'B1+',
    targetBand: { min: 5.5, max: 5.5 },
    summary:
      'No IELTS tests yet. Build strong grammar, a bigger vocabulary and the habit of listening to English every day. Later phases depend on this foundation.',
    goals: [
      'Finish English Grammar in Use (Murphy) by the end of February (about 10 units a week).',
      'Learn new words every week — always in a phrase or sentence.',
      'Listen to English every day (BBC 6 Minute English, podcasts, series).',
      'Record yourself speaking twice a week.',
      'At the end of February: Listening + Reading test, 20–23 correct answers in each (~5.5; 23 is already ~6.0).',
    ],
    notes: [
      'Learn words in context. Do not write "increase" alone; write "a sharp increase in prices".',
      'Give extra attention to tenses, articles (a/an/the), the passive and conditionals. Most IELTS grammar mistakes are in these topics.',
      'Recording your speaking may feel uncomfortable at first, but it is the fastest way to improve.',
      'Change the language of your phone and social media to English.',
      'At the end of February, do the Listening and Reading parts of one Cambridge test. Target: 20–23 correct answers in each (20–22 is about 5.5, and 23 is already about 6.0).',
    ],
    resourceIds: ['murphy', 'oxford-word-skills', 'evu-upper', 'srs', 'bbc-6min', 'news-in-levels', 'podcasts', 'series-films'],
    newWordsPerWeek: 50,
  },
  {
    id: 2,
    name: 'Development',
    range: { start: PHASE_CALENDAR.phase2Start, end: PHASE_CALENDAR.phase2End },
    dailyHours: { min: 2, max: 2.5 },
    levelFrom: 'B1+',
    levelTo: 'B2',
    targetBand: { min: 6.0, max: 6.5 },
    summary:
      'Get to know the IELTS format: one IELTS part every day, plus grammar and academic vocabulary.',
    goals: [
      'Practise every IELTS part each week with the real format.',
      'Learn the Academic Word List (AWL).',
      'Write one Task 1 (weekly chart type) and one Task 2 essay every week.',
      'At the end of June: full test, 23–27 correct answers in Listening and Reading (~6.0–6.5).',
    ],
    notes: [
      'Academic Reading texts are scientific and long. Learn skimming (getting the main idea quickly) and scanning (finding specific information).',
      'The hardest question types are True / False / Not Given and Matching Headings. Give them separate time every week.',
      'In Task 1 you do not give your opinion. You describe and compare the data. Always write an overview.',
      'Learn the Task 2 structure by heart: introduction → 2 body paragraphs → conclusion.',
      'At the end of June, do a full test. Target: 23–27 correct answers in Listening and Reading (~6.0–6.5).',
    ],
    resourceIds: ['hewings', 'collocations-in-use', 'awl', 'srs', 'cambridge-10-13', 'extra-practice-tests', 'strategy-channels', 'ted', 'podcasts'],
    newWordsPerWeek: 80,
  },
  {
    id: 3,
    name: 'IELTS Intensive',
    range: { start: PHASE_CALENDAR.phase3Start, end: PHASE_CALENDAR.phase3End },
    dailyHours: { min: 2.5, max: 3 },
    levelFrom: 'B2',
    levelTo: 'B2+',
    targetBand: { min: 6.5, max: 7.0 },
    summary:
      'Real exam tasks with real timing. Analyse your mistakes after every test. Start getting outside feedback on Writing and Speaking.',
    goals: [
      'Do full tests under real time limits every week.',
      'Get at least 2 essays checked every week.',
      'Speak with a live partner at least 2 times a week.',
      'Register for the exam in August.',
      'At the end of September: 27–30 correct answers in Listening and Reading (~6.5–7.0).',
    ],
    notes: [
      'Writing feedback is a must. It is very hard to reach 7 by checking your own writing. Get at least 2 essays checked every week.',
      'Speak live at least 2 times a week. Recording helps, but it does not replace a real conversation.',
      'In the mistake notebook, write the cause of every mistake: "did not know the word", "misunderstood the question", "ran out of time". When you know the cause, it is easier to fix.',
      'In Reading, time is the main problem: 20 minutes per passage. Do not get stuck on one question — move on and come back later.',
      'Register for the exam in August.',
      'Target at the end of September: 27–30 correct answers in Listening and Reading (~6.5–7.0).',
    ],
    resourceIds: ['cambridge-14-19', 'extra-practice-tests', 'feedback-people', 'speaking-partner', 'collocations-in-use', 'awl', 'srs', 'strategy-channels'],
    newWordsPerWeek: 80,
  },
  {
    id: 4,
    name: 'Final',
    range: { start: PHASE_CALENDAR.phase4Start, end: DEFAULT_CONFIG.examDate },
    dailyHours: { min: 3, max: 3 },
    levelFrom: 'B2+',
    levelTo: 'C1 (7.0–7.5)',
    targetBand: { min: 7.0, max: 7.5 },
    summary:
      'No new material. Do full tests in real exam conditions and fix your last mistakes.',
    goals: [
      'Do full tests at the same time of day as the real exam.',
      'Spend extra time on your weakest part twice a week.',
      'Take an official mock test (British Council / IDP) in October if possible: 7.0+.',
      'Follow the final-week plan before the exam.',
    ],
    notes: [
      'Do tests at the same time as the exam, so your brain gets used to that time.',
      'Writing time: Task 1 – 20 minutes, Task 2 – 40 minutes. You can start with Task 2, because it gives more marks.',
      'In Speaking, do not give short answers. Explain each answer and give an example. If you make a mistake, keep going.',
      'If you take the computer exam, do your practice tests on a computer in the last weeks.',
      'If your result is a little lower than you hoped, do not worry: you may be able to retake only one part (One Skill Retake). Check if your test centre offers it.',
    ],
    resourceIds: ['cambridge-14-19', 'official-mock', 'feedback-people', 'speaking-partner', 'srs'],
    newWordsPerWeek: 0,
  },
];

export const PHASE_BY_ID: Record<PhaseId, Phase> = {
  1: PHASES[0],
  2: PHASES[1],
  3: PHASES[2],
  4: PHASES[3],
};

/** IELTS Academic format overview from the plan (shown on an "About the exam" screen). */
export const EXAM_FORMAT = [
  {
    skill: 'listening',
    time: 'about 30 minutes',
    content: '4 parts, 40 questions. You hear the recording only once.',
    neededFor: '30 correct for 7.0 / 32 correct for 7.5 (approximate)',
  },
  {
    skill: 'reading',
    time: '60 minutes',
    content: '3 long academic texts (from journals, books), 40 questions.',
    neededFor: '30 correct for 7.0 / 33 correct for 7.5 (approximate)',
  },
  {
    skill: 'writing',
    time: '60 minutes',
    content:
      'Task 1: describe a graph, table, diagram, process or map (150+ words, about 20 minutes). Task 2: an essay giving your opinion or discussing an issue (250+ words, about 40 minutes). Task 2 counts for two thirds of the Writing band.',
    neededFor: 'Marked on 4 criteria: Task Achievement / Task Response, Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy',
  },
  {
    skill: 'speaking',
    time: '11–14 minutes',
    content: 'Part 1: questions about you. Part 2: talk for 2 minutes about a topic on a card. Part 3: a deeper discussion of the topic.',
    neededFor: 'Fluency, rich vocabulary, correct grammar and clear pronunciation',
  },
] as const;

export const OVERALL_BAND_NOTE =
  'Your overall band is the average of the 4 parts, rounded to the nearest half band. Scoring uses official IELTS tables that change a little from test to test.';
