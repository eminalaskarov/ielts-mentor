import type { Block, DayPlan, PhaseId, QuizTopic, Weekday, WeeklySchedule } from './types';

/**
 * Weekly schedules for the 4 phases, one per weekday, taken from docs/ielts-plan.txt.
 * Block ids: "p{phase}-{weekday}-{order}" — stable, used for completion records and flex rules.
 * Where the plan does not give minutes, `minutesAssumed: true` is set.
 */

type BlockInput = Omit<Block, 'id' | 'order'>;

function day(phase: PhaseId, weekday: Weekday, quizTopics: QuizTopic[], blocks: BlockInput[], isRestDay = false): DayPlan {
  return {
    weekday,
    isRestDay,
    quizTopics,
    blocks: blocks.map((b, i) => ({ ...b, id: `p${phase}-${weekday}-${i + 1}`, order: i + 1 })),
  };
}

/** Sunday in every phase: rest + 15 min vocabulary review (golden rule 1). */
function sunday(phase: PhaseId, restTask: string): DayPlan {
  return day(
    phase,
    'sun',
    ['mixed-review'],
    [
      { skill: 'rest', minutes: 0, title: 'Rest', task: restTask, activity: 'rest' },
      {
        skill: 'vocabulary',
        minutes: 15,
        title: 'Vocabulary review',
        task: 'Review your due word cards. Only 15 minutes — no new study today.',
        activity: 'vocab-review',
        resources: [{ resourceId: 'srs' }],
      },
    ],
    true,
  );
}

// ---------------------------------------------------------------------------
// Phase 1 · Foundation (no IELTS tests yet)
// ---------------------------------------------------------------------------

const MURPHY_HINT =
  'Do the units in book order. The plan says 2 units a day, but to finish the book by the end of February you need about 10 units a week, so do 3 units when the app says you are behind.';

export const PHASE_1_SCHEDULE: WeeklySchedule = {
  phase: 1,
  days: {
    mon: day(1, 'mon', ['grammar-current', 'vocab-collocations'], [
      {
        skill: 'grammar', minutes: 45, title: 'Grammar',
        task: 'Study 2 new Murphy units and do the exercises.',
        activity: 'murphy-units', resources: [{ resourceId: 'murphy', detail: 'next 2 units' }], hint: MURPHY_HINT,
      },
      {
        skill: 'vocabulary', minutes: 45, title: 'Vocabulary',
        task: 'Learn 20 new words and add them to your word cards. Write each word in a phrase or sentence, e.g. "a sharp increase in prices".',
        activity: 'vocab-new', resources: [{ resourceId: 'oxford-word-skills' }, { resourceId: 'srs' }],
      },
      {
        skill: 'listening', minutes: 30, minutesMax: 40, title: 'Listening',
        task: 'Listen to 2 episodes of BBC 6 Minute English.',
        activity: 'listening-external', resources: [{ resourceId: 'bbc-6min', detail: '2 episodes' }],
      },
    ]),
    tue: day(1, 'tue', ['grammar-current', 'articles'], [
      {
        skill: 'grammar', minutes: 45, title: 'Grammar',
        task: 'Study 2 new Murphy units and do the exercises.',
        activity: 'murphy-units', resources: [{ resourceId: 'murphy', detail: 'next 2 units' }], hint: MURPHY_HINT,
      },
      {
        skill: 'reading', minutes: 45, title: 'Reading',
        task: 'Read 1 short article. Write down the words you do not know.',
        activity: 'reading-article', resources: [{ resourceId: 'news-in-levels', detail: 'level 2–3' }],
      },
      {
        skill: 'speaking', minutes: 30, minutesMax: 40, title: 'Speaking',
        task: 'Speak about one topic for 3–5 minutes and record it on your phone. Listen, note your mistakes, and record again.',
        activity: 'speaking-record',
      },
    ]),
    wed: day(1, 'wed', ['grammar-current', 'vocab-collocations'], [
      {
        skill: 'grammar', minutes: 45, title: 'Grammar',
        task: 'Study 2 new Murphy units and do the exercises.',
        activity: 'murphy-units', resources: [{ resourceId: 'murphy', detail: 'next 2 units' }], hint: MURPHY_HINT,
      },
      {
        skill: 'vocabulary', minutes: 45, title: 'Vocabulary',
        task: 'Learn 20 new words (in context) and do your word card review.',
        activity: 'vocab-new', resources: [{ resourceId: 'oxford-word-skills' }, { resourceId: 'srs' }],
      },
      {
        skill: 'listening', minutes: 30, minutesMax: 40, title: 'Listening',
        task: 'Listen to an English podcast with the English transcript.',
        activity: 'listening-external', resources: [{ resourceId: 'podcasts' }],
      },
    ]),
    thu: day(1, 'thu', ['grammar-current', 'tenses'], [
      {
        skill: 'grammar', minutes: 45, title: 'Grammar',
        task: 'Study 2 new Murphy units and do the exercises.',
        activity: 'murphy-units', resources: [{ resourceId: 'murphy', detail: 'next 2 units' }], hint: MURPHY_HINT,
      },
      {
        skill: 'writing', minutes: 45, title: 'Writing',
        task: 'Write a 150-word paragraph. Use the grammar you learned this week.',
        activity: 'writing-paragraph',
      },
      {
        skill: 'vocabulary', minutes: 30, minutesMax: 40, title: 'Word cards',
        task: 'Review your word cards and go over this week’s new words.',
        activity: 'vocab-review', resources: [{ resourceId: 'srs' }],
      },
    ]),
    fri: day(1, 'fri', ['grammar-week-review', 'mixed-review'], [
      {
        skill: 'grammar', minutes: 45, title: 'Grammar review',
        task: 'Review this week’s grammar units and your mistakes.',
        activity: 'grammar-weekly-review', resources: [{ resourceId: 'murphy' }],
      },
      {
        skill: 'reading', minutes: 45, title: 'Reading',
        task: 'Read 1 article. Write down the words you do not know.',
        activity: 'reading-article', resources: [{ resourceId: 'news-in-levels' }],
      },
      {
        skill: 'speaking', minutes: 30, minutesMax: 40, title: 'Speaking',
        task: 'Talk about everyday topics (family, work, hobbies). Record yourself.',
        activity: 'speaking-record',
      },
    ]),
    sat: day(1, 'sat', ['grammar-week-review', 'mixed-review'], [
      {
        skill: 'test', minutes: 30, minutesAssumed: true, title: 'Mini test',
        task: 'Do the in-app mini test on this week’s grammar and words.',
        activity: 'mini-test',
      },
      {
        skill: 'listening', minutes: 60, title: 'Listening',
        task: 'Watch an English series or film with English subtitles (about 1 hour).',
        activity: 'listening-external', resources: [{ resourceId: 'series-films' }], flex: true,
      },
    ]),
    sun: sunday(1, 'Rest day. Relax.'),
  },
};

