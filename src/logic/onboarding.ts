/** Onboarding date rules. Pure. */
import { isISODate } from './dates';

/** The start date onboarding saves: a past date with "Start from Day 1 today" becomes today. */
export function effectiveStartDate(start: string, late: 'calendar' | 'day1', today: string): string {
  return isISODate(start) && start < today && late === 'day1' ? today : start;
}

/** Both dates valid and the saved start date strictly before the exam date. */
export function onboardingDatesValid(start: string, exam: string, late: 'calendar' | 'day1', today: string): boolean {
  const s = effectiveStartDate(start, late, today);
  return isISODate(s) && isISODate(exam) && s < exam;
}
