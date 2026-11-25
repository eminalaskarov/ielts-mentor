/**
 * IndexedDB via Dexie. Schema is versioned: NEVER edit an existing version's stores; add a new
 * `this.version(n+1).stores({...}).upgrade(...)` for changes so a year of data migrates safely.
 */
import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { ExamFormat, ExamSkill, ISODate, Skill, Task1ChartType, Task2EssayType } from '../data';
import type { CardState, Rating, SrsState } from '../logic/srs';

export interface KV {
  key: string;
  value: unknown;
}

export interface BlockLog {
  /** `${date}|${blockId}` */
  id: string;
  date: ISODate;
  blockId: string;
  skill: Skill;
  done: boolean;
  minutes: number;
  doneAt: number;
  /** Murphy units added to the pointer when this block was ticked (to undo). */
  murphyUnitsAdded?: number;
  extra?: boolean;
  /** Resolved detail at the time it was ticked (e.g. "Units 1–3"). */
  detail?: string;
}

export interface CardRec {
  id: string;
  source: 'builtin' | 'user';
  headword: string;
  pos: string;
  definition: string;
  example: string;
  collocations: string[];
  translationAz?: string;
  topic?: string;
  awl?: boolean;
  tags: string[];
  createdAt: number;
  srs: SrsState;
}

export interface ReviewRec {
  id?: number;
  cardId: string;
  at: number;
  date: ISODate;
  rating: Rating;
  prevState: CardState;
}

export interface QuizAttempt {
  /** `${date}|${kind}|${n}` */
  id: string;
  date: ISODate;
  kind: 'daily' | 'extra' | 'mini' | 'practice';
  itemIds: string[];
  answers: Record<string, { given: number | string; correct: boolean }>;
  startedAt: number;
  finishedAt?: number;
}

export type MistakeCause = 'word' | 'misread' | 'time' | 'grammar' | 'hearing' | 'careless' | 'other';

export interface Mistake {
  id: string;
  date: ISODate;
  createdAt: number;
  skill: Skill;
  what: string;
  correction: string;
  cause: MistakeCause;
  causeOther?: string;
  source?: string;
  /** Optional sub-tag, e.g. grammar topic or reading question type. */
  tag?: string;
  /** Months (YYYY-MM) in which it was reviewed; stillTricky reappears next month. */
  reviewedMonths: string[];
  stillTricky: boolean;
  fixed: boolean;
  quizItemId?: string;
}

export type WritingKind = 'task1' | 'task2' | 'paragraph';

export interface EssayScores {
  ta: number | null;
  cc: number | null;
  lr: number | null;
  gra: number | null;
}

export interface Essay {
  id: string;
  kind: WritingKind;
  status: 'draft' | 'done';
  date: ISODate;
  startedAt: number;
  finishedAt?: number;
  promptId?: string;
  promptText: string;
  chartType?: Task1ChartType;
  essayType?: Task2EssayType;
  text: string;
  words: number;
  timed: boolean;
  durationMs: number;
  /** Timer state (timestamp based) for drafts. */
  timer?: unknown;
  scores?: EssayScores;
  checklist?: Record<string, boolean>;
  band?: number | null;
  fixNext?: string;
  needsFeedback?: boolean;
  feedbackReceived?: boolean;
  feedbackAt?: ISODate;
  teacherNote?: string;
  parentId?: string;
  /** Essays written in one "Full Writing" session share this id. */
  sessionId?: string;
}

export interface RecordingMeta {
  id: string;
  createdAt: number;
  expiresAt: number;
  date: ISODate;
  part: 1 | 2 | 3 | 0; // 0 = free talk
  promptId?: string;
  promptTitle: string;
  mime: string;
  size: number;
  durationMs: number;
  audioDeleted: boolean;
  review?: {
    checklist: Record<string, boolean>;
    scores: Record<string, number | null>;
    notes: string;
  };
}

export interface AudioRec {
  id: string;
  blob: Blob;
}

