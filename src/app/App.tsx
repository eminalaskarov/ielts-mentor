import { useEffect, useState } from 'react';
import { plural } from '../logic/text';
import { useLiveQuery } from 'dexie-react-hooks';
import { registerSW } from 'virtual:pwa-register';
import { db } from '../db/db';
import { purgeExpiredRecordings } from '../db/actions';
import { pruneSnapshots, requestPersistence } from '../db/backupIo';
import { clearCrash } from '../db/recoveryMarkers';
import { useAppState, useSettings, useToday } from '../state/hooks';
import { AppProvider, useToastHost } from './AppContext';
import { switchTab, TABS, useRoute } from './router';
import type { Route, Tab } from './router';
import { Icon } from '../ui/Icon';
import { TodayScreen } from '../features/today/TodayScreen';
import { QuizScreen } from '../features/quiz/QuizScreen';
import { ReviewSession, WordList, WordsHome } from '../features/words/WordsScreens';
import { AssessScreen, EssayDetail, EssayHistory, PracticeHub, WritingHub, WritingSession } from '../features/writing/WritingScreens';
import { RecordingsScreen, SpeakingHub, SpeakingSession } from '../features/speaking/SpeakingScreens';
import { TestLogScreen } from '../features/tests/TestLogScreens';
import { MistakesReview, MistakesScreen } from '../features/mistakes/MistakesScreens';
import { CheckpointsScreen, ProgressScreen, RoadmapScreen } from '../features/progress/ProgressScreens';
import { BackupScreen, DatesScreen, PracticeTimerScreen, RulesScreen, SettingsScreen } from '../features/settings/SettingsScreens';
import { Onboarding } from '../features/onboarding/Onboarding';
import { ErrorBoundary } from './ErrorBoundary';
import { pruneTimers } from '../ui/TimerView';

const TAB_LABEL: Record<Tab, string> = { today: 'Today', words: 'Words', practice: 'Practice', mistakes: 'Mistakes', progress: 'Progress' };

