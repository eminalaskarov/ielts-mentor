import { useEffect, useRef, useState } from 'react';
import { plural } from '../../logic/text';
import { GOLDEN_RULES, MURPHY_PLAN } from '../../data';
import type { ExamFormat } from '../../data';
import { updateSettings } from '../../db/db';
import type { Settings } from '../../db/db';
import { useApp } from '../../app/AppContext';
import { navigate } from '../../app/router';
import { bakuDate, daysBetween, formatShort, isISODate } from '../../logic/dates';
import { BACKUP_ERROR_TEXT, parseBackup } from '../../logic/backup';
import type { BackupFile, BackupPreview } from '../../logic/backup';
import { formatBytes } from '../../logic/recordings';
import { changesLostText, formatDateTime } from '../../logic/recovery';
import { APP_VERSION, eraseAll, latestSnapshot, replaceWithBackup, restoreSnapshot, storageInfo } from '../../db/backupIo';
import { BackupFlow } from './BackupFlow';
import { BandPicker, Chips, Field, InlineHeader, Row, Screen, Segmented, Stepper, Switch } from '../../ui/components';
import { Icon } from '../../ui/Icon';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { TimerView } from '../../ui/TimerView';

export function SettingsScreen() {
  const { state } = useApp();
  const s = state.settings;
  const [info, setInfo] = useState<{ usage: number | null; persisted: boolean | null } | null>(null);
  useEffect(() => {
    void storageInfo().then(setInfo);
  }, []);
  const lastBackup = s.lastBackupAt ? daysBetween(bakuDate(s.lastBackupAt), state.today) : null;
  return (
    <Screen>
      <InlineHeader title="Settings" backTo="/today" backLabel="Today" />
      <div className="stack">
        <div className="list">
          <Row title="Dates and plan" subtitle={`Start ${formatShort(s.startDate)} · Exam ${formatShort(s.examDate)}${s.examDateEstimated ? ' (estimated)' : ''}`} onClick={() => navigate('/today/settings/dates')} />
          <Row title="Target" subtitle={`Overall ${s.targetOverall.toFixed(1)} · Min per skill ${s.targetMinPerSkill ? s.targetMinPerSkill.toFixed(1) : 'none'}`} onClick={() => navigate('/today/settings/dates')} />
          <Row title="Backup & Restore" subtitle={lastBackup === null ? 'Never backed up' : `Last backup: ${lastBackup === 0 ? 'today' : `${plural(lastBackup, 'day')} ago`}`} onClick={() => navigate('/today/settings/backup')} />
          <Row title="Golden rules" onClick={() => navigate('/today/rules')} />
        </div>

        <p className="section-title">Appearance</p>
        <Segmented<Settings['theme']> value={s.theme} onChange={(v) => void updateSettings({ theme: v })} options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} label="Appearance" />

        <p className="section-title">Study</p>
        <div className="card stack">
          <div className="row"><span style={{ flex: 1 }}>New cards per day</span><Stepper value={s.newCardsPerDay} min={5} max={50} step={5} onChange={(v) => void updateSettings({ newCardsPerDay: v })} /></div>
          <div className="row"><span style={{ flex: 1 }}>Max reviews per day</span><Stepper value={s.maxReviews} min={20} max={500} step={10} onChange={(v) => void updateSettings({ maxReviews: v })} /></div>
          <div className="row"><span style={{ flex: 1 }}>Murphy units done</span><Stepper value={s.murphyUnitsDone} min={0} max={MURPHY_PLAN.totalUnits} onChange={(v) => void updateSettings({ murphyUnitsDone: v })} /></div>
          <div className="row"><span style={{ flex: 1 }}>Show Azerbaijani on word cards</span><Switch checked={s.showTranslation} onChange={(v) => void updateSettings({ showTranslation: v })} label="Show Azerbaijani translation" /></div>
        </div>

        <p className="section-title">Reminders</p>
        <div className="card stack">
          <p className="callout">Reminders appear inside the app: today’s plan, missed days, checkpoints, milestones and backups.</p>
          <p className="footnote">
            iPhone web apps cannot show scheduled notifications without a server, and this app has no server, so there are no push notifications.
            If you want a daily nudge, set your own alarm or calendar event at a time that suits you.
          </p>
        </div>

        <p className="section-title">About</p>
        <div className="card stack">
          <div className="kv">
            <span className="muted">Version</span><span>{APP_VERSION}</span>
            <span className="muted">Storage used</span><span>{info?.usage != null ? formatBytes(info.usage) : '–'}</span>
            <span className="muted">Protected storage</span><span>{info?.persisted === true ? 'On' : info?.persisted === false ? 'Off' : 'Unknown'}</span>
          </div>
          {info?.persisted !== true && (
            <p className="footnote">Safari may clear website data after 7 days without use. Add the app to your Home Screen and back up regularly.</p>
          )}
          <p className="footnote">All data stays on this phone. No account, no server, no tracking. Book names are references only; all quiz content is original.</p>
        </div>

        <p className="section-title">Danger zone</p>
        <EraseAll />
      </div>
    </Screen>
  );
}

