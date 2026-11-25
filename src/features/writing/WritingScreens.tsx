import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { WRITING_PROMPTS } from '../../content';
import type { WritingPrompt } from '../../content/types';
import { TASK1_CHART_LABEL, TASK2_TYPE_ROTATION, WRITING_CRITERIA, WRITING_TIPS, criteriaToBand } from '../../data';
import type { Task1ChartType, Task2EssayType } from '../../data';
import { db, uid } from '../../db/db';
import type { Essay, EssayScores, WritingKind } from '../../db/db';
import { deleteEssay, saveEssay, setBlockDone, setBlockDoneById } from '../../db/actions';
import { useApp } from '../../app/AppContext';
import { goBack, navigate, useRoute } from '../../app/router';
import { formatClock, formatShort, isISODate } from '../../logic/dates';
import { paragraphCount, wordCount, minWordsFor, plural } from '../../logic/text';
import { hashString } from '../../logic/quiz';
import { resolveDay, task1ChartForDate, task2TypeForDate } from '../../logic/plan';
import type { PlanBlock } from '../../logic/plan';
import { useTimer } from '../../ui/TimerView';
import { BAND_OPTIONS, BandPicker, CheckRow, Empty, Field, FullTop, InlineHeader, Row, Screen, Segmented, Sheet, SkillTile, Switch } from '../../ui/components';
import { Icon } from '../../ui/Icon';

const KIND_LABEL: Record<WritingKind, string> = { task1: 'Task 1', task2: 'Task 2', paragraph: 'Paragraph' };
const TASK_MINUTES: Record<WritingKind, number> = { task1: 20, task2: 40, paragraph: 30 };

export const TASK2_TEMPLATE = [
  { part: 'Introduction', frames: ['Paraphrase the question in your own words.', 'Say clearly what this essay will do or what your opinion is: “In my view, … because …”.'] },
  { part: 'Body paragraph 1', frames: ['Topic sentence with your first main idea: “One important reason is that …”.', 'Explain it, then give a specific example: “For instance, …”.'] },
  { part: 'Body paragraph 2', frames: ['Topic sentence with your second main idea (or the other view): “On the other hand, …”.', 'Explain and support it with an example or a result.'] },
  { part: 'Conclusion', frames: ['Sum up your main points in one or two sentences: “To sum up, …”.', 'Repeat your position. Do not add new ideas.'] },
];

export function PracticeHub() {
  const { state } = useApp();
  const next = state.day.blocks.find((b) => !state.doneToday.has(b.id) && b.action !== 'none' && b.action !== 'timer' && b.action !== 'review');
  return (
    <Screen>
      <header className="header"><div className="titles"><h1 className="large-title">Practice</h1></div></header>
      <div className="stack">
        {next && (
          <>
            <p className="section-title">Suggested for today</p>
            <div className="list">
              <Row
                left={<SkillTile skill={next.displaySkill} />}
                title={`${next.title}${next.detail ? ` · ${next.detail}` : ''}`}
                subtitle={`${next.minutes} min`}
                onClick={() => navigate('/today')}
              />
            </div>
          </>
        )}
        <p className="section-title">Skills</p>
        <div className="list">
          <Row left={<SkillTile skill="grammar" />} title="Daily quiz" subtitle="5 questions" onClick={() => navigate('/quiz/daily')} />
          <Row left={<SkillTile skill="writing" />} title="Writing" subtitle="Task 1 · Task 2 · history" onClick={() => navigate('/practice/writing')} />
          <Row left={<SkillTile skill="speaking" />} title="Speaking" subtitle="Parts 1–3 · recordings" onClick={() => navigate('/practice/speaking')} />
          <Row left={<SkillTile skill="test" />} title="Test log" subtitle="Add a result · checkpoints" onClick={() => navigate('/practice/tests')} />
          <Row left={<SkillTile skill="reading" />} title="Timed practice" subtitle="Reading 20 min per passage · Listening 30 min" onClick={() => navigate('/practice/timer')} />
          <Row left={<SkillTile skill="rest" />} title="Golden rules" onClick={() => navigate('/practice/rules')} />
        </div>
      </div>
    </Screen>
  );
}

