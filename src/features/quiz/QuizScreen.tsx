import { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { QUIZ_ITEMS } from '../../content';
import type { QuizItem } from '../../content/types';
import type { QuizTopic, Skill } from '../../data';
import { db } from '../../db/db';
import { addDays } from '../../logic/dates';
import type { MistakeCause, QuizAttempt } from '../../db/db';
import { saveMistake } from '../../db/actions';
import { useApp } from '../../app/AppContext';
import { goBack, navigate } from '../../app/router';
import { answerText, checkAnswer, correctAnswerText, expandTopics, optionOrder, QUIZ_TOPIC_LABEL, resultTier, selectQuiz, tfngOptions } from '../../logic/quiz';
import type { QuizAnswer } from '../../logic/quiz';
import { Empty, FullTop, ProgressBar, Screen } from '../../ui/components';
import { Icon } from '../../ui/Icon';

type Kind = QuizAttempt['kind'];

export function topicSkill(t: QuizTopic): Skill {
  if (t.startsWith('reading')) return 'reading';
  if (t.startsWith('vocab') || t === 'awl' || t === 'topic-vocab') return 'vocabulary';
  if (t.startsWith('listening')) return 'listening';
  if (t.startsWith('task')) return 'writing';
  if (t === 'speaking-language') return 'speaking';
  if (t === 'exam-strategy' || t === 'mixed-review') return 'test';
  return 'grammar';
}

function defaultCause(skill: Skill): MistakeCause {
  if (skill === 'vocabulary') return 'word';
  if (skill === 'reading') return 'misread';
  return 'grammar';
}

export function QuizScreen({ kind }: { kind: Kind }) {
  const { state, toast } = useApp();
  const { today, day, ctx } = state;
  const attempts = useLiveQuery(() => db.quizAttempts.toArray(), []);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const creating = useRef(false);

  // Create or resume the attempt.
  useEffect(() => {
    if (!attempts || attemptId || creating.current) return;
    const todays = attempts.filter((a) => a.date === today && a.kind === kind).sort((a, b) => a.startedAt - b.startedAt);
    const open = todays.find((a) => !a.finishedAt);
    if (open) return setAttemptId(open.id);
    if (kind !== 'extra' && todays.length > 0) return setAttemptId(todays[0].id);
    const seen = new Set(attempts.flatMap((a) => Object.keys(a.answers)));
    const excluded = new Set(attempts.filter((a) => a.date === today).flatMap((a) => a.itemIds));
    const size = kind === 'mini' ? 10 : 5;
    const baseTopics: QuizTopic[] = kind === 'mini' ? ['grammar-week-review', 'mixed-review', 'vocab-collocations'] : day.quizTopics;
    const topics = expandTopics(baseTopics, { phase: day.phase, weekday: day.weekday, weekOfPhase: day.weekOfPhase, murphyUnitsDone: ctx.murphyUnitsDone, ...state.quizSignals });
    const recentFrom = addDays(today, -14);
    const recentIds = new Set(attempts.filter((a) => a.date >= recentFrom && a.date < today).flatMap((a) => a.itemIds));
    const items = selectQuiz({ items: QUIZ_ITEMS, topics, phase: day.phase ?? 1, seed: `${today}|${kind}|${todays.length}`, size, seenIds: seen, excludeIds: excluded, recentIds });
    const id = `${today}|${kind}|${todays.length + 1}`;
    const a: QuizAttempt = { id, date: today, kind, itemIds: items.map((q) => q.id), answers: {}, startedAt: Date.now() };
    creating.current = true;
    void db.quizAttempts.put(a).then(
      () => setAttemptId(id),
      () => {
        creating.current = false;
        toast('Could not start the quiz. Try again.');
      },
    );
  }, [attempts, attemptId, today, kind, day, ctx.murphyUnitsDone, state.quizSignals]);

  const attempt = attempts?.find((a) => a.id === attemptId);
  const items = useMemo(() => {
    if (!attempt) return [];
    const byId = new Map(QUIZ_ITEMS.map((q) => [q.id, q]));
    return attempt.itemIds.map((id) => byId.get(id)).filter((q): q is QuizItem => !!q);
  }, [attempt]);

  const firstOpen = items.findIndex((q) => !attempt?.answers[q.id]);
  const [index, setIndex] = useState<number | null>(null);
  // Pin the position once when the attempt loads; afterwards only "Next" moves it.
  useEffect(() => {
    if (attempt && items.length > 0 && index === null) setIndex(firstOpen === -1 ? items.length : firstOpen);
  }, [attempt, items.length, index, firstOpen]);
  const cur = index ?? (firstOpen === -1 ? items.length : firstOpen);
  const [answer, setAnswer] = useState<QuizAnswer | null>(null);
  const [checked, setChecked] = useState(false);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const close = () => {
    const answered = Object.keys(attempt?.answers ?? {}).length;
    if (attempt && !attempt.finishedAt && answered > 0 && answered < items.length) {
      if (!window.confirm('Leave quiz? Your answers so far are saved.')) return;
    }
    goBack('/today');
  };

  if (!attempt) return <Screen full><FullTop onClose={close} /></Screen>;
  if (items.length === 0)
    return (
      <Screen full>
        <FullTop onClose={close} title="Quiz" />
        <Empty text="No quiz for today yet. Try a practice set instead." action={<button className="btn" onClick={() => navigate('/quiz/extra', { replace: true })}>Practice set</button>} />
      </Screen>
    );

  const addMistake = async (q: QuizItem, given: QuizAnswer) => {
    const skill = topicSkill(q.topic);
    await saveMistake({
      date: today,
      skill,
      what: `${'prompt' in q ? q.prompt : 'statement' in q ? q.statement : q.paragraph.slice(0, 80)} — I chose: ${answerText(q, given)}`,
      correction: `${correctAnswerText(q)}. ${q.explanation}`,
      cause: defaultCause(skill),
      source: `Quiz · ${QUIZ_TOPIC_LABEL[q.topic]}`,
      tag: QUIZ_TOPIC_LABEL[q.topic],
      quizItemId: q.id,
    });
    setAdded((s) => new Set(s).add(q.id));
    toast('Added to Mistakes.');
  };

  // Result
  if (cur >= items.length) {
    const results = items.map((q) => ({ q, a: attempt.answers[q.id] }));
    const correct = results.filter((r) => r.a?.correct).length;
    const wrong = results.filter((r) => r.a && !r.a.correct);
    if (!attempt.finishedAt) void db.quizAttempts.update(attempt.id, { finishedAt: Date.now() });
    const weakTopics = [...new Set(wrong.map((r) => QUIZ_TOPIC_LABEL[r.q.topic]))];
    return (
      <Screen full>
        <FullTop onClose={() => goBack('/today')} title="Result" />
        <div className="stack" style={{ alignItems: 'stretch' }}>
          <p className="title1" style={{ textAlign: 'center', fontSize: '2.6rem' }}>{correct} / {items.length}</p>
          <p style={{ textAlign: 'center' }}>{resultTier(correct, items.length)} {Math.round((100 * correct) / items.length)}% correct.</p>
          {weakTopics.length > 0 && <p className="subhead" style={{ textAlign: 'center' }}>Weak spot: {weakTopics.join(', ')} ({wrong.length} miss{wrong.length === 1 ? '' : 'es'})</p>}
          {wrong.map(({ q, a }) => (
            <div key={q.id} className="card stack">
              <p className="footnote">{QUIZ_TOPIC_LABEL[q.topic]}</p>
              <QuestionText q={q} compact />
              <p className="callout"><b>Your answer:</b> {answerText(q, a!.given)}</p>
              <p className="callout"><b>Correct:</b> {correctAnswerText(q)}</p>
              <p className="subhead">{q.explanation}</p>
              {added.has(q.id) ? (
                <p className="footnote"><Icon name="check" size={14} /> In your Mistakes</p>
              ) : (
                <button className="btn small" onClick={() => void addMistake(q, a!.given)}>Add to Mistakes</button>
              )}
            </div>
          ))}
          {wrong.length > 0 && <p className="footnote">Golden rule 3: write down your mistakes and their causes. Review them once a month.</p>}
          <button className="btn primary" onClick={() => goBack('/today')}>Done</button>
          <button
            className="btn block"
            onClick={() => {
              if (kind === 'extra') {
                setAttemptId(null);
                setIndex(null);
              } else navigate('/quiz/extra', { replace: true });
            }}
          >
            Try 5 more
          </button>
        </div>
      </Screen>
    );
  }

  const q = items[cur];
  const isCorrect = checked && answer !== null && checkAnswer(q, answer);
  const submit = async () => {
    if (answer === null) return;
    const ok = checkAnswer(q, answer);
    setChecked(true);
    await db.quizAttempts.update(attempt.id, { answers: { ...attempt.answers, [q.id]: { given: answer, correct: ok } } });
  };
  const next = () => {
    setChecked(false);
    setAnswer(null);
    setIndex(cur + 1);
  };

  return (
    <Screen full>
      <FullTop onClose={close} title={`Question ${cur + 1} of ${items.length}`} />
      <div className="stack">
        <ProgressBar value={cur / items.length} />
        <p className="subhead">{QUIZ_TOPIC_LABEL[q.topic]}</p>
        <QuestionText q={q} />
        <Options q={q} attemptId={attempt.id} answer={answer} checked={checked} onAnswer={(a) => !checked && setAnswer(a)} />
        {checked && (
          <div className={`card stack ${isCorrect ? 'tinted-success' : ''}`} role="status">
            <p className="headline" style={{ color: isCorrect ? 'var(--success)' : 'var(--danger)' }}>
              <Icon name={isCorrect ? 'check' : 'close'} size={18} /> {isCorrect ? 'Correct' : 'Not quite'}
            </p>
            {!isCorrect && <p className="callout"><b>Answer:</b> {correctAnswerText(q)}</p>}
            <p className="callout">{q.explanation}</p>
          </div>
        )}
        <div className="footer-bar stack" style={{ gap: 8 }}>
          {!checked ? (
            <button className="btn primary" disabled={answer === null || answer === ''} onClick={() => void submit()}>Check</button>
          ) : (
            <>
              <button className="btn primary" onClick={next}>{cur + 1 === items.length ? 'See result' : 'Next'}</button>
              {!isCorrect && !added.has(q.id) && <button className="btn block" onClick={() => void addMistake(q, answer!)}>Add to Mistakes</button>}
            </>
          )}
        </div>
      </div>
    </Screen>
  );
}

function QuestionText({ q, compact }: { q: QuizItem; compact?: boolean }) {
  switch (q.kind) {
    case 'mcq':
      return <p className={compact ? 'callout selectable' : 'title2 selectable'}>{compact ? q.prompt : <>{q.prompt}</>}</p>;
    case 'gap':
      return (
        <>
          {!compact && <p className="subhead">Type the missing word or phrase.</p>}
          <p className={compact ? 'callout selectable' : 'title2 selectable'}>{q.prompt}</p>
        </>
      );
    case 'tfng':
      return (
        <>
          {!compact && <div className="passage selectable">{q.passage}</div>}
          {!compact && <p className="subhead">Does the statement agree with the text?</p>}
          <p className={compact ? 'callout selectable' : 'headline selectable'}>{q.statement}</p>
        </>
      );
    case 'headings':
      return (
        <>
          {!compact && <p className="subhead">Choose the best heading for this paragraph.</p>}
          <div className={compact ? 'callout selectable' : 'passage selectable'}>{compact ? `${q.paragraph.slice(0, 120)}…` : q.paragraph}</div>
        </>
      );
  }
}

function Options({ q, attemptId, answer, checked, onAnswer }: { q: QuizItem; attemptId: string; answer: QuizAnswer | null; checked: boolean; onAnswer: (a: QuizAnswer) => void }) {
  if (q.kind === 'gap') {
    return (
      <input
        className="input"
        value={typeof answer === 'string' ? answer : ''}
        onChange={(e) => onAnswer(e.target.value)}
        placeholder="Your answer"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="done"
        readOnly={checked}
        aria-label="Your answer"
        style={checked ? { borderColor: checkAnswer(q, answer ?? '') ? 'var(--success)' : 'var(--danger)' } : undefined}
      />
    );
  }
  const opts: { value: QuizAnswer; label: string }[] =
    // Shuffled display order; each value is the ORIGINAL option index (stored and checked as such).
    q.kind === 'tfng' ? tfngOptions(q) : optionOrder(q, attemptId).map((i) => ({ value: i, label: q.options[i] }));
  const correctValue: QuizAnswer = q.kind === 'tfng' ? q.answer : q.answerIndex;
  return (
    <div className="stack" style={{ gap: 8 }} role="radiogroup">
      {opts.map((o) => {
        const chosen = answer === o.value;
        let cls = chosen ? ' on' : '';
        if (checked && o.value === correctValue) cls = ' correct';
        else if (checked && chosen) cls = ' wrong';
        return (
          <button key={String(o.value)} className={`radio-row${cls}`} role="radio" aria-checked={chosen} onClick={() => onAnswer(o.value)} disabled={checked && !chosen && o.value !== correctValue}>
            <span className="dot" />
            <span style={{ flex: 1 }}>{o.label}</span>
            {checked && o.value === correctValue && <Icon name="check" size={18} />}
            {checked && chosen && o.value !== correctValue && <Icon name="close" size={18} />}
          </button>
        );
      })}
    </div>
  );
}
