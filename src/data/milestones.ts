import type { FinalWeekStage, Milestone } from './types';

/**
 * Milestone reminders. `days` in relative dates: negative = before, positive = after.
 * `derived: true` = added by the methodologist to support something the plan asks for.
 */
export const MILESTONES: Milestone[] = [
  // "Before you start" (plan)
  {
    id: 'ms-university-requirements',
    kind: 'university',
    title: 'Check your university’s IELTS requirements',
    description:
      'Find the overall band you need (for example 6.5 or 7.0) and the minimum for each part (for example "no part below 6.0"). Writing is usually the lowest part. Enter the numbers in Settings.',
    showFrom: { relativeTo: 'start', days: 0 },
    dueBy: { relativeTo: 'start', days: 14 },
    requiresAction: true,
  },
  {
    id: 'ms-application-deadlines',
    kind: 'university',
    title: 'Check application deadlines',
    description:
      'Results come about 3–13 days after the exam. If your application deadline is earlier than November, you may need to take the exam earlier. Enter your deadline in Settings.',
    showFrom: { relativeTo: 'start', days: 0 },
    dueBy: { relativeTo: 'start', days: 14 },
    requiresAction: true,
  },
  {
    id: 'ms-notebooks',
    kind: 'setup',
    title: 'Set up your two notebooks',
    description:
      'All year you will keep a mistake notebook and a word notebook. Both are in this app (Mistakes and Vocabulary). You can also keep a paper notebook.',
    showFrom: { relativeTo: 'start', days: 0 },
    dueBy: { relativeTo: 'start', days: 3 },
    requiresAction: true,
  },
  {
    id: 'ms-phone-english',
    kind: 'setup',
    title: 'Switch your phone and social media to English',
    description: 'Free extra practice every day (golden rule 5).',
    showFrom: { relativeTo: 'start', days: 0 },
    dueBy: { relativeTo: 'start', days: 7 },
    requiresAction: true,
  },
  // Phase 3 preparation (derived: phase 3 needs outside feedback from day 1)
  {
    id: 'ms-find-feedback',
    kind: 'feedback',
    title: 'Find a Writing teacher and a Speaking partner',
    description:
      'From July you need feedback on at least 2 essays a week and live speaking at least 2 times a week. Arrange a teacher, a course, iTalki / Cambly or a strong friend now.',
    showFrom: '2027-06-01',
    dueBy: '2027-06-30',
    requiresAction: true,
    derived: true,
  },
  {
    id: 'ms-recheck-requirements',
    kind: 'university',
    title: 'Check requirements and deadlines again',
    description: 'Before you register, make sure the university requirements and dates have not changed.',
    showFrom: '2027-07-15',
    dueBy: '2027-07-31',
    requiresAction: true,
    derived: true,
  },
  // Registration (plan: August 2027)
  {
    id: 'ms-register-exam',
    kind: 'registration',
    title: 'Register for the IELTS exam',
    description:
      'Register in August — places for November fill up fast. Choose computer or paper format (results come faster on computer). Then enter your exam date and format in Settings.',
    showFrom: '2027-08-01',
    dueBy: '2027-08-31',
    requiresAction: true,
  },
  {
    id: 'ms-book-mock',
    kind: 'booking',
    title: 'Book an official mock test for October',
    description: 'Book a British Council or IDP mock test for October, if one is available near you.',
    showFrom: '2027-09-01',
    dueBy: '2027-09-30',
    requiresAction: true,
    derived: true,
  },
  {
    id: 'ms-computer-practice',
    kind: 'format',
    title: 'Practise on a computer',
    description: 'You chose the computer exam. In the last weeks, do your practice tests on a computer.',
    showFrom: '2027-10-01',
    requiresAction: false,
    onlyForFormat: 'computer',
  },
  {
    id: 'ms-final-week',
    kind: 'countdown',
    title: 'Final week starts',
    description: 'One week to the exam. The app now shows the final-week plan instead of the normal schedule. No new material.',
    showFrom: { relativeTo: 'exam', days: -7 },
    requiresAction: false,
  },
  {
    id: 'ms-results',
    kind: 'results',
    title: 'Waiting for your results',
    description:
      'Results come about 3–13 days after the exam (faster for the computer exam). If one part is lower than you need, check if your centre offers One Skill Retake.',
    showFrom: { relativeTo: 'exam', days: 1 },
    requiresAction: false,
  },
];