// ---------------------------------------------------------------------------
// Phase 2 · Development (IELTS format)
// ---------------------------------------------------------------------------

export const PHASE_2_SCHEDULE: WeeklySchedule = {
  phase: 2,
  days: {
    mon: day(2, 'mon', ['listening-spelling-numbers', 'grammar-current', 'awl'], [
      {
        skill: 'listening', minutes: 45, title: 'Listening',
        task: 'Do IELTS Listening Sections 1–2. Then check every mistake with the transcript.',
        activity: 'listening-ielts-sections', resources: [{ resourceId: 'cambridge-10-13', detail: 'Sections 1–2' }],
      },
      {
        skill: 'grammar', minutes: 45, title: 'Grammar',
        task: 'Advanced Grammar in Use: this week’s topic.',
        activity: 'hewings-units', resources: [{ resourceId: 'hewings' }],
      },
      {
        skill: 'vocabulary', minutes: 40, title: 'Vocabulary',
        task: 'Learn words from the Academic Word List (AWL) and review your word cards.',
        activity: 'awl', resources: [{ resourceId: 'awl' }, { resourceId: 'srs' }],
      },
    ]),
    tue: day(2, 'tue', ['reading-tfng', 'speaking-language'], [
      {
        skill: 'reading', minutes: 45, title: 'Reading',
        task: 'Read 1 academic passage in 20 minutes (timer). Then analyse your answers.',
        activity: 'reading-passage', resources: [{ resourceId: 'cambridge-10-13', detail: '1 passage' }],
      },
      {
        skill: 'vocabulary', minutes: 45, title: 'Vocabulary',
        task: 'Add the new words from the passage to your word cards (with the sentence).',
        activity: 'vocab-from-text', resources: [{ resourceId: 'srs' }],
      },
      {
        skill: 'speaking', minutes: 40, title: 'Speaking Part 1',
        task: 'Answer 10 Part 1 questions and record your answers.',
        activity: 'speaking-part1',
      },
    ]),
    wed: day(2, 'wed', ['task1-language', 'task1-overview'], [
      {
        skill: 'writing', minutes: 45, title: 'Writing Task 1',
        task: 'Write a Task 1 report on this week’s chart type (see the rotation). 20 minutes, 150+ words. Always write an overview.',
        activity: 'writing-task1',
      },
      {
        skill: 'listening', minutes: 45, title: 'Listening',
        task: 'Do IELTS Listening Sections 3–4 (academic topics). Check mistakes with the transcript.',
        activity: 'listening-ielts-sections', resources: [{ resourceId: 'cambridge-10-13', detail: 'Sections 3–4' }],
      },
      {
        skill: 'vocabulary', minutes: 40, title: 'Word cards',
        task: 'Review your word cards.',
        activity: 'vocab-review', resources: [{ resourceId: 'srs' }], flex: true,
      },
    ]),
    thu: day(2, 'thu', ['reading-headings', 'reading-question-type-current', 'complex-sentences', 'linkers'], [
      {
        skill: 'reading', minutes: 45, title: 'Reading',
        task: 'Read 1 passage and practise the strategy for this week’s question type.',
        activity: 'reading-passage', resources: [{ resourceId: 'cambridge-10-13' }, { resourceId: 'strategy-channels' }],
        hint: 'Every week also spend some minutes on True/False/Not Given or Matching Headings — the hardest types.',
      },
      {
        skill: 'grammar', minutes: 45, title: 'Grammar',
        task: 'Complex sentences and linking words (this week’s topic).',
        activity: 'grammar-topic', resources: [{ resourceId: 'hewings' }],
      },
      {
        skill: 'speaking', minutes: 40, title: 'Speaking Part 2',
        task: 'Take a Part 2 card: 1 minute to prepare, then speak for 2 minutes. Record it.',
        activity: 'speaking-part2',
      },
    ]),
    fri: day(2, 'fri', ['task2-structure', 'topic-vocab'], [
      {
        skill: 'writing', minutes: 45, title: 'Writing Task 2',
        task: 'Write 1 essay, 250+ words, in 40 minutes (timer). Structure: introduction → 2 body paragraphs → conclusion.',
        activity: 'writing-task2',
      },
      {
        skill: 'writing', minutes: 45, title: 'Model essays',
        task: 'Compare your essay with a band 7+ model essay on the same topic. Note what the model does better.',
        activity: 'writing-model-compare',
      },
      {
        skill: 'vocabulary', minutes: 40, title: 'Vocabulary',
        task: 'Learn words for the essay topic and add them to your word cards.',
        activity: 'vocab-topic', resources: [{ resourceId: 'collocations-in-use' }, { resourceId: 'srs' }],
      },
    ]),
    sat: day(2, 'sat', ['exam-strategy', 'mixed-review'], [
      {
        skill: 'test', minutes: 90, minutesMax: 120, title: 'Test',
        task: 'Do a full Listening + Reading test (90 minutes). Then analyse your mistakes and log your scores.',
        activity: 'lr-test', resources: [{ resourceId: 'cambridge-10-13' }, { resourceId: 'extra-practice-tests' }],
        hint: 'Books 10–13 have only 16 tests. Mix in other practice tests so you have enough until June.',
      },
      {
        skill: 'listening', minutes: 30, minutesAssumed: true, title: 'Listening',
        task: 'Watch a TED Talk or listen to a podcast.',
        activity: 'listening-external', resources: [{ resourceId: 'ted' }, { resourceId: 'podcasts' }], flex: true,
      },
    ]),
    sun: sunday(2, 'Rest day. Relax.'),
  },
};

