import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { AppState } from '../state/hooks';

export interface ToastAction {
  label: string;
  run: () => void;
}

export interface AppCtx {
  state: AppState;
  stale: boolean;
  refreshDay: () => void;
  toast: (msg: string, action?: ToastAction, ms?: number) => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ value, children }: { value: AppCtx; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside provider');
  return v;
}

export function useToastHost() {
  const [toast, setToast] = useState<{ msg: string; action?: ToastAction } | null>(null);
  const timer = useRef<number | null>(null);
  const show = useCallback((msg: string, action?: ToastAction, ms = 4000) => {
    if (timer.current) window.clearTimeout(timer.current);
    setToast({ msg, action });
    timer.current = window.setTimeout(() => setToast(null), action ? Math.max(ms, 5000) : ms);
  }, []);
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);
  const view = toast ? (
    <div className="toast" role="status" aria-live="polite">
      <span>{toast.msg}</span>
      {toast.action && (
        <button
          onClick={() => {
            toast.action?.run();
            setToast(null);
          }}
        >
          {toast.action.label}
        </button>
      )}
    </div>
  ) : null;
  return { show, view };
}
