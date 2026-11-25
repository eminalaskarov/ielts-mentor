/**
 * Tiny hash router. Hash routes keep the iOS edge-swipe back gesture working in standalone mode.
 * Each tab remembers its own last path; tapping the active tab pops to its root.
 */
import { useEffect, useState } from 'react';

export type Tab = 'today' | 'words' | 'practice' | 'mistakes' | 'progress';
export const TABS: Tab[] = ['today', 'words', 'practice', 'mistakes', 'progress'];

/** Routes that hide the tab bar (full-screen flows). */
const FULL_SCREEN = ['/quiz', '/review', '/write', '/speak', '/mistakes-review', '/onboarding', '/assess', '/timer'];

export interface Route {
  path: string;
  segments: string[];
  query: URLSearchParams;
  tab: Tab;
  fullScreen: boolean;
}

const lastPathByTab: Record<Tab, string> = {
  today: '/today',
  words: '/words',
  practice: '/practice',
  mistakes: '/mistakes',
  progress: '/progress',
};
let lastTab: Tab = 'today';

function parse(hash: string): Route {
  const raw = hash.replace(/^#/, '') || '/today';
  const [path, qs = ''] = raw.split('?');
  const segments = path.split('/').filter(Boolean);
  const first = segments[0] as Tab;
  const fullScreen = FULL_SCREEN.some((p) => path === p || path.startsWith(`${p}/`));
  const tab: Tab = TABS.includes(first) ? first : lastTab;
  return { path, segments, query: new URLSearchParams(qs), tab, fullScreen };
}

export function currentRoute(): Route {
  return parse(window.location.hash);
}

const listeners = new Set<() => void>();
function emit(): void {
  listeners.forEach((l) => l());
}

function stateIdx(): number {
  const st = window.history.state as { idx?: number } | null;
  return st && typeof st.idx === 'number' ? st.idx : 0;
}

export function navigate(to: string, opts: { replace?: boolean } = {}): void {
  const url = `#${to}`;
  if (opts.replace) window.history.replaceState({ idx: stateIdx() }, '', url);
  else window.history.pushState({ idx: stateIdx() + 1 }, '', url);
  emit();
}

/** Go back in history if we navigated inside the app, otherwise replace with the fallback. */
export function goBack(fallback: string): void {
  if (stateIdx() > 0) window.history.back();
  else navigate(fallback, { replace: true });
}

export function tabRoot(tab: Tab): string {
  return `/${tab}`;
}

export function switchTab(tab: Tab, active: Tab): void {
  if (tab === active) {
    if (currentRoute().path !== tabRoot(tab)) navigate(tabRoot(tab));
    document.querySelector('.screen')?.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  navigate(lastPathByTab[tab]);
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => currentRoute());
  useEffect(() => {
    if (window.history.state === null) window.history.replaceState({ idx: 0 }, '', window.location.href);
    const on = () => {
      const r = currentRoute();
      if (!r.fullScreen && TABS.includes(r.segments[0] as Tab)) {
        lastPathByTab[r.tab] = r.path; // query (e.g. ?add=1) is transient — don't reopen sheets on tab tap
        lastTab = r.tab;
      }
      setRoute(r);
    };
    on();
    listeners.add(on);
    window.addEventListener('popstate', on);
    window.addEventListener('hashchange', on);
    return () => {
      listeners.delete(on);
      window.removeEventListener('popstate', on);
      window.removeEventListener('hashchange', on);
    };
  }, []);
  return route;
}
