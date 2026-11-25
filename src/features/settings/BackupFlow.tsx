/**
 * Two-step backup: (1) prepare the file, (2) "Share backup file" — the tap calls navigator.share
 * directly, so iOS opens the share sheet (Save to Files / iCloud Drive / AirDrop).
 * The backup counts as done only when the share completed, or — on the download fallback — when
 * the user confirms the file was saved. Self-contained (no AppContext) so the root error screen can use it.
 */
import { useState } from 'react';
import { markBackedUp, prepareBackup, shareBackupFile } from '../../db/backupIo';
import type { PreparedBackup } from '../../db/backupIo';
import { formatBytes } from '../../logic/recordings';
import { Icon } from '../../ui/Icon';

type Step = 'idle' | 'preparing' | 'ready' | 'sharing' | 'confirm' | 'done' | 'error';

export function BackupFlow({
  includeAudio = false,
  label = 'Back up now',
  small,
  markDone = true,
  onDone,
}: {
  includeAudio?: boolean;
  label?: string;
  small?: boolean;
  /** Set lastBackupAt when the file was handed off (false for the raw-data escape hatch). */
  markDone?: boolean;
  onDone?: (size: number) => void;
}) {
  const [step, setStep] = useState<Step>('idle');
  const [prepared, setPrepared] = useState<PreparedBackup | null>(null);
  const cls = small ? 'btn small' : 'btn primary';

  const prepare = async () => {
    setStep('preparing');
    try {
      setPrepared(await prepareBackup(includeAudio));
      setStep('ready');
    } catch {
      setStep('error');
    }
  };

  const finish = async (p: PreparedBackup) => {
    try {
      if (markDone) await markBackedUp();
    } catch {
      /* the file is saved; the reminder may show again */
    }
    setStep('done');
    onDone?.(p.size);
  };

  // Must stay synchronous up to shareBackupFile(): no await before navigator.share.
  const share = () => {
    const p = prepared;
    if (!p) return;
    setStep('sharing');
    void shareBackupFile(p).then((outcome) => {
      if (outcome === 'shared') void finish(p);
      else if (outcome === 'downloaded') setStep('confirm');
      else setStep('ready');
    });
  };

  if (step === 'idle' || step === 'preparing' || step === 'error') {
    return (
      <div className="stack" style={{ gap: 8 }}>
        <button className={cls} disabled={step === 'preparing'} onClick={() => void prepare()}>
          <Icon name="share" size={18} /> {step === 'preparing' ? 'Preparing your backup…' : label}
        </button>
        {step === 'error' && <p className="footnote" style={{ color: 'var(--danger)' }}>We couldn’t create the backup. Nothing was changed. Try again.</p>}
      </div>
    );
  }
  if (step === 'ready' || step === 'sharing') {
    return (
      <div className="stack" style={{ gap: 8 }}>
        <p className="callout">Backup file ready ({formatBytes(prepared?.size ?? 0)}). Tap below and choose “Save to Files” › iCloud Drive.</p>
        <button className={cls} disabled={step === 'sharing'} onClick={share}>
          <Icon name="share" size={18} /> Share backup file
        </button>
        <button className="btn plain small" onClick={() => { setPrepared(null); setStep('idle'); }}>Cancel</button>
      </div>
    );
  }
  if (step === 'confirm') {
    return (
      <div className="stack" style={{ gap: 8 }}>
        <p className="callout">Did the file save? Check Files › Downloads (or iCloud Drive).</p>
        <button className={cls} onClick={() => prepared && void finish(prepared)}>Yes, it’s saved</button>
        <button className="btn block" onClick={share}>Try again</button>
        <button className="btn plain small" onClick={() => setStep('ready')}>No, not saved</button>
      </div>
    );
  }
  return (
    <div className="stack" style={{ gap: 8 }}>
      <p className="callout"><Icon name="check" size={18} /> Backup saved. Keep it in Files › iCloud Drive so it’s safe if you lose your phone.</p>
      <button className="btn plain small" onClick={() => { setPrepared(null); setStep('idle'); }}>Make another backup</button>
    </div>
  );
}
