import { describe, expect, it } from 'vitest';
import { wordCount, paragraphCount } from './text';
import { idleTimer, pauseTimer, remainingMs, resumeTimer, startTimer, isTimeUp } from './timer';
import { BACKUP_APP_ID, BACKUP_SCHEMA_VERSION, backupReminder, parseBackup, upgradeBackup } from './backup';
import { daysBetween } from './dates';
import { checkAnswer, selectQuiz } from './quiz';
import { monthlyReviewDue, missedDayMessage, canEditDay, goldenRuleOfDay } from './mentor';
import { expiryLabel, isExpired, pickMimeType, RECORDING_TTL_MS } from './recordings';
import type { QuizItem } from '../content/types';

describe('text', () => {
  it('counts words and paragraphs', () => {
    expect(wordCount('  A well-known fact, isn’t it?  ')).toBe(5);
    expect(wordCount('— 50% rise —')).toBe(2);
    expect(paragraphCount('One.\n\nTwo.\nThree.')).toBe(3);
  });
});

describe('timer', () => {
  it('uses timestamps and pauses', () => {
    let t = startTimer(idleTimer(20 * 60_000), 0);
    expect(remainingMs(t, 60_000)).toBe(19 * 60_000);
    t = pauseTimer(t, 60_000);
    expect(remainingMs(t, 600_000)).toBe(19 * 60_000);
    t = resumeTimer(t, 600_000);
    expect(remainingMs(t, 660_000)).toBe(18 * 60_000);
    expect(isTimeUp(t, 600_000 + 19 * 60_000)).toBe(true);
  });
});

const card = (id: string) => ({
  id, source: 'user', headword: 'w', pos: 'noun', definition: 'd', example: 'e', collocations: [], tags: [], createdAt: 1,
  srs: { state: 'new', step: 0, interval: 0, ease: 2.5, reps: 0, lapses: 0, due: '2026-11-25', dueAt: 1 },
});

describe('backup', () => {
  it('validates files', () => {
    expect(parseBackup('hello')).toEqual({ ok: false, error: 'not-backup' });
    expect(parseBackup('{"app":"other"}')).toEqual({ ok: false, error: 'not-backup' });
    expect(parseBackup('{"app":"ielts-mentor"')).toEqual({ ok: false, error: 'damaged' });
    expect(parseBackup(JSON.stringify({ app: BACKUP_APP_ID, schemaVersion: 99, tables: {} }))).toEqual({ ok: false, error: 'newer-version' });
    const ok = parseBackup(
      JSON.stringify({ app: BACKUP_APP_ID, schemaVersion: 1, exportedAt: 'x', tables: { cards: [card('a'), card('b')], blockLogs: [{ id: '2026-11-23|b1', date: '2026-11-23', blockId: 'b1', done: true }] } }),
    );
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.preview.words).toBe(2);
      expect(ok.preview.daysStudied).toBe(1);
    }
    // Rows without the fields the UI relies on are rejected (QA: qa-backup.test.ts).
    expect(parseBackup(JSON.stringify({ app: BACKUP_APP_ID, schemaVersion: 1, tables: { cards: [{}] } }))).toEqual({ ok: false, error: 'damaged' });
    expect(parseBackup(JSON.stringify({ app: BACKUP_APP_ID, schemaVersion: 1.5, tables: {} }))).toEqual({ ok: false, error: 'damaged' });
    const dup = { app: BACKUP_APP_ID, schemaVersion: 1, tables: { cards: [card('a'), card('a')] } };
    expect(parseBackup(JSON.stringify(dup))).toEqual({ ok: false, error: 'damaged' });
    const badSrs = { app: BACKUP_APP_ID, schemaVersion: 1, tables: { cards: [{ ...card('a'), srs: { ...card('a').srs, due: 'soon' } }] } };
    expect(parseBackup(JSON.stringify(badSrs))).toEqual({ ok: false, error: 'damaged' });
    const badKv = { app: BACKUP_APP_ID, schemaVersion: 1, tables: { kv: [{ key: 'settings', value: { newCardsPerDay: '20' } }] } };
    expect(parseBackup(JSON.stringify(badKv))).toEqual({ ok: false, error: 'damaged' });
    const goodKv = { app: BACKUP_APP_ID, schemaVersion: 1, tables: { kv: [{ key: 'settings', value: { startDate: '2026-11-23', examDate: '2027-11-20', firstUseDate: null, lastBackupAt: 5 } }] } };
    expect(parseBackup(JSON.stringify(goodKv)).ok).toBe(true);
  });
  it('upgradeBackup is a no-op for the current schema and refuses unknown older versions', () => {
    const f = { app: BACKUP_APP_ID, schemaVersion: BACKUP_SCHEMA_VERSION, tables: {} };
    expect(upgradeBackup(f)).toBe(f);
    expect(() => upgradeBackup({ ...f, schemaVersion: 0 })).toThrow();
  });
  it('backup reminders', () => {
    const base = { daysBetween, snoozedUntil: null, frequency: 'weekly' as const };
    expect(backupReminder({ ...base, today: '2026-11-25', firstUseDate: '2026-11-23', lastBackupDate: null })).toBeNull();
    expect(backupReminder({ ...base, today: '2026-11-26', firstUseDate: '2026-11-23', lastBackupDate: null })?.kind).toBe('first');
    expect(backupReminder({ ...base, today: '2026-12-09', firstUseDate: '2026-11-23', lastBackupDate: '2026-12-01' })?.kind).toBe('overdue');
    expect(backupReminder({ ...base, today: '2026-12-08', firstUseDate: '2026-11-23', lastBackupDate: '2026-12-01' })).toBeNull();
  });
});

