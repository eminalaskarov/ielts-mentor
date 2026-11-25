import type { FlexPolicy, GoldenRule, MentorRule } from './types';

/** The 8 golden rules for the whole year (plan, in order). */
export const GOLDEN_RULES: GoldenRule[] = [
  {
    id: 1,
    title: 'Word cards every day',
    text: 'Review your word cards every day — even on rest days, for 15 minutes. Learning 3000–4000 words in 12 months is realistic.',
    triggers: ['rest-day', 'vocab-review-due', 'daily-rotation'],
  },
  {
    id: 2,
    title: 'Regular is better than intense',
    text: 'Studying 2 hours a day, 6 days a week, is much more effective than studying 6 hours on 2 days.',
    triggers: ['catch-up-attempt', 'daily-rotation', 'phase-start'],
  },
  {
    id: 3,
    title: 'Keep a mistake notebook',
    text: 'After every test, write down your mistakes and their causes. Once a month, review the whole notebook.',
    triggers: ['after-test-logged', 'monthly-mistake-review', 'daily-rotation'],
  },
  {
    id: 4,
    title: 'Record your speaking',
    text: 'Record yourself. Listen, note your mistakes, and speak again.',
    triggers: ['speaking-block', 'daily-rotation'],
  },
  {
    id: 5,
    title: 'Passive English',
    text: 'Use English for your phone, YouTube, series and news. That is one extra hour of free practice every day.',
    triggers: ['rest-day', 'daily-rotation'],
  },
  {
    id: 6,
    title: 'Get feedback on Writing and Speaking',
    text: 'Writing and Speaking are the hardest and most important parts for reaching 7. Ask a teacher or a partner for feedback.',
    triggers: ['writing-block', 'speaking-block', 'low-feedback-count'],
  },
  {
    id: 7,
    title: 'Do not waste the Cambridge tests',
    text: 'Save the newest books (Cambridge IELTS 14–19) for phases 3 and 4.',
    triggers: ['cambridge-book-chosen', 'phase-start'],
  },
  {
    id: 8,
    title: 'Missed a day? Do not punish yourself',
    text: 'If you miss a day, do not punish yourself. Go back to the plan the next day — but never miss 2 days in a row.',
    triggers: ['after-missed-day'],
  },
];

/**
 * Mentor rules = the plan's guidance expressed as machine-checkable rules.
 * Implementation pseudo-code is in docs/curriculum-notes.md.
 */
