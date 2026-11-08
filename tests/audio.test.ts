import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AudioService,
  MAX_SFX_VOICES,
  SFX_THROTTLE_MS,
  VoiceBudget,
} from '../src/audio';
import type { AudioServiceOptions } from '../src/audio';
import type { SfxId } from '../src/game/presentation';

// ---------------------------------------------------------------------------
// Lightweight stand-ins. The test environment is plain node (no jsdom), so the
// service only needs duck-typed DOM and WebAudio objects.
// ---------------------------------------------------------------------------

class FakeParam {
  value = 0;

  setValueAtTime(value: number, _time: number): this {
    this.value = value;
    return this;
  }

  linearRampToValueAtTime(value: number, _time: number): this {
    this.value = value;
    return this;
  }

  exponentialRampToValueAtTime(value: number, _time: number): this {
    this.value = value;
    return this;
  }

  setTargetAtTime(value: number, _time: number, _constant: number): this {
    this.value = value;
    return this;
  }

  cancelScheduledValues(_time: number): this {
    return this;
  }
}

class FakeNode {
  gain = new FakeParam();
  frequency = new FakeParam();
  detune = new FakeParam();
  Q = new FakeParam();
  threshold = new FakeParam();
  knee = new FakeParam();
  ratio = new FakeParam();
  attack = new FakeParam();
  release = new FakeParam();
  type = '';
  buffer: unknown = null;
  onended: (() => void) | null = null;
  connectedTo: FakeNode[] = [];

  connect<T>(node: T): T {
    this.connectedTo.push(node as unknown as FakeNode);
    return node;
  }

  start(_when?: number): void {}
  stop(_when?: number): void {}
}

class MockAudioContext {
  state = 'suspended';
  currentTime = 0;
  sampleRate = 48000;
  destination = new FakeNode();
  oscillators: FakeNode[] = [];
  buffers: FakeNode[] = [];
  resumeCalls = 0;
  closeCalls = 0;

  createGain(): FakeNode {
    return new FakeNode();
  }

  createDynamicsCompressor(): FakeNode {
    return new FakeNode();
  }

  createOscillator(): FakeNode {
    const node = new FakeNode();
    this.oscillators.push(node);
    return node;
  }

  createBiquadFilter(): FakeNode {
    return new FakeNode();
  }

  createBufferSource(): FakeNode {
    const node = new FakeNode();
    this.buffers.push(node);
    return node;
  }

  createBuffer(_channels: number, length: number, _sampleRate: number): unknown {
    return { getChannelData: () => new Float32Array(length) };
  }

  resume(): Promise<void> {
    this.resumeCalls += 1;
    this.state = 'running';
    return Promise.resolve();
  }

  close(): Promise<void> {
    this.closeCalls += 1;
    this.state = 'closed';
    return Promise.resolve();
  }

  setState(state: string): void {
    this.state = state;
  }
}

type Listener = (event: { target?: unknown }) => void;

class FakeDocument {
  hidden = false;
  documentElement = { dataset: {} as Record<string, string> };
  private readonly listeners = new Map<string, Set<Listener>>();

  addEventListener(type: string, listener: Listener): void {
    let bucket = this.listeners.get(type);
    if (!bucket) {
      bucket = new Set();
      this.listeners.set(type, bucket);
    }
    bucket.add(listener);
  }

  removeEventListener(type: string, listener: Listener): void {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type: string, event: { target?: unknown } = {}): void {
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener(event);
  }

  listenerCount(type: string): number {
    return this.listeners.get(type)?.size ?? 0;
  }
}

const originalDocument = (globalThis as { document?: unknown }).document;

function installDocument(): FakeDocument {
  const doc = new FakeDocument();
  vi.stubGlobal('document', doc);
  return doc;
}

function createService(options: Partial<AudioServiceOptions> = {}): {
  service: AudioService;
  context: MockAudioContext;
} {
  const context = new MockAudioContext();
  const service = new AudioService({
    contextFactory: () => context as unknown as AudioContext,
    ...options,
  });
  return { service, context };
}

function playCount(context: MockAudioContext, service: AudioService, id: SfxId): number {
  const before = context.oscillators.length + context.buffers.length;
  service.play(id);
  return context.oscillators.length + context.buffers.length - before;
}

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalDocument === undefined) {
    delete (globalThis as { document?: unknown }).document;
  } else {
    vi.stubGlobal('document', originalDocument);
  }
});

