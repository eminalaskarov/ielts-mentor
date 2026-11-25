import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ruleById } from '../../logic/mentor';
import { db, uid } from '../../db/db';
import type { TestLog, TestType } from '../../db/db';
import { deleteTest, saveTest } from '../../db/actions';
import { useApp } from '../../app/AppContext';
import { navigate, useRoute } from '../../app/router';
import { bandFromRaw, checkpointForDate, checkpointResultBand, checkpointStatus, isReservedBook, overallOf } from '../../logic/assessment';
import type { CheckpointStatus } from '../../logic/assessment';
import { daysBetween, formatShort, isISODate } from '../../logic/dates';
import { phaseForDate, resolvedCheckpoints } from '../../logic/plan';
import { BandPicker, Chips, Empty, Field, InlineHeader, Row, Screen, Sheet, Switch } from '../../ui/components';
import { Icon } from '../../ui/Icon';
import type { Checkpoint } from '../../data';

const TYPE_LABEL: Record<TestType, string> = {
  lr: 'Listening + Reading',
  full: 'Full mock',
  mini: 'Mini test',
  official: 'Official',
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
};

const BOOKS = ['Cambridge IELTS 10', 'Cambridge IELTS 11', 'Cambridge IELTS 12', 'Cambridge IELTS 13', 'Cambridge IELTS 14', 'Cambridge IELTS 15', 'Cambridge IELTS 16', 'Cambridge IELTS 17', 'Cambridge IELTS 18', 'Cambridge IELTS 19', 'Cambridge IELTS 20', 'Other practice test', 'Official mock'];

const WEAK_AREAS = ['T/F/NG', 'Y/N/NG', 'Headings', 'Matching', 'Completion', 'Multiple choice', 'Listening Section 3', 'Listening Section 4', 'Spelling', 'Task 1 overview', 'Task 2 ideas', 'Time'];

export const STATUS_TEXT: Record<CheckpointStatus, string> = {
  'on-track': 'On track',
  close: 'Close',
  behind: 'Needs more time',
  'not-tested': 'Not tested yet',
};

export function statusColor(s: CheckpointStatus): string {
  return s === 'on-track' ? 'var(--success)' : s === 'not-tested' ? 'var(--label-2)' : 'var(--warning)';
}

export function TestLogScreen() {
  const { state } = useApp();
  const route = useRoute();
  const tests = useLiveQuery(() => db.tests.orderBy('date').reverse().toArray(), []);
  const [adding, setAdding] = useState<{ cp?: string; official?: boolean } | null>(null);
  const [editing, setEditing] = useState<TestLog | null>(null);
  useEffect(() => {
    if (route.query.get('add') === '1') setAdding({ cp: route.query.get('cp') ?? undefined, official: route.query.get('official') === '1' });
  }, [route.query]);
  const cps = resolvedCheckpoints(state.settings);
  const next = cps.find((c) => c.date >= state.today && !state.checkpointsLogged.has(c.id));
  return (
    <Screen>
      <InlineHeader
        title="Test log"
        backTo="/practice"
        backLabel="Practice"
        right={<button className="icon-btn" aria-label="Add a test result" onClick={() => setAdding({})}><Icon name="plus" /></button>}
      />
      <div className="stack">
        {next && (
          <div className="card">
            <p className="subhead">Next checkpoint</p>
            <p className="headline">{next.useExamDate ? 'IELTS exam' : next.label} · ~{next.targetBand.min.toFixed(1)} · {daysBetween(state.today, next.date) === 0 ? 'today' : `in ${daysBetween(state.today, next.date)} days`}</p>
          </div>
        )}
        {tests && tests.length === 0 ? (
          <Empty
            text="No tests yet. In Phase 1 you don’t take full tests. Your first checkpoint is at the end of February."
            action={<button className="btn" onClick={() => setAdding({})}>Log a practice test anyway</button>}
          />
        ) : (
          <div className="list">
            {(tests ?? []).map((t) => (
              <Row
                key={t.id}
                title={`${formatShort(t.date)} · ${TYPE_LABEL[t.type]}${t.official ? ' · Official' : ''}`}
                subtitle={[
                  t.listening != null && `L ${t.listening.toFixed(1)}`,
                  t.reading != null && `R ${t.reading.toFixed(1)}`,
                  t.writing != null && `W ${t.writing.toFixed(1)}`,
                  t.speaking != null && `S ${t.speaking.toFixed(1)}`,
                  t.overall != null && `Overall ${t.overall.toFixed(1)}`,
                ].filter(Boolean).join('  ') + (t.source ? ` · ${t.source}` : '')}
                onClick={() => setEditing(t)}
              />
            ))}
          </div>
        )}
        <p className="footnote">Band tables are approximate and can change from test to test.</p>
      </div>
      <AddTestSheet
        open={!!adding || !!editing}
        edit={editing ?? undefined}
        presetCp={adding?.cp}
        presetOfficial={adding?.official}
        onClose={() => {
          setAdding(null);
          setEditing(null);
          if (route.query.get('add')) navigate('/practice/tests', { replace: true });
        }}
      />
    </Screen>
  );
}