function useTheme(theme: 'system' | 'light' | 'dark' | undefined) {
  useEffect(() => {
    const root = document.documentElement;
    if (!theme || theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
  }, [theme]);
}

let updateSW: ((reload?: boolean) => Promise<void>) | null = null;

export function App() {
  const settings = useSettings();
  const route = useRoute();
  // One date source: a running full-screen flow keeps its date; otherwise "today" follows midnight.
  const { today, stale, refresh } = useToday(route.fullScreen);
  const state = useAppState(today);
  const toastHost = useToastHost();
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineShown, setOfflineShown] = useState(false);
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine);
  const dueBadge = state ? state.queue.due.length : 0;
  useTheme(settings?.theme);

  useEffect(() => {
    if (import.meta.env.DEV) return;
    updateSW = registerSW({
      onNeedRefresh: () => setNeedRefresh(true),
    });
  }, []);

  useEffect(() => {
    void purgeExpiredRecordings();
    void pruneTimers().catch(() => {});
    void pruneSnapshots().catch(() => {});
    const id = window.setInterval(() => void purgeExpiredRecordings(), 5 * 60_000);
    const vis = () => document.visibilityState === 'visible' && void purgeExpiredRecordings();
    document.addEventListener('visibilitychange', vis);
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', vis);
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  // The app computed its state and rendered: any earlier crash is over.
  const started = !!state;
  useEffect(() => {
    if (started) clearCrash();
  }, [started]);

  useEffect(() => {
    if (settings?.onboarded) void requestPersistence();
  }, [settings?.onboarded]);

  // App badge (where supported) = due word cards. Not available on all iOS versions; ignored if missing.
  useEffect(() => {
    const nav = navigator as Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
    if (!nav.setAppBadge) return;
    if (dueBadge > 0) void nav.setAppBadge(dueBadge).catch(() => {});
    else void nav.clearAppBadge?.().catch(() => {});
  }, [dueBadge]);

  const ready = useLiveQuery(() => db.kv.count(), []);
  if (!settings || ready === undefined) return null;
  if (!settings.onboarded) return <Onboarding settings={settings} onDone={() => {}} />;
  if (!state) return null;

  return (
    <AppProvider value={{ state, stale, refreshDay: refresh, toast: toastHost.show }}>
      <div className={`app${route.fullScreen ? ' full' : ''}`}>
        {needRefresh && !route.fullScreen && (
          <div className="banner" role="status">
            <span style={{ flex: 1 }}>A new version is ready.</span>
            <button className="btn small" onClick={() => void updateSW?.(true)}>Update</button>
            <button className="icon-btn" aria-label="Later" onClick={() => setNeedRefresh(false)}><Icon name="close" size={18} /></button>
          </div>
        )}
        {offline && !offlineShown && (
          <button className="pill" style={{ position: 'fixed', top: 'calc(var(--safe-t) + 8px)', left: '50%', transform: 'translateX(-50%)', zIndex: 45 }} onClick={() => setOfflineShown(true)}>
            You’re offline. Everything still works.
          </button>
        )}
        <ErrorBoundary key={route.path}>
          <Routes route={route} />
        </ErrorBoundary>
        {!route.fullScreen && (
          <nav className="tabbar" aria-label="Tabs">
            {TABS.map((t) => (
              <button key={t} className={route.tab === t ? 'on' : ''} onClick={() => switchTab(t, route.tab)} aria-current={route.tab === t ? 'page' : undefined}>
                <Icon name={t} size={26} />
                {TAB_LABEL[t]}
                {t === 'words' && dueBadge > 0 && <span className="badge" aria-label={`${plural(dueBadge, 'card')} due`}>{dueBadge > 99 ? '99+' : dueBadge}</span>}
              </button>
            ))}
          </nav>
        )}
        {toastHost.view}
      </div>
    </AppProvider>
  );
}

function Routes({ route }: { route: Route }) {
  const s = route.segments;
  const p = route.path;
  // Full-screen flows
  if (s[0] === 'quiz') return <QuizScreen key={p} kind={(s[1] as 'daily' | 'extra' | 'mini') ?? 'daily'} />;
  if (s[0] === 'review') return <ReviewSession key={p} />;
  if (s[0] === 'write') return <WritingSession key={p + route.query.toString()} mode={(s[1] as 'task1') ?? 'task2'} />;
  if (s[0] === 'assess' && s[1]) return <AssessScreen key={s[1]} id={s[1]} />;
  if (s[0] === 'speak') return <SpeakingSession key={p + route.query.toString()} part={s[1] ?? '2'} />;
  if (s[0] === 'mistakes-review') return <MistakesReview />;

  switch (p) {
    case '/today/settings':
      return <SettingsScreen />;
    case '/today/settings/dates':
      return <DatesScreen />;
    case '/today/settings/backup':
      return <BackupScreen backTo="/today/settings" />;
    case '/today/rules':
      return <RulesScreen backTo="/today" />;
    case '/words':
      return <WordsHome />;
    case '/words/list':
      return <WordList />;
    case '/practice':
      return <PracticeHub />;
    case '/practice/writing':
      return <WritingHub />;
    case '/practice/writing/history':
      return <EssayHistory />;
    case '/practice/speaking':
      return <SpeakingHub />;
    case '/practice/speaking/recordings':
      return <RecordingsScreen />;
    case '/practice/tests':
      return <TestLogScreen />;
    case '/practice/timer':
      return <PracticeTimerScreen />;
    case '/practice/rules':
      return <RulesScreen backTo="/practice" />;
    case '/mistakes':
      return <MistakesScreen />;
    case '/progress':
      return <ProgressScreen />;
    case '/progress/roadmap':
      return <RoadmapScreen />;
    case '/progress/checkpoints':
      return <CheckpointsScreen />;
    case '/progress/backup':
      return <BackupScreen backTo="/progress" />;
    case '/progress/rules':
      return <RulesScreen backTo="/progress" />;
  }
  if (p.startsWith('/practice/writing/essay/') && s[3]) return <EssayDetail id={s[3]} />;
  return <TodayScreen />;
}
