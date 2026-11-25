import type { Criterion } from './types';

/**
 * Writing and Speaking assessment criteria, with SHORT summaries in our own words for bands 5–8
 * (the levels this learner moves through). These are NOT the official descriptors; they are a
 * simplified self-check guide. For a real score, the learner needs human feedback (golden rule 6).
 */

export const WRITING_CRITERIA: Criterion[] = [
  {
    id: 'w-ta',
    name: 'Task Achievement (Task 1)',
    appliesTo: 'writing-task1',
    question: 'Did I report the most important information and give a clear overview?',
    levels: [
      { band: 5, summary: 'Describes details one by one, often without an overview. Some key information is missing or not correct.' },
      { band: 6, summary: 'Has an overview and covers the task, but the chosen key features are not always the most important ones. Some details are unnecessary.' },
      { band: 7, summary: 'A clear overview of the main trends or differences. Key features are presented and supported with data.' },
      { band: 8, summary: 'All key features are covered clearly and fully, with well-chosen data and accurate comparisons.' },
    ],
    selfCheck: [
      'I wrote at least 150 words.',
      'I paraphrased the question in my introduction.',
      'I wrote an overview (main trends / biggest differences) with no numbers in it.',
      'I supported key features with correct numbers.',
      'I compared data, not only listed it.',
      'I did not give my opinion.',
    ],
  },
  {
    id: 'w-tr',
    name: 'Task Response (Task 2)',
    appliesTo: 'writing-task2',
    question: 'Did I answer every part of the question with a clear position and developed ideas?',
    levels: [
      { band: 5, summary: 'Answers the question only partly. The position is not always clear. Ideas are few and not well developed.' },
      { band: 6, summary: 'Answers all parts, but some parts get less attention. There is a position, but ideas are not always fully explained.' },
      { band: 7, summary: 'Answers all parts. A clear position all the way through. Main ideas are explained and supported, though some may be too general.' },
      { band: 8, summary: 'Answers all parts fully. Ideas are relevant, well explained and supported with good examples.' },
    ],
    selfCheck: [
      'I wrote at least 250 words.',
      'I answered every part of the question.',
      'My opinion is clear in the introduction and the conclusion.',
      'Each body paragraph has one main idea, an explanation and an example.',
      'I stayed on topic.',
    ],
  },
  {
    id: 'w-cc',
    name: 'Coherence and Cohesion',
    appliesTo: 'writing-both',
    question: 'Is my writing easy to follow, with logical paragraphs and good linking?',
    levels: [
      { band: 5, summary: 'Some organisation, but ideas do not always follow logically. Linking words are repeated or wrong. Paragraphs may be missing or unclear.' },
      { band: 6, summary: 'Generally organised and clear. Uses linking words, but sometimes mechanically or with mistakes. Paragraphs are not always logical.' },
      { band: 7, summary: 'Ideas progress logically. A range of linking words with only small over- or under-use. Each paragraph has a clear main idea.' },
      { band: 8, summary: 'Ideas are in a logical order and linking feels natural. Paragraphs are used well.' },
    ],
    selfCheck: [
      'Each paragraph has one clear main idea.',
      'I used different linking words, not the same ones again and again.',
      'I did not start every sentence with a linking word.',
      'I used words like "this", "these", "such" to refer back instead of repeating nouns.',
    ],
  },
  {
    id: 'w-lr',
    name: 'Lexical Resource',
    appliesTo: 'writing-both',
    question: 'Did I use a good range of accurate words and collocations?',
    levels: [
      { band: 5, summary: 'Limited vocabulary, just enough for the task. Spelling and word-form mistakes are noticeable and can make reading difficult.' },
      { band: 6, summary: 'Enough vocabulary for the task. Tries some less common words, with some mistakes, but the meaning is clear.' },
      { band: 7, summary: 'Enough range to be flexible and precise. Uses some less common words and good collocations, with only occasional mistakes.' },
      { band: 8, summary: 'Wide, precise vocabulary used naturally, including less common words. Mistakes are rare.' },
    ],
    selfCheck: [
      'I paraphrased instead of copying words from the question.',
      'I used at least 3 good collocations (e.g. "a sharp increase", "play a key role").',
      'I checked spelling and word forms (economy / economic).',
      'I avoided informal words (e.g. "a lot of", "kids", "stuff").',
    ],
  },
  {
    id: 'w-gra',
    name: 'Grammatical Range and Accuracy',
    appliesTo: 'writing-both',
    question: 'Did I use a mix of simple and complex sentences with few mistakes?',
    levels: [
      { band: 5, summary: 'A limited range of structures. Tries complex sentences, but they often have mistakes. Mistakes are frequent.' },
      { band: 6, summary: 'A mix of simple and complex sentences. Some mistakes, but they rarely make the meaning unclear.' },
      { band: 7, summary: 'A variety of complex structures. Many sentences have no mistakes. Good control, with a few errors.' },
      { band: 8, summary: 'A wide range of structures. Most sentences have no mistakes; errors are only occasional.' },
    ],
    selfCheck: [
      'I used some complex sentences (relative clauses, conditionals, passive).',
      'I checked articles (a/an/the).',
      'I checked subject–verb agreement and tenses.',
      'I checked punctuation: no very long sentences joined only by commas.',
    ],
  },
];

