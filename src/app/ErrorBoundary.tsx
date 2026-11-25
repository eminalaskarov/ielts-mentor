import { Component, useEffect, useState } from 'react';
import { latestSnapshot, restoreSnapshot } from '../db/backupIo';
import { getFirstCrashAt, getReplacedAt, noteCrash } from '../db/recoveryMarkers';
import { changesLostText, formatDateTime, shouldOfferSafetyCopy } from '../logic/recovery';
import { BackupFlow } from '../features/settings/BackupFlow';
import type { ErrorInfo, ReactNode } from 'react';

/** Never show a blank screen: keep the user's data and offer a way out. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI error', error, info.componentStack);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="screen full">
        <div className="card stack" style={{ marginTop: 40 }}>
          <p className="title2">Something went wrong on this screen.</p>
          <p className="callout">Your data is safe on this phone. Go back to Today and try again.</p>
          <p className="footnote">{this.state.error.message}</p>
          <button
            className="btn primary"
            onClick={() => {
              this.setState({ error: null });
              window.location.hash = '#/today';
            }}
          >
            Go to Today
          </button>
          <button className="btn block" onClick={() => window.location.reload()}>Reload the app</button>
        </div>
      </main>
    );
  }
}

/**
 * Root boundary around the whole App (outside useAppState). If the app cannot even compute today's
 * state (e.g. damaged data), offer the safety copy and a raw-data export instead of a blank screen.
 */
export class RootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    noteCrash();
    console.error('App error', error, info.componentStack);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return <RootRecovery message={this.state.error.message} />;
  }
}

function RootRecovery({ message }: { message: string }) {
  const [snap, setSnap] = useState<{ id: string; createdAt: number; reason: string } | null | undefined>(undefined);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    // componentDidCatch runs after this first render; make sure the crash time is recorded first.
    noteCrash();
    latestSnapshot()
      .then((s) => setSnap(s ?? null))
      .catch(() => setSnap(null));
  }, []);
  const offer = shouldOfferSafetyCopy({ snapshot: snap, replacedAt: getReplacedAt(), firstCrashAt: getFirstCrashAt(), now: Date.now() });
  const restore = async () => {
    if (!snap || busy) return;
    if (!window.confirm(`Restore the safety copy from ${formatDateTime(snap.createdAt)}?\n\n${changesLostText(snap.createdAt)}`)) return;
    setBusy(true);
    try {
      await restoreSnapshot(snap.id);
      window.location.reload();
    } catch {
      setStatus('The safety copy could not be restored. Nothing was changed. Export your raw data first.');
      setBusy(false);
    }
  };
  return (
    <main className="screen full">
      <div className="card stack" style={{ marginTop: 40 }}>
        <p className="title2">The app could not start.</p>
        <p className="callout">Your data is still on this phone. Save a copy of it first.</p>
        <p className="footnote">{message}</p>
        <BackupFlow label="Export raw data" markDone={false} />
        <p className="footnote">Save the file to Files or iCloud Drive. It contains everything, even if the app cannot open it now.</p>
        <button className="btn block" onClick={() => window.location.reload()}>Reload the app</button>
        {snap && offer && (
          <div className="card stack tinted-warning">
            <p className="headline">Last resort: restore safety copy</p>
            <p className="subhead">
              The problem started after your last import. The safety copy is from {formatDateTime(snap.createdAt)} ({snap.reason}). Use it only if
              reloading does not help, and export your raw data first. {changesLostText(snap.createdAt)}
            </p>
            <button className="btn danger block" disabled={busy} onClick={() => void restore()}>
              {busy ? 'Restoring…' : 'Restore safety copy'}
            </button>
          </div>
        )}
        {status && <p className="footnote" style={{ color: 'var(--danger)' }}>{status}</p>}
      </div>
    </main>
  );
}
