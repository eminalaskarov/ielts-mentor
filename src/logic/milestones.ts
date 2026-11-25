/** Resolve milestone dates and visibility. Pure. */
import { MILESTONES } from '../data';
import type { AppConfig, ISODate, Milestone } from '../data';
import { addDays } from './dates';

export function resolveMilestoneDate(d: Milestone['showFrom'], config: Pick<AppConfig, 'startDate' | 'examDate'>): ISODate {
  if (typeof d === 'string') return d;
  return addDays(d.relativeTo === 'start' ? config.startDate : config.examDate, d.days);
}

export interface MilestoneView {
  milestone: Milestone;
  showFrom: ISODate;
  dueBy?: ISODate;
  overdue: boolean;
}

export interface MilestoneState {
  done: Record<string, boolean>;
  /** id → date until which the milestone is snoozed (exclusive). */
  snoozedUntil: Record<string, ISODate>;
  /** Non-action milestones dismissed by the user. */
  dismissed: Record<string, boolean>;
}

export function visibleMilestones(
  today: ISODate,
  config: Pick<AppConfig, 'startDate' | 'examDate' | 'examFormat'>,
  state: MilestoneState,
  list: Milestone[] = MILESTONES,
): MilestoneView[] {
  const out: MilestoneView[] = [];
  for (const m of list) {
    if (m.onlyForFormat && m.onlyForFormat !== config.examFormat) continue;
    const showFrom = resolveMilestoneDate(m.showFrom, config);
    if (today < showFrom) continue;
    if (state.done[m.id] || state.dismissed[m.id]) continue;
    const snooze = state.snoozedUntil[m.id];
    if (snooze && today < snooze) continue;
    const dueBy = m.dueBy ? resolveMilestoneDate(m.dueBy, config) : undefined;
    // Non-action milestones are shown for 14 days only.
    if (!m.requiresAction && today > addDays(showFrom, 14)) continue;
    out.push({ milestone: m, showFrom, dueBy, overdue: !!dueBy && today > dueBy });
  }
  return out;
}
