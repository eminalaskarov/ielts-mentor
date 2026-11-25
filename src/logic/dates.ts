/**
 * Date helpers. All calendar logic uses ISO "YYYY-MM-DD" strings that represent local dates in Asia/Baku
 * (UTC+4 all year, no DST). Arithmetic is done in UTC on those strings, so it is independent of the
 * device time zone.
 */
import { BAKU_UTC_OFFSET_MINUTES, WEEKDAY_BY_JS_DAY } from '../data';
import type { ISODate, Weekday } from '../data';

const DAY_MS = 86_400_000;

/** Local Asia/Baku calendar date for an instant. */
export function bakuDate(now: Date | number = Date.now()): ISODate {
  const ms = typeof now === 'number' ? now : now.getTime();
  return new Date(ms + BAKU_UTC_OFFSET_MINUTES * 60_000).toISOString().slice(0, 10);
}

/** Local Asia/Baku "HH:MM" for an instant. */
export function bakuTime(now: Date | number = Date.now()): string {
  const ms = typeof now === 'number' ? now : now.getTime();
  return new Date(ms + BAKU_UTC_OFFSET_MINUTES * 60_000).toISOString().slice(11, 16);
}

/** Epoch ms of local midnight (start of day) in Baku for an ISO date. */
export function bakuMidnightMs(date: ISODate): number {
  return toUtcMs(date) - BAKU_UTC_OFFSET_MINUTES * 60_000;
}

export function isISODate(s: unknown): s is ISODate {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function toUtcMs(date: ISODate): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUtcMs(ms: number): ISODate {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(date: ISODate, days: number): ISODate {
  return fromUtcMs(toUtcMs(date) + days * DAY_MS);
}

/** b − a in whole days (positive if b is later). */
export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((toUtcMs(b) - toUtcMs(a)) / DAY_MS);
}

/** 0 = Sunday … 6 = Saturday (JS convention). */
export function jsDay(date: ISODate): number {
  return new Date(toUtcMs(date)).getUTCDay();
}

export function weekdayOf(date: ISODate): Weekday {
  return WEEKDAY_BY_JS_DAY[jsDay(date)];
}

/** Monday of the Monday–Sunday week containing date. */
export function mondayOf(date: ISODate): ISODate {
  const offset = (jsDay(date) + 6) % 7; // Mon=0 … Sun=6
  return addDays(date, -offset);
}

/** Whole weeks between the Monday-weeks of a and b (b − a). */
export function weeksBetween(a: ISODate, b: ISODate): number {
  return Math.floor(daysBetween(mondayOf(a), mondayOf(b)) / 7);
}

export function lastDayOfMonth(date: ISODate): ISODate {
  const [y, m] = date.split('-').map(Number);
  return fromUtcMs(Date.UTC(y, m, 0));
}

/** Last Friday of the month containing date. */
export function lastFridayOfMonth(date: ISODate): ISODate {
  const last = lastDayOfMonth(date);
  const back = (jsDay(last) - 5 + 7) % 7;
  return addDays(last, -back);
}

export function monthKey(date: ISODate): string {
  return date.slice(0, 7);
}

/** Inclusive list of dates from a to b. Empty if b < a. */
export function dateRange(a: ISODate, b: ISODate): ISODate[] {
  const out: ISODate[] = [];
  const n = daysBetween(a, b);
  for (let i = 0; i <= n; i++) out.push(addDays(a, i));
  return out;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** "Tue, 24 Nov" (withYear → "Tue, 24 Nov 2026"). */
export function formatDate(date: ISODate, withYear = false): string {
  const [y, m, d] = date.split('-').map(Number);
  return `${WD[jsDay(date)]}, ${d} ${MONTHS[m - 1]}${withYear ? ` ${y}` : ''}`;
}

/** "24 Nov 2026" */
export function formatShort(date: ISODate, withYear = true): string {
  const [y, m, d] = date.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}${withYear ? ` ${y}` : ''}`;
}

export function formatMonthYear(date: ISODate): string {
  const [y, m] = date.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/** "2 h 10 min", "45 min". */
export function formatMinutes(min: number): string {
  const m = Math.max(0, Math.round(min));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r} min`;
  if (r === 0) return `${h} h`;
  return `${h} h ${r} min`;
}

/** "mm:ss" or "h:mm:ss". Negative values are clamped to 0. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Human "in 3 days" / "today" / "3 days ago". */
export function relativeDays(from: ISODate, to: ISODate): string {
  const n = daysBetween(from, to);
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  if (n === -1) return 'yesterday';
  return n > 0 ? `in ${n} day${n === 1 ? '' : 's'}` : `${-n} day${n === -1 ? '' : 's'} ago`;
}
