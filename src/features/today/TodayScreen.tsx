import { useMemo, useState } from 'react';
import { plural } from '../../logic/text';
import { useLiveQuery } from 'dexie-react-hooks';
import { PHASE_BY_ID, resolvePhaseRanges } from '../../data';
import type { ISODate, RuleTrigger } from '../../data';
import { useApp } from '../../app/AppContext';
import { navigate } from '../../app/router';
import { db, kvSet, updateSettings } from '../../db/db';
import { setBlockDone, updateMilestones } from '../../db/actions';
import { EMPTY_MILESTONES } from '../../db/actions';
import { useKV } from '../../state/hooks';
import { addDays, bakuDate, daysBetween, formatDate, formatMinutes, formatShort, mondayOf, relativeDays } from '../../logic/dates';
import { countableBlocks, plannedMinutes, resolveDay, resolvedCheckpoints, SKILL_LABEL } from '../../logic/plan';
import type { PlanBlock } from '../../logic/plan';
import { checkpointReminder, feedbackQuotaMessage, goldenRuleOfDay, missedDayMessage, monthlyReviewDue, nextCheckpoint } from '../../logic/mentor';
import { visibleMilestones } from '../../logic/milestones';
import type { MilestoneState } from '../../logic/milestones';
import { backupReminder } from '../../logic/backup';
import { isKept } from '../../logic/streak';
import { BackupFlow } from '../settings/BackupFlow';
import { LargeHeader, ProgressBar, Ring, Screen, Sheet, SkillTile } from '../../ui/components';
import { Icon, skillVar } from '../../ui/Icon';
import { BlockSheet } from './BlockSheet';

