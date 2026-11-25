import { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { SPEAKING_PROMPTS } from '../../content';
import type { SpeakingPrompt } from '../../content/types';
import { SPEAKING_TIPS } from '../../data';
import { db, uid } from '../../db/db';
import type { RecordingMeta } from '../../db/db';
import { deleteRecording, saveLiveSession, saveRecording } from '../../db/actions';
import { useApp } from '../../app/AppContext';
import { goBack, navigate, useRoute } from '../../app/router';
import { formatClock, formatShort, mondayOf } from '../../logic/dates';
import { expiryLabel, extensionForMime, formatBytes } from '../../logic/recordings';
import { hashString } from '../../logic/quiz';
import { splitCueBullets } from '../../logic/text';
import { useNow } from '../../state/hooks';
import { useTimer } from '../../ui/TimerView';
import { CheckRow, Chips, Empty, Field, FullTop, InlineHeader, Row, Screen, Sheet, SkillTile, Stepper } from '../../ui/components';
import { Icon } from '../../ui/Icon';
import { Recorder, recordingSupported } from './recorder';
import type { RecorderResult } from './recorder';

export const SELF_REVIEW = [
  'I spoke for almost the full time',
  'I explained, not just answered',
  'I gave a real example',
  'I kept going when I made a mistake',
  'I used some linking words (because, however…)',
];
const SCORE_KEYS = ['Fluency', 'Vocabulary', 'Grammar', 'Pronunciation'];
const PART_LABEL: Record<string, string> = { '0': 'Free talk', '1': 'Part 1', '2': 'Part 2', '3': 'Part 3', full: 'Full test' };
const MAX_MS: Record<string, number> = { '0': 6 * 60_000, '1': 6 * 60_000, '2': 150_000, '3': 6 * 60_000, full: 15 * 60_000 };

export function SpeakingHub() {
  const { state, toast } = useApp();
  const route = useRoute();
  const [liveOpen, setLiveOpen] = useState(route.query.get('live') === '1');
  const count = useLiveQuery(() => db.recordings.count(), []);
  const weekStart = mondayOf(state.today);
  const liveWeek = useLiveQuery(() => db.liveSessions.where('date').aboveOrEqual(weekStart).count(), [weekStart]);
  const [live, setLive] = useState({ minutes: 30, withWhom: '', notes: '' });
  const phase = state.day.phase ?? 1;
  useEffect(() => {
    if (route.query.get('live') === '1') setLiveOpen(true);
  }, [route.query]);
  return (
    <Screen>
      <InlineHeader title="Speaking" backTo="/practice" backLabel="Practice" />
      <div className="stack">
        <div className="list">
          <Row left={<SkillTile skill="speaking" />} title="Part 1 · Questions about you" subtitle="4–5 questions" onClick={() => navigate('/speak/1')} />
          <Row left={<SkillTile skill="speaking" />} title="Part 2 · Talk for 2 minutes" subtitle="1 min prep + 2 min talk" onClick={() => navigate('/speak/2')} />
          <Row left={<SkillTile skill="speaking" />} title="Part 3 · Discussion" subtitle="Deeper questions" onClick={() => navigate('/speak/3')} />
          <Row left={<SkillTile skill="speaking" />} title="Free talk" subtitle="3–5 min on one topic" onClick={() => navigate('/speak/0')} />
          {phase >= 3 && <Row left={<SkillTile skill="speaking" />} title="Full test · 11–14 min" subtitle="Parts 1, 2 and 3" onClick={() => navigate('/speak/full')} />}
        </div>
        <div className="list">
          <Row title="Recordings" value={count ?? 0} onClick={() => navigate('/practice/speaking/recordings')} />
          <Row title="Log a live session" subtitle={`With a teacher or partner · this week: ${liveWeek ?? 0}`} onClick={() => setLiveOpen(true)} />
        </div>
        {phase >= 3 && <div className="card"><p className="headline">Talk to a real person 2 times this week. {liveWeek ?? 0} of 2 done.</p></div>}
        <div className="card stack">
          <p className="headline">Recording yourself is the fastest way to improve.</p>
          {SPEAKING_TIPS.map((t) => <p key={t} className="callout">• {t}</p>)}
          <p className="footnote">Recordings are deleted automatically 24 hours after you record them. Your self-review stays.</p>
        </div>
      </div>
      <Sheet
        open={liveOpen}
        onClose={() => setLiveOpen(false)}
        title="Live session"
        right={
          <button
            className="btn plain"
            onClick={async () => {
              await saveLiveSession({ date: state.today, ...live });
              setLiveOpen(false);
              toast('Live session logged.');
            }}
          >
            Save
          </button>
        }
      >
        <div className="stack">
          <Field label="Minutes"><Stepper value={live.minutes} step={5} min={5} max={180} onChange={(v) => setLive({ ...live, minutes: v })} format={(v) => `${v} min`} /></Field>
          <Field label="With whom"><input className="input" value={live.withWhom} onChange={(e) => setLive({ ...live, withWhom: e.target.value })} placeholder="Teacher, partner, iTalki…" /></Field>
          <Field label="Notes"><textarea className="textarea" value={live.notes} onChange={(e) => setLive({ ...live, notes: e.target.value })} placeholder="What did you learn? What to fix?" /></Field>
        </div>
      </Sheet>
    </Screen>
  );
}

function pickPrompt(part: 1 | 2 | 3, phase: number, used: Set<string>, seed: string, skip: number): SpeakingPrompt | null {
  const all = SPEAKING_PROMPTS.filter((p) => p.part === part);
  if (!all.length) return null;
  const score = (p: SpeakingPrompt) => (p.phase <= phase ? 0 : 2) + (used.has(p.id) ? 1 : 0);
  const sorted = [...all].sort((a, b) => score(a) - score(b) || (hashString(seed + a.id) % 1000) - (hashString(seed + b.id) % 1000));
  return sorted[skip % sorted.length];
}

type Stage = 'ready' | 'mic' | 'denied' | 'prep' | 'recording' | 'saving' | 'timeronly' | 'interrupted' | 'review';

export function SpeakingSession({ part }: { part: string }) {
  const { state, toast } = useApp();
  const route = useRoute();
  const topicQ = route.query.get('topic');
  const used = useLiveQuery(() => db.recordings.toArray(), []);
  const [skip, setSkip] = useState(0);
  const [stage, setStageState] = useState<Stage>('ready');
  const stageRef = useRef<Stage>('ready');
  const setStage = (st: Stage) => {
    stageRef.current = st;
    setStageState(st);
  };
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<RecorderResult | null>(null);
  const [recId, setRecId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<Recorder | null>(null);
  const prepTimer = useTimer(null, 60_000);
  const talkTimer = useTimer(null, part === '2' ? 120_000 : 0);
  const [tick, setTick] = useState(0);
  const phase = state.day.phase ?? 1;
  const seed = state.today + part;

  const prompts = useMemo(() => {
    if (!used) return [];
    const u = new Set(used.map((r) => r.promptId).filter((x): x is string => !!x));
    if (part === 'full') return [pickPrompt(1, phase, u, seed, skip), pickPrompt(2, phase, u, seed, skip), pickPrompt(3, phase, u, seed, skip)].filter((p): p is SpeakingPrompt => !!p);
    if (part === '0') return [];
    const p = pickPrompt(Number(part) as 1 | 2 | 3, phase, u, seed, skip);
    return p ? [p] : [];
  }, [used, part, phase, seed, skip]);
  const main = prompts.find((p) => p.part === 2) ?? prompts[0];
  const title = part === '0' ? (topicQ ?? 'Free talk') : main ? `${PART_LABEL[part]} · ${main.topic}` : PART_LABEL[part];

  // Tick while recording / prep.
  useEffect(() => {
    if (stage !== 'recording' && stage !== 'prep' && stage !== 'timeronly') return;
    const id = window.setInterval(() => setTick((t) => t + 1), 250);
    return () => window.clearInterval(id);
  }, [stage]);

  // Part 2: prep → speak automatically.
  useEffect(() => {
    if (stage === 'prep' && prepTimer.timeUp) void beginTalk();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, stage]);

  // Hard cap.
  useEffect(() => {
    if (stage === 'recording' && recRef.current && recRef.current.elapsed() >= MAX_MS[part]) void stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  useEffect(
    () => () => {
      // cancel() is a no-op while a stop is pending, so a take being saved still finishes saving
      // (the stop()/persist chain keeps running after unmount).
      recRef.current?.cancel();
      recRef.current?.release();
    },
    [],
  );

  /** One mic/record/stop operation at a time (double taps, the prep auto-start and the hard cap). */
  const inFlight = useRef(false);
  const guard = async (fn: () => Promise<void>) => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      await fn();
    } finally {
      inFlight.current = false;
    }
  };

  const onInterrupted = (res: RecorderResult) => {
    setResult(res);
    setStage('interrupted');
  };

  const allowMic = () =>
    guard(async () => {
      setError(null);
      if (!recordingSupported()) {
        setError('Recording is not available in this browser. You can still practise with the timer.');
        setStage('timeronly');
        return;
      }
      setStage('mic');
      try {
        const r = recRef.current ?? new Recorder();
        r.onInterrupted = onInterrupted;
        recRef.current = r;
        if (part === '2') {
          // Ask for the mic now (user gesture), but start recording after the prep minute.
          await r.acquire();
          prepTimer.restart(60_000);
          setStage('prep');
        } else {
          await r.start();
          talkTimer.restart(0);
          setStage('recording');
        }
      } catch (e) {
        const name = (e as DOMException)?.name;
        setStage(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'ready');
        if (name !== 'NotAllowedError' && name !== 'SecurityError') setError('We could not start the microphone. Try again.');
      }
    });

  const beginTalk = () =>
    guard(async () => {
      if (stageRef.current !== 'prep') return;
      setStage('mic');
      try {
        const r = recRef.current ?? new Recorder();
        recRef.current = r;
        r.onInterrupted = onInterrupted;
        if (!r.busy) await r.start();
        talkTimer.restart(120_000);
        setStage('recording');
      } catch {
        setError('Recording could not start, so this take is not being recorded. Keep talking with the timer, or close and try again.');
        setStage('timeronly');
        talkTimer.restart(120_000);
      }
    });

  /** The take currently being finished + saved (close/unmount let it complete). */
  const savingRef = useRef<Promise<void> | null>(null);
  const trackSave = (p: Promise<void>) => {
    savingRef.current = p;
    void p.finally(() => {
      if (savingRef.current === p) savingRef.current = null;
    });
    return p;
  };

  const stop = () =>
    guard(async () => {
      const r = recRef.current;
      if (!r || stageRef.current !== 'recording') return;
      setStage('saving');
      await trackSave(
        (async () => {
          const res = await r.stop();
          setResult(res);
          const ok = await persist(res);
          setStage(ok ? 'review' : 'interrupted');
        })(),
      );
    });

  /** Save the audio. Returns false (and shows an error) if it could not be stored. */
  const persist = async (res: RecorderResult): Promise<boolean> => {
    setError(null);
    if (res.blob.size === 0) return true;
    const id = uid('rec');
    try {
      await saveRecording(
        {
          id,
          createdAt: Date.now(),
          date: state.today,
          part: part === 'full' ? 0 : (Number(part) as 0 | 1 | 2 | 3),
          promptId: main?.id,
          promptTitle: title,
          mime: res.mime,
          size: res.blob.size,
          durationMs: res.durationMs,
        },
        res.blob,
      );
    } catch (e) {
      const full = (e as DOMException)?.name === 'QuotaExceededError';
      setError(full ? 'The phone’s storage for this app is full, so the recording was not saved. Delete old recordings and try again.' : 'The recording could not be saved. Try again.');
      return false;
    }
    setRecId(id);
    return true;
  };

  const keep = () =>
    guard(async () => {
      if (!result) return;
      setStage('saving');
      await trackSave(
        (async () => {
          const ok = await persist(result);
          setStage(ok ? 'review' : 'interrupted');
        })(),
      );
    });

  const again = () => {
    setResult(null);
    setRecId(null);
    setStage('ready');
  };

  const [leaving, setLeaving] = useState(false);
  const close = async () => {
    if (stageRef.current === 'saving' || savingRef.current) {
      // Never drop a take that is being saved: wait for it, then leave.
      setLeaving(true);
      try {
        await savingRef.current;
      } catch {
        /* persist reports its own errors */
      }
      if (stageRef.current === 'interrupted') {
        setLeaving(false); // saving failed: stay so the user can retry
        return;
      }
      toast('Recording saved.');
      goBack('/practice/speaking');
      return;
    }
    if (stageRef.current === 'recording' && !window.confirm('Stop and leave? The recording so far will be lost.')) return;
    recRef.current?.cancel();
    goBack('/practice/speaking');
  };

  const elapsed = recRef.current?.elapsed() ?? 0;
  void tick;

  return (
    <Screen full>
      <FullTop onClose={() => void close()} title={PART_LABEL[part]} />
      <div className="stack">
        {/* Prompt card */}
        {part === '0' ? (
          <div className="card stack">
            <p className="title2">{topicQ ?? 'Choose a topic'}</p>
            {!topicQ && <TopicChips />}
            <p className="callout">Talk for 3–5 minutes. Explain and give examples. Then listen, note your mistakes, and record again.</p>
          </div>
        ) : (
          prompts.map((p) => (
            <div key={p.id} className="card stack selectable">
              <p className="footnote">{PART_LABEL[String(p.part)]} · {p.topic}</p>
              {p.part === 2 ? (
                <>
                  <p className="headline">{p.questions[0]}</p>
                  {p.bullets && p.bullets.length > 0 && <CueCardBullets bullets={p.bullets} />}
                  {p.questions.slice(1).map((q) => <p key={q} className="callout">{q}</p>)}
                </>
              ) : (
                <ol style={{ margin: 0, paddingLeft: 20 }}>{p.questions.map((q) => <li key={q} style={{ marginBottom: 6 }}>{q}</li>)}</ol>
              )}
              {p.usefulLanguage && p.usefulLanguage.length > 0 && <p className="subhead">Useful: {p.usefulLanguage.join(' · ')}</p>}
            </div>
          ))
        )}
        {prompts.length === 0 && part !== '0' && <Empty text="No prompts in the bank yet." />}

        {stage === 'ready' && (
          <div className="card stack">
            {part !== '0' && <button className="btn plain small" onClick={() => setSkip(skip + 1)}>Another topic</button>}
            <p className="callout">We need your microphone to record your voice. The recording stays on this phone and is deleted after 24 hours.</p>
            <button className="btn primary" onClick={() => void allowMic()}>
              <Icon name="speaking" size={18} /> {part === '2' ? 'Start preparing (1 min)' : 'Allow microphone and record'}
            </button>
            <button className="btn block" onClick={() => { setError(null); setStage('timeronly'); talkTimer.restart(part === '2' ? 120_000 : 0); }}>Practice without recording</button>
            {error && <p className="footnote" style={{ color: 'var(--danger)' }}>{error}</p>}
            <p className="footnote">Keep the app open while recording. iPhone stops recording if you switch apps or lock the screen.</p>
          </div>
        )}

        {stage === 'denied' && (
          <div className="card stack tinted-warning">
            <p className="headline">Microphone is off.</p>
            <p className="callout">Open iPhone Settings › Safari › Microphone (or Settings › IELTS Mentor) and allow it. Then try again.</p>
            <button className="btn" onClick={() => setStage('ready')}>Try again</button>
            <button className="btn block" onClick={() => { setError(null); setStage('timeronly'); talkTimer.restart(part === '2' ? 120_000 : 0); }}>Practice without recording</button>
          </div>
        )}

        {stage === 'prep' && (
          <div className="card stack">
            <p className="subhead">Step 1: Prepare</p>
            <div className="timer-digits">{formatClock(prepTimer.remaining)}</div>
            <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Short notes (optional)" />
            <button className="btn primary" onClick={() => void beginTalk()}>I’m ready — start talking</button>
          </div>
        )}

        {stage === 'recording' && (
          <div className="card stack" style={{ alignItems: 'center' }}>
            <p className="row" style={{ gap: 8 }}><span className="rec-dot" /> <b>Recording</b></p>
            <div className="timer-digits">{formatClock(elapsed)}</div>
            {part === '2' && <p className="subhead">{elapsed < 120_000 ? `Target 2:00 · ${formatClock(120_000 - elapsed)} to go` : 'Good — you can finish now.'}</p>}
            {notes && <p className="footnote prewrap" style={{ alignSelf: 'stretch' }}>{notes}</p>}
            <button className="btn primary" onClick={() => void stop()}><Icon name="stop" size={18} /> Stop</button>
          </div>
        )}

        {(stage === 'mic' || stage === 'saving') && (
          <div className="card stack" style={{ alignItems: 'center' }}>
            <p className="subhead">{stage === 'mic' ? 'Starting the microphone…' : leaving ? 'Saving your recording… The screen closes when it is saved.' : 'Saving your recording…'}</p>
          </div>
        )}

        {stage === 'timeronly' && (
          <div className="card stack" style={{ alignItems: 'center' }}>
            <p className="subhead">Practice with the timer</p>
            {error && <p className="footnote" style={{ color: 'var(--danger)' }} role="alert">{error}</p>}
            <div className="timer-digits">{part === '2' ? (talkTimer.timeUp ? 'Time’s up' : formatClock(talkTimer.remaining)) : formatClock(talkTimer.elapsed)}</div>
            <button className="btn primary" onClick={() => setStage('review')}>Finish</button>
          </div>
        )}

        {stage === 'interrupted' && result && (
          <div className="card stack tinted-warning">
            <p className="headline">Recording was interrupted.</p>
            <p className="callout">{formatClock(result.durationMs)} recorded.</p>
            {error && <p className="footnote" style={{ color: 'var(--danger)' }}>{error}</p>}
            <button className="btn primary" onClick={() => void keep()}>{error ? 'Try saving again' : 'Keep what we have'}</button>
            <button className="btn block" onClick={again}>Record again</button>
          </div>
        )}

        {stage === 'review' && (
          <ReviewPanel
            recId={recId}
            date={state.today}
            onAgain={again}
            onDone={() => {
              toast('Saved. Your self-review is kept.');
              goBack('/practice/speaking');
            }}
          />
        )}
      </div>
    </Screen>
  );
}

/** Like a real cue card: "You should say:", bullet points, then the "and explain …" line without a bullet. */
function CueCardBullets({ bullets }: { bullets: string[] }) {
  const { points, explain } = splitCueBullets(bullets);
  return (
    <>
      <p className="headline">You should say:</p>
      {points.length > 0 && <ul style={{ margin: 0, paddingLeft: 24 }}>{points.map((b) => <li key={b}>{b}</li>)}</ul>}
      {explain.map((b) => <p key={b} className="callout" style={{ paddingLeft: 24 }}>{b}</p>)}
    </>
  );
}

function TopicChips() {
  const topics = ['Family', 'Work or studies', 'Hobbies', 'Your city', 'Food', 'A recent trip', 'Technology', 'A good book or film'];
  return (
    <div className="chips wrap">
      {topics.map((t) => (
        <button key={t} className="chip" onClick={() => navigate(`/speak/0?topic=${encodeURIComponent(t)}`, { replace: true })}>{t}</button>
      ))}
    </div>
  );
}

function useBlobUrl(id: string | null): string | null {
  const audio = useLiveQuery(() => (id ? db.audio.get(id) : undefined), [id]);
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!audio) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(audio.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [audio]);
  return url;
}

export function AudioPlayer({ id }: { id: string }) {
  const url = useBlobUrl(id);
  const ref = useRef<HTMLAudioElement>(null);
  const [rate, setRate] = useState(1);
  if (!url) return <p className="footnote">Audio not available.</p>;
  return (
    <div className="stack" style={{ gap: 8 }}>
      <audio ref={ref} src={url} controls preload="metadata" style={{ width: '100%' }} />
      <div className="row">
        <span className="subhead">Speed</span>
        <Chips<number>
          value={rate}
          onChange={(v) => {
            setRate(v);
            if (ref.current) ref.current.playbackRate = v;
          }}
          options={[{ value: 1, label: '1x' }, { value: 0.75, label: '0.75x' }]}
        />
      </div>
    </div>
  );
}

export async function shareRecording(meta: RecordingMeta): Promise<void> {
  const a = await db.audio.get(meta.id);
  if (!a) return;
  const name = `ielts-speaking-${meta.date}-${meta.id.slice(-6)}.${extensionForMime(meta.mime)}`;
  const file = new File([a.blob], name, { type: meta.mime });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: 'Speaking recording' });
      return;
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(a.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function ReviewPanel({ recId, date, onAgain, onDone }: { recId: string | null; date: string; onAgain: () => void; onDone: () => void }) {
  const meta = useLiveQuery(() => (recId ? db.recordings.get(recId) : undefined), [recId]);
  const [check, setCheck] = useState<Record<string, boolean>>({});
  const [scores, setScores] = useState<Record<string, number | null>>({});
  const [notes, setNotes] = useState('');
  const save = async () => {
    if (recId) await db.recordings.update(recId, { review: { checklist: check, scores, notes } });
    else {
      // Practice without recording: keep the self-review as a recording entry with no audio.
      const now = Date.now();
      await db.recordings.put({
        id: uid('rec'), createdAt: now, expiresAt: now, date, part: 0, promptTitle: 'Practice (no recording)',
        mime: '', size: 0, durationMs: 0, audioDeleted: true, review: { checklist: check, scores, notes },
      });
    }
    onDone();
  };
  return (
    <div className="stack">
      {recId && (
        <div className="card stack">
          <AudioPlayer id={recId} />
          {meta && <p className="footnote">{formatBytes(meta.size)} · {expiryLabel(meta, Date.now())}</p>}
          {meta && <button className="btn small" onClick={() => void shareRecording(meta)}><Icon name="share" size={18} /> Save to Files / share</button>}
        </div>
      )}
      <div className="card stack">
        <p className="headline">Listen once, then check:</p>
        {SELF_REVIEW.map((it) => <CheckRow key={it} checked={!!check[it]} onChange={(v) => setCheck({ ...check, [it]: v })}>{it}</CheckRow>)}
      </div>
      <div className="card stack">
        {SCORE_KEYS.map((k) => (
          <div key={k} className="stack" style={{ gap: 4 }}>
            <p className="subhead">{k} (1–5)</p>
            <Chips<number> value={scores[k] ?? null} onChange={(v) => setScores({ ...scores, [k]: v })} options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))} />
          </div>
        ))}
      </div>
      <Field label="My mistakes to fix">
        <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. 1:10 “I have went” → “I went”" />
      </Field>
      <button className="btn primary" onClick={() => void save()}>Save</button>
      <button className="btn block" onClick={onAgain}>Record again</button>
      <button className="btn block" onClick={() => navigate('/mistakes?add=1&skill=speaking')}>Add to Mistakes</button>
    </div>
  );
}

