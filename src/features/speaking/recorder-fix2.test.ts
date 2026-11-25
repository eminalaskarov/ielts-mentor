/** Fix pass 2: recorder keeps a take that is being saved, and replaces an ended mic stream. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Recorder, streamEnded } from './recorder';

class FakeRecorder {
  static instances: FakeRecorder[] = [];
  state: 'inactive' | 'recording' = 'inactive';
  mimeType = 'audio/mp4';
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(public stream: unknown) {
    FakeRecorder.instances.push(this);
  }
  static isTypeSupported(t: string) {
    return t === 'audio/mp4';
  }
  start() {
    this.state = 'recording';
  }
  emit(text: string) {
    this.ondataavailable?.({ data: new Blob([text]) });
  }
  stop() {
    if (this.state === 'inactive') return;
    this.state = 'inactive';
    setTimeout(() => this.onstop?.(), 5);
  }
}

type Track = { readyState: 'live' | 'ended'; stop: () => void };
let streams: { tracks: Track[] }[] = [];
const makeStream = () => {
  const s = { tracks: [{ readyState: 'live' as 'live' | 'ended', stop() { this.readyState = 'ended'; } }] };
  streams.push(s);
  return { getTracks: () => s.tracks, getAudioTracks: () => s.tracks, _s: s };
};

beforeEach(() => {
  FakeRecorder.instances = [];
  streams = [];
  vi.stubGlobal('MediaRecorder', FakeRecorder);
  vi.stubGlobal('document', { addEventListener: () => {}, removeEventListener: () => {}, visibilityState: 'visible' });
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: async () => makeStream() } });
});
afterEach(() => vi.unstubAllGlobals());

describe('Recorder (fix pass 2)', () => {
  it('cancel() while a stop is pending does not lose the take (leaving during "saving")', async () => {
    const r = new Recorder();
    await r.start();
    FakeRecorder.instances[0].emit('take');
    const pending = r.stop();
    expect(r.stopPending).toBe(true);
    r.cancel(); // user closes / screen unmounts while saving
    r.release();
    const res = await pending;
    expect(await new Response(res.blob).text()).toBe('take');
    expect(res.interrupted).toBe(false);
  });

  it('cancel() while recording still discards (and does not fire onInterrupted)', async () => {
    const r = new Recorder();
    const interrupted = vi.fn();
    r.onInterrupted = interrupted;
    await r.start();
    r.cancel();
    await new Promise((res) => setTimeout(res, 20));
    expect(interrupted).not.toHaveBeenCalled();
    expect(r.busy).toBe(false);
  });

  it('acquire() gets a new stream when every audio track has ended (app left during Part 2 prep)', async () => {
    const r = new Recorder();
    await r.acquire();
    expect(streams.length).toBe(1);
    await r.acquire();
    expect(streams.length).toBe(1); // live stream is reused
    streams[0].tracks[0].readyState = 'ended'; // iOS ended the track in the background
    await r.start();
    expect(streams.length).toBe(2);
    expect((FakeRecorder.instances[0].stream as { _s: unknown })._s).toBe(streams[1]);
  });

  it('streamEnded: tracks without readyState count as live; no tracks counts as ended', () => {
    const st = (tracks: unknown[]) => ({ getTracks: () => tracks }) as unknown as MediaStream;
    expect(streamEnded(st([{}]))).toBe(false);
    expect(streamEnded(st([{ readyState: 'ended' }, { readyState: 'live' }]))).toBe(false);
    expect(streamEnded(st([{ readyState: 'ended' }]))).toBe(true);
    expect(streamEnded(st([]))).toBe(true);
  });
});
