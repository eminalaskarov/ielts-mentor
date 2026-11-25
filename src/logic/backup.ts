/** Backup file format and validation. Pure (DB I/O lives in src/db/backupIo.ts). */
import { addDays, isISODate } from './dates';
import { DEFAULT_CONFIG } from '../data/config';

export const BACKUP_APP_ID = 'ielts-mentor';
export const BACKUP_SCHEMA_VERSION = 1;

export const BACKUP_TABLES = [
  'kv',
  'blockLogs',
  'cards',
  'reviews',
  'quizAttempts',
  'mistakes',
  'essays',
  'recordings',
  'tests',
  'liveSessions',
] as const;
export type BackupTable = (typeof BACKUP_TABLES)[number];

export interface BackupFile {
  app: typeof BACKUP_APP_ID;
  schemaVersion: number;
  exportedAt: string; // ISO timestamp
  appVersion: string;
  includesAudio: boolean;
  tables: Record<BackupTable, unknown[]>;
}

export interface BackupPreview {
  exportedAt: string;
  words: number;
  essays: number;
  daysStudied: number;
  mistakes: number;
  tests: number;
  recordings: number;
  /** The start/exam dates were out of order and were repaired; ask the user to check them in Settings. */
  datesRepaired: boolean;
}

export type BackupError = 'not-backup' | 'newer-version' | 'damaged';

export const BACKUP_ERROR_TEXT: Record<BackupError, string> = {
  'not-backup': 'This file doesn’t look like an IELTS Mentor backup.',
  'newer-version': 'This backup is from a newer version of the app. Update the app first.',
  damaged: 'The file is damaged. Nothing was changed.',
};

/**
 * Upgrade an older backup file to the current schema. Keyed on schemaVersion: add an entry
 * `UPGRADES[n] = (f) => f'` that turns version n into n+1 whenever BACKUP_SCHEMA_VERSION is bumped.
 */
const UPGRADES: Record<number, (f: Record<string, unknown>) => Record<string, unknown>> = {};

export function upgradeBackup(file: Record<string, unknown>): Record<string, unknown> {
  let f = file;
  let v = f.schemaVersion as number;
  while (v < BACKUP_SCHEMA_VERSION) {
    const step = UPGRADES[v];
    if (!step) throw new Error(`No upgrade from backup schema ${v}`);
    f = { ...step(f), schemaVersion: v + 1 };
    v += 1;
  }
  return f;
}

// ---------------------------------------------------------------------------
// Row validation (a backup that passes here cannot crash the UI later)
// ---------------------------------------------------------------------------

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isNonEmptyStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
const isArr = (v: unknown): v is unknown[] => Array.isArray(v);
const isStrArr = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);
const opt = (v: unknown, f: (x: unknown) => boolean) => v === undefined || f(v);
const optNull = (v: unknown, f: (x: unknown) => boolean) => v === undefined || v === null || f(v);
const isISODateStr = isISODate;

const CARD_STATES = new Set(['new', 'learning', 'review', 'relearning']);
const RATINGS = new Set([1, 2, 3, 4]);

function validSrs(v: unknown): boolean {
  return (
    isObj(v) &&
    CARD_STATES.has(v.state as string) &&
    isNum(v.step) &&
    isNum(v.interval) &&
    isNum(v.ease) &&
    isNum(v.reps) &&
    isNum(v.lapses) &&
    isISODateStr(v.due) &&
    isNum(v.dueAt) &&
    opt(v.lastReviewedAt, isNum)
  );
}

const SETTINGS_DATES = ['startDate', 'examDate'];
const SETTINGS_NULL_DATES = ['firstUseDate', 'applicationDeadline'];
const SETTINGS_NUMS = ['targetOverall', 'newCardsPerDay', 'maxReviews', 'murphyUnitsDone'];
const SETTINGS_NULL_NUMS = ['targetMinPerSkill', 'lastBackupAt'];
const SETTINGS_BOOLS = ['onboarded', 'examDateEstimated', 'showTranslation'];
const SETTINGS_ENUMS: Record<string, string[]> = {
  theme: ['system', 'light', 'dark'],
  backupFrequency: ['weekly', 'biweekly', 'monthly', 'never'],
  examFormat: ['computer', 'paper', 'undecided'],
};

