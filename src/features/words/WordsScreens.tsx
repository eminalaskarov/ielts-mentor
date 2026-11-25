import { useEffect, useMemo, useRef, useState } from 'react';
import { plural } from '../../logic/text';
import { useApp } from '../../app/AppContext';
import { goBack, navigate, useRoute } from '../../app/router';
import type { CardRec } from '../../db/db';
import { addUserCard, cardFromContent, deleteCard, rateCard, undoRating, updateCard } from '../../db/actions';
import { clozeOf, deckCounts, dueOnDate } from '../../logic/deck';
import { addDays, formatShort } from '../../logic/dates';
import { bucketOf, previewLabels, schedule, LEARNED_INTERVAL } from '../../logic/srs';
import type { Rating } from '../../logic/srs';
import { hashString } from '../../logic/quiz';
import type { VocabCard } from '../../content/types';
import { VOCAB_CARDS } from '../../content';
import { Chips, Empty, Field, FullTop, InlineHeader, LargeHeader, ProgressBar, Row, Screen, Sheet } from '../../ui/components';
import { Icon } from '../../ui/Icon';

const GOAL = 3000;

export function speak(text: string): void {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    const v = voices.find((x) => x.lang === 'en-GB') ?? voices.find((x) => x.lang.startsWith('en'));
    if (v) u.voice = v;
    u.lang = v?.lang ?? 'en-GB';
    u.rate = 0.9;
    synth.speak(u);
  } catch {
    /* TTS not available */
  }
}

type DeckFilter = 'all' | 'awl' | 'mine' | 'colloc';

export function WordsHome() {
  const { state } = useApp();
  const route = useRoute();
  const [addOpen, setAddOpen] = useState(route.query.get('add') === '1');
  const [filter, setFilter] = useState<DeckFilter>('all');
  useEffect(() => {
    if (route.query.get('add') === '1') setAddOpen(true);
  }, [route.query]);
  const cards = useMemo(() => {
    if (filter === 'awl') return state.cards.filter((c) => c.awl);
    if (filter === 'mine') return state.cards.filter((c) => c.source === 'user');
    if (filter === 'colloc') return state.cards.filter((c) => c.tags.includes('collocation') || c.pos === 'phrase');
    return state.cards;
  }, [state.cards, filter]);
  const counts = deckCounts(cards);
  const { queue } = state;
  const total = queue.due.length + queue.fresh.length;
  const minutes = Math.max(1, Math.round(queue.due.length * 0.25 + queue.fresh.length * 0.5));
  return (
    <Screen>
      <LargeHeader
        title="Words"
        right={
          <button className="icon-btn" aria-label="Add a word" onClick={() => setAddOpen(true)}>
            <Icon name="plus" />
          </button>
        }
      />
      <div className="stack">
        <div className="card stack">
          <div className="row">
            <div style={{ flex: 1 }}>
              <p className="subhead">Due today</p>
              <p className="title1">{plural(queue.due.length, 'card')}</p>
              <p className="subhead">~{minutes} min</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="subhead">New today</p>
              <p className="headline">{queue.fresh.length} / {state.settings.newCardsPerDay}</p>
            </div>
          </div>
          {queue.dueTotal > queue.due.length && <p className="footnote">Today: {plural(queue.due.length, 'card')}. The rest will wait. No stress.</p>}
          {state.pauseNew && <p className="footnote">You have many cards to review. Today: review only, no new words.</p>}
          {total > 0 ? (
            <button className="btn primary" onClick={() => navigate('/review')}>Start review</button>
          ) : (
            <p className="callout">No cards due. Nice. Learn new words or come back tomorrow.</p>
          )}
        </div>

        <div className="card stack">
          <p className="headline">Progress to {GOAL.toLocaleString('en-GB')} words</p>
          <ProgressBar value={deckCounts(state.cards).learned / GOAL} color="var(--skill-vocabulary)" />
          <p className="subhead">
            {deckCounts(state.cards).learned} learned · New {counts.new} · Learning {counts.learning} · Young {counts.young} · Mature {counts.mature}
          </p>
          <p className="footnote">A word counts as learned when you can remember it for 3 weeks ({LEARNED_INTERVAL} days).</p>
          <p className="footnote">Starter deck: {queue.builtinRemaining} more words waiting for your phase.</p>
        </div>

        <Chips<DeckFilter>
          value={filter}
          onChange={setFilter}
          label="Deck filter"
          options={[
            { value: 'all', label: 'All' },
            { value: 'awl', label: 'Academic (AWL)' },
            { value: 'mine', label: 'My words' },
            { value: 'colloc', label: 'Collocations' },
          ]}
        />
        <div className="list">
          <Row title="Word list" value={`${cards.length}`} onClick={() => navigate(`/words/list?f=${filter}`)} left={<Icon name="words" />} />
          <Row title="Add a new word" onClick={() => setAddOpen(true)} left={<Icon name="plus" />} />
        </div>
        <p className="footnote">Golden rule 1: review your word cards every day — even on rest days, for 15 minutes.</p>
      </div>
      <AddWordSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </Screen>
  );
}