describe('quiz', () => {
  const items: QuizItem[] = [
    { id: 'a', kind: 'gap', phase: 1, cefr: 'B1', topic: 'tenses', explanation: '', prompt: 'I ___', answers: ['have lived', "'ve lived"] },
    { id: 'b', kind: 'mcq', phase: 1, cefr: 'B1', topic: 'articles', explanation: '', prompt: 'x', options: ['a', 'the'], answerIndex: 1 },
    { id: 'c', kind: 'mcq', phase: 2, cefr: 'B2', topic: 'tenses', explanation: '', prompt: 'y', options: ['a', 'b'], answerIndex: 0 },
  ];
  it('checks answers', () => {
    expect(checkAnswer(items[0], '  Have   Lived. ')).toBe(true);
    expect(checkAnswer(items[0], '’ve lived')).toBe(true);
    expect(checkAnswer(items[1], 1)).toBe(true);
    expect(checkAnswer(items[1], 0)).toBe(false);
  });
  it('selects on-topic, phase-appropriate, deterministic', () => {
    const s1 = selectQuiz({ items, topics: ['tenses'], phase: 1, seed: 'd1', size: 2 });
    expect(s1[0].id).toBe('a');
    expect(s1.map((q) => q.id)).not.toContain('c');
    expect(selectQuiz({ items, topics: ['tenses'], phase: 1, seed: 'd1', size: 2 })).toEqual(s1);
  });
});

describe('mentor', () => {
  it('monthly review window', () => {
    expect(monthlyReviewDue('2026-11-26', new Set())).toBeNull();
    expect(monthlyReviewDue('2026-11-27', new Set())?.month).toBe('2026-11');
    expect(monthlyReviewDue('2026-12-03', new Set())?.month).toBe('2026-11');
    expect(monthlyReviewDue('2026-12-04', new Set())).toBeNull();
    expect(monthlyReviewDue('2026-11-28', new Set(['2026-11']))).toBeNull();
  });
  it('missed-day messages and editing window', () => {
    expect(missedDayMessage(0, 5)).toBeNull();
    expect(missedDayMessage(1, 5)?.kind).toBe('one');
    expect(missedDayMessage(4, 5)?.kind).toBe('many');
    expect(canEditDay('2026-11-24', '2026-11-25')).toBe(true);
    expect(canEditDay('2026-11-23', '2026-11-25')).toBe(false);
  });
  it('golden rule: trigger first, else rotation', () => {
    expect(goldenRuleOfDay('2026-11-25', ['after-missed-day']).id).toBe(8);
    expect(goldenRuleOfDay('2026-11-25', []).triggers).toContain('daily-rotation');
  });
});

describe('recordings', () => {
  it('expire after 24 h', () => {
    const r = { expiresAt: 1000 + RECORDING_TTL_MS };
    expect(isExpired(r, 1000)).toBe(false);
    expect(isExpired(r, 1000 + RECORDING_TTL_MS)).toBe(true);
    expect(expiryLabel(r, 1000)).toBe('Audio deletes in 24 h');
  });
  it('prefers audio/mp4 (iOS)', () => {
    expect(pickMimeType((t) => t === 'audio/mp4' || t === 'audio/webm')).toBe('audio/mp4');
    expect(pickMimeType((t) => t === 'audio/webm')).toBe('audio/webm');
    expect(pickMimeType(() => false)).toBeNull();
  });
});