/**
 * Final week before the exam (plan). Overrides the phase 4 weekly schedule from exam − 7 to exam day.
 * Block ids: "fw-{stage}-{n}".
 */
export const FINAL_WEEK: FinalWeekStage[] = [
  {
    id: 'fw-7-4',
    daysBefore: { from: 7, to: 4 },
    title: '7–4 days before the exam',
    todo: ['Do 1 light test a day.', 'Review your mistake notebook.'],
    avoid: ['No new material.'],
    blocks: [
      { id: 'fw-7-4-1', order: 1, skill: 'test', minutes: 60, minutesAssumed: true, title: 'Light test', task: 'One light test (one part only, for example Listening or one Reading passage).', activity: 'final-week' },
      { id: 'fw-7-4-2', order: 2, skill: 'test', minutes: 30, minutesAssumed: true, title: 'Mistake notebook', task: 'Review your mistake notebook.', activity: 'mistake-analysis' },
      { id: 'fw-7-4-3', order: 3, skill: 'vocabulary', minutes: 15, title: 'Vocabulary review', task: 'Review your due word cards.', activity: 'vocab-review' },
    ],
  },
  {
    id: 'fw-3-2',
    daysBefore: { from: 3, to: 2 },
    title: '3–2 days before the exam',
    todo: ['Only Speaking practice.', 'Review your Writing templates (Task 1 and Task 2 structures).', 'Sleep well.'],
    avoid: ['No tests.', 'No new material.'],
    blocks: [
      { id: 'fw-3-2-1', order: 1, skill: 'speaking', minutes: 30, minutesAssumed: true, title: 'Speaking', task: 'Speaking practice: Part 1, a Part 2 card and Part 3.', activity: 'speaking-part2-part3' },
      { id: 'fw-3-2-2', order: 2, skill: 'writing', minutes: 30, minutesAssumed: true, title: 'Writing templates', task: 'Review your Task 1 and Task 2 structures. Do not write full essays.', activity: 'final-week' },
      { id: 'fw-3-2-3', order: 3, skill: 'vocabulary', minutes: 15, title: 'Vocabulary review', task: 'Review your due word cards.', activity: 'vocab-review' },
    ],
  },
  {
    id: 'fw-1',
    daysBefore: { from: 1, to: 1 },
    title: '1 day before the exam',
    todo: ['Prepare your documents (passport / ID you used to register).', 'Check the way to the test centre.', 'Go to bed early.'],
    avoid: ['Do not study.'],
    blocks: [
      { id: 'fw-1-1', order: 1, skill: 'rest', minutes: 0, title: 'No study today', task: 'Get your documents ready, check the route to the test centre, go to bed early.', activity: 'rest' },
    ],
  },
  {
    id: 'fw-0',
    daysBefore: { from: 0, to: 0 },
    title: 'Exam day',
    todo: [
      'Eat a light breakfast.',
      'Listen to 10 minutes of English in the morning to warm up.',
      'Arrive at least 30 minutes early (check the time your centre gives you).',
    ],
    avoid: ['Do not try to learn anything new.'],
    blocks: [
      { id: 'fw-0-1', order: 1, skill: 'listening', minutes: 10, title: 'Warm-up', task: 'Listen to 10 minutes of English.', activity: 'listening-external' },
      { id: 'fw-0-2', order: 2, skill: 'test', minutes: 0, title: 'IELTS exam', task: 'Good luck! Arrive early and stay calm.', activity: 'final-week' },
    ],
  },
];