export function validSettingsValue(v: unknown): boolean {
  if (!isObj(v)) return false;
  for (const k of SETTINGS_DATES) if (!opt(v[k], isISODateStr)) return false;
  for (const k of SETTINGS_NULL_DATES) if (!optNull(v[k], isISODateStr)) return false;
  for (const k of SETTINGS_NUMS) if (!opt(v[k], isNum)) return false;
  for (const k of SETTINGS_NULL_NUMS) if (!optNull(v[k], isNum)) return false;
  for (const k of SETTINGS_BOOLS) if (!opt(v[k], isBool)) return false;
  for (const [k, vals] of Object.entries(SETTINGS_ENUMS)) if (v[k] !== undefined && !vals.includes(v[k] as string)) return false;
  // Date ORDER is not checked here: a start date on/after the exam date is repairable
  // (repairSettingsDates) and must not make a whole year of data unimportable.
  return true;
}

/**
 * If the settings row has startDate ≥ examDate (after defaults are applied), keep the start date
 * (the plan and history are anchored to it) and move the exam date to 52 weeks later, marked as
 * estimated. Mutates the kv rows in place. Returns true when something was repaired.
 */
export function repairSettingsDates(kvRows: unknown[]): boolean {
  const row = kvRows.find((r) => isObj(r) && r.key === 'settings') as Obj | undefined;
  if (!row || !isObj(row.value)) return false;
  const v = row.value;
  const start = isISODateStr(v.startDate) ? v.startDate : DEFAULT_CONFIG.startDate;
  const exam = isISODateStr(v.examDate) ? v.examDate : DEFAULT_CONFIG.examDate;
  if (start < exam) return false;
  row.value = { ...v, startDate: start, examDate: addDays(start, 364), examDateEstimated: true };
  return true;
}

/** Strict base64 (what btoa produces): alphabet, padding only at the end, length a multiple of 4. */
export function isBase64(s: string): boolean {
  return s.length % 4 === 0 && /^[A-Za-z0-9+/]*={0,2}$/.test(s);
}

const ROW_VALIDATORS: Record<BackupTable, (r: Obj) => boolean> = {
  kv: (r) => isNonEmptyStr(r.key) && (r.key !== 'settings' || validSettingsValue(r.value)),
  blockLogs: (r) => isNonEmptyStr(r.id) && isISODateStr(r.date) && isNonEmptyStr(r.blockId) && isBool(r.done) && opt(r.minutes, isNum) && opt(r.murphyUnitsAdded, isNum),
  cards: (r) =>
    isNonEmptyStr(r.id) &&
    isNonEmptyStr(r.headword) &&
    opt(r.pos, isStr) &&
    opt(r.definition, isStr) &&
    opt(r.example, isStr) &&
    isStrArr(r.collocations) &&
    isStrArr(r.tags) &&
    validSrs(r.srs),
  reviews: (r) => opt(r.id, isNum) && isNonEmptyStr(r.cardId) && isNum(r.at) && isISODateStr(r.date) && RATINGS.has(r.rating as number) && CARD_STATES.has(r.prevState as string),
  quizAttempts: (r) => isNonEmptyStr(r.id) && isISODateStr(r.date) && isStr(r.kind) && isStrArr(r.itemIds) && isObj(r.answers) && opt(r.startedAt, isNum),
  mistakes: (r) => isNonEmptyStr(r.id) && isISODateStr(r.date) && isStr(r.skill) && isStr(r.what) && opt(r.correction, isStr) && isStrArr(r.reviewedMonths) && opt(r.fixed, isBool),
  essays: (r) =>
    isNonEmptyStr(r.id) &&
    ['task1', 'task2', 'paragraph'].includes(r.kind as string) &&
    ['draft', 'done'].includes(r.status as string) &&
    isISODateStr(r.date) &&
    isStr(r.text) &&
    isNum(r.words) &&
    opt(r.promptText, isStr) &&
    optNull(r.band, isNum),
  recordings: (r) => isNonEmptyStr(r.id) && isNum(r.createdAt) && isNum(r.expiresAt) && isISODateStr(r.date) && isStr(r.mime) && opt(r.promptTitle, isStr) && opt(r.audioDeleted, isBool),
  tests: (r) => isNonEmptyStr(r.id) && isISODateStr(r.date) && isStr(r.type) && isStrArr(r.weakAreas) && opt(r.notes, isStr),
  liveSessions: (r) => isNonEmptyStr(r.id) && isISODateStr(r.date) && isNum(r.minutes),
};

