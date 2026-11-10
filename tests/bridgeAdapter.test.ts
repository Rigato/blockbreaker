import { afterEach, describe, expect, it, vi } from 'vitest';
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
      showRewarded: ReturnType<typeof vi.fn>;
      isInterstitialSupported: boolean;
      isRewardedSupported: boolean;
    };
  };
  emit: (event: string, ...args: unknown[]) => void;
  listenerCount: (event: string) => number;
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
      isRewardedSupported: false,
      showInterstitial: vi.fn(),
      showRewarded: vi.fn(),
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
    listenerCount(event: string): number {
      return listeners.get(event)?.size ?? 0;
    },
  };
}

afterEach(() => {
  vi.useRealTimers();
});

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

  it('skips rewarded ads when the platform does not support them', async () => {
    const fake = createFakeBridge();
    const adapter = new BridgeAdapter(fake.bridge);

    expect(adapter.ads.isRewardedSupported).toBe(false);
    await expect(adapter.ads.showRewarded('revive')).resolves.toBe('skipped');
    expect(fake.raw.advertisement.showRewarded).not.toHaveBeenCalled();
  });

  it('reads rewarded support live from the Bridge', () => {
    const fake = createFakeBridge();
    const adapter = new BridgeAdapter(fake.bridge);

    fake.raw.advertisement.isRewardedSupported = true;
    expect(adapter.ads.isRewardedSupported).toBe(true);
  });

  it('rewards only after the rewarded state and cleans up', async () => {
    const fake = createFakeBridge();
    fake.raw.advertisement.isRewardedSupported = true;
    const adapter = new BridgeAdapter(fake.bridge);

    const result = adapter.ads.showRewarded('revive');
    fake.emit('rewarded_state_changed', 'opened');
    fake.emit('rewarded_state_changed', 'rewarded');

    await expect(result).resolves.toBe('rewarded');
    expect(fake.raw.advertisement.showRewarded).toHaveBeenCalledWith('revive');
    expect(fake.listenerCount('rewarded_state_changed')).toBe(0);
  });

  it('maps closed without a reward to closed and cleans up', async () => {
    const fake = createFakeBridge();
    fake.raw.advertisement.isRewardedSupported = true;
    const adapter = new BridgeAdapter(fake.bridge);

    const result = adapter.ads.showRewarded('revive');
    fake.emit('rewarded_state_changed', 'opened');
    fake.emit('rewarded_state_changed', 'closed');

    await expect(result).resolves.toBe('closed');
    expect(fake.listenerCount('rewarded_state_changed')).toBe(0);
  });

  it('maps failed and throwing rewarded requests to failed', async () => {
    const fake = createFakeBridge();
    fake.raw.advertisement.isRewardedSupported = true;
    const adapter = new BridgeAdapter(fake.bridge);

    const result = adapter.ads.showRewarded('revive');
    fake.emit('rewarded_state_changed', 'failed');

    await expect(result).resolves.toBe('failed');
    expect(fake.listenerCount('rewarded_state_changed')).toBe(0);

    fake.raw.advertisement.showRewarded.mockImplementation(() => {
      throw new Error('adblock');
    });
    await expect(adapter.ads.showRewarded('revive')).resolves.toBe('failed');
    expect(fake.listenerCount('rewarded_state_changed')).toBe(0);
  });

  it('times out rewarded ads after 15 s and cleans up the listener', async () => {
    vi.useFakeTimers();
    const fake = createFakeBridge();
    fake.raw.advertisement.isRewardedSupported = true;
    const adapter = new BridgeAdapter(fake.bridge);

    const result = adapter.ads.showRewarded('revive');
    expect(fake.listenerCount('rewarded_state_changed')).toBe(1);
    await vi.advanceTimersByTimeAsync(15_000);

    await expect(result).resolves.toBe('failed');
    expect(fake.listenerCount('rewarded_state_changed')).toBe(0);
  });
});
