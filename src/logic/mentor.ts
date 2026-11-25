/** Mentor layer rules (golden rule of the day, missed-day messages, reminders). Pure. */
import { GOLDEN_RULES, MENTOR_RULES } from '../data';
import type { Checkpoint, GoldenRule, ISODate, PhaseId, RuleTrigger, Weekday } from '../data';
import { addDays, daysBetween, lastFridayOfMonth, monthKey } from './dates';

/** Golden rule for today: first rule whose trigger matches the context; else daily rotation. */
export function goldenRuleOfDay(date: ISODate, triggers: RuleTrigger[]): GoldenRule {
  for (const t of triggers) {
    const r = GOLDEN_RULES.find((g) => g.triggers.includes(t));
    if (r) return r;
  }
  const rot = GOLDEN_RULES.filter((g) => g.triggers.includes('daily-rotation'));
  const i = ((daysBetween('2026-01-01', date) % rot.length) + rot.length) % rot.length;
  return rot[i];
}

export function ruleById(id: number): GoldenRule {
  return GOLDEN_RULES.find((g) => g.id === id) ?? GOLDEN_RULES[0];
}

const N2 = MENTOR_RULES.find((r) => r.id === 'never-two-in-a-row')!;

export interface MissedMessage {
  kind: 'one' | 'two' | 'many';
  title: string;
  body: string;
  /** Offer the "minimum day" (first block + word cards). */
  offerMinimumDay: boolean;
}

/** ux-spec 5.2 copy + mentor rule messages. missedRun = consecutive missed days ending yesterday. */
export function missedDayMessage(missedRun: number, dayNumber: number): MissedMessage | null {
  if (missedRun <= 0) return null;
  if (missedRun === 1)
    return {
      kind: 'one',
      title: 'You missed yesterday. That’s okay.',
      body: 'Doing something today keeps your streak safe. Just don’t miss two days in a row.',
      offerMinimumDay: true,
    };
  if (missedRun === 2)
    return { kind: 'two', title: 'Welcome back. Let’s restart gently.', body: N2.messages.afterTwoOrMore, offerMinimumDay: true };
  return {
    kind: 'many',
    title: 'Welcome back.',
    body: `We’ll skip the backlog. Today is Day ${dayNumber} of the plan. Start with one block.`,
    offerMinimumDay: true,
  };
}

export interface CheckpointReminder {
  checkpoint: Checkpoint;
  state: 'upcoming' | 'today' | 'open' | 'missed';
  daysTo: number;
}

/**
 * Rule "checkpoint-due": remind from 7 days before; "open" while inside the window without a result;
 * "missed" for 14 days after the window if nothing was logged.
 */
export function checkpointReminder(today: ISODate, cps: Checkpoint[], loggedIds: Set<string>, remindDaysBefore = 7): CheckpointReminder | null {
  for (const c of cps) {
    if (c.useExamDate) continue;
    if (loggedIds.has(c.id)) continue;
    const daysTo = daysBetween(today, c.date);
    if (daysTo === 0) return { checkpoint: c, state: 'today', daysTo };
    if (daysTo > 0 && daysTo <= remindDaysBefore) return { checkpoint: c, state: 'upcoming', daysTo };
    if (today >= c.window.start && today <= c.window.end) return { checkpoint: c, state: 'open', daysTo };
    if (today > c.window.end && daysBetween(c.window.end, today) <= 14) return { checkpoint: c, state: 'missed', daysTo };
  }
  return null;
}

/** Next checkpoint on or after today (including the exam). */
export function nextCheckpoint(today: ISODate, cps: Checkpoint[]): Checkpoint | null {
  return cps.filter((c) => c.date >= today).sort((a, b) => (a.date < b.date ? -1 : 1))[0] ?? null;
}

/**
 * Monthly mistake review: due on the last Friday of the month, visible for 7 days (may cross into the
 * next month). Returns the month key it belongs to, or null.
 */
export function monthlyReviewDue(today: ISODate, doneMonths: Set<string>, visibleDays = 7): { month: string; due: ISODate } | null {
  const candidates = [lastFridayOfMonth(today), lastFridayOfMonth(addDays(`${monthKey(today)}-01`, -1))];
  for (const due of candidates) {
    const d = daysBetween(due, today);
    if (d >= 0 && d < visibleDays && !doneMonths.has(monthKey(due))) return { month: monthKey(due), due };
  }
  return null;
}

const FQ = MENTOR_RULES.find((r) => r.id === 'feedback-quota')!;

/** Rule "feedback-quota" (phase 3+): remind from Thursday when a weekly count is 0. */
export function feedbackQuotaMessage(phase: PhaseId | null, weekday: Weekday, essays: number, speaking: number): string | null {
  if (!phase || phase < Number(FQ.params.fromPhase ?? 3)) return null;
  if (!['thu', 'fri', 'sat', 'sun'].includes(weekday)) return null;
  if (essays > 0 && speaking > 0) return null;
  return FQ.messages.remind.replace('{essays}', String(essays)).replace('{speaking}', String(speaking));
}

/** Rule "no-catch-up": ticking is allowed only for today and yesterday. */
export function canEditDay(date: ISODate, today: ISODate): boolean {
  const d = daysBetween(date, today);
  return d === 0 || d === 1;
}
