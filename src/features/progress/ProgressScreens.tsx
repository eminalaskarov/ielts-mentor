import { useMemo, useState } from 'react';
import { plural } from '../../logic/text';
import { useLiveQuery } from 'dexie-react-hooks';
import { MILESTONES, PHASES, resolvePhaseRanges } from '../../data';
import type { ExamSkill, Skill } from '../../data';
import { db } from '../../db/db';
import { useApp } from '../../app/AppContext';
import { navigate, useRoute } from '../../app/router';
import { addDays, bakuDate, daysBetween, formatMinutes, formatMonthYear, formatShort, mondayOf, relativeDays } from '../../logic/dates';
import { resolvedCheckpoints, SKILL_LABEL } from '../../logic/plan';
import { checkpointResultBand, checkpointStatus, EXAM_SKILLS, overallOf, partialAverage, skillEstimates } from '../../logic/assessment';
import { deckCounts } from '../../logic/deck';
import { isKept } from '../../logic/streak';
import { resolveMilestoneDate } from '../../logic/milestones';
import type { MilestoneState } from '../../logic/milestones';
import { EMPTY_MILESTONES } from '../../db/actions';
import { useKV } from '../../state/hooks';
import { InlineHeader, LargeHeader, ProgressBar, Row, Screen, Segmented, SkillTile } from '../../ui/components';
import { LineChart, StackedBars } from '../../ui/charts';
import { Icon, skillVar } from '../../ui/Icon';
import { STATUS_TEXT, statusColor } from '../tests/TestLogScreens';

const STUDY_SKILLS: Skill[] = ['listening', 'reading', 'writing', 'speaking', 'grammar', 'vocabulary', 'test'];