export function WritingHub() {
  const { state } = useApp();
  const count = useLiveQuery(() => db.essays.where('status').equals('done').count(), []);
  const [tpl, setTpl] = useState(false);
  const chart = task1ChartForDate(state.today);
  const t2 = task2TypeForDate(state.today);
  const phase = state.day.phase ?? 1;
  const essaysWeek = useLiveQuery(() => db.essays.where('status').equals('done').toArray(), []);
  const checked = (essaysWeek ?? []).filter((e) => e.feedbackReceived && e.feedbackAt && e.feedbackAt >= state.today.slice(0, 8) + '01').length;
  return (
    <Screen>
      <InlineHeader title="Writing" backTo="/practice" backLabel="Practice" />
      <div className="stack">
        {chart && (
          <div className="card">
            <p className="subhead">This week · Task 1 chart type</p>
            <p className="title2">{TASK1_CHART_LABEL[chart]}</p>
            <p className="subhead">Task 2 type: {t2.label}</p>
          </div>
        )}
        <div className="list">
          <Row left={<SkillTile skill="writing" />} title="Start Task 1" subtitle="20 min · 150+ words" onClick={() => navigate(`/write/task1${chart ? `?chart=${chart}` : ''}`)} />
          <Row left={<SkillTile skill="writing" />} title="Start Task 2" subtitle="40 min · 250+ words" onClick={() => navigate(`/write/task2?type=${t2.type}`)} />
          {phase >= 3 && <Row left={<SkillTile skill="writing" />} title="Full Writing" subtitle="60 min · Task 1 + Task 2" onClick={() => navigate(`/write/full?type=${t2.type}${chart ? `&chart=${chart}` : ''}`)} />}
          <Row left={<SkillTile skill="writing" />} title="Free paragraph" subtitle="150 words · use this week’s grammar" onClick={() => navigate('/write/paragraph')} />
          <Row title="Task 2 structure template" onClick={() => setTpl(true)} />
          <Row title="Essay history" value={count ?? 0} onClick={() => navigate('/practice/writing/history')} />
        </div>
        {phase >= 3 && <div className="card"><p className="headline">Get feedback: aim for 2 essays checked each week.</p><p className="subhead">Checked this month: {checked}</p></div>}
        <div className="card stack">
          {WRITING_TIPS.map((t) => <p key={t} className="callout">• {t}</p>)}
        </div>
      </div>
      <TemplateSheet open={tpl} onClose={() => setTpl(false)} />
    </Screen>
  );
}

function TemplateSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Task 2 structure">
      <div className="stack">
        {TASK2_TEMPLATE.map((p) => (
          <div key={p.part} className="card stack">
            <p className="headline">{p.part}</p>
            {p.frames.map((f) => <p key={f} className="callout selectable">{f}</p>)}
          </div>
        ))}
        <div className="card stack">
          <p className="headline">Essay types</p>
          {TASK2_TYPE_ROTATION.filter((t, i, a) => a.findIndex((x) => x.type === t.type) === i).map((t) => (
            <p key={t.type} className="callout"><b>{t.label}:</b> {t.structureTip}</p>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

function pickPrompt(task: 1 | 2, opts: { chart?: Task1ChartType | null; type?: Task2EssayType | null; phase: number; used: Set<string>; seed: string; skip: number }): WritingPrompt | null {
  const all = WRITING_PROMPTS.filter((p) => p.task === task);
  if (all.length === 0) return null;
  const score = (p: WritingPrompt) =>
    (opts.chart && p.chartType === opts.chart ? 0 : 4) + (opts.type && p.essayType === opts.type ? 0 : 4) + (p.phase <= opts.phase ? 0 : 2) + (opts.used.has(p.id) ? 1 : 0);
  const sorted = [...all].sort((a, b) => score(a) - score(b) || (hashString(opts.seed + a.id) % 1000) - (hashString(opts.seed + b.id) % 1000));
  return sorted[opts.skip % sorted.length];
}

interface Part {
  essay: Essay;
  prompt: WritingPrompt | null;
}

/** Full-screen writing session: /write/task1 | task2 | paragraph | full */
export function WritingSession({ mode }: { mode: 'task1' | 'task2' | 'paragraph' | 'full' }) {
  const { state, toast } = useApp();
  const route = useRoute();
  const chartQ = route.query.get('chart') as Task1ChartType | null;
  const typeQ = route.query.get('type') as Task2EssayType | null;
  const fromBlock = route.query.get('from');
  const rewriteOf = route.query.get('rewrite');
  const [parts, setParts] = useState<Part[] | null>(null);
  const [resumeAsk, setResumeAsk] = useState<Essay[] | null>(null);
  const [active, setActive] = useState(0);
  const [timed, setTimed] = useState(true);
  const [skip, setSkip] = useState(0);
  const [ownPrompt, setOwnPrompt] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);
  const [tpl, setTpl] = useState(false);
  const sessionId = parts?.[0]?.essay.sessionId ?? parts?.[0]?.essay.id ?? 'pending';
  const totalMin = mode === 'full' ? 60 : TASK_MINUTES[mode];
  const timer = useTimer(parts ? `write:${sessionId}` : null, timed ? totalMin * 60_000 : 0);
  const dirtyRef = useRef(false);
  const finishedRef = useRef(false);
  const partsRef = useRef<Part[] | null>(null);
  partsRef.current = parts;

  const kinds: WritingKind[] = mode === 'full' ? ['task1', 'task2'] : [mode];
  const timerStatus = timer.t.status;
  const timerLoaded = timer.loaded;
  useEffect(() => {
    if (timerLoaded && timerStatus === 'idle') timer.setDuration(timed ? totalMin * 60_000 : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timed, timerLoaded]);

  const newParts = useCallback(
    async (skipN: number) => {
      const used = new Set((await db.essays.toArray()).map((e) => e.promptId).filter((x): x is string => !!x));
      const sid = uid('w');
      const now = Date.now();
      let parentText = '';
      let parentPrompt = '';
      let parentPromptId: string | undefined;
      if (rewriteOf) {
        const p = await db.essays.get(rewriteOf);
        if (p) {
          parentText = p.text;
          parentPrompt = p.promptText;
          parentPromptId = p.promptId;
        }
      }
      const out: Part[] = kinds.map((k) => {
        const prompt =
          k === 'paragraph' || parentPrompt
            ? null
            : pickPrompt(k === 'task1' ? 1 : 2, { chart: chartQ, type: typeQ, phase: state.day.phase ?? 1, used, seed: `${state.today}|${k}`, skip: skipN });
        const essay: Essay = {
          id: mode === 'full' ? uid('e') : sid,
          sessionId: sid,
          kind: k,
          status: 'draft',
          date: state.today,
          startedAt: now,
          promptId: parentPromptId ?? prompt?.id,
          promptText:
            parentPrompt ||
            prompt?.prompt ||
            (k === 'paragraph' ? 'Write a 150-word paragraph about your week. Use the grammar you learned this week.' : ''),
          chartType: k === 'task1' ? (prompt?.chartType ?? chartQ ?? undefined) : undefined,
          essayType: k === 'task2' ? (prompt?.essayType ?? typeQ ?? undefined) : undefined,
          text: parentText,
          words: wordCount(parentText),
          timed: true,
          durationMs: 0,
          parentId: rewriteOf ?? undefined,
        };
        return { essay, prompt };
      });
      return out;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, chartQ, typeQ, rewriteOf, state.today, state.day.phase],
  );

  // Look for an existing draft.
  useEffect(() => {
    let alive = true;
    (async () => {
      const drafts = (await db.essays.where('status').equals('draft').toArray()).filter((e) => kinds.includes(e.kind));
      const groups = new Map<string, Essay[]>();
      for (const d of drafts) groups.set(d.sessionId ?? d.id, [...(groups.get(d.sessionId ?? d.id) ?? []), d]);
      const match = [...groups.values()].find((g) => g.length === kinds.length && kinds.every((k) => g.some((e) => e.kind === k)));
      if (!alive) return;
      if (match && !rewriteOf) setResumeAsk(match);
      else setParts(await newParts(0));
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback(async () => {
    const ps = partsRef.current;
    if (!ps || !dirtyRef.current || finishedRef.current) return;
    dirtyRef.current = false;
    for (const p of ps) await saveEssay(p.essay);
  }, []);

  // Autosave every 2 s and when the app is hidden (iOS may kill the PWA at any time).
  useEffect(() => {
    const id = window.setInterval(() => void persist(), 2000);
    const hide = () => document.visibilityState === 'hidden' && void persist();
    const pagehide = () => void persist();
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('pagehide', pagehide);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', hide);
      window.removeEventListener('pagehide', pagehide);
      void persist();
    };
  }, [persist]);

  if (resumeAsk) {
    return (
      <Screen full>
        <FullTop onClose={() => goBack('/practice/writing')} title="Writing" />
        <div className="card stack">
          <p className="headline">Resume your draft?</p>
          <p className="subhead">Started {formatShort(resumeAsk[0].date)} · {plural(resumeAsk.reduce((s, e) => s + e.words, 0), 'word')}</p>
          <button
            className="btn primary"
            onClick={() => {
              const byId = new Map(WRITING_PROMPTS.map((p) => [p.id, p]));
              const ordered = kinds.map((k) => resumeAsk.find((e) => e.kind === k)!);
              setParts(ordered.map((e) => ({ essay: e, prompt: e.promptId ? (byId.get(e.promptId) ?? null) : null })));
              setResumeAsk(null);
            }}
          >
            Resume
          </button>
          <button
            className="btn danger block"
            onClick={async () => {
              for (const e of resumeAsk) await deleteEssay(e.id);
              setParts(await newParts(0));
              setResumeAsk(null);
            }}
          >
            Discard
          </button>
        </div>
      </Screen>
    );
  }
  if (!parts) return <Screen full><FullTop onClose={() => goBack('/practice/writing')} /></Screen>;

  const cur = parts[active];
  const words = wordCount(cur.essay.text);
  const minWords = minWordsFor(cur.essay.kind);
  const started = timer.t.status !== 'idle';
  const anyText = parts.some((p) => p.essay.text.trim().length > 0);

  const setText = (text: string) => {
    dirtyRef.current = true;
    setParts(parts.map((p, i) => (i === active ? { ...p, essay: { ...p.essay, text, words: wordCount(text) } } : p)));
  };
  const setPromptText = (promptText: string) => {
    dirtyRef.current = true;
    setParts(parts.map((p, i) => (i === active ? { ...p, essay: { ...p.essay, promptText, promptId: undefined }, prompt: null } : p)));
  };

  const finish = async () => {
    if (!anyText) return;
    const now = Date.now();
    // Stop autosave first so a pending draft save can never overwrite the finished essay.
    finishedRef.current = true;
    dirtyRef.current = false;
    const done = parts.map((p) => ({
      ...p.essay,
      status: 'done' as const,
      finishedAt: now,
      words: wordCount(p.essay.text),
      timed,
      durationMs: timer.elapsed,
    }));
    for (const e of done) await saveEssay(e);
    timer.reset();
    if (fromBlock) {
      const i = fromBlock.indexOf('|');
      const date = fromBlock.slice(0, i);
      const blockId = fromBlock.slice(i + 1);
      const mins = Math.max(1, Math.round(timer.elapsed / 60000));
      if (i > 0 && blockId && isISODate(date)) {
        let b: PlanBlock | undefined;
        try {
          b = resolveDay(date, state.settings, state.ctx).blocks.find((x) => x.id === blockId);
        } catch {
          b = undefined;
        }
        // The plan may have changed since the block was opened: still tick the block by id.
        if (b) await setBlockDone(date, b, true, mins);
        else await setBlockDoneById(date, blockId, 'writing', mins);
      }
    }
    toast('Essay saved.');
    const order = [...done].sort((a, b) => (a.kind === 'task2' ? 0 : 1) - (b.kind === 'task2' ? 0 : 1));
    navigate(`/assess/${order[0].id}${order[1] ? `?next=${order[1].id}` : ''}`, { replace: true });
  };

  const close = async () => {
    await persist();
    goBack('/practice/writing');
  };

  return (
    <Screen full>
      <FullTop
        onClose={() => void close()}
        title={mode === 'full' ? 'Full Writing' : KIND_LABEL[cur.essay.kind]}
        right={
          started ? (
            <span className={`mono${timer.timeUp ? '' : ''}`} style={{ color: timer.timeUp ? 'var(--danger)' : timed && timer.remaining < 5 * 60_000 ? 'var(--warning)' : undefined }}>
              {timed ? (timer.timeUp ? 'Time’s up' : formatClock(timer.remaining)) : formatClock(timer.elapsed)}
            </span>
          ) : undefined
        }
      />
      <div className="stack">
        {mode === 'full' && (
          <Segmented<string> value={String(active)} onChange={(v) => setActive(Number(v))} options={parts.map((p, i) => ({ value: String(i), label: `${KIND_LABEL[p.essay.kind]} · ${wordCount(p.essay.text)} w` }))} label="Task" />
        )}

        {!started && (
          <div className="card stack">
            <Segmented<string> value={timed ? 'timed' : 'untimed'} onChange={(v) => setTimed(v === 'timed')} options={[{ value: 'timed', label: `Timed · ${totalMin} min` }, { value: 'untimed', label: 'Untimed' }]} label="Timer mode" />
            <button className="btn primary" onClick={timer.start}><Icon name="play" size={18} /> Start writing</button>
            {cur.essay.kind === 'task2' && <button className="btn plain small" onClick={() => setTpl(true)}>Structure template</button>}
          </div>
        )}

        <div className="card stack">
          <button className="row" style={{ border: 'none', background: 'none', padding: 0, color: 'inherit', minHeight: 44 }} onClick={() => setShowPrompt(!showPrompt)} aria-expanded={showPrompt}>
            <span className="headline" style={{ flex: 1, textAlign: 'left' }}>
              Question{cur.essay.chartType ? ` · ${TASK1_CHART_LABEL[cur.essay.chartType]}` : ''}
            </span>
            <Icon name={showPrompt ? 'minus' : 'plus'} size={18} />
          </button>
          {showPrompt &&
            (ownPrompt ? (
              <textarea className="textarea" value={cur.essay.promptText} onChange={(e) => setPromptText(e.target.value)} placeholder="Type or paste the question from your book." />
            ) : (
              <>
                <p className="selectable callout">{cur.essay.promptText || 'No question in the bank yet. Use your own question.'}</p>
                {cur.prompt?.dataDescription && <div className="passage selectable prewrap">{cur.prompt.dataDescription}</div>}
              </>
            ))}
          {showPrompt && !started && cur.essay.kind !== 'paragraph' && !rewriteOf && (
            <div className="row wrap">
              {!ownPrompt && (
                <button
                  className="btn small"
                  onClick={async () => {
                    const s = skip + 1;
                    setSkip(s);
                    const np = await newParts(s);
                    setParts(parts.map((p, i) => (i === active ? { ...np[i], essay: { ...np[i].essay, id: p.essay.id, sessionId: p.essay.sessionId, text: p.essay.text } } : p)));
                    dirtyRef.current = true;
                  }}
                >
                  Another question
                </button>
              )}
              <button className="btn plain small" onClick={() => setOwnPrompt(!ownPrompt)}>{ownPrompt ? 'Use app question' : 'Use my own question'}</button>
            </div>
          )}
        </div>

        {timer.timeUp && <div className="card tight tinted-warning"><p className="callout">Finish when you’re ready. Writing past the time is fine for practice.</p></div>}

        <div className="card">
          <textarea
            className="editor selectable"
            value={cur.essay.text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => !started && timer.start()}
            placeholder={started ? 'Start writing here…' : 'Tap Start, or just begin typing.'}
            spellCheck
            autoCorrect="off"
            autoCapitalize="sentences"
            aria-label="Your text"
          />
        </div>

        {(started || anyText) && <div className="footer-bar stack" style={{ gap: 8 }}>
          <div className="row">
            <span style={{ flex: 1, color: words >= minWords ? 'var(--success)' : undefined }} className="callout">
              {words >= minWords && <Icon name="check" size={16} />} Words: {words} / {minWords}+{words < minWords ? ` · ${minWords - words} to go` : ''} · Paragraphs: {paragraphCount(cur.essay.text)}
            </span>
            {started && (
              <button className="icon-btn" onClick={timer.t.status === 'running' ? timer.pause : timer.start} aria-label={timer.t.status === 'running' ? 'Pause timer' : 'Resume timer'}>
                <Icon name={timer.t.status === 'running' ? 'pause' : 'play'} />
              </button>
            )}
          </div>
          <button className="btn primary" disabled={!anyText} onClick={() => void finish()}>Finish</button>
        </div>}
      </div>
      <TemplateSheet open={tpl} onClose={() => setTpl(false)} />
    </Screen>
  );
}

/** Self-assessment by the 4 criteria: /assess/:id[?next=id2] */
export function AssessScreen({ id }: { id: string }) {
  const { toast } = useApp();
  const route = useRoute();
  const next = route.query.get('next');
  const essay = useLiveQuery(() => db.essays.get(id), [id]);
  const [scores, setScores] = useState<EssayScores>({ ta: null, cc: null, lr: null, gra: null });
  const [check, setCheck] = useState<Record<string, boolean>>({});
  const [fixNext, setFixNext] = useState('');
  const [needsFeedback, setNeedsFeedback] = useState(false);
  const [help, setHelp] = useState<string | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  useEffect(() => {
    if (essay && loadedId !== essay.id) {
      setScores(essay.scores ?? { ta: null, cc: null, lr: null, gra: null });
      setCheck(essay.checklist ?? {});
      setFixNext(essay.fixNext ?? '');
      setNeedsFeedback(!!essay.needsFeedback);
      setLoadedId(essay.id);
    }
  }, [essay, loadedId]);

  const criteria = useMemo(() => {
    const t = essay?.kind === 'task1' ? 'writing-task1' : 'writing-task2';
    const first = WRITING_CRITERIA.find((c) => c.appliesTo === t)!;
    const rest = WRITING_CRITERIA.filter((c) => c.appliesTo === 'writing-both');
    return [first, ...rest];
  }, [essay?.kind]);
  if (!essay) return <Screen full><FullTop onClose={() => goBack('/practice/writing')} /></Screen>;

  const keys: (keyof EssayScores)[] = ['ta', 'cc', 'lr', 'gra'];
  const vals = keys.map((k) => scores[k]).filter((v): v is number => v !== null);
  const band = vals.length === 4 ? criteriaToBand(vals) : null;
  const items = criteria[0].selfCheck;
  const save = async () => {
    await db.essays.update(essay.id, { scores, checklist: check, band, fixNext, needsFeedback });
    toast('Self-assessment saved.');
    if (next) navigate(`/assess/${next}`, { replace: true });
    else navigate(`/practice/writing/essay/${essay.id}`, { replace: true });
  };

  return (
    <Screen full>
      <FullTop onClose={() => goBack('/practice/writing')} title={`Rate your ${KIND_LABEL[essay.kind]}`} />
      <div className="stack">
        <p className="subhead">Be honest; this is for you. {plural(essay.words, 'word')}.</p>
        {criteria.map((c, i) => (
          <div key={c.id} className="card stack">
            <div className="row">
              <p className="headline" style={{ flex: 1 }}>{c.name}</p>
              <button className="icon-btn" aria-label={`What does ${c.name} mean?`} onClick={() => setHelp(c.id)}><Icon name="info" /></button>
            </div>
            <BandPicker value={scores[keys[i]]} allowNone={false} options={BAND_OPTIONS.filter((b) => b <= 8)} onChange={(v) => setScores({ ...scores, [keys[i]]: v })} />
          </div>
        ))}
        <div className="card stack">
          <p className="headline">Checklist</p>
          {items.map((it) => (
            <CheckRow key={it} checked={!!check[it]} onChange={(v) => setCheck({ ...check, [it]: v })}>{it}</CheckRow>
          ))}
        </div>
        <div className="card stack">
          <p className="headline">Estimated band: {band !== null ? band.toFixed(1) : '–'}</p>
          <p className="footnote">The average of the 4 criteria, rounded down to be safe. A teacher’s score is more reliable.</p>
        </div>
        <Field label="Main thing to fix next time">
          <input className="input" value={fixNext} onChange={(e) => setFixNext(e.target.value)} />
        </Field>
        <div className="row card">
          <span style={{ flex: 1 }}>I’ll ask a teacher to check this</span>
          <Switch checked={needsFeedback} onChange={setNeedsFeedback} label="Needs feedback" />
        </div>
        <button className="btn primary" onClick={() => void save()}>Save</button>
        <button className="btn block" onClick={() => navigate('/mistakes?add=1&skill=writing')}>Add mistakes…</button>
      </div>
      <Sheet open={!!help} onClose={() => setHelp(null)} title={criteria.find((c) => c.id === help)?.name}>
        {help && (() => {
          const c = criteria.find((x) => x.id === help)!;
          return (
            <div className="stack">
              <p className="callout"><i>{c.question}</i></p>
              {c.levels.map((l) => <p key={l.band} className="callout"><b>Band {l.band}:</b> {l.summary}</p>)}
              <p className="footnote">Simplified guide in our own words, not the official descriptors.</p>
            </div>
          );
        })()}
      </Sheet>
    </Screen>
  );
}

export function EssayHistory() {
  const essays = useLiveQuery(() => db.essays.where('status').equals('done').reverse().sortBy('finishedAt'), []);
  return (
    <Screen>
      <InlineHeader title="Essays" backTo="/practice/writing" backLabel="Writing" />
      {essays && essays.length === 0 ? (
        <Empty text="No essays yet. Your first one is a big step." action={<button className="btn" onClick={() => navigate('/write/task1')}>Start Task 1</button>} />
      ) : (
        <div className="list">
          {(essays ?? []).map((e) => (
            <Row
              key={e.id}
              title={`${formatShort(e.date)} · ${KIND_LABEL[e.kind]}${e.chartType ? ` · ${TASK1_CHART_LABEL[e.chartType]}` : ''}`}
              subtitle={`${plural(e.words, 'word')}${typeof e.band === 'number' ? ` · est. ${e.band.toFixed(1)}` : ''}${e.feedbackReceived ? ' · Checked' : e.needsFeedback ? ' · Needs feedback' : ''}`}
              onClick={() => navigate(`/practice/writing/essay/${e.id}`)}
            />
          ))}
        </div>
      )}
    </Screen>
  );
}

export function EssayDetail({ id }: { id: string }) {
  const { state, toast } = useApp();
  const essay = useLiveQuery(() => db.essays.get(id), [id]);
  const [note, setNote] = useState<string | null>(null);
  const [showModel, setShowModel] = useState(false);
  if (essay === undefined) return <Screen><InlineHeader title="Essay" backTo="/practice/writing/history" backLabel="Essays" /></Screen>;
  const prompt = essay.promptId ? WRITING_PROMPTS.find((p) => p.id === essay.promptId) : undefined;
  return (
    <Screen>
      <InlineHeader title={KIND_LABEL[essay.kind]} backTo="/practice/writing/history" backLabel="Essays" />
      <div className="stack">
        <p className="subhead">{formatShort(essay.date)} · {plural(essay.words, 'word')} · {Math.round(essay.durationMs / 60000)} min{typeof essay.band === 'number' ? ` · est. band ${essay.band.toFixed(1)}` : ''}</p>
        <div className="card"><p className="callout selectable">{essay.promptText}</p></div>
        <div className="card"><p className="selectable prewrap">{essay.text}</p></div>
        {essay.fixNext && <div className="card"><p className="subhead">Fix next time</p><p>{essay.fixNext}</p></div>}
        {prompt?.modelAnswer && (
          <div className="card stack">
            <button className="btn" onClick={() => setShowModel(!showModel)}>{showModel ? 'Hide' : 'Compare with'} the model answer</button>
            {showModel && (
              <>
                <p className="selectable prewrap callout">{prompt.modelAnswer}</p>
                {prompt.modelAnswerNotes?.map((n) => <p key={n} className="subhead">• {n}</p>)}
              </>
            )}
          </div>
        )}
        <div className="card stack">
          <div className="row">
            <span style={{ flex: 1 }}>Feedback received</span>
            <Switch
              checked={!!essay.feedbackReceived}
              label="Feedback received"
              onChange={(v) => void db.essays.update(essay.id, { feedbackReceived: v, feedbackAt: v ? state.today : undefined, needsFeedback: v ? false : essay.needsFeedback })}
            />
          </div>
          <Field label="Teacher feedback">
            <textarea className="textarea" value={note ?? essay.teacherNote ?? ''} onChange={(e) => setNote(e.target.value)} onBlur={() => note !== null && void db.essays.update(essay.id, { teacherNote: note })} />
          </Field>
        </div>
        <button className="btn block" onClick={() => navigate(`/assess/${essay.id}`)}>Edit self-assessment</button>
        {essay.kind !== 'paragraph' && <button className="btn block" onClick={() => navigate(`/write/${essay.kind}?rewrite=${essay.id}`)}>Rewrite with corrections</button>}
        <button className="btn block" onClick={() => navigate('/mistakes?add=1&skill=writing')}>Add mistakes…</button>
        <button
          className="btn danger block"
          onClick={async () => {
            if (!window.confirm('Delete this essay?')) return;
            await deleteEssay(essay.id);
            toast('Deleted.');
            goBack('/practice/writing/history');
          }}
        >
          Delete
        </button>
      </div>
    </Screen>
  );
}