export function RecordingsScreen() {
  const now = useNow(60_000);
  const recs = useLiveQuery(() => db.recordings.orderBy('createdAt').reverse().toArray(), []);
  const [open, setOpen] = useState<RecordingMeta | null>(null);
  const total = (recs ?? []).filter((r) => !r.audioDeleted).reduce((s, r) => s + r.size, 0);
  return (
    <Screen>
      <InlineHeader title="Recordings" backTo="/practice/speaking" backLabel="Speaking" />
      <div className="stack">
        <p className="footnote">Audio is deleted automatically 24 hours after recording. Save it to Files before then if you want to keep it. Self-review results stay. Audio now: {formatBytes(total)}.</p>
        {recs && recs.length === 0 ? (
          <Empty text="No recordings yet. Your first one will feel strange. That’s normal. It gets easier." action={<button className="btn" onClick={() => navigate('/speak/2')}>Record Part 2</button>} />
        ) : (
          <div className="list">
            {(recs ?? []).map((r) => {
              const done = r.review ? Object.values(r.review.checklist).filter(Boolean).length : 0;
              return (
                <Row
                  key={r.id}
                  title={`${formatShort(r.date)} · ${r.promptTitle}`}
                  subtitle={`${r.durationMs ? formatClock(r.durationMs) + ' · ' : ''}${r.audioDeleted ? 'Audio deleted' : expiryLabel(r, now)}${r.review ? ` · checklist ${done}/${SELF_REVIEW.length}` : ''}`}
                  onClick={() => setOpen(r)}
                />
              );
            })}
          </div>
        )}
      </div>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.promptTitle}>
        {open && (
          <div className="stack">
            {!open.audioDeleted ? <AudioPlayer id={open.id} /> : <p className="subhead">The audio was deleted after 24 hours.</p>}
            {!open.audioDeleted && <p className="footnote">{formatBytes(open.size)} · {expiryLabel(open, now)}</p>}
            {!open.audioDeleted && <button className="btn block" onClick={() => void shareRecording(open)}><Icon name="share" size={18} /> Save to Files / share</button>}
            {open.review && (
              <div className="card stack">
                {SELF_REVIEW.map((it) => <p key={it} className="callout">{open.review!.checklist[it] ? '✓' : '–'} {it}</p>)}
                <p className="subhead">{SCORE_KEYS.map((k) => `${k} ${open.review!.scores[k] ?? '–'}`).join(' · ')}</p>
                {open.review.notes && <p className="callout prewrap">{open.review.notes}</p>}
              </div>
            )}
            <button
              className="btn danger block"
              onClick={async () => {
                if (!window.confirm('Delete this recording and its self-review?')) return;
                await deleteRecording(open.id);
                setOpen(null);
              }}
            >
              Delete
            </button>
          </div>
        )}
      </Sheet>
    </Screen>
  );
}