export function ProgressScreen() {
  const { state } = useApp();
  const route = useRoute();
  const [seg, setSeg] = useState<'overview' | 'skills' | 'tests'>((route.query.get('seg') as 'skills') ?? 'overview');
  const [range, setRange] = useState<'7' | '30' | 'all'>('7');
  const tests = useLiveQuery(() => db.tests.orderBy('date').toArray(), []);
  const mistakes = useLiveQuery(() => db.mistakes.toArray(), []);
  const { settings, today, streak, day } = state;

  const logs = useMemo(() => [...state.logsByDate.values()].flat().filter((l) => l.done), [state.logsByDate]);
  const weekStart = mondayOf(today);
  const weekMin = logs.filter((l) => l.date >= weekStart).reduce((s, l) => s + l.minutes, 0);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).filter((d) => d <= today && isKept(state.statuses.get(d) ?? 'missed')).length;
  const totalMin = logs.reduce((s, l) => s + l.minutes, 0);

  const bars = useMemo(() => {
    const n = range === '7' ? 7 : range === '30' ? 30 : Math.max(7, Math.min(400, daysBetween(settings.startDate, today) + 1));
    const days = Array.from({ length: n }, (_, i) => addDays(today, i - n + 1));
    if (range === 'all' && n > 60) {
      // weekly bars
      const weeks = new Map<string, Map<Skill, number>>();
      for (const l of logs) {
        if (l.date < days[0]) continue;
        const w = mondayOf(l.date);
        const m = weeks.get(w) ?? new Map();
        m.set(l.skill, (m.get(l.skill) ?? 0) + l.minutes);
        weeks.set(w, m);
      }
      return [...weeks.entries()].sort().map(([w, m]) => ({ label: formatShort(w, false).split(' ')[0], parts: STUDY_SKILLS.map((s) => ({ skill: s, value: m.get(s) ?? 0 })) }));
    }
    return days.map((d) => {
      const dl = logs.filter((l) => l.date === d);
      return { label: n <= 7 ? formatShort(d, false).split(' ')[0] : d.slice(8), parts: STUDY_SKILLS.map((s) => ({ skill: s, value: dl.filter((l) => l.skill === s).reduce((a, l) => a + l.minutes, 0) })) };
    });
  }, [range, logs, today, settings.startDate]);

  const counts = deckCounts(state.cards);
  const est = skillEstimates((tests ?? []).map((t) => ({ ...t })));
  const target = settings.targetOverall;
  const config = { startDate: settings.startDate, examDate: settings.examDate };
  const cps = resolvedCheckpoints(config);
  const span = Math.max(1, daysBetween(settings.startDate, settings.examDate));
  const xOf = (d: string) => Math.max(0, Math.min(1, daysBetween(settings.startDate, d) / span));
  const overallSeries = (tests ?? [])
    .map((t) => ({ x: xOf(t.date), y: overallOf(t) ?? partialAverage(t) ?? NaN }))
    .filter((p) => !Number.isNaN(p.y));
  const phaseRanges = resolvePhaseRanges(config);
  const phaseRange = day.phase ? phaseRanges[day.phase] : null;
  const nextCp = cps.find((c) => c.date >= today);
  const lowest = (EXAM_SKILLS.filter((k) => est[k].band !== null) as ExamSkill[]).sort((a, b) => (est[a].band ?? 9) - (est[b].band ?? 9))[0];
  const lastBackup = settings.lastBackupAt ? daysBetween(bakuDate(settings.lastBackupAt), today) : null;

  return (
    <Screen>
      <LargeHeader title="Progress" />
      <div className="stack">
        <Segmented value={seg} onChange={setSeg} options={[{ value: 'overview', label: 'Overview' }, { value: 'skills', label: 'Skills' }, { value: 'tests', label: 'Tests' }]} label="Progress view" />

        {seg === 'overview' && (
          <>
            {phaseRange && day.phase && (
              <div className="card stack">
                <p className="headline">Phase {day.phase} · {PHASES[day.phase - 1].name} · day {daysBetween(phaseRange.start, today) + 1} of {daysBetween(phaseRange.start, phaseRange.end) + 1}</p>
                <ProgressBar value={(daysBetween(phaseRange.start, today) + 1) / (daysBetween(phaseRange.start, phaseRange.end) + 1)} />
                {nextCp && <p className="subhead">Next checkpoint: {formatShort(nextCp.date)} (~{nextCp.targetBand.min.toFixed(1)}) {relativeDays(today, nextCp.date)}</p>}
              </div>
            )}
            <div className="grid2">
              <div className="card">
                <p className="subhead">Streak</p>
                <p className="title1">{plural(streak.current, 'day')}</p>
                <p className="footnote">Best {streak.best} · Words {state.vocabStreak}</p>
              </div>
              <div className="card">
                <p className="subhead">This week</p>
                <p className="title1">{formatMinutes(weekMin)}</p>
                <p className="footnote">{weekDays} of 7 days · total {formatMinutes(totalMin)}</p>
              </div>
            </div>
            <div className="card stack">
              <p className="headline">Study time</p>
              <div>
                <Segmented value={range} onChange={setRange} options={[{ value: '7', label: '7 d' }, { value: '30', label: '30 d' }, { value: 'all', label: 'All' }]} label="Range" />
              </div>
              {totalMin === 0 ? (
                <p className="subhead">Your chart appears after your first finished block.</p>
              ) : (
                <>
                  <StackedBars bars={bars} summary={`Study time, ${range === 'all' ? 'all time' : `last ${range} days`}: ${formatMinutes(bars.reduce((s, b) => s + b.parts.reduce((a, p) => a + p.value, 0), 0))}`} />
                  <div className="row wrap" style={{ gap: 8 }}>
                    {STUDY_SKILLS.map((s) => (
                      <span key={s} className="footnote row" style={{ gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: skillVar(s), display: 'inline-block' }} />{SKILL_LABEL[s]}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="card stack">
              <p className="headline">Words learned · {counts.learned.toLocaleString('en-GB')} / 3,000</p>
              <ProgressBar value={counts.learned / 3000} color="var(--skill-vocabulary)" />
              <p className="footnote">{plural(counts.total, 'card')} started · a word is learned after 3 weeks in memory.</p>
            </div>
            <div className="card stack">
              <p className="headline">Band trend</p>
              {overallSeries.length === 0 ? (
                <p className="subhead">Your chart appears after your first logged test.</p>
              ) : (
                <LineChart
                  series={[{ name: 'Overall', color: 'var(--accent)', points: overallSeries }]}
                  target={target}
                  summary={`Band from ${overallSeries[0].y.toFixed(1)} to ${overallSeries[overallSeries.length - 1].y.toFixed(1)} in ${overallSeries.length} tests. Target ${target.toFixed(1)}.`}
                  markers={cps.filter((c) => !c.useExamDate).map((c) => ({ x: xOf(c.date), label: formatMonthYear(c.date).split(' ')[0] }))}
                />
              )}
            </div>
            <div className="list">
              <Row left={<Icon name="map" />} title="Roadmap" onClick={() => navigate('/progress/roadmap')} />
              <Row left={<Icon name="test" />} title="Checkpoints" onClick={() => navigate('/progress/checkpoints')} />
              <Row
                left={<Icon name="backup" />}
                title="Backup & Restore"
                value={<span style={{ color: lastBackup === null || lastBackup > 14 ? 'var(--warning)' : 'var(--success)' }}>{lastBackup === null ? 'Never backed up' : lastBackup === 0 ? 'Backed up today' : `${plural(lastBackup, 'day')} ago`}</span>}
                onClick={() => navigate('/progress/backup')}
              />
              <Row left={<Icon name="star" />} title="Golden rules" onClick={() => navigate('/progress/rules')} />
            </div>
          </>
        )}

        {seg === 'skills' && (
          <>
            <div className="list">
              {STUDY_SKILLS.map((s) => {
                const mins = logs.filter((l) => l.skill === s).reduce((a, l) => a + l.minutes, 0);
                const e = (EXAM_SKILLS as Skill[]).includes(s) ? est[s as ExamSkill] : null;
                const mc = (mistakes ?? []).filter((m) => m.skill === s).length;
                return (
                  <div key={s} className="list-row" style={{ cursor: 'default' }}>
                    <SkillTile skill={s} />
                    <span className="main">
                      <span className="headline" style={{ color: skillVar(s) }}>{SKILL_LABEL[s]}</span>
                      {s === lowest && <span className="footnote" style={{ color: 'var(--warning)' }}> · weakest</span>}
                      <span className="subhead" style={{ display: 'block' }}>{formatMinutes(mins)} studied · {plural(mc, 'mistake')}</span>
                    </span>
                    {e && <span className="value">{e.band !== null ? e.band.toFixed(1) : '–'}</span>}
                  </div>
                );
              })}
            </div>
            {state.weak.weakSkill ? (
              <div className="card stack">
                <p className="headline">Focus: {SKILL_LABEL[state.weak.weakSkill]}</p>
                <p className="callout">{FOCUS_STEPS[state.weak.weakSkill]}</p>
              </div>
            ) : (
              <p className="subhead">{state.weak.hasData ? 'You are on target in every skill for this phase.' : 'Take a checkpoint test to unlock personalised advice.'}</p>
            )}
            {(tests ?? []).length > 0 && (
              <div className="card stack">
                <p className="headline">Skills over time</p>
                <LineChart
                  series={EXAM_SKILLS.map((k) => ({
                    name: k,
                    color: skillVar(k),
                    points: (tests ?? []).filter((t) => typeof t[k] === 'number').map((t) => ({ x: xOf(t.date), y: t[k] as number })),
                  }))}
                  target={target}
                  summary="Band per skill over time"
                />
                <div className="row wrap" style={{ gap: 8 }}>
                  {EXAM_SKILLS.map((k) => (
                    <span key={k} className="footnote row" style={{ gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 5, background: skillVar(k), display: 'inline-block' }} />{SKILL_LABEL[k]}</span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {seg === 'tests' && (
          <>
            <div className="list">
              {[...(tests ?? [])].reverse().slice(0, 20).map((t) => (
                <Row
                  key={t.id}
                  title={`${formatShort(t.date)} · ${t.source || t.type}`}
                  subtitle={EXAM_SKILLS.filter((k) => t[k] != null).map((k) => `${SKILL_LABEL[k][0]} ${(t[k] as number).toFixed(1)}`).join('  ')}
                  value={overallOf(t)?.toFixed(1)}
                  onClick={() => navigate('/practice/tests')}
                />
              ))}
            </div>
            <button className="btn block" onClick={() => navigate('/practice/tests')}>Open test log</button>
            <button className="btn block" onClick={() => navigate('/progress/checkpoints')}>Checkpoints</button>
          </>
        )}
      </div>
    </Screen>
  );
}

const FOCUS_STEPS: Record<ExamSkill, string> = {
  writing: 'Write 1 extra Task 2 essay. Ask a teacher to check one essay. Review repeated grammar mistakes.',
  reading: 'Practise True/False/Not Given for 15 minutes a day. Time yourself: 20 minutes per passage.',
  listening: 'Do one extra Section 3 or 4. Read the transcript after you finish.',
  speaking: 'Record Part 2 three times this week. Talk to a real person once.',
};

export function CheckpointsScreen() {
  const { state } = useApp();
  const tests = useLiveQuery(() => db.tests.toArray(), []);
  const cps = resolvedCheckpoints(state.settings);
  return (
    <Screen>
      <InlineHeader title="Checkpoints" backTo="/progress" backLabel="Progress" />
      <div className="stack">
        {cps.map((c) => {
          const t = (tests ?? []).filter((x) => x.checkpointId === c.id).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
          const band = t ? checkpointResultBand(t, c) : null;
          const st = checkpointStatus(band, c);
          return (
            <div key={c.id} className="card stack">
              <div className="row">
                <p className="headline" style={{ flex: 1 }}>{c.useExamDate ? `IELTS exam · ${formatShort(c.date)}` : c.label}</p>
                <span className="mono">~{c.targetBand.min.toFixed(1)}</span>
              </div>
              <p className="callout">How to check: {c.howToCheck}</p>
              {c.rawTarget && <p className="subhead">Target: about {c.rawTarget.min}–{c.rawTarget.max} of 40 correct per skill (band {c.targetBand.min.toFixed(1)}{c.targetBand.max !== c.targetBand.min ? `–${c.targetBand.max.toFixed(1)}` : ''})</p>}
              <p className="subhead">{c.useExamDate ? '' : `Suggested day: ${formatShort(c.date)} · counts from ${formatShort(c.window.start, false)} to ${formatShort(c.window.end, false)}`}</p>
              <p className="callout">Your result: {band !== null ? band.toFixed(1) : 'not logged yet'}</p>
              <p className="row" style={{ color: statusColor(st), gap: 6 }}>
                <Icon name={st === 'on-track' ? 'check' : st === 'not-tested' ? 'info' : 'warning'} size={18} /> {STATUS_TEXT[st]}
              </p>
              {!t && <button className="btn small" onClick={() => navigate(`/practice/tests?add=1&cp=${c.id}`)}>Log result</button>}
            </div>
          );
        })}
      </div>
    </Screen>
  );
}

export function RoadmapScreen() {
  const { state } = useApp();
  const ms = useKV<MilestoneState>('milestones', EMPTY_MILESTONES);
  const config = state.settings;
  const ranges = resolvePhaseRanges(config);
  const cps = resolvedCheckpoints(config);
  const [open, setOpen] = useState<number | null>(state.day.phase);
  return (
    <Screen>
      <InlineHeader title="Roadmap" backTo="/progress" backLabel="Progress" />
      <div className="stack">
        {PHASES.map((p) => {
          const r = ranges[p.id];
          const current = state.day.phase === p.id;
          return (
            <div key={p.id} className="card stack" style={{ borderLeft: current ? '4px solid var(--accent)' : undefined }}>
              <button className="row" style={{ border: 'none', background: 'none', padding: 0, color: 'inherit', minHeight: 44, width: '100%', textAlign: 'left' }} onClick={() => setOpen(open === p.id ? null : p.id)} aria-expanded={open === p.id}>
                <span style={{ flex: 1 }}>
                  <span className="headline" style={{ display: 'block' }}>Phase {p.id} · {p.name}{current ? ' · you are here' : ''}</span>
                  <span className="subhead">{r ? `${formatShort(r.start)} – ${formatShort(r.end)}` : 'Not in your dates'} · target ~{p.targetBand.min.toFixed(1)} · {p.dailyHours.min}{p.dailyHours.max !== p.dailyHours.min ? `–${p.dailyHours.max}` : ''} h/day</span>
                </span>
                <Icon name={open === p.id ? 'minus' : 'plus'} size={18} />
              </button>
              {open === p.id && (
                <>
                  <p className="callout">{p.summary}</p>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>{p.goals.map((g) => <li key={g} className="callout">{g}</li>)}</ul>
                  {p.notes.map((n) => <p key={n} className="subhead">• {n}</p>)}
                </>
              )}
              {cps.filter((c) => c.phase === p.id).map((c) => (
                <p key={c.id} className="footnote"><Icon name="test" size={14} /> {formatShort(c.date)} · {c.useExamDate ? 'IELTS exam' : c.label} (~{c.targetBand.min.toFixed(1)})</p>
              ))}
            </div>
          );
        })}
        <p className="section-title">Milestones</p>
        <div className="list">
          {MILESTONES.filter((m) => !m.onlyForFormat || m.onlyForFormat === config.examFormat).map((m) => {
            const d = resolveMilestoneDate(m.showFrom, config);
            const done = ms.done[m.id];
            return <Row key={m.id} title={m.title} subtitle={`From ${formatShort(d)}${done ? ' · done' : ''}`} chevron={false} left={done ? <Icon name="check" /> : <Icon name="info" />} />;
          })}
        </div>
      </div>
    </Screen>
  );
}
