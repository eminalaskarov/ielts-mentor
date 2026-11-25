import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { PHASE3_ERROR_TOPICS_FALLBACK } from '../../data';
import type { Skill } from '../../data';
import { db } from '../../db/db';
import type { Mistake, MistakeCause } from '../../db/db';
import { deleteMistake, markMistakeReviewDone, saveMistake } from '../../db/actions';
import { useApp } from '../../app/AppContext';
import { goBack, navigate, useRoute } from '../../app/router';
import { addDays, formatShort, monthKey } from '../../logic/dates';
import { monthlyReviewDue } from '../../logic/mentor';
import { READING_TYPE_LABEL, SKILL_LABEL } from '../../logic/plan';
import { Chips, Empty, Field, FullTop, LargeHeader, ProgressBar, Screen, Sheet, SkillChip } from '../../ui/components';
import { Icon, skillVar } from '../../ui/Icon';
import { useKV } from '../../state/hooks';

export const CAUSE_LABEL: Record<MistakeCause, string> = {
  word: 'I didn’t know the word',
  misread: 'I misread the question',
  time: 'I ran out of time',
  grammar: 'I didn’t know the grammar rule',
  hearing: 'I didn’t hear it clearly',
  careless: 'Careless slip',
  other: 'Other',
};
const CAUSE_SHORT: Record<MistakeCause, string> = {
  word: 'Didn’t know the word',
  misread: 'Misread question',
  time: 'Ran out of time',
  grammar: 'Grammar rule',
  hearing: 'Didn’t hear it',
  careless: 'Careless slip',
  other: 'Other',
};
const CAUSE_TIP: Record<MistakeCause, string> = {
  word: 'Add unknown words to your word cards the same day.',
  misread: 'Underline the key words in the question before you answer.',
  time: 'Use a timer: 20 minutes per Reading passage. Move on when time is up.',
  grammar: 'Go back to the grammar unit and do 5 more exercises on this rule.',
  hearing: 'Listen again with the transcript and repeat the sentence aloud.',
  careless: 'Leave 2 minutes at the end to check your answers.',
  other: 'Look for a pattern in your notes.',
};
const SKILLS: Skill[] = ['listening', 'reading', 'writing', 'speaking', 'grammar', 'vocabulary'];
const GRAMMAR_TAGS = [...PHASE3_ERROR_TOPICS_FALLBACK.map((t) => t.topic), 'Tenses', 'Word order'];
const READING_TAGS = Object.values(READING_TYPE_LABEL);