describe('AudioService lifecycle', () => {
  it('starts locked and unlocks on the first simulated gesture', () => {
    const doc = installDocument();
    const { service, context } = createService();

    expect(service.state).toBe('locked');
    expect(service.unlocked).toBe(false);
    expect(doc.documentElement.dataset.audioState).toBe('locked');
    expect(context.resumeCalls).toBe(0);

    // No context is created and no sound is scheduled before a gesture.
    expect(playCount(context, service, 'paddle')).toBe(0);
    expect(context.oscillators).toHaveLength(0);

    doc.dispatch('pointerdown');

    expect(context.resumeCalls).toBe(1);
    expect(service.state).toBe('running');
    expect(service.unlocked).toBe(true);
    expect(doc.documentElement.dataset.audioState).toBe('running');

    service.dispose();
  });

  it('does not resume automatically when leaving background', () => {
    const doc = installDocument();
    const { service, context } = createService();

    doc.dispatch('pointerdown');
    expect(service.state).toBe('running');

    // Simulate iOS suspending the context while the tab is hidden.
    context.setState('suspended');
    service.setBackground(true);
    expect(service.state).toBe('background');
    service.setBackground(false);

    expect(service.state).toBe('locked');
    expect(context.resumeCalls).toBe(1);

    doc.dispatch('touchend');

    expect(context.resumeCalls).toBe(2);
    expect(service.state).toBe('running');

    service.dispose();
  });

  it('transitions through muted, suspended, background and updates the dataset', () => {
    const doc = installDocument();
    const { service } = createService();
    doc.dispatch('pointerdown');

    service.setEnabled(false);
    expect(service.state).toBe('muted');
    expect(doc.documentElement.dataset.audioState).toBe('muted');

    service.setEnabled(true);
    expect(service.state).toBe('running');

    service.setPlatformEnabled(false);
    expect(service.state).toBe('muted');

    service.setPlatformEnabled(true);
    expect(service.state).toBe('running');

    service.setSuspended(true);
    expect(service.state).toBe('suspended');
    expect(doc.documentElement.dataset.audioState).toBe('suspended');

    service.setSuspended(false);
    expect(service.state).toBe('running');

    service.setBackground(true);
    expect(service.state).toBe('background');
    expect(doc.documentElement.dataset.audioState).toBe('background');

    service.setBackground(false);
    expect(service.state).toBe('locked');
    expect(doc.documentElement.dataset.audioState).toBe('locked');

    service.dispose();
  });

  it('hard-mutes on visibilitychange and waits for a gesture', () => {
    const doc = installDocument();
    const { service, context } = createService();
    service.unlock();
    expect(service.state).toBe('running');

    context.setState('suspended');
    doc.hidden = true;
    doc.dispatch('visibilitychange');
    expect(service.state).toBe('background');
    expect(doc.documentElement.dataset.audioState).toBe('background');

    doc.hidden = false;
    doc.dispatch('visibilitychange');
    expect(service.state).toBe('locked');
    expect(context.resumeCalls).toBe(1);

    doc.dispatch('keydown');
    expect(service.state).toBe('running');
    expect(context.resumeCalls).toBe(2);

    service.dispose();
  });

  it('honours both mute switches', () => {
    installDocument();
    const { service } = createService({ enabled: false, platformEnabled: false });

    expect(service.state).toBe('muted');
    service.unlock();
    expect(service.state).toBe('muted');

    service.setEnabled(true);
    expect(service.state).toBe('muted');
    service.setPlatformEnabled(true);
    // The unlock gesture already happened, so audio is ready once unmuted.
    expect(service.state).toBe('running');

    service.dispose();
  });
});

