import { useEffect, useState } from 'react';
import { MURPHY_PLAN, RESOURCE_BY_ID } from '../../data';
import type { ISODate } from '../../data';
import type { PlanBlock } from '../../logic/plan';
import { SKILL_LABEL } from '../../logic/plan';
import { formatMinutes } from '../../logic/dates';
import { setBlockDone, setBlockMinutes } from '../../db/actions';
import { updateSettings } from '../../db/db';
import { navigate } from '../../app/router';
import { useApp } from '../../app/AppContext';
import { Sheet, SkillTile, Stepper } from '../../ui/components';
import { clearTimer, TimerView, timerMinutes } from '../../ui/TimerView';
import { Icon } from '../../ui/Icon';

export function blockHref(b: PlanBlock, date: ISODate): string | null {
  const q = `from=${encodeURIComponent(`${date}|${b.id}`)}`;
  switch (b.action) {
    case 'review':
      return '/review';
    case 'quiz':
      return `/quiz/${b.quizSize && b.quizSize > 5 ? 'mini' : 'daily'}`;
    case 'writing-task1':
      return `/write/task1?${q}${b.task1Chart ? `&chart=${b.task1Chart}` : ''}`;
    case 'writing-task2':
      return `/write/task2?${q}${b.task2Type ? `&type=${b.task2Type}` : ''}`;
    case 'writing-full':
      return `/write/full?${q}${b.task1Chart ? `&chart=${b.task1Chart}` : ''}${b.task2Type ? `&type=${b.task2Type}` : ''}`;
    case 'writing-paragraph':
      return `/write/paragraph?${q}`;
    case 'writing-history':
      return '/practice/writing/history';
    case 'speaking-part1':
      return '/speak/1';
    case 'speaking-part2':
      return '/speak/2';
    case 'speaking-part3':
      return '/speak/3';
    case 'speaking-free':
      return `/speak/0${b.speakingTopic ? `?topic=${encodeURIComponent(b.speakingTopic)}` : ''}`;
    case 'speaking-live':
      return '/practice/speaking?live=1';
    case 'test':
      return `/practice/tests?add=1${b.checkpointId ? `&cp=${b.checkpointId}` : ''}`;
    case 'mistakes':
      return b.id.startsWith('mmr-') ? '/mistakes-review' : '/mistakes';
    default:
      return null;
  }
}

const ACTION_LABEL: Partial<Record<PlanBlock['action'], string>> = {
  review: 'Start word review',
  quiz: 'Start the quiz',
  'writing-task1': 'Start Task 1',
  'writing-task2': 'Start Task 2',
  'writing-full': 'Start full Writing (60 min)',
  'writing-paragraph': 'Start writing',
  'writing-history': 'Open my essays',
  'speaking-part1': 'Start Part 1',
  'speaking-part2': 'Start Part 2',
  'speaking-part3': 'Start Parts 2–3',
  'speaking-free': 'Start speaking',
  'speaking-live': 'Log a live session',
  test: 'Log the result',
  mistakes: 'Open mistakes',
};