export const SPEAKING_CRITERIA: Criterion[] = [
  {
    id: 's-fc',
    name: 'Fluency and Coherence',
    appliesTo: 'speaking',
    question: 'Can I keep talking smoothly and connect my ideas?',
    levels: [
      { band: 5, summary: 'Keeps going, but with repetition, self-correction or slow speech. Uses the same few linking words.' },
      { band: 6, summary: 'Willing to speak at length, but sometimes loses the thread. Uses linking words, not always correctly.' },
      { band: 7, summary: 'Speaks at length without much effort. Some pauses to find words. Uses a range of linking words and discourse markers.' },
      { band: 8, summary: 'Speaks fluently with only occasional repetition. Pauses are mostly to think about ideas, not words. Develops topics well.' },
    ],
    selfCheck: [
      'My answers were longer than one sentence (answer → reason → example).',
      'I kept going after a mistake instead of stopping.',
      'In Part 2 I spoke for the full 2 minutes.',
      'I used linking phrases (for example, on the other hand, the main reason is).',
    ],
  },
  {
    id: 's-lr',
    name: 'Lexical Resource',
    appliesTo: 'speaking',
    question: 'Do I have enough words to talk about different topics, and can I paraphrase?',
    levels: [
      { band: 5, summary: 'Can talk about familiar and unfamiliar topics, but with little flexibility. Paraphrasing works only sometimes.' },
      { band: 6, summary: 'Enough vocabulary to talk at length. Some words are not quite right, but the meaning is clear. Usually paraphrases well.' },
      { band: 7, summary: 'Uses vocabulary flexibly on many topics, including some less common and idiomatic words. Paraphrases well.' },
      { band: 8, summary: 'A wide range of words used precisely, including idiomatic language, with only occasional mistakes.' },
    ],
    selfCheck: [
      'I used some topic words, not only very common words.',
      'When I did not know a word, I explained it in another way.',
      'I used at least one natural collocation or idiom correctly.',
    ],
  },
  {
    id: 's-gra',
    name: 'Grammatical Range and Accuracy',
    appliesTo: 'speaking',
    question: 'Do I use a mix of structures, and are most sentences correct?',
    levels: [
      { band: 5, summary: 'Basic sentences are fairly accurate. Few complex sentences, and these usually have mistakes.' },
      { band: 6, summary: 'A mix of simple and complex sentences, with limited flexibility. Mistakes in complex sentences, but the meaning is usually clear.' },
      { band: 7, summary: 'A range of complex structures used with some flexibility. Many sentences are correct, though some mistakes repeat.' },
      { band: 8, summary: 'A wide range of structures used flexibly. Most sentences are correct.' },
    ],
    selfCheck: [
      'I used past, present and future correctly when the question needed them.',
      'I used at least one conditional or relative clause.',
      'I listened to my recording, wrote down my grammar mistakes and said those sentences again correctly.',
    ],
  },
  {
    id: 's-p',
    name: 'Pronunciation',
    appliesTo: 'speaking',
    question: 'Is my speech easy to understand, with natural stress and intonation?',
    levels: [
      { band: 5, summary: 'Usually understood, but some mispronounced words cause problems. Little control of stress and intonation.' },
      { band: 6, summary: 'Generally easy to understand. Uses some features like stress and intonation, but not always well. Some words are unclear.' },
      { band: 7, summary: 'Easy to understand most of the time, with good use of stress, rhythm and intonation in parts.' },
      { band: 8, summary: 'Easy to understand all the time. Uses stress, rhythm and intonation naturally. The accent has very little effect.' },
    ],
    selfCheck: [
      'A listener could understand every word in my recording.',
      'I stressed the important words in my sentences.',
      'My voice went up and down naturally, not flat.',
      'I pronounced word endings (-s, -ed) clearly.',
    ],
  },
];

/** Plan tips for Speaking shown with the checklist. */
export const SPEAKING_TIPS = [
  'Do not give short answers. Explain each answer and give an example.',
  'If you make a mistake, do not stop — keep going.',
  'Part 2: use the 1 minute to write short notes, then talk for the full 2 minutes.',
];

/** Plan tips for Writing shown with the timers. */
export const WRITING_TIPS = [
  'Task 1: about 20 minutes, 150+ words. Task 2: about 40 minutes, 250+ words.',
  'Task 2 counts for two thirds of the Writing band. You can start with Task 2.',
  'Task 1: no opinion — describe and compare the data. Always write an overview.',
  'Task 2 structure: introduction → 2 body paragraphs → conclusion.',
];