describe('AudioService playback rules', () => {
  it('synthesizes the metallic block-damage ricochet', () => {
    installDocument();
    const { service, context } = createService();
    service.unlock();

    expect(playCount(context, service, 'block-damage')).toBeGreaterThan(0);
    service.dispose();
  });

  it('does not schedule SFX while muted or in background', () => {
    installDocument();
    const { service, context } = createService();
    service.unlock();

    service.setEnabled(false);
    expect(playCount(context, service, 'paddle')).toBe(0);

    service.setEnabled(true);
    service.setBackground(true);
    expect(playCount(context, service, 'explosion')).toBe(0);

    service.setBackground(false);
    // Back from background: still locked until the next gesture.
    expect(playCount(context, service, 'paddle')).toBe(0);

    service.dispose();
  });

  it('blocks gameplay SFX while suspended but keeps jingles and UI', () => {
    installDocument();
    const { service, context } = createService();
    service.unlock();
    service.setSuspended(true);

    expect(playCount(context, service, 'block-break')).toBe(0);
    expect(playCount(context, service, 'laser')).toBe(0);
    expect(playCount(context, service, 'level-up')).toBeGreaterThan(0);
    expect(playCount(context, service, 'victory')).toBeGreaterThan(0);

    service.dispose();
  });

  it('routes ui clicks from DOM buttons only', () => {
    const doc = installDocument();
    const { service, context } = createService();
    service.unlock();

    const beforeButton = context.oscillators.length;
    doc.dispatch('click', { target: { closest: () => ({ tagName: 'BUTTON' }) } });
    expect(context.oscillators.length).toBeGreaterThan(beforeButton);

    const beforeCanvas = context.oscillators.length;
    doc.dispatch('click', { target: { closest: () => null } });
    expect(context.oscillators.length).toBe(beforeCanvas);

    service.dispose();
  });

  it('stays silent and does not throw without WebAudio', () => {
    installDocument();
    vi.stubGlobal('AudioContext', undefined);
    vi.stubGlobal('webkitAudioContext', undefined);

    const service = new AudioService();
    expect(() => service.unlock()).not.toThrow();
    expect(service.state).toBe('locked');
    expect(() => service.play('paddle')).not.toThrow();

    service.dispose();
  });
});

describe('VoiceBudget', () => {
  it('throttles the same id and recovers after the window', () => {
    const budget = new VoiceBudget();

    expect(budget.begin('paddle', 100)).toBe(true);
    expect(budget.begin('paddle', 100 + SFX_THROTTLE_MS - 1)).toBe(false);
    expect(budget.begin('paddle', 100 + SFX_THROTTLE_MS)).toBe(true);
    expect(budget.activeVoices).toBe(2);

    budget.end();
    expect(budget.activeVoices).toBe(1);
  });

  it('caps simultaneous voices and frees a slot on end', () => {
    const budget = new VoiceBudget();

    for (let index = 0; index < MAX_SFX_VOICES; index += 1) {
      expect(budget.begin('block-break', index * 1000)).toBe(true);
    }

    expect(budget.activeVoices).toBe(MAX_SFX_VOICES);
    expect(budget.canStart('laser', 1_000_000)).toBe(false);
    expect(budget.begin('laser', 1_000_000)).toBe(false);

    budget.end();
    expect(budget.begin('laser', 1_000_000)).toBe(true);
  });

  it('reset clears both throttle memory and active voices', () => {
    const budget = new VoiceBudget();
    budget.begin('ui', 10);
    budget.reset();

    expect(budget.activeVoices).toBe(0);
    expect(budget.begin('ui', 10)).toBe(true);
  });
});

describe('AudioService disposal', () => {
  it('removes listeners, closes the context once and is idempotent', () => {
    const doc = installDocument();
    const { service, context } = createService();
    service.unlock();

    expect(doc.listenerCount('pointerdown')).toBeGreaterThan(0);
    expect(doc.listenerCount('click')).toBeGreaterThan(0);

    service.dispose();

    expect(context.closeCalls).toBe(1);
    expect(doc.listenerCount('pointerdown')).toBe(0);
    expect(doc.listenerCount('touchend')).toBe(0);
    expect(doc.listenerCount('keydown')).toBe(0);
    expect(doc.listenerCount('click')).toBe(0);
    expect(doc.listenerCount('visibilitychange')).toBe(0);
    expect(doc.documentElement.dataset.audioState).toBeUndefined();

    expect(() => service.dispose()).not.toThrow();
    expect(context.closeCalls).toBe(1);
    expect(() => service.play('paddle')).not.toThrow();
    expect(service.state).toBe('locked');
  });
});
