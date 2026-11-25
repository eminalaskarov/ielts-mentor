/**
 * MediaRecorder wrapper. iOS Safari records audio/mp4 (AAC); other browsers fall back to webm/ogg.
 * Microphone permission is requested only from a user tap (start()).
 */
import { pickMimeType } from '../../logic/recordings';

export interface RecorderResult {
  blob: Blob;
  mime: string;
  durationMs: number;
  interrupted: boolean;
}

export function recordingSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
}

/** All audio tracks have ended (or there are none). Tracks without a readyState count as live. */
export function streamEnded(stream: MediaStream): boolean {
  const tracks = typeof stream.getAudioTracks === 'function' ? stream.getAudioTracks() : stream.getTracks();
  return tracks.length === 0 || tracks.every((t) => t.readyState === 'ended');
}

type WakeLockSentinelLike = { release: () => Promise<void> };

export class Recorder {
  private rec: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private startedAt = 0;
  private userStopped = false;
  private starting = false;
  private wake: WakeLockSentinelLike | null = null;
  private resolveStop: ((r: RecorderResult) => void) | null = null;
  private stopping: Promise<RecorderResult> | null = null;
  onInterrupted: ((r: RecorderResult) => void) | null = null;
  mime = '';

  /** Ask for the microphone (call from a user tap). The stream can be reused by start(). */
  async acquire(): Promise<void> {
    // iOS ends the tracks when the app goes to the background (e.g. during Part 2 prep): a stream
    // whose audio tracks have all ended cannot record, so get a fresh one.
    if (this.stream && !this.rec && streamEnded(this.stream)) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (!this.stream) this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  }

  /** True while start() is in progress or a recording is running/stopping. */
  get busy(): boolean {
    return this.starting || (!!this.rec && this.rec.state !== 'inactive');
  }

  async start(): Promise<void> {
    if (this.busy) throw new Error('Already recording');
    this.starting = true;
    try {
      await this.acquire();
      if (!this.stream) throw new Error('No microphone stream');
      const mime = pickMimeType((t) => (MediaRecorder.isTypeSupported ? MediaRecorder.isTypeSupported(t) : false));
      const rec = mime ? new MediaRecorder(this.stream, { mimeType: mime }) : new MediaRecorder(this.stream);
      const recMime = rec.mimeType || mime || 'audio/mp4';
      // Chunks belong to this recording only (a later start() can never mix into it).
      const chunks: Blob[] = [];
      this.rec = rec;
      this.mime = recMime;
      this.userStopped = false;
      this.stopping = null;
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      rec.onstop = () => {
        const result: RecorderResult = {
          blob: new Blob(chunks, { type: recMime }),
          mime: recMime,
          durationMs: Date.now() - this.startedAt,
          interrupted: !this.userStopped,
        };
        if (this.rec === rec) this.cleanup();
        const resolve = this.resolveStop;
        this.resolveStop = null;
        if (resolve) resolve(result);
        else if (this.onInterrupted) this.onInterrupted(result);
      };
      // 1 s timeslice: chunks are collected continuously, so partial audio survives interruptions.
      rec.start(1000);
      this.startedAt = Date.now();
      document.addEventListener('visibilitychange', this.onVisibility);
    } catch (e) {
      this.starting = false;
      throw e;
    }
    this.starting = false;
    try {
      const wl = (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<WakeLockSentinelLike> } }).wakeLock;
      if (wl) {
        const w = await wl.request('screen');
        if (this.rec) this.wake = w;
        else void w.release().catch(() => {}); // stopped while the wake lock was being requested
      }
    } catch {
      /* wake lock not available */
    }
  }

  private onVisibility = () => {
    // iOS stops recording in the background; stop cleanly so the audio so far is kept.
    if (document.visibilityState === 'hidden' && this.rec && this.rec.state === 'recording' && !this.stopping) {
      this.rec.stop();
    }
  };

  get recording(): boolean {
    return !!this.rec && this.rec.state === 'recording';
  }

  elapsed(): number {
    return this.recording ? Date.now() - this.startedAt : 0;
  }

  /** Stop and get the audio. Calling it again while stopping returns the same pending promise. */
  stop(): Promise<RecorderResult> {
    if (this.stopping) return this.stopping;
    if (!this.rec || this.rec.state === 'inactive') {
      return Promise.resolve({ blob: new Blob([], { type: this.mime }), mime: this.mime, durationMs: 0, interrupted: false });
    }
    const rec = this.rec;
    this.userStopped = true;
    this.stopping = new Promise<RecorderResult>((resolve) => {
      this.resolveStop = resolve;
    }).finally(() => {
      this.stopping = null;
    });
    rec.stop();
    return this.stopping;
  }

  /** True while a stop() is waiting for the final audio (the take is being finished/saved). */
  get stopPending(): boolean {
    return !!this.stopping;
  }

  /**
   * Discard a running recording. While a stop() is pending this does nothing: the take is already
   * on its way to the caller (who will save it), and its resolver must not be replaced.
   */
  cancel(): void {
    if (this.stopping) return;
    this.userStopped = true;
    this.resolveStop = () => {};
    if (this.rec && this.rec.state !== 'inactive') this.rec.stop();
    else this.cleanup();
  }

  /** Release the microphone without recording (e.g. leaving during Part 2 preparation). */
  release(): void {
    if (!this.rec) this.cleanup();
  }

  private cleanup(): void {
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.rec = null;
    void this.wake?.release().catch(() => {});
    this.wake = null;
  }
}