export function MistakesScreen() {
  const { state } = useApp();
  const route = useRoute();
  const mistakes = useLiveQuery(() => db.mistakes.orderBy('createdAt').reverse().toArray(), []);
  const reviewDone = useKV<string[]>('mistakeReviewDone', []);
  const [skill, setSkill] = useState<Skill | 'all'>('all');
  const [cause, setCause] = useState<MistakeCause | 'all'>('all');
  const [q, setQ] = useState('');
  const [sheet, setSheet] = useState<{ edit?: Mistake; skill?: Skill } | null>(null);

  useEffect(() => {
    if (route.query.get('add') === '1') setSheet({ skill: (route.query.get('skill') as Skill) ?? undefined });
  }, [route.query]);

  const list = (mistakes ?? []).filter(
    (m) =>
      (skill === 'all' || m.skill === skill) &&
      (cause === 'all' || m.cause === cause) &&
      (!q || `${m.what} ${m.correction} ${m.source ?? ''} ${m.tag ?? ''}`.toLowerCase().includes(q.toLowerCase())),
  );
  const month = monthKey(state.today);
  const thisMonth = (mistakes ?? []).filter((m) => monthKey(m.date) === month);
  const causeCounts = useMemo(() => {
    const c = new Map<MistakeCause, number>();
    for (const m of mistakes ?? []) c.set(m.cause, (c.get(m.cause) ?? 0) + 1);
    return [...c.entries()].sort((a, b) => b[1] - a[1]);
  }, [mistakes]);
  const topCause = (() => {
    const c = new Map<MistakeCause, number>();
    for (const m of thisMonth) c.set(m.cause, (c.get(m.cause) ?? 0) + 1);
    return [...c.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  })();
  const due = (mistakes?.length ?? 0) > 0 ? monthlyReviewDue(state.today, new Set(reviewDone)) : null;
  const max = causeCounts[0]?.[1] ?? 1;

  const groups = new Map<string, Mistake[]>();
  for (const m of list) groups.set(m.date, [...(groups.get(m.date) ?? []), m]);

  return (
    <Screen>
      <LargeHeader title="Mistakes" right={<button className="icon-btn" aria-label="Add a mistake" onClick={() => setSheet({})}><Icon name="plus" /></button>} />
      <div className="stack">
        {(mistakes ?? []).length === 0 ? (
          <Empty text="No mistakes logged yet. Mistakes are useful. Log them here after every test and quiz." action={<button className="btn" onClick={() => setSheet({})}>Log a mistake</button>} />
        ) : (
          <>
            <input className="input" type="search" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search mistakes" />
            <Chips<Skill | 'all'> value={skill} onChange={setSkill} label="Skill filter" options={[{ value: 'all', label: 'All' }, ...SKILLS.map((s) => ({ value: s, label: SKILL_LABEL[s] }))]} />
            <div className="card stack">
              <p className="headline">This month: {thisMonth.length} mistake{thisMonth.length === 1 ? '' : 's'}{topCause ? ` · Top cause: ${CAUSE_SHORT[topCause]}` : ''}</p>
              {causeCounts.map(([c, n]) => (
                <button key={c} className="row" style={{ border: 'none', background: 'none', padding: 0, color: 'inherit', minHeight: 44, width: '100%' }} onClick={() => setCause(cause === c ? 'all' : c)} aria-pressed={cause === c}>
                  <span className="subhead" style={{ width: 140, textAlign: 'left', fontWeight: cause === c ? 700 : 400 }}>{CAUSE_SHORT[c]}</span>
                  <span style={{ flex: 1 }}><ProgressBar value={n / max} color="var(--skill-test)" /></span>
                  <span className="subhead mono" style={{ width: 28, textAlign: 'right' }}>{n}</span>
                </button>
              ))}
              {cause !== 'all' && <button className="btn plain small" onClick={() => setCause('all')}>Show all causes</button>}
            </div>
            {due && (
              <div className="card stack" style={{ borderLeft: `4px solid ${skillVar('test')}` }}>
                <p className="headline">Monthly review due</p>
                <button className="btn small" onClick={() => navigate('/mistakes-review')}>Start review</button>
              </div>
            )}
            {!due && <button className="btn block" onClick={() => navigate('/mistakes-review')}>Review mistakes now</button>}
            {[...groups.entries()].map(([date, ms]) => (
              <div key={date} className="stack" style={{ gap: 6 }}>
                <p className="section-title">{formatShort(date)}</p>
                {ms.map((m) => (
                  <button key={m.id} className="block-card" style={{ border: 'none', padding: 0, textAlign: 'left', color: 'inherit', cursor: 'pointer' }} onClick={() => setSheet({ edit: m })}>
                    <span className="accent" style={{ background: skillVar(m.skill) }} />
                    <span className="stack" style={{ padding: 12, gap: 4, flex: 1, minWidth: 0 }}>
                      <span className="row" style={{ gap: 8 }}>
                        <SkillChip skill={m.skill} />
                        <span className="footnote">{CAUSE_SHORT[m.cause]}</span>
                        {m.fixed && <span className="footnote" style={{ color: 'var(--success)' }}>Fixed</span>}
                      </span>
                      {m.what && <span>{m.what}</span>}
                      {m.correction && <span className="subhead">Fix: {m.correction}</span>}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </>
        )}
      </div>
      <MistakeSheet open={!!sheet} edit={sheet?.edit} presetSkill={sheet?.skill} onClose={() => { setSheet(null); if (route.query.get('add')) navigate('/mistakes', { replace: true }); }} />
    </Screen>
  );
}

export function MistakeSheet({ open, onClose, edit, presetSkill }: { open: boolean; onClose: () => void; edit?: Mistake; presetSkill?: Skill }) {
  const { state, toast } = useApp();
  const blank = { skill: (presetSkill ?? 'reading') as Skill, what: '', correction: '', cause: null as MistakeCause | null, causeOther: '', source: '', tag: '', asCard: false };
  const [f, setF] = useState(blank);
  useEffect(() => {
    if (!open) return;
    if (edit) setF({ skill: edit.skill, what: edit.what, correction: edit.correction, cause: edit.cause, causeOther: edit.causeOther ?? '', source: edit.source ?? '', tag: edit.tag ?? '', asCard: false });
    else setF({ ...blank, skill: presetSkill && SKILLS.includes(presetSkill) ? presetSkill : 'reading' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, edit?.id, presetSkill]);
  const tags = f.skill === 'grammar' || f.skill === 'writing' ? GRAMMAR_TAGS : f.skill === 'reading' ? READING_TAGS : [];
  const save = async () => {
    if (!f.cause) return;
    await saveMistake({
      id: edit?.id,
      date: edit?.date ?? state.today,
      skill: f.skill,
      what: f.what.trim(),
      correction: f.correction.trim(),
      cause: f.cause,
      causeOther: f.cause === 'other' ? f.causeOther.trim() : undefined,
      source: f.source.trim() || undefined,
      tag: f.tag || undefined,
    });
    toast(edit ? 'Saved.' : 'Mistake logged.');
    onClose();
    if (f.asCard) navigate('/words?add=1');
  };
  return (
    <Sheet
      open={open}
      onClose={onClose}
      dirty={!edit && (f.what !== '' || f.correction !== '')}
      title={edit ? 'Mistake' : 'Add mistake'}
      right={<button className="btn plain" disabled={!f.cause} onClick={() => void save()}>Save</button>}
    >
      <div className="stack">
        <Field label="Skill">
          <Chips<Skill> value={f.skill} onChange={(v) => setF({ ...f, skill: v, tag: '' })} wrap options={SKILLS.map((s) => ({ value: s, label: SKILL_LABEL[s] }))} />
        </Field>
        <Field label="What happened?">
          <input className="input" value={f.what} onChange={(e) => setF({ ...f, what: e.target.value })} placeholder="Chose False, answer was Not Given" />
        </Field>
        <Field label="Correct answer / correction">
          <input className="input" value={f.correction} onChange={(e) => setF({ ...f, correction: e.target.value })} />
        </Field>
        <Field label="Why did it happen?">
          <div className="stack" style={{ gap: 6 }} role="radiogroup">
            {(Object.keys(CAUSE_LABEL) as MistakeCause[]).map((c) => (
              <button key={c} className={`radio-row${f.cause === c ? ' on' : ''}`} role="radio" aria-checked={f.cause === c} onClick={() => setF({ ...f, cause: c })}>
                <span className="dot" />
                <span>{CAUSE_LABEL[c]}</span>
              </button>
            ))}
          </div>
          {f.cause === 'other' && <input className="input" value={f.causeOther} onChange={(e) => setF({ ...f, causeOther: e.target.value })} placeholder="What was it?" />}
        </Field>
        {tags.length > 0 && (
          <Field label={f.skill === 'reading' ? 'Question type (optional)' : 'Grammar topic (optional)'}>
            <div className="chips wrap">
              {tags.map((t) => (
                <button key={t} className={`chip${f.tag === t ? ' on' : ''}`} aria-pressed={f.tag === t} onClick={() => setF({ ...f, tag: f.tag === t ? '' : t })}>{t}</button>
              ))}
            </div>
          </Field>
        )}
        <Field label="Source (optional)">
          <input className="input" value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} placeholder="Cambridge 12 T3 R2" />
        </Field>
        {!edit && (f.skill === 'vocabulary' || f.cause === 'word') && (
          <button className={`checkrow${f.asCard ? ' on' : ''}`} role="checkbox" aria-checked={f.asCard} onClick={() => setF({ ...f, asCard: !f.asCard })}>
            <span className="box">{f.asCard && <Icon name="check" size={16} stroke={2.5} />}</span>
            <span>Also add as a word card</span>
          </button>
        )}
        {edit && (
          <>
            <button className="btn block" onClick={async () => { await db.mistakes.update(edit.id, { fixed: !edit.fixed }); onClose(); }}>{edit.fixed ? 'Mark as not fixed' : 'Mark as fixed'}</button>
            <button className="btn danger block" onClick={async () => { if (!window.confirm('Delete this mistake?')) return; await deleteMistake(edit.id); onClose(); }}>Delete</button>
          </>
        )}
      </div>
    </Sheet>
  );
}

/** Monthly review: one by one, hide the correction; "I know it now" / "Still tricky". */
export function MistakesReview() {
  const { state } = useApp();
  const [items, setItems] = useState<Mistake[] | null>(null);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [tricky, setTricky] = useState(0);
  const month = monthKey(state.today);
  useEffect(() => {
    if (items) return;
    void db.mistakes.toArray().then((all) => {
      const since = addDays(state.today, -45);
      const pick = all.filter((m) => !m.fixed && (m.date >= since || m.stillTricky) && !m.reviewedMonths.includes(month));
      setItems(pick.length ? pick : all.filter((m) => !m.fixed).slice(-30));
    });
  }, [items, state.today, month]);
  if (!items) return <Screen full><FullTop onClose={() => goBack('/mistakes')} /></Screen>;
  const finish = async () => {
    const due = monthlyReviewDue(state.today, new Set());
    await markMistakeReviewDone(due?.month ?? month);
  };
  if (i >= items.length) {
    const counts = new Map<MistakeCause, number>();
    items.forEach((m) => counts.set(m.cause, (counts.get(m.cause) ?? 0) + 1));
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const skills = new Map<Skill, number>();
    items.forEach((m) => skills.set(m.skill, (skills.get(m.skill) ?? 0) + 1));
    const topSkills = [...skills.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    void finish();
    return (
      <Screen full>
        <FullTop onClose={() => goBack('/mistakes')} title="Review done" />
        <div className="stack">
          {items.length === 0 ? (
            <p className="callout">Nothing to review right now.</p>
          ) : (
            <>
              <p className="title2">You reviewed {items.length} mistake{items.length === 1 ? '' : 's'}.</p>
              {top && <p>Top cause: {CAUSE_SHORT[top]}. Try: {CAUSE_TIP[top]}</p>}
              {topSkills.length > 0 && <p className="subhead">Top skills: {topSkills.map(([s, n]) => `${SKILL_LABEL[s]} (${n})`).join(', ')}</p>}
              <p className="subhead">{tricky} still tricky — they come back next month.</p>
            </>
          )}
          <button className="btn primary" onClick={() => goBack('/mistakes')}>Done</button>
        </div>
      </Screen>
    );
  }
  const m = items[i];
  const answer = async (stillTricky: boolean) => {
    await db.mistakes.update(m.id, { stillTricky, reviewedMonths: [...m.reviewedMonths, month], fixed: stillTricky ? false : m.fixed });
    if (stillTricky) setTricky(tricky + 1);
    setShown(false);
    setI(i + 1);
  };
  return (
    <Screen full>
      <FullTop onClose={() => goBack('/mistakes')} title={`${i + 1} / ${items.length}`} />
      <div className="stack">
        <ProgressBar value={i / items.length} color="var(--skill-test)" />
        <div className="card stack">
          <div className="row"><SkillChip skill={m.skill} /><span className="footnote">{CAUSE_SHORT[m.cause]}</span></div>
          <p className="title2 selectable">{m.what || '(no description)'}</p>
          {m.source && <p className="footnote">{m.source}</p>}
          {shown && <p className="callout selectable"><b>Correction:</b> {m.correction || '–'}</p>}
        </div>
        <div className="footer-bar stack" style={{ gap: 8 }}>
          {!shown ? (
            <button className="btn primary" onClick={() => setShown(true)}>Show correction</button>
          ) : (
            <>
              <button className="btn primary" onClick={() => void answer(false)}>I know it now</button>
              <button className="btn block" onClick={() => void answer(true)}>Still tricky</button>
            </>
          )}
        </div>
      </div>
    </Screen>
  );
}