const POS = ['noun', 'verb', 'adjective', 'adverb', 'phrase', 'phrasal verb', 'linker'];

export function AddWordSheet({ open, onClose, edit }: { open: boolean; onClose: () => void; edit?: CardRec }) {
  const { state, toast } = useApp();
  const empty = { headword: '', pos: 'noun', definition: '', example: '', translationAz: '', tags: [] as string[], collocation: '' };
  const [f, setF] = useState(empty);
  useEffect(() => {
    if (open && edit)
      setF({ headword: edit.headword, pos: edit.pos, definition: edit.definition, example: edit.example, translationAz: edit.translationAz ?? '', tags: edit.tags, collocation: edit.collocations.join(', ') });
    else if (open) setF(empty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, edit?.id]);
  const dup = !edit && f.headword.trim() ? state.cards.find((c) => c.headword.toLowerCase() === f.headword.trim().toLowerCase()) : undefined;
  const dirty = f.headword.trim() !== '' || f.example.trim() !== '';

  const save = async (again: boolean) => {
    if (!f.headword.trim()) return;
    if (!f.example.trim() && !window.confirm('A sentence helps you remember. Save without one?')) return;
    const data = {
      headword: f.headword.trim(),
      pos: f.pos,
      definition: f.definition.trim(),
      example: f.example.trim(),
      translationAz: f.translationAz.trim() || undefined,
      collocations: f.collocation.split(',').map((s) => s.trim()).filter(Boolean),
      tags: f.tags,
      awl: f.tags.includes('awl'),
    };
    if (edit) {
      await updateCard(edit.id, data);
      toast('Saved.');
      onClose();
      return;
    }
    await addUserCard(data);
    toast(`Added “${data.headword}”.`);
    if (again) setF(empty);
    else onClose();
  };
  const toggleTag = (t: string) => setF((s) => ({ ...s, tags: s.tags.includes(t) ? s.tags.filter((x) => x !== t) : [...s.tags, t] }));

  return (
    <Sheet
      open={open}
      onClose={onClose}
      dirty={dirty}
      title={edit ? 'Edit word' : 'New word'}
      right={<button className="btn plain" disabled={!f.headword.trim()} onClick={() => void save(false)}>Save</button>}
    >
      <div className="stack">
        <Field label="Word or phrase">
          <input className="input" value={f.headword} onChange={(e) => setF({ ...f, headword: e.target.value })} autoCapitalize="off" autoCorrect="off" placeholder="sharp increase" />
        </Field>
        {dup && (
          <div className="card tight tinted-warning row">
            <span style={{ flex: 1 }}>You already have “{dup.headword}”.</span>
          </div>
        )}
        <Field label="Part of speech">
          <select className="select" value={f.pos} onChange={(e) => setF({ ...f, pos: e.target.value })}>
            {POS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Meaning (English)">
          <input className="input" value={f.definition} onChange={(e) => setF({ ...f, definition: e.target.value })} placeholder="a fast rise in number" />
        </Field>
        <Field label="Example sentence" hint="Write a full sentence.">
          <textarea className="textarea" value={f.example} onChange={(e) => setF({ ...f, example: e.target.value })} placeholder="Prices saw a sharp increase last year." />
        </Field>
        <Field label="Collocations (optional, separate with commas)">
          <input className="input" value={f.collocation} onChange={(e) => setF({ ...f, collocation: e.target.value })} placeholder="a sharp increase in, a steady increase" autoCapitalize="off" />
        </Field>
        <Field label="Azerbaijani (optional)">
          <input className="input" value={f.translationAz} onChange={(e) => setF({ ...f, translationAz: e.target.value })} />
        </Field>
        <div className="chips wrap">
          {[
            ['awl', 'Academic'],
            ['collocation', 'Collocation'],
            ['mistake', 'From my mistakes'],
          ].map(([t, l]) => (
            <button key={t} className={`chip${f.tags.includes(t) ? ' on' : ''}`} onClick={() => toggleTag(t)} aria-pressed={f.tags.includes(t)}>{l}</button>
          ))}
        </div>
        {!edit && (
          <button className="btn block" disabled={!f.headword.trim()} onClick={() => void save(true)}>Save and add another</button>
        )}
      </div>
    </Sheet>
  );
}

export function WordList() {
  const { state, toast } = useApp();
  const route = useRoute();
  const f = (route.query.get('f') ?? 'all') as DeckFilter;
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<CardRec | null>(null);
  const [edit, setEdit] = useState<CardRec | undefined>(undefined);
  const list = state.cards
    .filter((c) => (f === 'awl' ? c.awl : f === 'mine' ? c.source === 'user' : f === 'colloc' ? c.tags.includes('collocation') || c.pos === 'phrase' : true))
    .filter((c) => !q || c.headword.toLowerCase().includes(q.toLowerCase()) || c.definition.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.headword.localeCompare(b.headword));
  return (
    <Screen>
      <InlineHeader title="Word list" backTo="/words" backLabel="Words" />
      <div className="stack">
        <input className="input" type="search" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search words" autoCapitalize="off" />
        {list.length === 0 ? (
          <Empty text={state.cards.length === 0 ? 'Add your first word. Tip: write it in a phrase, like “a sharp increase in prices”, not alone.' : 'No words match.'} />
        ) : (
          <div className="list">
            {list.slice(0, 500).map((c) => (
              <Row key={c.id} title={c.headword} subtitle={c.definition} value={bucketOf(c.srs)} onClick={() => setOpen(c)} />
            ))}
          </div>
        )}
        {list.length > 500 && <p className="footnote">Showing 500 of {list.length}. Use search.</p>}
      </div>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.headword}>
        {open && (
          <div className="stack">
            <p className="title2">{open.headword} <span className="subhead">({open.pos})</span></p>
            <p>{open.definition}</p>
            <p className="callout selectable"><i>{open.example}</i></p>
            {open.collocations.length > 0 && <p className="subhead">{open.collocations.join(' · ')}</p>}
            {open.translationAz && <p className="subhead">Azerbaijani: {open.translationAz}</p>}
            <div className="kv">
              <span className="muted">Status</span><span>{bucketOf(open.srs)}</span>
              <span className="muted">Next review</span><span>{open.srs.state === 'new' ? 'not started' : formatShort(open.srs.due)}</span>
              <span className="muted">Interval</span><span>{plural(open.srs.interval, 'day')}</span>
              <span className="muted">Lapses</span><span>{open.srs.lapses}</span>
            </div>
            <button className="btn block" onClick={() => speak(open.headword)}><Icon name="speaker" size={18} /> Listen</button>
            <button className="btn block" onClick={() => { setEdit(open); setOpen(null); }}>Edit</button>
            <button
              className="btn danger block"
              onClick={async () => {
                if (!window.confirm(`Delete “${open.headword}”? Its review history is deleted too.`)) return;
                await deleteCard(open.id);
                setOpen(null);
                toast('Deleted.');
              }}
            >
              Delete
            </button>
          </div>
        )}
      </Sheet>
      <AddWordSheet open={!!edit} edit={edit} onClose={() => setEdit(undefined)} />
    </Screen>
  );
}

interface SessionCard {
  card: CardRec;
}

export function ReviewSession() {
  const { state, toast } = useApp();
  const [queue, setQueue] = useState<SessionCard[] | null>(null);
  const [pos, setPos] = useState(0);
  const [shown, setShown] = useState(false);
  const [stats, setStats] = useState<Record<Rating, number>>({ 1: 0, 2: 0, 3: 0, 4: 0 });
  const [undo, setUndo] = useState<{ cardId: string; prev: CardRec | null; reviewId: number; pos: number; queue: SessionCard[]; rating: Rating } | null>(null);
  const startedAt = useRef(Date.now());
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (queue) return;
    const now = Date.now();
    const fresh = state.queue.fresh.map((c) => ('srs' in c ? (c as CardRec) : cardFromContent(c as VocabCard, now)));
    setQueue([...state.queue.due, ...fresh].map((card) => ({ card })));
  }, [queue, state.queue]);

  if (!queue) return <Screen full><FullTop onClose={() => goBack('/words')} /></Screen>;

  const total = queue.length;
  if (pos >= total) {
    const n = stats[1] + stats[2] + stats[3] + stats[4];
    const mins = Math.max(1, Math.round((Date.now() - startedAt.current) / 60000));
    const tomorrow = dueOnDate(state.cards, addDays(state.today, 1));
    return (
      <Screen full>
        <FullTop onClose={() => goBack('/words')} title="Review done" />
        <div className="stack" style={{ textAlign: 'center' }}>
          {n === 0 ? (
            <p className="callout">No cards due. Nice. Learn new words or come back tomorrow.</p>
          ) : (
            <>
              <p className="title1">Review done.</p>
              <p>{plural(n, 'card')} in {mins} min.</p>
              <p className="subhead">Again {stats[1]} · Hard {stats[2]} · Good {stats[3]} · Easy {stats[4]}</p>
            </>
          )}
          <p className="subhead">Tomorrow: {plural(tomorrow, 'card')} due.</p>
          <button className="btn primary" onClick={() => goBack('/words')}>Done</button>
          {state.queue.builtinRemaining > 0 && (
            <button
              className="btn block"
              onClick={() => {
                // "Learn 5 more new words" beyond today's limit.
                const now = Date.now();
                const inDb = new Set(state.cards.map((c) => c.id));
                const seen = new Set(queue.map((q) => q.card.id));
                const phase = state.day.phase ?? 1;
                const next = VOCAB_CARDS.filter((v) => v.phase <= phase && !inDb.has(v.id) && !seen.has(v.id)).slice(0, 5);
                if (next.length > 0) setQueue([...queue, ...next.map((v) => ({ card: cardFromContent(v, now) }))]);
              }}
            >
              Learn 5 more new words
            </button>
          )}
        </div>
      </Screen>
    );
  }

  const { card } = queue[pos];
  const now = Date.now();
  const labels = previewLabels(card.srs, now);
  const cloze = hashString(`${card.id}|${card.srs.reps}`) % 2 === 0 ? clozeOf(card.example, card.headword) : null;

  const rate = async (r: Rating) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await doRate(r);
    } catch {
      toast('Could not save this rating. Try again.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const doRate = async (r: Rating) => {
    // The session's date (state.today) is used for the review row, so new-card limits and
    // the review streak always agree with what the screen shows, even after midnight.
    const res = await rateCard(card, r, Date.now(), state.today);
    setStats((s) => ({ ...s, [r]: s[r] + 1 }));
    const prevQueue = queue;
    // Learning steps due within 20 minutes come back in this session.
    const next = schedule(card.srs, r, Date.now());
    let nq = queue;
    if ((next.state === 'learning' || next.state === 'relearning') && next.dueAt - Date.now() < 20 * 60_000) {
      nq = [...queue, { card: { ...(res.prev ?? card), srs: next } }];
      setQueue(nq);
    }
    setUndo({ cardId: card.id, prev: res.prev, reviewId: res.reviewId, pos, queue: prevQueue, rating: r });
    setShown(false);
    setPos(pos + 1);
  };

  return (
    <Screen full>
      <FullTop
        onClose={() => goBack('/words')}
        title={`${Math.min(pos + 1, total)} / ${total}`}
        right={
          undo ? (
            <button
              className="btn plain small"
              disabled={busy}
              onClick={async () => {
                if (busyRef.current) return;
                busyRef.current = true;
                setBusy(true);
                try {
                  await undoRating(undo.cardId, undo.prev, undo.reviewId);
                } catch {
                  toast('Could not undo. Try again.');
                  return;
                } finally {
                  busyRef.current = false;
                  setBusy(false);
                }
                setStats((s) => ({ ...s, [undo.rating]: s[undo.rating] - 1 }));
                setQueue(undo.queue);
                setPos(undo.pos);
                setShown(false);
                setUndo(null);
              }}
            >
              Undo
            </button>
          ) : undefined
        }
      />
      <div className="stack">
        <ProgressBar value={pos / Math.max(1, total)} color="var(--skill-vocabulary)" />
        <div className="flashcard selectable">
          {card.srs.state === 'new' && <p className="footnote">New word</p>}
          {cloze && !shown ? (
            <>
              <p className="title2">{cloze}</p>
              <p className="subhead">Missing word: {card.definition || card.pos}</p>
            </>
          ) : (
            <>
              <p className="title1">{card.headword}</p>
              {!shown && card.collocations[0] && card.collocations[0].toLowerCase() !== card.headword.toLowerCase() && <p className="subhead">{card.collocations[0]}</p>}
            </>
          )}
          {shown && (
            <>
              {cloze && <p className="title1">{card.headword}</p>}
              <p className="subhead">({card.pos})</p>
              <p>{card.definition}</p>
              <p className="callout"><i>{card.example}</i></p>
              {card.collocations.length > 0 && <p className="subhead">{card.collocations.join(' · ')}</p>}
              {state.settings.showTranslation && card.translationAz && <p className="subhead">Azerbaijani: {card.translationAz}</p>}
              <button className="btn plain" onClick={() => speak(card.headword)} aria-label={`Listen to ${card.headword}`} style={{ alignSelf: 'center' }}>
                <Icon name="speaker" /> Listen
              </button>
            </>
          )}
        </div>
        <div className="footer-bar">
          {!shown ? (
            <button className="btn primary" onClick={() => setShown(true)}>Show answer</button>
          ) : (
            <div className="rating-row">
              {([1, 2, 3, 4] as Rating[]).map((r) => (
                <button key={r} className={r === 1 ? 'again' : ''} disabled={busy} aria-busy={busy} onClick={() => void rate(r)}>
                  {['Again', 'Hard', 'Good', 'Easy'][r - 1]}
                  <small>{labels[r]}</small>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Screen>
  );
}