// ---------------------------------------------------------------------------
// Phase 3 · IELTS intensive (real tasks, real time, external feedback)
// ---------------------------------------------------------------------------

export const PHASE_3_SCHEDULE: WeeklySchedule = {
  phase: 3,
  days: {
    mon: day(3, 'mon', ['listening-spelling-numbers', 'task2-structure'], [
      {
        skill: 'listening', minutes: 60, title: 'Listening',
        task: 'Do a full Listening test (30 minutes) and analyse your mistakes.',
        activity: 'listening-full-test', resources: [{ resourceId: 'cambridge-14-19' }, { resourceId: 'extra-practice-tests' }],
      },
      {
        skill: 'writing', minutes: 60, title: 'Writing Task 2',
        task: 'Write 1 essay in 40 minutes (timer). Send it for feedback if you can.',
        activity: 'writing-task2',
      },
      {
        skill: 'vocabulary', minutes: 40, title: 'Word cards',
        task: 'Review your word cards and add new words.',
        activity: 'vocab-new', resources: [{ resourceId: 'srs' }],
      },
    ]),
    tue: day(3, 'tue', ['reading-question-type-current', 'speaking-language'], [
      {
        skill: 'reading', minutes: 60, title: 'Reading',
        task: 'Do a full Reading test (60 minutes). Spend 20 minutes on each passage.',
        activity: 'reading-full-test', resources: [{ resourceId: 'cambridge-14-19' }, { resourceId: 'extra-practice-tests' }],
      },
      {
        skill: 'test', minutes: 60, title: 'Analysis',
        task: 'For every mistake, write the cause in your mistake notebook ("did not know the word", "misread the question", "ran out of time").',
        activity: 'mistake-analysis',
      },
      {
        skill: 'speaking', minutes: 40, title: 'Speaking',
        task: 'Practise Parts 1, 2 and 3 with a live partner.',
        activity: 'speaking-full-live', resources: [{ resourceId: 'speaking-partner' }],
      },
    ]),
    wed: day(3, 'wed', ['task1-language', 'common-errors'], [
      {
        skill: 'writing', minutes: 60, title: 'Writing',
        task: 'Write Task 1 + Task 2 together in 60 minutes (20 + 40).',
        activity: 'writing-task1-and-task2',
      },
      {
        skill: 'writing', minutes: 60, title: 'Rewrite',
        task: 'Rewrite an essay that got feedback, using the corrections.',
        activity: 'writing-rewrite', resources: [{ resourceId: 'feedback-people' }],
        hint: 'No feedback yet? Rewrite your weakest recent essay using the self-check list.',
      },
      {
        skill: 'vocabulary', minutes: 40, title: 'Word cards',
        task: 'Review your word cards.',
        activity: 'vocab-review', resources: [{ resourceId: 'srs' }], flex: true,
      },
    ]),
    thu: day(3, 'thu', ['reading-question-type-current', 'speaking-language'], [
      {
        skill: 'listening', minutes: 60, title: 'Listening',
        task: 'Do a full Listening test and analyse it.',
        activity: 'listening-full-test', resources: [{ resourceId: 'extra-practice-tests' }, { resourceId: 'cambridge-14-19' }],
      },
      {
        skill: 'reading', minutes: 60, title: 'Reading',
        task: 'Do 2 passages that practise your weakest question types.',
        activity: 'reading-passage', resources: [{ resourceId: 'extra-practice-tests' }],
        hint: 'Your weakest types come from the mistake notebook (reading mistakes by question type).',
      },
      {
        skill: 'speaking', minutes: 40, title: 'Speaking',
        task: 'Practise Part 2 cards and the Part 3 discussion that follows.',
        activity: 'speaking-part2-part3',
      },
    ]),
    fri: day(3, 'fri', ['task1-overview', 'common-errors', 'topic-vocab'], [
      {
        skill: 'writing', minutes: 60, title: 'Writing Task 1',
        task: 'Write a Task 1 report on your weakest chart type.',
        activity: 'writing-task1',
        hint: 'Weakest type = the chart type with your lowest self-assessed score. If you have no scores yet, use this week’s rotation type.',
      },
      {
        skill: 'grammar', minutes: 60, title: 'Grammar',
        task: 'Work on the grammar mistakes that repeat in your own essays.',
        activity: 'grammar-own-errors',
      },
      {
        skill: 'vocabulary', minutes: 40, title: 'Vocabulary',
        task: 'Topic words: this week’s topic (education, environment, technology, health).',
        activity: 'vocab-topic', resources: [{ resourceId: 'collocations-in-use' }, { resourceId: 'srs' }], flex: true,
      },
    ]),
    sat: day(3, 'sat', ['exam-strategy'], [
      {
        skill: 'test', minutes: 160, title: 'Mock exam',
        task: 'Listening + Reading + Writing in a row, with no breaks (2 hours 40 minutes).',
        activity: 'lrw-test', resources: [{ resourceId: 'cambridge-14-19' }],
      },
      {
        skill: 'test', minutes: 40, minutesAssumed: true, title: 'Analysis',
        task: 'Log your results and find your weakest part.',
        activity: 'mistake-analysis',
      },
    ]),
    sun: sunday(3, 'Full rest day, so you do not get tired. Only your short vocabulary review.'),
  },
};