export const MENTOR_RULES: MentorRule[] = [
  {
    id: 'day-status',
    title: 'How a day is counted',
    description:
      'A study day (Mon–Sat, not in the final week rest days) is "done" if all blocks are checked, "partial" if at least one non-rest block is checked, "missed" if none. Sunday counts as kept if the 15-minute vocabulary review is done. Days before startDate are ignored. The day boundary is midnight Asia/Baku.',
    params: { partialCountsAsKept: true, sundayNeeds: 'vocab-review' },
    messages: {},
  },
  {
    id: 'never-two-in-a-row',
    title: 'Never miss 2 days in a row',
    description:
      'If yesterday was missed: show golden rule 8 with a gentle message, and mark today as "must not miss". Do NOT move yesterday’s blocks to today (the plan says: go back to the plan). Progress-based items (Murphy units, Hewings topics, word cards) simply continue from where the learner stopped. If 2 or more days in a row are missed, show the restart message and offer a short "minimum day" (the first block + vocabulary review) to restart the habit.',
    params: { maxConsecutiveMissed: 1, moveMissedBlocks: false, minimumDayBlocks: 1, notifyEveningHour: 20 },
    messages: {
      afterOneMiss: 'You missed yesterday. That’s OK — today you are back on the plan. Just don’t miss two days in a row.',
      eveningWarning: 'You haven’t studied today, and you missed yesterday. Even one block now keeps your plan alive.',
      afterTwoOrMore: 'Welcome back! Start small today: do the first block and your word cards. Tomorrow, the full plan.',
    },
    goldenRuleIds: [8, 2],
  },
  {
    id: 'no-catch-up',
    title: 'No marathon catch-up',
    description:
      'If the learner tries to check off blocks for past days, or plans more than 1.5× the day’s minutes, remind them of golden rule 2. Allow logging past blocks only for yesterday (forgot to tick), not older days.',
    params: { maxDayMultiplier: 1.5, backfillDays: 1 },
    messages: {
      warning: 'Regular study beats long sessions. Do today’s plan well, and keep going tomorrow.',
    },
    goldenRuleIds: [2],
  },
  {
    id: 'streaks',
    title: 'Streaks',
    description:
      'Study streak: consecutive kept days (Sunday counts when the vocabulary review is done). Because of rule 8, one missed day does not reset the streak to zero if the next day is kept; it is shown as a "saved" day. Two missed days in a row reset it. Vocabulary streak: consecutive days with the review done (all 7 days).',
    params: { graceDays: 1 },
    messages: {
      saved: 'Streak saved! You came back after one missed day.',
      reset: 'New streak starts today.',
    },
    goldenRuleIds: [8, 1],
  },
  {
    id: 'behind-target',
    title: 'Behind target → more time on the weak skill',
    description:
      'After each checkpoint result (and as a running check on the average of the last 3 logged tests per skill in phases 2–4), compare each skill band with the target minimum. weakSkill = the skill with the largest gap below target; on a tie, choose Writing, then Speaking, then Reading, then Listening (Writing is usually the lowest). If any skill is behind, turn on "weak-skill focus" until the next checkpoint: the flex blocks of the current phase (see FLEX_POLICIES) are redirected to weakSkill practice. In phase 4, the Tuesday/Thursday "weak skill" blocks always use weakSkill. If the overall gap is 1.0 band or more, also suggest getting a teacher’s opinion and checking whether the exam date is still right.',
    params: {
      runningAverageTests: 3,
      tieOrder: ['writing', 'speaking', 'reading', 'listening'],
      bigGap: 1.0,
      minTestsForRunningCheck: 2,
    },
    messages: {
      behind: 'Your {weakSkill} is {gap} band below the target for now. Until the next checkpoint, some of your free blocks will be used for {weakSkill}.',
      onTrack: 'Great — you reached the target for this checkpoint. Keep the same plan.',
      bigGap: 'Your result is quite far from the target. Ask a teacher for advice, and check if your exam date is still realistic.',
    },
  },
  {
    id: 'checkpoint-due',
    title: 'Checkpoint test day',
    description:
      'On a checkpoint date (default: a Saturday), the checkpoint test replaces that Saturday’s normal test block. Show a reminder from 7 days before. If no result is logged by the end of the window, show "checkpoint missed — do it on the next free day".',
    params: { remindDaysBefore: 7 },
    messages: {
      upcoming: 'Checkpoint on {date}: {howToCheck}',
      missed: 'You have not logged your checkpoint test yet. Do it on your next study day.',
    },
  },
  {
    id: 'monthly-mistake-review',
    title: 'Monthly mistake review',
    description:
      'Once a month, review the whole mistake notebook (golden rule 3). Due on the last Friday of each month (in phase 1 it fits the Friday "review and mistakes" block). Stays visible until done or until 7 days pass. Show the top 3 mistake causes and top 3 skills from the last month.',
    params: { dueOn: 'last-friday-of-month', minutes: 20, visibleDays: 7 },
    messages: {
      due: 'Time for your monthly mistake review. Look at your notebook: which mistakes come back again and again?',
    },
    goldenRuleIds: [3],
  },
  {
    id: 'feedback-quota',
    title: 'Feedback every week (phase 3–4)',
    description:
      'From phase 3: count essays marked "got feedback" and live speaking sessions per Monday–Sunday week. Target: at least 2 of each. On Thursday, if the count is 0, remind; on Sunday, show the week summary.',
    params: { fromPhase: 3, essaysPerWeek: 2, liveSpeakingPerWeek: 2, remindOn: 'thu' },
    messages: {
      remind: 'This week you have {essays} essay(s) checked and {speaking} live speaking session(s). The target is 2 of each.',
    },
    goldenRuleIds: [6],
  },
  {
    id: 'test-book-guard',
    title: 'Save Cambridge 14–19',
    description:
      'When the learner logs a test from Cambridge IELTS 14–19 during phases 1–2, show golden rule 7 and ask to confirm. Track which tests are used (book + test number) to avoid repeating a test.',
    params: { reservedBooks: ['cambridge-14-19'], reservedUntilPhase: 3 },
    messages: {
      confirm: 'Cambridge 14–19 are best saved for phases 3 and 4. Use this test anyway?',
    },
    goldenRuleIds: [7],
  },
  {
    id: 'murphy-pace',
    title: 'Murphy pace (phase 1)',
    description:
      'Expected units done = 145 × (study days with new units so far / all such days in phase 1). If the learner is 4+ units behind, the grammar block suggests 3 units instead of 2. If phase 1 ends with units left, they continue as optional units in early phase 2 (before Hewings).',
    params: { behindThreshold: 4 },
    messages: {
      behind: 'You are {n} units behind. Try 3 units today to finish the book by the end of February.',
    },
  },
  {
    id: 'vocab-load',
    title: 'Word card load',
    description:
      'New words per week follow the phase target (newWordsPerWeek). If more than 200 reviews are due, or retention is under 80%, pause new words for that day and only review.',
    params: { maxDueBeforePause: 200, minRetention: 0.8 },
    messages: {
      pause: 'You have many cards to review. Today: review only, no new words.',
    },
    goldenRuleIds: [1],
  },
  {
    id: 'rule-of-the-day',
    title: 'Golden rule of the day',
    description:
      'Show one golden rule on the Today screen. Priority: (1) a rule whose trigger matches today’s context (missed day, rest day, speaking/writing block, test logged); (2) otherwise rotate rules with the "daily-rotation" trigger by day number.',
    params: {},
    messages: {},
  },
];