function EraseAll() {
  const { toast } = useApp();
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  if (!open) return <button className="btn danger block" onClick={() => setOpen(true)}>Erase all data</button>;
  return (
    <div className="card stack">
      <p className="callout">This deletes everything on this phone: plan progress, words, mistakes, essays, tests. Make a backup first.</p>
      <BackupFlow small label="Back up first" />
      <Field label="Type ERASE to confirm"><input className="input" value={text} onChange={(e) => setText(e.target.value)} autoCapitalize="characters" /></Field>
      <button
        className="btn danger block"
        disabled={text !== 'ERASE'}
        onClick={async () => {
          await eraseAll();
          toast('All data erased.');
          navigate('/today', { replace: true });
          window.location.reload();
        }}
      >
        Erase everything
      </button>
      <button className="btn plain" onClick={() => setOpen(false)}>Cancel</button>
    </div>
  );
}

export function DatesScreen() {
  const { state, toast } = useApp();
  const s = state.settings;
  const [start, setStart] = useState(s.startDate);
  const [exam, setExam] = useState(s.examDate);
  const [deadline, setDeadline] = useState(s.applicationDeadline ?? '');
  const valid = isISODate(start) && isISODate(exam) && start < exam;
  const short = valid && daysBetween(start, exam) < 56;
  const save = async () => {
    if (!valid) return;
    if (start !== s.startDate && !window.confirm('Changing the start date moves the whole plan. Your progress and history stay. Continue?')) return;
    await updateSettings({ startDate: start, examDate: exam, examDateEstimated: exam === s.examDate ? s.examDateEstimated : false, applicationDeadline: isISODate(deadline) ? deadline : null });
    toast('Dates saved.');
  };
  return (
    <Screen>
      <InlineHeader title="Dates and plan" backTo="/today/settings" backLabel="Settings" />
      <div className="stack">
        <div className="card stack">
          <Field label="Start date"><input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
          <Field label="Exam date" hint="The final week and checkpoints follow this date."><input className="input" type="date" value={exam} onChange={(e) => setExam(e.target.value)} /></Field>
          {short && <p className="footnote" style={{ color: 'var(--warning)' }}>That’s less than 8 weeks. The plan needs about 12 months.</p>}
          {!valid && <p className="footnote" style={{ color: 'var(--danger)' }}>The exam must be after the start date.</p>}
          <Field label="University application deadline (optional)"><input className="input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></Field>
          {isISODate(deadline) && deadline < exam && <p className="footnote" style={{ color: 'var(--warning)' }}>Your deadline is before the exam. Results take about 3–13 days. You may need an earlier exam date.</p>}
          <button className="btn primary" disabled={!valid} onClick={() => void save()}>Save dates</button>
        </div>
        <div className="card stack">
          <p className="headline">Exam format</p>
          <Chips<ExamFormat> value={s.examFormat} onChange={(v) => void updateSettings({ examFormat: v })} options={[{ value: 'undecided', label: 'Not decided' }, { value: 'computer', label: 'Computer' }, { value: 'paper', label: 'Paper' }]} label="Exam format" />
        </div>
        <div className="card stack">
          <p className="headline">Target overall band</p>
          <Chips<number> value={s.targetOverall} onChange={(v) => void updateSettings({ targetOverall: v })} options={[6.5, 7, 7.5].map((b) => ({ value: b, label: b.toFixed(1) }))} label="Target overall band" />
          <p className="headline">University minimum per skill</p>
          <BandPicker value={s.targetMinPerSkill} onChange={(v) => void updateSettings({ targetMinPerSkill: v })} options={[5.5, 6, 6.5, 7, 7.5]} />
          <p className="footnote">Many universities ask for a minimum in each skill, often 6.0 or 6.5. Check yours.</p>
        </div>
      </div>
    </Screen>
  );
}