// ---------------------------------------------------------------------------
// Phase 4 · Final (no new material; real exam conditions)
// ---------------------------------------------------------------------------

const AT_EXAM_TIME = 'Start at your exam time (for example 9:00), so your brain gets used to it.';

export const PHASE_4_SCHEDULE: WeeklySchedule = {
  phase: 4,
  days: {
    mon: day(4, 'mon', ['exam-strategy', 'common-errors'], [
      {
        skill: 'test', minutes: 160, title: 'Full test', timeOfDay: 'morning',
        task: 'Listening + Reading + Writing (2 hours 40 minutes).',
        activity: 'lrw-test', resources: [{ resourceId: 'cambridge-14-19' }], hint: AT_EXAM_TIME,
      },
      {
        skill: 'test', minutes: 45, minutesAssumed: true, title: 'Analysis', timeOfDay: 'afternoon',
        task: 'Write your mistakes in the mistake notebook.',
        activity: 'mistake-analysis',
      },
    ]),
    tue: day(4, 'tue', ['common-errors', 'speaking-language'], [
      {
        skill: 'test', minutes: 90, title: 'Weak skill', timeOfDay: 'morning',
        task: 'Spend 1.5 hours on the part with your lowest band: {weakSkill}.',
        activity: 'weak-skill',
      },
      {
        skill: 'speaking', minutes: 45, minutesAssumed: true, title: 'Speaking mock', timeOfDay: 'afternoon',
        task: 'Do a full Speaking mock (14 minutes) and get feedback.',
        activity: 'speaking-mock', resources: [{ resourceId: 'speaking-partner' }],
      },
    ]),
    wed: day(4, 'wed', ['exam-strategy', 'task2-structure'], [
      {
        skill: 'test', minutes: 160, title: 'Full test', timeOfDay: 'morning',
        task: 'Listening + Reading + Writing.',
        activity: 'lrw-test', resources: [{ resourceId: 'cambridge-14-19' }], hint: AT_EXAM_TIME,
      },
      {
        skill: 'writing', minutes: 45, minutesAssumed: true, title: 'Feedback', timeOfDay: 'afternoon',
        task: 'Analyse the test and send your Writing for checking.',
        activity: 'feedback', resources: [{ resourceId: 'feedback-people' }],
      },
    ]),
    thu: day(4, 'thu', ['common-errors', 'speaking-language'], [
      {
        skill: 'test', minutes: 90, title: 'Weak skill', timeOfDay: 'morning',
        task: 'Spend 1.5 hours on your weakest part: {weakSkill}.',
        activity: 'weak-skill',
      },
      {
        skill: 'speaking', minutes: 45, minutesAssumed: true, title: 'Speaking', timeOfDay: 'afternoon',
        task: 'Practise the last topic cards.',
        activity: 'speaking-part2-part3',
      },
    ]),
    fri: day(4, 'fri', ['exam-strategy', 'mixed-review'], [
      {
        skill: 'test', minutes: 160, title: 'Full test', timeOfDay: 'morning',
        task: 'Listening + Reading + Writing.',
        activity: 'lrw-test', resources: [{ resourceId: 'cambridge-14-19' }], hint: AT_EXAM_TIME,
      },
      {
        skill: 'vocabulary', minutes: 45, minutesAssumed: true, title: 'Review', timeOfDay: 'afternoon',
        task: 'Review your mistake notebook and your word cards.',
        activity: 'vocab-review', resources: [{ resourceId: 'srs' }],
      },
    ]),
    sat: day(4, 'sat', ['exam-strategy'], [
      {
        skill: 'test', minutes: 175, title: 'Full mock exam', timeOfDay: 'morning',
        task: 'Full mock exam, Speaking included. If possible, take an official mock test (British Council / IDP).',
        activity: 'full-mock', resources: [{ resourceId: 'official-mock' }, { resourceId: 'cambridge-14-19' }], hint: AT_EXAM_TIME,
      },
    ]),
    sun: sunday(4, 'Rest day.'),
  },
};

export const SCHEDULES: Record<PhaseId, WeeklySchedule> = {
  1: PHASE_1_SCHEDULE,
  2: PHASE_2_SCHEDULE,
  3: PHASE_3_SCHEDULE,
  4: PHASE_4_SCHEDULE,
};