/**
 * Which blocks may be redirected to the weakest skill when "weak-skill focus" is on (rule behind-target).
 * Only low-cost blocks are used, so the plan structure stays the same.
 */
export const FLEX_POLICIES: FlexPolicy[] = [
  {
    phase: 1,
    blockIds: ['p1-sat-2'],
    minutesPerWeek: 30,
    explanation: 'Half of the Saturday film time goes to the weak skill. Watch the rest of the film in your free time (golden rule 5).',
  },
  {
    phase: 2,
    blockIds: ['p2-wed-3', 'p2-sat-2'],
    minutesPerWeek: 55,
    explanation: 'Wednesday word-card block: 15 min review, 25 min weak skill. Saturday TED/podcast: 30 min weak skill.',
  },
  {
    phase: 3,
    blockIds: ['p3-wed-3', 'p3-fri-3'],
    minutesPerWeek: 45,
    explanation: 'Wednesday word-card block: 15 min review, 25 min weak skill. Friday topic words: 20 min words, 20 min weak skill.',
  },
  {
    phase: 4,
    blockIds: ['p4-tue-1', 'p4-thu-1'],
    minutesPerWeek: 180,
    explanation: 'Phase 4 already has 2 weak-skill blocks a week (1.5 hours each). They always use your lowest skill.',
  },
];

/** What "weak skill practice" means for each skill (used when a flex block is redirected). */
export const WEAK_SKILL_PRACTICE: Record<'listening' | 'reading' | 'writing' | 'speaking', string> = {
  listening: 'One Listening section with the transcript check, or a section you got wrong before.',
  reading: 'One timed Reading passage (20 minutes) with your weakest question types.',
  writing: 'One timed Task 1 or a Task 2 plan + introduction, then self-check with the criteria.',
  speaking: 'Record a Part 2 card (1 min prep + 2 min talk), listen back, and record again.',
};