export type TestType = 'lr' | 'full' | 'mini' | 'official' | 'listening' | 'reading' | 'writing' | 'speaking';

export interface TestLog {
  id: string;
  date: ISODate;
  createdAt: number;
  type: TestType;
  source: string;
  book?: string;
  listeningRaw?: number | null;
  readingRaw?: number | null;
  listening?: number | null;
  reading?: number | null;
  writing?: number | null;
  speaking?: number | null;
  overall?: number | null;
  weakAreas: string[];
  notes: string;
  official: boolean;
  checkpointId?: string | null;
}

export interface LiveSession {
  id: string;
  date: ISODate;
  createdAt: number;
  minutes: number;
  withWhom: string;
  notes: string;
}

export interface Snapshot {
  id: string;
  createdAt: number;
  reason: string;
  data: string;
}

export interface Settings {
  onboarded: boolean;
  startDate: ISODate;
  examDate: ISODate;
  examDateEstimated: boolean;
  examFormat: ExamFormat;
  targetOverall: number;
  targetMinPerSkill: number | null;
  applicationDeadline: ISODate | null;
  theme: 'system' | 'light' | 'dark';
  newCardsPerDay: number;
  maxReviews: number;
  murphyUnitsDone: number;
  backupFrequency: 'weekly' | 'biweekly' | 'monthly' | 'never';
  lastBackupAt: number | null;
  firstUseDate: ISODate | null;
  showTranslation: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  onboarded: false,
  startDate: '2026-11-23',
  examDate: '2027-11-20',
  examDateEstimated: false,
  examFormat: 'undecided',
  targetOverall: 7.0,
  targetMinPerSkill: null,
  applicationDeadline: null,
  theme: 'system',
  newCardsPerDay: 20,
  maxReviews: 100,
  murphyUnitsDone: 0,
  backupFrequency: 'weekly',
  lastBackupAt: null,
  firstUseDate: null,
  showTranslation: true,
};

export type WeakSkillCache = { skill: ExamSkill | null };

export class AppDB extends Dexie {
  kv!: Table<KV, string>;
  blockLogs!: Table<BlockLog, string>;
  cards!: Table<CardRec, string>;
  reviews!: Table<ReviewRec, number>;
  quizAttempts!: Table<QuizAttempt, string>;
  mistakes!: Table<Mistake, string>;
  essays!: Table<Essay, string>;
  recordings!: Table<RecordingMeta, string>;
  audio!: Table<AudioRec, string>;
  tests!: Table<TestLog, string>;
  liveSessions!: Table<LiveSession, string>;
  snapshots!: Table<Snapshot, string>;

  constructor(name = 'ielts-mentor') {
    super(name);
    this.version(1).stores({
      kv: 'key',
      blockLogs: 'id, date, blockId',
      cards: 'id, source, srs.state, srs.dueAt',
      reviews: '++id, cardId, date, at',
      quizAttempts: 'id, date, kind',
      mistakes: 'id, date, skill, cause, createdAt',
      essays: 'id, status, date, kind',
      recordings: 'id, createdAt, expiresAt',
      audio: 'id',
      tests: 'id, date',
      liveSessions: 'id, date',
      snapshots: 'id, createdAt',
    });
  }
}

export const db = new AppDB();

export function uid(prefix = ''): string {
  const r = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  return prefix ? `${prefix}-${r}` : r;
}

export async function getSettings(): Promise<Settings> {
  const row = await db.kv.get('settings');
  return { ...DEFAULT_SETTINGS, ...((row?.value as Partial<Settings>) ?? {}) };
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  await db.transaction('rw', db.kv, async () => {
    const cur = await getSettings();
    await db.kv.put({ key: 'settings', value: { ...cur, ...patch } });
  });
}

export async function kvGet<T>(key: string, fallback: T): Promise<T> {
  const row = await db.kv.get(key);
  return row === undefined ? fallback : (row.value as T);
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  await db.kv.put({ key, value });
}

export async function kvDelete(key: string): Promise<void> {
  await db.kv.delete(key);
}