export function BlockSheet({ block, date, done, minutesLogged, readOnly, onClose }: {
  block: PlanBlock | null;
  date: ISODate;
  done: boolean;
  minutesLogged?: number;
  readOnly?: boolean;
  onClose: () => void;
}) {
  const { state, toast } = useApp();
  const [mins, setMins] = useState(block?.minutes ?? 0);
  useEffect(() => {
    setMins(minutesLogged ?? block?.minutes ?? 0);
  }, [block?.id, minutesLogged, block?.minutes]);
  if (!block) return null;
  const href = blockHref(block, date);
  const timerKey = `block:${date}:${block.id}`;
  const showTimer = block.minutes > 0 && ['timer', 'test', 'mistakes'].includes(block.action);
  const minutesText = block.minutes === 0 ? '' : block.minutesMax ? `${block.minutes}–${block.minutesMax} min` : formatMinutes(block.minutes);

  const toggle = async () => {
    let m = mins;
    if (!done) {
      const used = await timerMinutes(timerKey);
      if (used && used > 0) m = used;
      setMins(m);
    }
    await setBlockDone(date, block, !done, m);
    if (!done) void clearTimer(timerKey);
    if (!done) toast('Marked done.', { label: 'Undo', run: () => void setBlockDone(date, block, false) });
  };

  return (
    <Sheet open onClose={onClose} title={SKILL_LABEL[block.displaySkill]}>
      <div className="stack">
        <div className="row">
          <SkillTile skill={block.displaySkill} />
          <div style={{ flex: 1 }}>
            <p className="title2">{block.title}</p>
            {minutesText && <p className="subhead">{minutesText}{block.minutesAssumed ? ' (suggested)' : ''}</p>}
          </div>
        </div>
        <p className="selectable">{block.task}</p>
        {block.detail && (
          <div className="card tight tinted-accent">
            <p className="headline">{block.detail}</p>
          </div>
        )}
        {block.hint && <p className="subhead selectable">{block.hint}</p>}
        {block.timeOfDay === 'morning' && <p className="footnote">Best in the morning, at your exam time.</p>}

        {block.murphyUnits && (
          <div className="card stack">
            <p className="subhead">Murphy units done so far</p>
            <div className="row">
              <Stepper
                value={state.settings.murphyUnitsDone}
                min={0}
                max={MURPHY_PLAN.totalUnits}
                onChange={(v) => void updateSettings({ murphyUnitsDone: v })}
                format={(v) => `${v} / ${MURPHY_PLAN.totalUnits}`}
              />
            </div>
            <p className="footnote">Ticking this block adds today’s units. Fix the number here if your book is different.</p>
          </div>
        )}

        {block.resources && block.resources.length > 0 && (
          <div className="stack" style={{ gap: 4 }}>
            <p className="section-title">Resources</p>
            {block.resources.map((r) => {
              const res = RESOURCE_BY_ID[r.resourceId];
              if (!res) return null;
              return (
                <div key={r.resourceId} className="card tight">
                  <p className="headline">{res.title}{r.detail ? ` · ${r.detail}` : ''}</p>
                  {res.author && <p className="footnote">{res.author}</p>}
                  {res.note && <p className="footnote">{res.note}</p>}
                </div>
              );
            })}
          </div>
        )}

        {href && !readOnly && (
          <button
            className="btn primary"
            onClick={() => {
              onClose();
              navigate(href);
            }}
          >
            {ACTION_LABEL[block.action] ?? 'Start'}
          </button>
        )}
        {block.action === 'review' && !readOnly && (
          <button className="btn block" onClick={() => { onClose(); navigate('/words?add=1'); }}>
            <Icon name="plus" size={18} /> Add words
          </button>
        )}
        {showTimer && !readOnly && <TimerView storageKey={timerKey} minutes={block.minutes} label={`${block.title} timer (optional)`} />}
        {['timer', 'test'].includes(block.action) && !readOnly && (
          <button className="btn block" onClick={() => { onClose(); navigate(`/mistakes?add=1&skill=${block.displaySkill}`); }}>
            Log a mistake
          </button>
        )}

        {block.skill !== 'rest' && !readOnly && (
          <div className="card stack">
            <button className={`checkrow${done ? ' on' : ''}`} role="checkbox" aria-checked={done} onClick={() => void toggle()}>
              <span className="box">{done && <Icon name="check" size={16} stroke={2.5} />}</span>
              <span className="headline">{done ? 'Done' : 'Mark as done'}</span>
            </button>
            {done && block.minutes > 0 && (
              <div className="row">
                <span className="subhead" style={{ flex: 1 }}>I spent</span>
                <Stepper
                  value={mins}
                  step={5}
                  min={0}
                  max={600}
                  format={(v) => `${v} min`}
                  onChange={(v) => {
                    setMins(v);
                    void setBlockMinutes(date, block.id, v);
                  }}
                />
              </div>
            )}
          </div>
        )}
        {readOnly && <p className="footnote">Older days are read-only. Regular study beats catching up.</p>}
      </div>
    </Sheet>
  );
}
