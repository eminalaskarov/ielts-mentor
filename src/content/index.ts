import { QUIZ_GRAMMAR } from './quiz-grammar';
import { QUIZ_PHASE34 } from './quiz-phase34';
import { QUIZ_READING } from './quiz-reading';
import { QUIZ_TASK1 } from './quiz-task1';
import { QUIZ_VOCAB } from './quiz-vocab';
import { SPEAKING_PHASE34 } from './speaking-phase34';
import { VOCAB_AWL } from './vocab-awl';
import { VOCAB_EXTRA } from './vocab-extra';
import { VOCAB_PHASE1 } from './vocab-phase1';
import { VOCAB_PHASE34 } from './vocab-phase34';
import { SPEAKING_PROMPTS as SPEAKING } from './speaking';
import { WRITING_PHASE34 } from './writing-phase34';
import { WRITING_PROMPTS as WRITING } from './writing';
import type { QuizItem, SpeakingPrompt, VocabCard, WritingPrompt } from './types';

export * from './types';

/*
 * IDs are position-based. Only APPEND to arrays, never reorder or delete.
 * Phases 1-2: quiz-grammar / quiz-vocab / quiz-reading / quiz-task1, vocab-phase1 / vocab-awl / vocab-extra, speaking, writing.
 * Phases 3-4 (pass B): quiz-phase34 (ids q34-*), vocab-phase34 (v34-*), speaking-phase34, writing-phase34.
 */
export const QUIZ_ITEMS: QuizItem[] = [...QUIZ_GRAMMAR, ...QUIZ_VOCAB, ...QUIZ_READING, ...QUIZ_TASK1, ...QUIZ_PHASE34];
export const VOCAB_CARDS: VocabCard[] = [...VOCAB_PHASE1, ...VOCAB_AWL, ...VOCAB_EXTRA, ...VOCAB_PHASE34];
export const SPEAKING_PROMPTS: SpeakingPrompt[] = [...SPEAKING, ...SPEAKING_PHASE34];
export const WRITING_PROMPTS: WritingPrompt[] = [...WRITING, ...WRITING_PHASE34];