export function BackupScreen({ backTo }: { backTo: string }) {
  const { state, toast } = useApp();
  const s = state.settings;
  const counts = useLiveQuery(async () => ({ essays: await db.essays.where('status').equals('done').count(), words: await db.cards.count() }), []);
  const [audio, setAudio] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ file: BackupFile; preview: BackupPreview } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [undoBusy, setUndoBusy] = useState(false);
  const [undoMsg, setUndoMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const snapshot = useLiveQuery(() => latestSnapshot(), []);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastBackup = s.lastBackupAt ? daysBetween(bakuDate(s.lastBackupAt), state.today) : null;

  const pick = async (f: File | undefined) => {
    setError(null);
    setPreview(null);
    if (!f) return;
    const text = await f.text();
    const r = parseBackup(text);
    if (!r.ok) setError(BACKUP_ERROR_TEXT[r.error]);
    else setPreview({ file: r.file, preview: r.preview });
    if (fileRef.current) fileRef.current.value = '';
  };

  const replace = async () => {
    if (!preview) return;
    if (!window.confirm('Replace data on this phone with this backup? Current data will be overwritten. (A safety copy is kept for 7 days.)')) return;
    setBusy(true);
    try {
      const repaired = preview.preview.datesRepaired;
      await replaceWithBackup(preview.file);
      setPreview(null);
      setUndoMsg(null);
      toast(repaired ? 'Backup restored. Check your start and exam dates in Settings › Dates and plan.' : 'Backup restored.');
    } catch {
      setError(BACKUP_ERROR_TEXT.damaged);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <InlineHeader title="Backup & Restore" backTo={backTo} backLabel={backTo.includes('progress') ? 'Progress' : 'Settings'} />
      <div className="stack">
        <div className="card stack">
          <p className="headline">Your data lives on this iPhone only</p>
          <p className="callout">If you delete the app or clear Safari data, it is gone. A backup file keeps it safe. Back up at least once a month — weekly is better.</p>
        </div>
        <div className={`card stack ${lastBackup === null || lastBackup > 14 ? 'tinted-warning' : 'tinted-success'}`}>
          <p className="headline">{lastBackup === null ? 'Never backed up' : `Last backup: ${lastBackup === 0 ? 'today' : `${plural(lastBackup, 'day')} ago`}`}</p>
          <p className="subhead">{plural(counts?.words ?? 0, 'word')} · {plural(counts?.essays ?? 0, 'essay')}</p>
        </div>
        <div className="row card">
          <span style={{ flex: 1 }}>Include voice recordings (larger file)</span>
          <Switch checked={audio} onChange={setAudio} label="Include voice recordings" />
        </div>
        <BackupFlow key={audio ? 'a' : 'n'} includeAudio={audio} />
        <div className="card stack">
          <p className="headline">Backup reminders</p>
          <Chips<Settings['backupFrequency']>
            value={s.backupFrequency}
            onChange={(v) => void updateSettings({ backupFrequency: v })}
            options={[{ value: 'weekly', label: 'Weekly' }, { value: 'biweekly', label: 'Every 2 weeks' }, { value: 'monthly', label: 'Monthly' }, { value: 'never', label: 'Never' }]}
            wrap
            label="Backup reminders"
          />
        </div>

        <p className="section-title">Restore from a backup</p>
        <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={(e) => void pick(e.target.files?.[0])} />
        <button className="btn block" onClick={() => fileRef.current?.click()}>Choose backup file</button>
        {error && <div className="card tinted-warning"><p className="callout"><Icon name="warning" size={18} /> {error}</p></div>}
        {preview && (
          <div className="card stack">
            <p className="headline">This backup is from {formatShort(bakuDate(Date.parse(preview.preview.exportedAt) || Date.now()))}</p>
            <p className="callout">{plural(preview.preview.words, 'word')} · {plural(preview.preview.essays, 'essay')} · {plural(preview.preview.daysStudied, 'day')} studied · {plural(preview.preview.mistakes, 'mistake')} · {plural(preview.preview.tests, 'test')}</p>
            {preview.preview.datesRepaired && (
              <p className="footnote" style={{ color: 'var(--warning)' }}>
                The start date in this backup is not before the exam date. Your data will be kept, and the exam date is set to an estimate one year after the start. After the import, check your dates in Settings › Dates and plan.
              </p>
            )}
            <BackupFlow small label="Back up current data first" />
            <button className="btn danger block" disabled={busy} onClick={() => void replace()}>Replace everything</button>
            <button className="btn plain" onClick={() => setPreview(null)}>Cancel</button>
          </div>
        )}
        {snapshot && (
          <div className="card stack">
            <p className="headline">{snapshot.reason === 'Before restore' ? 'Undo restore' : 'Undo import'}</p>
            <p className="subhead">Safety copy from {formatDateTime(snapshot.createdAt)} ({snapshot.reason}). Kept for 7 days.</p>
            <button
              className="btn block"
              disabled={undoBusy}
              onClick={async () => {
                if (undoBusy) return;
                if (!window.confirm(`Go back to the safety copy from ${formatDateTime(snapshot.createdAt)}?\n\n${changesLostText(snapshot.createdAt)}`)) return;
                setUndoBusy(true);
                setUndoMsg(null);
                try {
                  const ok = await restoreSnapshot(snapshot.id);
                  if (!ok) throw new Error('missing');
                  setUndoMsg({ ok: true, text: 'Restored the safety copy. Your data from before is back.' });
                  toast('Restored the safety copy.');
                } catch {
                  setUndoMsg({ ok: false, text: 'The safety copy could not be restored. Nothing was changed.' });
                } finally {
                  setUndoBusy(false);
                }
              }}
            >
              {undoBusy ? 'Restoring…' : snapshot.reason === 'Before restore' ? 'Undo restore' : 'Undo import'}
            </button>
          </div>
        )}
        {undoMsg && (
          <div className={`card ${undoMsg.ok ? 'tinted-success' : 'tinted-warning'}`} role="status">
            <p className="callout">{undoMsg.text}</p>
          </div>
        )}
      </div>
    </Screen>
  );
}

export function RulesScreen({ backTo }: { backTo: string }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <Screen>
      <InlineHeader title="Golden rules" backTo={backTo} backLabel="Back" />
      <div className="stack">
        {GOLDEN_RULES.map((r) => (
          <button key={r.id} className="card stack" style={{ border: 'none', textAlign: 'left', color: 'inherit', cursor: 'pointer' }} onClick={() => setOpen(open === r.id ? null : r.id)} aria-expanded={open === r.id}>
            <span className="row"><Icon name="star" /><span className="headline">{r.id}. {r.title}</span></span>
            {open === r.id ? <span className="callout">{r.text}</span> : <span className="subhead">Tap to read why it matters</span>}
          </button>
        ))}
      </div>
    </Screen>
  );
}

export function PracticeTimerScreen() {
  const [mode, setMode] = useState<'reading' | 'listening' | 'custom'>('reading');
  const [mins, setMins] = useState(20);
  const minutes = mode === 'reading' ? 20 : mode === 'listening' ? 30 : mins;
  return (
    <Screen>
      <InlineHeader title="Timed practice" backTo="/practice" backLabel="Practice" />
      <div className="stack">
        <Segmented value={mode} onChange={setMode} options={[{ value: 'reading', label: 'Reading 20' }, { value: 'listening', label: 'Listening 30' }, { value: 'custom', label: 'Custom' }]} label="Timer type" />
        {mode === 'custom' && <div className="row"><span style={{ flex: 1 }}>Minutes</span><Stepper value={mins} min={5} max={180} step={5} onChange={setMins} /></div>}
        <TimerView key={`${mode}-${minutes}`} storageKey={`practice:${mode}:${minutes}`} minutes={minutes} label={mode === 'reading' ? 'Reading · one passage' : mode === 'listening' ? 'Listening · full test' : 'Custom timer'} />
        <p className="footnote">The timer keeps running if you lock the phone or switch apps.</p>
      </div>
    </Screen>
  );
}
