/** Recorder race guards, with a fake MediaRecorder (node environment). */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Recorder } from './recorder';

class FakeRecorder {
  static instances: FakeRecorder[] = [];
  state: 'inactive' | 'recording' = 'inactive';
  mimeType: string;
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  stopCalls = 0;
  constructor(_s: unknown, o?: { mimeType?: string }) {
    this.mimeType = o?.mimeType ?? 'audio/mp4';
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
    this.stopCalls++;
    if (this.state === 'inactive') return;
    this.state = 'inactive';
    setTimeout(() => this.onstop?.(), 5);
  }
}

beforeEach(() => {
  FakeRecorder.instances = [];
  vi.stubGlobal('MediaRecorder', FakeRecorder);
  vi.stubGlobal('document', { addEventListener: () => {}, removeEventListener: () => {}, visibilityState: 'visible' });
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [{ stop: () => {} }] }) } });
});
afterEach(() => vi.unstubAllGlobals());

describe('Recorder', () => {
  it('stop() twice returns the same pending promise and stops once', async () => {
    const r = new Recorder();
    await r.start();
    FakeRecorder.instances[0].emit('abc');
    const a = r.stop();
    const b = r.stop();
    expect(b).toBe(a);
    const res = await a;
    expect(FakeRecorder.instances[0].stopCalls).toBe(1);
    expect(await new Response(res.blob).text()).toBe('abc');
    expect(res.interrupted).toBe(false);
    expect(res.mime).toBe('audio/mp4');
  });

  it('start() refuses while recording or while another start is in progress', async () => {
    const r = new Recorder();
    const p1 = r.start();
    await expect(r.start()).rejects.toThrow();
    await p1;
    await expect(r.start()).rejects.toThrow();
    expect(FakeRecorder.instances.length).toBe(1);
  });

  it('each recording keeps its own chunks', async () => {
    const r = new Recorder();
    await r.start();
    FakeRecorder.instances[0].emit('first');
    const first = await r.stop();
    await r.start();
    FakeRecorder.instances[1].emit('second');
    // A late chunk from the first recorder must not leak into the second recording.
    FakeRecorder.instances[0].emit('late');
    const second = await r.stop();
    expect(await new Response(first.blob).text()).toBe('first');
    expect(await new Response(second.blob).text()).toBe('second');
  });

  it('stop() when not recording resolves with an empty result', async () => {
    const res = await new Recorder().stop();
    expect(res.blob.size).toBe(0);
    expect(res.durationMs).toBe(0);
  });
});