export function AddTestSheet({ open, onClose, edit, presetCp, presetOfficial }: { open: boolean; onClose: () => void; edit?: TestLog; presetCp?: string; presetOfficial?: boolean }) {
  const { state, toast } = useApp();
  const cps = useMemo(() => resolvedCheckpoints(state.settings), [state.settings]);
  const blank = (): TestLog => ({
    id: uid('t'),
    date: state.today,
    createdAt: Date.now(),
    type: presetOfficial ? 'official' : presetCp ? (cps.find((c) => c.id === presetCp)?.skillsTested.length === 4 ? 'full' : 'lr') : 'lr',
    source: '',
    book: '',
    listeningRaw: null,
    readingRaw: null,
    listening: null,
    reading: null,
    writing: null,
    speaking: null,
    overall: null,
    weakAreas: [],
    notes: '',
    official: !!presetOfficial,
    checkpointId: presetCp ?? null,
  });
  const [t, setT] = useState<TestLog>(blank);
  const [lBandDirect, setLBandDirect] = useState(false);
  useEffect(() => {
    if (open) {
      setT(edit ?? blank());
      setLBandDirect(!!edit && edit.listeningRaw == null && edit.listening != null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, edit?.id]);

  const autoCp: Checkpoint | undefined = checkpointForDate(t.date, cps);
  const phase = phaseForDate(t.date, state.settings);
  const listening = lBandDirect ? t.listening : bandFromRaw('listening', t.listeningRaw ?? null);
  const reading = lBandDirect ? t.reading : bandFromRaw('reading', t.readingRaw ?? null);
  const computed: TestLog = { ...t, listening, reading };
  const overall = overallOf(computed);
  const showL = ['lr', 'full', 'mini', 'official', 'listening'].includes(t.type);
  const showR = ['lr', 'full', 'mini', 'official', 'reading'].includes(t.type);
  const showW = ['full', 'official', 'writing', 'lr'].includes(t.type);
  const showS = ['full', 'official', 'speaking', 'lr'].includes(t.type);

  const save = async () => {
    if (!isISODate(t.date)) return;
    const bookName = t.book || t.source;
    if (!edit && isReservedBook(bookName, phase)) {
      if (!window.confirm(`${ruleById(7).text}\n\nCambridge 14–19 are best saved for phases 3 and 4. Use this test anyway?`)) return;
    }
    const final: TestLog = { ...computed, overall, source: t.source || t.book || '' };
    await saveTest(final);
    onClose();
    const cp = cps.find((c) => c.id === final.checkpointId);
    if (cp) {
      const band = checkpointResultBand(final, cp);
      const st = checkpointStatus(band, cp);
      toast(st === 'on-track' ? `You reached ~${cp.targetBand.min.toFixed(1)}. On track.` : `Your score is ${band?.toFixed(1) ?? '–'}. That’s useful information.`, { label: 'Log mistakes', run: () => navigate('/mistakes?add=1') }, 7000);
    } else {
      toast('Saved. Log the mistakes from this test?', { label: 'Add mistakes', run: () => navigate('/mistakes?add=1') }, 7000);
    }
  };

  const num = (v: string) => (v === '' ? null : Math.max(0, Math.min(40, Math.round(Number(v)))));

  return (
    <Sheet open={open} onClose={onClose} title={edit ? 'Test result' : 'Add result'} right={<button className="btn plain" onClick={() => void save()}>Save</button>}>
      <div className="stack">
        <Chips<TestType>
          value={t.type}
          onChange={(v) => setT({ ...t, type: v, official: v === 'official' ? true : t.official })}
          options={(['lr', 'full', 'mini', 'official', 'listening', 'reading', 'writing', 'speaking'] as TestType[]).map((v) => ({ value: v, label: TYPE_LABEL[v] }))}
          label="Type"
        />
        <Field label="Source">
          <select className="select" value={t.book ?? ''} onChange={(e) => setT({ ...t, book: e.target.value })}>
            <option value="">Choose…</option>
            {BOOKS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <input className="input" value={t.source} onChange={(e) => setT({ ...t, source: e.target.value })} placeholder="e.g. Test 3" />
        </Field>
        {isReservedBook(t.book, phase) && <p className="footnote" style={{ color: 'var(--warning)' }}>Golden rule 7: Cambridge 14–19 are best saved for phases 3 and 4.</p>}
        <Field label="Date">
          <input className="input" type="date" value={t.date} onChange={(e) => setT({ ...t, date: e.target.value })} max={state.today} />
        </Field>
        {showL && (
          <Field label="Listening">
            {lBandDirect ? (
              <BandPicker value={t.listening ?? null} onChange={(v) => setT({ ...t, listening: v })} />
            ) : (
              <div className="row">
                <input className="input" inputMode="numeric" style={{ width: 90 }} value={t.listeningRaw ?? ''} onChange={(e) => setT({ ...t, listeningRaw: num(e.target.value) })} aria-label="Listening correct answers" />
                <span>/ 40 → Band <b>{listening?.toFixed(1) ?? '–'}</b></span>
              </div>
            )}
          </Field>
        )}
        {showR && (
          <Field label="Reading (Academic)">
            {lBandDirect ? (
              <BandPicker value={t.reading ?? null} onChange={(v) => setT({ ...t, reading: v })} />
            ) : (
              <div className="row">
                <input className="input" inputMode="numeric" style={{ width: 90 }} value={t.readingRaw ?? ''} onChange={(e) => setT({ ...t, readingRaw: num(e.target.value) })} aria-label="Reading correct answers" />
                <span>/ 40 → Band <b>{reading?.toFixed(1) ?? '–'}</b></span>
              </div>
            )}
          </Field>
        )}
        {(showL || showR) && (
          <div className="row">
            <span className="subhead" style={{ flex: 1 }}>I have bands, not raw scores (official result)</span>
            <Switch checked={lBandDirect} onChange={setLBandDirect} label="Enter bands directly" />
          </div>
        )}
        {showW && <Field label="Writing estimate (optional)" hint="From self-check or a teacher"><BandPicker value={t.writing ?? null} onChange={(v) => setT({ ...t, writing: v })} /></Field>}
        {showS && <Field label="Speaking estimate (optional)"><BandPicker value={t.speaking ?? null} onChange={(v) => setT({ ...t, speaking: v })} /></Field>}
        <div className="card tight">
          <p className="headline">Overall {overall !== null ? overall.toFixed(1) : '–'}</p>
          {overall === null && <p className="footnote">Add all 4 parts for an overall band.</p>}
        </div>
        {(autoCp || t.checkpointId) && (
          <div className="row">
            <span style={{ flex: 1 }}>Counts for checkpoint: {(cps.find((c) => c.id === (t.checkpointId ?? autoCp?.id)) ?? autoCp)?.label}</span>
            <Switch checked={!!t.checkpointId} onChange={(v) => setT({ ...t, checkpointId: v ? (autoCp?.id ?? t.checkpointId) : null })} label="Counts for checkpoint" />
          </div>
        )}
        <Field label="Weak areas">
          <div className="chips wrap">
            {WEAK_AREAS.map((w) => (
              <button key={w} className={`chip${t.weakAreas.includes(w) ? ' on' : ''}`} aria-pressed={t.weakAreas.includes(w)} onClick={() => setT({ ...t, weakAreas: t.weakAreas.includes(w) ? t.weakAreas.filter((x) => x !== w) : [...t.weakAreas, w] })}>
                {w}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Notes"><textarea className="textarea" value={t.notes} onChange={(e) => setT({ ...t, notes: e.target.value })} /></Field>
        <div className="row">
          <span style={{ flex: 1 }}>Official result</span>
          <Switch checked={t.official} onChange={(v) => setT({ ...t, official: v })} label="Official" />
        </div>
        {edit && (
          <button
            className="btn danger block"
            onClick={async () => {
              if (!window.confirm('Delete this result?')) return;
              await deleteTest(edit.id);
              onClose();
            }}
          >
            Delete
          </button>
        )}
      </div>
    </Sheet>
  );
}
