import { describe, expect, it, vi } from 'vitest';
import type { PlaygamaBridge } from '@playgama/bridge';
import { BridgeAdapter } from '../src/platform/BridgeAdapter';

type Handler = (...args: unknown[]) => void;

interface FakeBridge {
  bridge: PlaygamaBridge;
  raw: {
    platform: {
      sendMessage: ReturnType<typeof vi.fn>;
    };
    storage: {
      get: ReturnType<typeof vi.fn>;
      set: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    advertisement: {
      showInterstitial: ReturnType<typeof vi.fn>;
    };
  };
  emit: (event: string, ...args: unknown[]) => void;
}

function createFakeBridge(storageGet?: () => Promise<unknown>): FakeBridge {
  const listeners = new Map<string, Set<Handler>>();

  const raw = {
    version: '2.4.1',
    isInitialized: true,
    platform: {
      id: 'mock',
      language: 'en-US',
      isAudioEnabled: true,
      isPaused: false,
      sendMessage: vi.fn(async () => undefined),
    },
    storage: {
      get: vi.fn(storageGet ?? (async () => ['saved'])),
      set: vi.fn(async () => undefined),
      delete: vi.fn(async () => undefined),
    },
    advertisement: {
      isInterstitialSupported: false,
      showInterstitial: vi.fn(),
    },
    on: vi.fn((event: string, handler: Handler) => {
      let bucket = listeners.get(event);
      if (!bucket) {
        bucket = new Set();
        listeners.set(event, bucket);
      }
      bucket.add(handler);
    }),
    off: vi.fn((event: string, handler?: Handler) => {
      if (handler) listeners.get(event)?.delete(handler);
      else listeners.delete(event);
    }),
  };

  return {
    bridge: raw as unknown as PlaygamaBridge,
    raw,
    emit(event: string, ...args: unknown[]): void {
      for (const handler of listeners.get(event) ?? []) handler(...args);
    },
  };
}

describe('BridgeAdapter', () => {
  it('exposes platform identity and diagnostics', () => {
    const fake = createFakeBridge();
    const adapter = new BridgeAdapter(fake.bridge, { initDurationMs: 12 });

    expect(adapter.id).toBe('mock');
    expect(adapter.language).toBe('en-US');
    expect(adapter.diagnostics).toEqual({
      source: 'bridge',
      storageKind: 'bridge',
      bridgeVersion: '2.4.1',
      initDurationMs: 12,
    });
  });

  it('uses arrays of equal length for Bridge storage', async () => {
    const fake = createFakeBridge();
    const adapter = new BridgeAdapter(fake.bridge);

    await expect(adapter.storage.get(['bb.save'])).resolves.toEqual(['saved']);
    expect(fake.raw.storage.get).toHaveBeenCalledWith(['bb.save'], false);

    await adapter.storage.set(['a', 'b'], ['1', '2']);
    expect(fake.raw.storage.set).toHaveBeenCalledWith(['a', 'b'], ['1', '2']);

    await adapter.storage.delete(['a']);
    expect(fake.raw.storage.delete).toHaveBeenCalledWith(['a']);
  });

  it('degrades to memory when Bridge storage times out', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fake = createFakeBridge(() => new Promise<unknown>(() => undefined));
    const adapter = new BridgeAdapter(fake.bridge, { storageTimeoutMs: 5 });

    await expect(adapter.storage.get(['bb.save'])).resolves.toEqual([null]);
    expect(adapter.diagnostics.storageKind).toBe('memory');

    await adapter.storage.set(['bb.save'], ['memory']);
    expect(fake.raw.storage.set).not.toHaveBeenCalled();
    await expect(adapter.storage.get(['bb.save'])).resolves.toEqual(['memory']);

    warning.mockRestore();
  });

  it('rejects mismatched arrays before calling the Bridge', async () => {
    const fake = createFakeBridge();
    const adapter = new BridgeAdapter(fake.bridge);

    await expect(adapter.storage.set(['a'], ['1', '2'])).rejects.toThrow(/same length/);
    expect(fake.raw.storage.set).not.toHaveBeenCalled();
  });

  it('forwards platform messages and pause events', async () => {
    const fake = createFakeBridge();
    const adapter = new BridgeAdapter(fake.bridge);

    await adapter.sendMessage('game_ready');
    expect(fake.raw.platform.sendMessage).toHaveBeenCalledWith('game_ready', {});

    const listener = vi.fn();
    const unsubscribe = adapter.onPauseChanged(listener);
    fake.emit('pause_state_changed', true);
    expect(listener).toHaveBeenCalledWith(true);

    unsubscribe();
    fake.emit('pause_state_changed', false);
    expect(listener).toHaveBeenCalledOnce();
  });

  it('skips interstitials when unsupported', async () => {
    const fake = createFakeBridge();
    const adapter = new BridgeAdapter(fake.bridge);

    expect(adapter.ads.isInterstitialSupported).toBe(false);
    await expect(adapter.ads.showInterstitial('phase_completed')).resolves.toBe('skipped');
  });
});