/** Returns the first problem found (for logs/tests) or null when every row is valid. */
export function validateTables(tables: Record<string, unknown>, audio?: unknown): string | null {
  for (const t of BACKUP_TABLES) {
    const rows = tables[t] as unknown[];
    const check = ROW_VALIDATORS[t];
    const keys = new Set<unknown>();
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!isObj(r) || !check(r)) return `${t}[${i}]`;
      const pk = t === 'kv' ? r.key : r.id;
      if (pk !== undefined) {
        if (keys.has(pk)) return `${t}[${i}] duplicate key`;
        keys.add(pk);
      }
    }
  }
  if (audio !== undefined) {
    if (!isArr(audio)) return 'audio';
    for (let i = 0; i < audio.length; i++) {
      const a = audio[i];
      if (!isObj(a) || !isNonEmptyStr(a.id) || !isStr(a.mime) || !isStr(a.data) || !isBase64(a.data)) return `audio[${i}]`;
    }
  }
  return null;
}

export function parseBackup(text: string): { ok: true; file: BackupFile; preview: BackupPreview } | { ok: false; error: BackupError } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: text.trim().startsWith('{') ? 'damaged' : 'not-backup' };
  }
  if (!isObj(data)) return { ok: false, error: 'not-backup' };
  if (data.app !== BACKUP_APP_ID) return { ok: false, error: 'not-backup' };
  const v = data.schemaVersion;
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1) return { ok: false, error: 'damaged' };
  if (v > BACKUP_SCHEMA_VERSION) return { ok: false, error: 'newer-version' };
  let f: Obj;
  try {
    f = upgradeBackup(data);
  } catch {
    return { ok: false, error: 'damaged' };
  }
  if (!isObj(f.tables)) return { ok: false, error: 'damaged' };
  const tables = f.tables;
  for (const t of BACKUP_TABLES) {
    if (tables[t] === undefined) tables[t] = [];
    if (!Array.isArray(tables[t])) return { ok: false, error: 'damaged' };
  }
  if (validateTables(tables, f.audio) !== null) return { ok: false, error: 'damaged' };
  const datesRepaired = repairSettingsDates(tables.kv as unknown[]);
  if (!isStr(f.exportedAt)) f.exportedAt = '';
  if (!isBool(f.includesAudio)) f.includesAudio = isArr(f.audio);
  if (!isStr(f.appVersion)) f.appVersion = '';
  const file = f as unknown as BackupFile;
  return { ok: true, file, preview: { ...previewOf(file), datesRepaired } };
}

export function previewOf(file: BackupFile): BackupPreview {
  const t = file.tables;
  const days = new Set<string>();
  for (const b of t.blockLogs as { date?: string; done?: boolean }[]) if (b && b.done && b.date) days.add(b.date);
  return {
    exportedAt: file.exportedAt,
    words: t.cards.length,
    essays: (t.essays as { status?: string }[]).filter((e) => e && e.status === 'done').length,
    daysStudied: days.size,
    mistakes: t.mistakes.length,
    tests: t.tests.length,
    recordings: t.recordings.length,
    datesRepaired: false,
  };
}

export function backupFileName(date: string): string {
  return `ielts-mentor-backup-${date}.json`;
}

/** Backup reminder (ux-spec 4.12). Returns the reminder to show or null. */
export function backupReminder(o: {
  today: string;
  firstUseDate: string | null;
  lastBackupDate: string | null;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'never';
  snoozedUntil: string | null;
  daysBetween: (a: string, b: string) => number;
}): { kind: 'first' | 'overdue'; days: number; urgent: boolean } | null {
  if (o.frequency === 'never') return null;
  if (o.snoozedUntil && o.today < o.snoozedUntil) return null;
  if (!o.lastBackupDate) {
    if (!o.firstUseDate) return null;
    const used = o.daysBetween(o.firstUseDate, o.today);
    return used >= 3 ? { kind: 'first', days: used, urgent: used >= 14 } : null;
  }
  const since = o.daysBetween(o.lastBackupDate, o.today);
  const limit = o.frequency === 'weekly' ? 7 : o.frequency === 'biweekly' ? 14 : 30;
  if (since > limit) return { kind: 'overdue', days: since, urgent: since > 14 };
  return null;
}