function isStandalone(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function TodayScreen() {
  const { state, stale, refreshDay, toast } = useApp();
  const { day, settings, today, streak, queue, doneToday } = state;
  const [openBlock, setOpenBlock] = useState<{ block: PlanBlock; date: ISODate } | null>(null);
  const [showFull, setShowFull] = useState(false);
  const [yesterdayOpen, setYesterdayOpen] = useState(false);

  const tipDismissed = useKV<string | null>('ui:tipDismissed', null);
  const milestones = useKV<MilestoneState>('milestones', EMPTY_MILESTONES);
  const backupSnooze = useKV<string | null>('ui:backupSnooze', null);
  const installHintAt = useKV<string | null>('ui:installHintAt', null);
  const reviewDone = useKV<string[]>('mistakeReviewDone', []);
  const dismissedCards = useKV<Record<string, string>>('ui:dismissedCards', {});
  const yesterdayHintSeen = useKV<string | null>('ui:yesterdayHint', null);

  const quizToday = useLiveQuery(() => db.quizAttempts.where('date').equals(today).toArray(), [today]);
  const weekStart = mondayOf(today);
  const essaysWeek = useLiveQuery(() => db.essays.where('date').aboveOrEqual(weekStart).toArray(), [weekStart]);
  const liveWeek = useLiveQuery(() => db.liveSessions.where('date').aboveOrEqual(weekStart).count(), [weekStart]);
  const mistakeCount = useLiveQuery(() => db.mistakes.count(), []);

  const config = { startDate: settings.startDate, examDate: settings.examDate, examFormat: settings.examFormat };
  const cps = useMemo(() => resolvedCheckpoints(config), [settings.startDate, settings.examDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const blocks = day.blocks;
  const countable = countableBlocks(day);
  const doneCount = countable.filter((b) => doneToday.has(b.id)).length;
  const allDone = countable.length > 0 && doneCount === countable.length;
  const nextBlock = blocks.find((b) => !doneToday.has(b.id) && b.skill !== 'rest' && !b.extra);
  const totalMin = plannedMinutes(blocks);
  const doneMinutes = (state.logsByDate.get(today) ?? []).filter((l) => l.done).reduce((s, l) => s + l.minutes, 0);
  const missed = missedDayMessage(doneCount === 0 ? streak.missedRun : 0, day.dayNumber);
  const easyRestart = !!missed && missed.kind !== 'one' && doneCount === 0 && day.kind === 'study';
  const shownBlocks = easyRestart && !showFull ? blocks.filter((b) => b === nextBlock || b.action === 'review') : blocks;

  const dueWords = queue.due.length;
  const freshWords = queue.fresh.length;
  const quizDone = (quizToday ?? []).some((a) => (a.kind === 'daily' || a.kind === 'mini') && a.finishedAt);

  // Golden rule of the day
  const triggers: RuleTrigger[] = [];
  if (streak.missedRun > 0) triggers.push('after-missed-day');
  const phaseRange = day.phase ? resolvePhaseRanges(settings)[day.phase] : null;
  if (phaseRange && phaseRange.start === today) triggers.push('phase-start');
  if (day.kind === 'rest') triggers.push('rest-day');
  if (blocks.some((b) => b.displaySkill === 'speaking')) triggers.push('speaking-block');
  if ((day.phase ?? 0) >= 3 && blocks.some((b) => b.displaySkill === 'writing')) triggers.push('writing-block');
  const rule = goldenRuleOfDay(today, triggers);

  const cpReminder = checkpointReminder(today, cps, state.checkpointsLogged);
  const nextCp = nextCheckpoint(today, cps);
  const ms = visibleMilestones(today, config, milestones).slice(0, 2);
  const monthly = (mistakeCount ?? 0) > 0 ? monthlyReviewDue(today, new Set(reviewDone)) : null;
  const essaysChecked = (essaysWeek ?? []).filter((e) => e.feedbackReceived).length;
  const fq = feedbackQuotaMessage(day.phase, day.weekday, essaysChecked, liveWeek ?? 0);
  const backup = backupReminder({
    today,
    firstUseDate: settings.firstUseDate,
    lastBackupDate: settings.lastBackupAt ? bakuDate(settings.lastBackupAt) : null,
    frequency: settings.backupFrequency,
    snoozedUntil: backupSnooze,
    daysBetween,
  });
  const showInstall = !isStandalone() && (!installHintAt || daysBetween(installHintAt, today) >= 7);
  const dismissed = (id: string) => dismissedCards[id] === today;
  const dismiss = (id: string) => void kvSet('ui:dismissedCards', { ...dismissedCards, [id]: today });

  // Yesterday (forgot to tick) — allowed by rule no-catch-up; phase 1–2, shown once per day.
  const yesterday = addDays(today, -1);
  const yDay = useMemo(() => resolveDay(yesterday, settings, state.ctx), [yesterday, settings, state.ctx]);
  const yDone = new Set((state.logsByDate.get(yesterday) ?? []).filter((l) => l.done).map((l) => l.blockId));
  const yLeft = countableBlocks(yDay).filter((b) => !yDone.has(b.id));
  const showYesterday = yDay.kind === 'study' && (yDay.phase ?? 3) <= 2 && yLeft.length > 0 && yLeft.length < countableBlocks(yDay).length && yesterdayHintSeen !== today;

  const toggle = async (b: PlanBlock, date: ISODate, isDone: boolean) => {
    await setBlockDone(date, b, !isDone);
    if (!isDone) {
      toast('Marked done.', { label: 'Undo', run: () => void setBlockDone(date, b, false) });
      if (date === today && settings.firstUseDate === null) void updateSettings({ firstUseDate: today });
    }
  };

  const phaseName = day.phase ? PHASE_BY_ID[day.phase].name : '';
  const subtitle =
    day.kind === 'pre-start'
      ? `${formatDate(today)} · Before your plan`
      : day.kind === 'post-exam'
        ? `${formatDate(today)} · After the exam`
        : `${formatDate(today)} · ${day.label}`;

  return (
    <Screen>
      <LargeHeader
        title="Today"
        subtitle={subtitle}
        right={
          <button className="icon-btn" onClick={() => navigate('/today/settings')} aria-label="Settings">
            <Icon name="gear" />
          </button>
        }
      />
      <div className="stack">
        {stale && (
          <button className="pill" onClick={refreshDay} style={{ alignSelf: 'center' }}>
            <Icon name="refresh" size={16} /> It’s a new day. Refresh Today
          </button>
        )}

        {missed && day.kind !== 'pre-start' && day.kind !== 'post-exam' && !dismissed('missed') && (
          <div className="card stack" style={{ borderLeft: `4px solid ${skillVar('rest')}` }}>
            <p className="headline">{missed.title}</p>
            <p className="callout">{missed.body}</p>
            <div className="row wrap">
              <button className="btn small" onClick={() => navigate('/review')}>Do a 15-min review</button>
              <button className="btn plain small" onClick={() => dismiss('missed')}>Hide</button>
            </div>
          </div>
        )}

        {day.kind === 'pre-start' && (
          <div className="card stack">
            <p className="title2">Your plan starts on {formatDate(settings.startDate)} ({relativeDays(today, settings.startDate)}).</p>
            <p className="callout">{PHASE_BY_ID[1].summary}</p>
            <p className="subhead">Word cards already work. You can review now.</p>
            <button className="btn" onClick={() => setShowFull(!showFull)}>{showFull ? 'Hide' : 'Preview'} Day 1</button>
            {showFull &&
              resolveDay(settings.startDate, settings, state.ctx).blocks.map((b) => (
                <div key={b.id} className="row">
                  <SkillTile skill={b.displaySkill} size={30} />
                  <span>{b.title} · {formatMinutes(b.minutes)}</span>
                </div>
              ))}
          </div>
        )}

        {day.kind === 'post-exam' && (
          <div className="card stack">
            <p className="title2">Your exam date has passed. How did it go?</p>
            <button className="btn primary" onClick={() => navigate('/practice/tests?add=1&official=1')}>Add my result</button>
            <button className="btn" onClick={() => navigate('/today/settings/dates')}>Plan a retake</button>
            <p className="footnote">If one part is lower than you need, check if your centre offers One Skill Retake. Your data stays here.</p>
          </div>
        )}

        {day.kind === 'final-week' && day.finalWeekStage && (
          <div className="card stack" style={{ borderLeft: `4px solid ${skillVar('test')}` }}>
            <p className="title2">{day.finalWeekStage.title}</p>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {day.finalWeekStage.todo.map((t) => <li key={t}>{t}</li>)}
            </ul>
            {day.finalWeekStage.avoid.map((t) => <p key={t} className="subhead">{t}</p>)}
          </div>
        )}

        {cpReminder && !dismissed(`cp-${cpReminder.checkpoint.id}`) && (
          <div className="card stack" style={{ borderLeft: `4px solid ${skillVar('test')}` }}>
            <p className="headline">
              {cpReminder.state === 'missed'
                ? 'You have not logged your checkpoint test yet.'
                : cpReminder.state === 'today'
                  ? `Checkpoint today: ${cpReminder.checkpoint.label}`
                  : cpReminder.state === 'upcoming'
                    ? `Checkpoint in ${plural(cpReminder.daysTo, 'day')}`
                    : `Checkpoint week: ${cpReminder.checkpoint.label}`}
            </p>
            <p className="callout">Target ~{cpReminder.checkpoint.targetBand.min.toFixed(1)}. {cpReminder.checkpoint.howToCheck}</p>
            {cpReminder.state === 'missed' && <p className="subhead">Do it on your next study day.</p>}
            <div className="row wrap">
              <button className="btn small" onClick={() => navigate(`/practice/tests?add=1&cp=${cpReminder.checkpoint.id}`)}>Log result</button>
              <button className="btn plain small" onClick={() => dismiss(`cp-${cpReminder.checkpoint.id}`)}>Later</button>
            </div>
          </div>
        )}

        {state.weak.weakSkill && !dismissed('focus') && day.kind !== 'pre-start' && (
          <div className="card stack" style={{ borderLeft: `4px solid ${skillVar(state.weak.weakSkill)}` }}>
            <p className="headline">Focus: {SKILL_LABEL[state.weak.weakSkill]}</p>
            <p className="callout">
              {SKILL_LABEL[state.weak.weakSkill]} is your lowest skill right now ({(state.weak.target - (state.weak.gaps[state.weak.weakSkill] ?? 0)).toFixed(1)}, target {state.weak.target.toFixed(1)}).
              Some free blocks now include extra {SKILL_LABEL[state.weak.weakSkill]} practice until the next checkpoint.
            </p>
            {state.weak.bigGap && <p className="subhead">Your result is quite far from the target. Ask a teacher for advice, and check if your exam date is still realistic.</p>}
            <div className="row wrap">
              <button className="btn small" onClick={() => navigate('/progress?seg=skills')}>See skills</button>
              <button className="btn plain small" onClick={() => dismiss('focus')}>Not now</button>
            </div>
          </div>
        )}

        {(day.kind === 'study' || day.kind === 'final-week') && countable.length > 0 && (
          <div className="card stack">
            <div className="row">
              <Ring value={countable.length ? doneCount / countable.length : 0} label={`${doneCount} of ${plural(countable.length, 'block')} done`} />
              <div style={{ flex: 1 }}>
                <p className="headline">{allDone ? 'All done for today' : 'Today’s plan'}</p>
                <p className="subhead">
                  {allDone
                    ? `${formatMinutes(doneMinutes)} studied. See you tomorrow.`
                    : `${doneCount} of ${plural(countable.length, 'block')} done · ~${formatMinutes(totalMin)}`}
                </p>
              </div>
            </div>
            {easyRestart && !showFull && <p className="callout">Easy restart: about {formatMinutes((nextBlock?.minutes ?? 0) + 15)} today. The first block and your word cards.</p>}
            {nextBlock && (
              <button className="btn primary" onClick={() => setOpenBlock({ block: nextBlock, date: today })}>
                <Icon name="play" size={18} /> Start: {SKILL_LABEL[nextBlock.displaySkill]}{nextBlock.minutes ? ` · ${formatMinutes(nextBlock.minutes)}` : ''}
              </button>
            )}
            {allDone && (
              <p className="footnote">
                Tomorrow: {resolveDay(addDays(today, 1), settings, state.ctx).blocks.filter((b) => b.skill !== 'rest').map((b) => SKILL_LABEL[b.displaySkill]).join(' · ') || 'Rest'}
              </p>
            )}
          </div>
        )}

        {day.kind === 'rest' && (
          <div className="card stack" style={{ borderLeft: `4px solid ${skillVar('rest')}` }}>
            <div className="row">
              <SkillTile skill="rest" />
              <div>
                <p className="headline">Rest day</p>
                <p className="callout">{day.autoKept ? 'Full rest today. Fatigue slows learning. See you tomorrow.' : 'Your brain grows while you rest.'}</p>
              </div>
            </div>
          </div>
        )}

        {shownBlocks.length > 0 && day.kind !== 'pre-start' && (
          <div className="stack" style={{ gap: 8 }}>
            {shownBlocks.filter((b) => !(b.skill === 'rest' && day.kind === 'rest')).map((b) => (
              <BlockCard
                key={b.id}
                block={b}
                done={doneToday.has(b.id)}
                isNext={b === nextBlock}
                doneDetail={(state.logsByDate.get(today) ?? []).find((l) => l.blockId === b.id && l.done)?.detail}
                onOpen={() => setOpenBlock({ block: b, date: today })}
                onToggle={() => void toggle(b, today, doneToday.has(b.id))}
              />
            ))}
            {easyRestart && (
              <button className="btn plain" onClick={() => setShowFull(!showFull)}>{showFull ? 'Show the easy restart' : 'Show the full plan'}</button>
            )}
          </div>
        )}

        {showYesterday && (
          <button className="list-row card" onClick={() => setYesterdayOpen(true)} style={{ borderRadius: 16 }}>
            <span className="main subhead">Yesterday: {plural(yLeft.length, 'block')} not ticked. Forgot to tick?</span>
            <Icon name="chevron" size={18} className="chev" />
          </button>
        )}

        {day.kind !== 'post-exam' && (
          <button className="list-row card" style={{ borderRadius: 16 }} onClick={() => navigate('/quiz/daily')}>
            <SkillTile skill="grammar" />
            <span className="main">
              <span className="headline" style={{ display: 'block' }}>Daily quiz</span>
              <span className="subhead">{quizDone ? 'Done today. Try more?' : '5 questions · about 4 min'}</span>
            </span>
            {quizDone ? <Icon name="check" className="chev" /> : <Icon name="chevron" size={18} className="chev" />}
          </button>
        )}

        <button className="list-row card" style={{ borderRadius: 16 }} onClick={() => navigate(dueWords + freshWords > 0 ? '/review' : '/words')}>
          <SkillTile skill="vocabulary" />
          <span className="main">
            <span className="headline" style={{ display: 'block' }}>Words due: {plural(dueWords, 'card')}</span>
            <span className="subhead">
              {freshWords > 0 ? `+ ${freshWords} new · ` : ''}
              {state.pauseNew ? 'Review only today' : state.reviewDates.has(today) ? 'Reviewed today' : 'Every day, even on rest days'}
            </span>
          </span>
          <Icon name="chevron" size={18} className="chev" />
        </button>

        {/* Progress strip */}
        {day.kind !== 'pre-start' && (
          <div className="card stack">
            <div className="row">
              <Icon name="chain" />
              <p className="headline" style={{ flex: 1 }}>
                {plural(streak.current, 'day')}
                {streak.onHold && <span className="subhead"> · on hold</span>}
              </p>
              <span className="footnote">Best: {streak.best}</span>
            </div>
            <WeekDots />
            {streak.onHold && <p className="footnote">1 day off is okay. 2 in a row resets your streak.</p>}
            {streak.saved && <p className="footnote">Streak saved. You came back after one missed day.</p>}
            {streak.current === 0 && streak.best > 0 && streak.missedRun >= 2 && <p className="footnote">New streak starts today. Your best is {plural(streak.best, 'day')}.</p>}
            {day.phase && phaseRange && (
              <>
                <hr className="sep" />
                <p className="subhead">
                  Phase {day.phase} · {phaseName} · {Math.round((100 * (daysBetween(phaseRange.start, today) + 1)) / (daysBetween(phaseRange.start, phaseRange.end) + 1))}%
                  {nextCp ? ` · ${plural(daysBetween(today, nextCp.date), 'day')} to ${nextCp.useExamDate ? 'the exam' : nextCp.label}` : ''}
                </p>
                <ProgressBar value={(daysBetween(phaseRange.start, today) + 1) / (daysBetween(phaseRange.start, phaseRange.end) + 1)} />
              </>
            )}
          </div>
        )}

        {monthly && (
          <div className="card stack" style={{ borderLeft: `4px solid ${skillVar('test')}` }}>
            <p className="headline">Monthly mistakes review · {plural(mistakeCount ?? 0, 'mistake')} · 10–20 min</p>
            <p className="callout">Look at your notebook: which mistakes come back again and again?</p>
            <button className="btn small" onClick={() => navigate('/mistakes-review')}>Start review</button>
          </div>
        )}

        {fq && !dismissed('fq') && (
          <div className="card stack">
            <p className="headline">Get feedback this week</p>
            <p className="callout">{fq}</p>
            <div className="row wrap">
              <button className="btn small" onClick={() => navigate('/practice/speaking?live=1')}>Log a session</button>
              <button className="btn plain small" onClick={() => dismiss('fq')}>Hide</button>
            </div>
          </div>
        )}

        {ms.map((m) => (
          <div key={m.milestone.id} className={`card stack${m.overdue ? ' tinted-warning' : ''}`}>
            <p className="headline">{m.milestone.title}</p>
            <p className="callout">{m.milestone.description}</p>
            {m.dueBy && <p className="footnote">{m.overdue ? 'Overdue · ' : ''}Do by {formatShort(m.dueBy)}</p>}
            <div className="row wrap">
              {m.milestone.requiresAction ? (
                <>
                  <button className="btn small" onClick={() => void updateMilestones((s) => ({ ...s, done: { ...s.done, [m.milestone.id]: true } }))}>Mark as done</button>
                  <button className="btn plain small" onClick={() => void updateMilestones((s) => ({ ...s, snoozedUntil: { ...s.snoozedUntil, [m.milestone.id]: addDays(today, 3) } }))}>Remind me in 3 days</button>
                </>
              ) : (
                <button className="btn small" onClick={() => void updateMilestones((s) => ({ ...s, dismissed: { ...s.dismissed, [m.milestone.id]: true } }))}>Got it</button>
              )}
              {['ms-university-requirements', 'ms-application-deadlines', 'ms-register-exam'].includes(m.milestone.id) && (
                <button className="btn plain small" onClick={() => navigate('/today/settings/dates')}>Open settings</button>
              )}
            </div>
          </div>
        ))}

        {tipDismissed !== today && (
          <div className="card stack">
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <Icon name="star" />
              <div style={{ flex: 1 }}>
                <p className="headline">Golden rule {rule.id}: {rule.title}</p>
                <p className="callout">{rule.text}</p>
              </div>
            </div>
            <div className="row">
              <button className="btn plain small" onClick={() => void kvSet('ui:tipDismissed', today)}>Got it</button>
              <span className="spacer" />
              <button className="btn plain small" onClick={() => navigate('/today/rules')}>All rules</button>
            </div>
          </div>
        )}

        {backup && (
          <div className={`card stack${backup.urgent ? ' tinted-warning' : ''}`}>
            <p className="headline">{backup.kind === 'first' ? 'Make your first backup. It takes 20 seconds.' : `Last backup was ${plural(backup.days, 'day')} ago.`}</p>
            <p className="callout">Your data lives only on this iPhone. Save a backup file in Files or iCloud Drive.</p>
            <div className="row wrap">
              <BackupFlow small />
              <button className="btn plain small" onClick={() => void kvSet('ui:backupSnooze', addDays(today, 1))}>Remind me tomorrow</button>
            </div>
          </div>
        )}

        {showInstall && (
          <div className="card stack">
            <p className="headline">Add IELTS Mentor to your Home Screen</p>
            <p className="callout">In Safari, tap the Share button, then “Add to Home Screen”. The app opens full screen, works offline, and your data is safer.</p>
            <button className="btn plain small" onClick={() => void kvSet('ui:installHintAt', today)}>Got it</button>
          </div>
        )}
      </div>

      {openBlock && (
        <BlockSheet
          block={openBlock.block}
          date={openBlock.date}
          done={(state.logsByDate.get(openBlock.date) ?? []).some((l) => l.blockId === openBlock.block.id && l.done)}
          minutesLogged={(state.logsByDate.get(openBlock.date) ?? []).find((l) => l.blockId === openBlock.block.id)?.minutes}
          onClose={() => setOpenBlock(null)}
        />
      )}

      <Sheet open={yesterdayOpen} onClose={() => { setYesterdayOpen(false); void kvSet('ui:yesterdayHint', today); }} title={`Yesterday · ${formatDate(yesterday)}`}>
        <div className="stack" style={{ gap: 8 }}>
          <p className="subhead">You can tick blocks you did yesterday but forgot to mark. Don’t do them now as extra work — just continue with today.</p>
          {countableBlocks(yDay).map((b) => (
            <BlockCard key={b.id} block={b} done={yDone.has(b.id)} onOpen={() => {}} onToggle={() => void toggle(b, yesterday, yDone.has(b.id))} />
          ))}
        </div>
      </Sheet>
    </Screen>
  );
}

function WeekDots() {
  const { state } = useApp();
  const days = Array.from({ length: 7 }, (_, i) => addDays(state.today, i - 6));
  return (
    <div className="dots" role="list" aria-label="Last 7 days">
      {days.map((d) => {
        const s = state.statuses.get(d);
        const kept = s ? isKept(s) : false;
        const isToday = d === state.today;
        const label = `${formatDate(d)}: ${kept ? 'kept' : s === 'missed' ? 'missed' : isToday ? 'today' : s === 'kept-rest' ? 'rest' : 'not counted'}`;
        return (
          <span
            key={d}
            role="listitem"
            aria-label={label}
            className="d"
            style={{
              background: kept ? 'var(--accent)' : 'transparent',
              border: isToday && !kept ? '2px solid var(--accent)' : kept ? 'none' : '1px solid var(--separator)',
              color: kept ? 'var(--on-accent)' : undefined,
            }}
          >
            {s === 'missed' ? '–' : formatDate(d).slice(0, 1)}
          </span>
        );
      })}
    </div>
  );
}

export function BlockCard({ block, done, isNext, onOpen, onToggle, doneDetail }: { block: PlanBlock; done: boolean; isNext?: boolean; onOpen: () => void; onToggle: () => void; doneDetail?: string }) {
  const color = skillVar(block.displaySkill);
  const minutes = block.minutes === 0 ? '' : block.minutesMax ? `${block.minutes}–${block.minutesMax} min` : formatMinutes(block.minutes);
  return (
    <div className={`block-card${done ? ' done' : ''}`}>
      <span className="accent" style={{ background: color }} />
      <button className="body" onClick={onOpen} aria-label={`${SKILL_LABEL[block.displaySkill]}: ${block.title}. ${minutes}. ${done ? 'Done' : 'Not done'}. Open details`}>
        <SkillTile skill={block.displaySkill} />
        <span className="text">
          <span className="row" style={{ gap: 8 }}>
            <span className="headline" style={{ color }}>{SKILL_LABEL[block.displaySkill]}</span>
            <span className="subhead" style={{ whiteSpace: 'nowrap' }}>{minutes}</span>
            {block.extra && <span className="footnote">Extra</span>}
            {isNext && !done && <span className="footnote" style={{ color: 'var(--accent)' }}>Next</span>}
          </span>
          <span style={{ display: 'block' }}>{done ? `Done · ${block.title}` : block.title === SKILL_LABEL[block.displaySkill] ? block.task : `${block.title}: ${block.task}`}</span>
          {(done ? (doneDetail ?? block.detail) : block.detail) && <span className="subhead" style={{ display: 'block' }}>{done ? (doneDetail ?? block.detail) : block.detail}</span>}
        </span>
      </button>
      {block.skill !== 'rest' && (
        <button className={`check${done ? ' on' : ''}`} onClick={onToggle} role="checkbox" aria-checked={done} aria-label={`Mark ${block.title} as ${done ? 'not done' : 'done'}`} style={{ color }}>
          <span className="circle" style={done ? { background: color, color: 'var(--on-skill)' } : undefined}>
            {done && <Icon name="check" size={18} stroke={2.5} />}
          </span>
        </button>
      )}
    </div>
  );
}
