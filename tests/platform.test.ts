import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PlaygamaBridge } from '@playgama/bridge';
import { BridgeAdapter } from '../src/platform/BridgeAdapter';
import { createFallbackAdapter } from '../src/platform/FallbackAdapter';
import { createMockAds } from '../src/platform/MockAds';

type Handler = (...args: unknown[]) => void;

interface FakeBridgeOptions {
  storageGet?: (keys: string[]) => Promise<unknown>;
  storageSet?: (keys: string[], values: string[]) => Promise<void>;
  storageDelete?: (keys: string[]) => Promise<void>;
  supported?: boolean;
  rewardedSupported?: boolean;
  showInterstitial?: (placement?: string | null) => void;
  showRewarded?: (placement?: string | null) => void;
}

function createFakeBridge(options: FakeBridgeOptions = {}) {
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
      get: vi.fn(options.storageGet ?? (async () => ['saved'])),
      set: vi.fn(options.storageSet ?? (async () => undefined)),
      delete: vi.fn(options.storageDelete ?? (async () => undefined)),
    },
    advertisement: {
      isInterstitialSupported: options.supported ?? false,
      isRewardedSupported: options.rewardedSupported ?? false,
      showInterstitial: vi.fn(options.showInterstitial ?? (() => undefined)),
      showRewarded: vi.fn(options.showRewarded ?? (() => undefined)),
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

function sourceFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...sourceFiles(absolute));
    else if (entry.isFile() && entry.name.endsWith('.ts')) files.push(absolute);
  }
  return files;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('BridgeAdapter storage', () => {
  it('uses Bridge storage with arrays of the same size', async () => {
    const fake = createFakeBridge();
    const adapter = new BridgeAdapter(fake.bridge);

    await expect(adapter.storage.get(['bb.save', 'bb.settings'])).resolves.toEqual([
      'saved',
      null,
    ]);
    expect(fake.raw.storage.get).toHaveBeenCalledWith(['bb.save', 'bb.settings'], false);

    await adapter.storage.set(['bb.save', 'bb.settings'], ['save', 'settings']);
    expect(fake.raw.storage.set).toHaveBeenCalledWith(
      ['bb.save', 'bb.settings'],
      ['save', 'settings'],
    );

    await adapter.storage.delete(['bb.save']);
    expect(fake.raw.storage.delete).toHaveBeenCalledWith(['bb.save']);
    expect(adapter.diagnostics.storageKind).toBe('bridge');
  });

  it('normalizes record responses and rejects mismatched arrays', async () => {
    const fake = createFakeBridge({
      storageGet: async () => ({ 'bb.save': 'one', 'bb.settings': 2 }),
    });
    const adapter = new BridgeAdapter(fake.bridge);

    await expect(adapter.storage.get(['bb.save', 'bb.settings'])).resolves.toEqual([
      'one',
      '2',
    ]);
    await expect(adapter.storage.set(['a'], ['1', '2'])).rejects.toThrow(/same length/);
    expect(fake.raw.storage.set).not.toHaveBeenCalled();
  });

  it('degrades a failed read to memory and keeps working', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fake = createFakeBridge({
      storageGet: async () => {
        throw new Error('storage unavailable');
      },
    });
    const adapter = new BridgeAdapter(fake.bridge);

    await expect(adapter.storage.get(['bb.save'])).resolves.toEqual([null]);
    expect(adapter.diagnostics.storageKind).toBe('memory');

    await adapter.storage.set(['bb.save'], ['memory-value']);
    expect(fake.raw.storage.set).not.toHaveBeenCalled();
    await expect(adapter.storage.get(['bb.save'])).resolves.toEqual(['memory-value']);

    warn.mockRestore();
  });

  it('times out a hanging read and continues from memory', async () => {
    vi.useFakeTimers();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fake = createFakeBridge({
      storageGet: () => new Promise<unknown>(() => undefined),
    });
    const adapter = new BridgeAdapter(fake.bridge, { storageTimeoutMs: 25 });

    const pending = adapter.storage.get(['bb.save']);
    await vi.advanceTimersByTimeAsync(25);
    await expect(pending).resolves.toEqual([null]);

    expect(adapter.diagnostics.storageKind).toBe('memory');
    await adapter.storage.set(['bb.save'], ['after-timeout']);
    expect(fake.raw.storage.set).not.toHaveBeenCalled();
    await expect(adapter.storage.get(['bb.save'])).resolves.toEqual(['after-timeout']);

    warn.mockRestore();
  });

  it('degrades a failed write to memory', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fake = createFakeBridge({
      storageSet: async () => {
        throw new Error('quota');
      },
    });
    const adapter = new BridgeAdapter(fake.bridge);

    await adapter.storage.set(['bb.save'], ['value']);
    expect(adapter.diagnostics.storageKind).toBe('memory');
    await expect(adapter.storage.get(['bb.save'])).resolves.toEqual(['value']);

    warn.mockRestore();
  });
});

describe('BridgeAdapter ads', () => {
  it('skips when the platform does not support interstitials', async () => {
    const fake = createFakeBridge({ supported: false });
    const adapter = new BridgeAdapter(fake.bridge);

    expect(adapter.ads.isInterstitialSupported).toBe(false);
    await expect(adapter.ads.showInterstitial('results')).resolves.toBe('skipped');
    expect(fake.raw.advertisement.showInterstitial).not.toHaveBeenCalled();
  });

  it('reads support live from the Bridge', () => {
    const fake = createFakeBridge({ supported: false });
    const adapter = new BridgeAdapter(fake.bridge);

    fake.raw.advertisement.isInterstitialSupported = true;
    expect(adapter.ads.isInterstitialSupported).toBe(true);
  });

  it('maps closed to shown and removes the listener', async () => {
    const fake = createFakeBridge({ supported: true });
    const adapter = new BridgeAdapter(fake.bridge);

    const result = adapter.ads.showInterstitial('results');
    fake.emit('interstitial_state_changed', 'opened');
    fake.emit('interstitial_state_changed', 'closed');

    await expect(result).resolves.toBe('shown');
    expect(fake.raw.advertisement.showInterstitial).toHaveBeenCalledWith('results');
    expect(fake.listenerCount('interstitial_state_changed')).toBe(0);
  });

  it('maps failed to failed', async () => {
    const fake = createFakeBridge({ supported: true });
    const adapter = new BridgeAdapter(fake.bridge);

    const result = adapter.ads.showInterstitial('results');
    fake.emit('interstitial_state_changed', 'failed');

    await expect(result).resolves.toBe('failed');
    expect(fake.listenerCount('interstitial_state_changed')).toBe(0);
  });

  it('fails instead of hanging after the 15 s timeout', async () => {
    vi.useFakeTimers();
    const fake = createFakeBridge({ supported: true });
    const adapter = new BridgeAdapter(fake.bridge);

    const result = adapter.ads.showInterstitial('results');
    fake.emit('interstitial_state_changed', 'opened');
    await vi.advanceTimersByTimeAsync(15_000);

    await expect(result).resolves.toBe('failed');
    expect(fake.listenerCount('interstitial_state_changed')).toBe(0);
  });

  it('fails when the SDK throws while requesting the ad', async () => {
    const fake = createFakeBridge({
      supported: true,
      showInterstitial: () => {
        throw new Error('adblock');
      },
    });
    const adapter = new BridgeAdapter(fake.bridge);

    await expect(adapter.ads.showInterstitial('results')).resolves.toBe('failed');
    expect(fake.listenerCount('interstitial_state_changed')).toBe(0);
  });

  it('fails when the SDK cannot register the listener', async () => {
    const fake = createFakeBridge({ supported: true });
    fake.raw.on.mockImplementation(() => {
      throw new Error('event bus unavailable');
    });
    const adapter = new BridgeAdapter(fake.bridge);

    await expect(adapter.ads.showInterstitial('results')).resolves.toBe('failed');
  });
});

describe('BridgeAdapter rewarded ads', () => {
  it('skips when the platform does not support rewarded ads', async () => {
    const fake = createFakeBridge({ rewardedSupported: false });
    const adapter = new BridgeAdapter(fake.bridge);

    expect(adapter.ads.isRewardedSupported).toBe(false);
    await expect(adapter.ads.showRewarded('revive')).resolves.toBe('skipped');
    expect(fake.raw.advertisement.showRewarded).not.toHaveBeenCalled();
  });

  it('reads rewarded support live from the Bridge', () => {
    const fake = createFakeBridge({ rewardedSupported: false });
    const adapter = new BridgeAdapter(fake.bridge);

    fake.raw.advertisement.isRewardedSupported = true;
    expect(adapter.ads.isRewardedSupported).toBe(true);
  });

  it('resolves rewarded only on the rewarded state', async () => {
    const fake = createFakeBridge({ rewardedSupported: true });
    const adapter = new BridgeAdapter(fake.bridge);

    const result = adapter.ads.showRewarded('revive');
    fake.emit('rewarded_state_changed', 'opened');
    fake.emit('rewarded_state_changed', 'rewarded');
    fake.emit('rewarded_state_changed', 'closed');

    await expect(result).resolves.toBe('rewarded');
    expect(fake.raw.advertisement.showRewarded).toHaveBeenCalledWith('revive');
    expect(fake.listenerCount('rewarded_state_changed')).toBe(0);
  });

  it('maps closed without a reward to closed', async () => {
    const fake = createFakeBridge({ rewardedSupported: true });
    const adapter = new BridgeAdapter(fake.bridge);

    const result = adapter.ads.showRewarded('revive');
    fake.emit('rewarded_state_changed', 'closed');

    await expect(result).resolves.toBe('closed');
    expect(fake.listenerCount('rewarded_state_changed')).toBe(0);
  });

  it('maps failed and throws to failed', async () => {
    const fake = createFakeBridge({ rewardedSupported: true });
    const adapter = new BridgeAdapter(fake.bridge);
    const result = adapter.ads.showRewarded('revive');
    fake.emit('rewarded_state_changed', 'failed');
    await expect(result).resolves.toBe('failed');

    const throwing = createFakeBridge({
      rewardedSupported: true,
      showRewarded: () => {
        throw new Error('adblock');
      },
    });
    const throwingAdapter = new BridgeAdapter(throwing.bridge);
    await expect(throwingAdapter.ads.showRewarded('revive')).resolves.toBe('failed');
  });

  it('fails after the 15 s timeout and removes the listener', async () => {
    vi.useFakeTimers();
    const fake = createFakeBridge({ rewardedSupported: true });
    const adapter = new BridgeAdapter(fake.bridge);

    const result = adapter.ads.showRewarded('revive');
    await vi.advanceTimersByTimeAsync(15_000);

    await expect(result).resolves.toBe('failed');
    expect(fake.listenerCount('rewarded_state_changed')).toBe(0);
  });
});

describe('MockAds', () => {
  it('marks rewarded support only for the rewarded modes', () => {
    expect(createMockAds('show').isRewardedSupported).toBe(false);
    expect(createMockAds('fail').isRewardedSupported).toBe(false);
    expect(createMockAds('rewarded').isRewardedSupported).toBe(true);
    expect(createMockAds('rewarded-fail').isRewardedSupported).toBe(true);
  });

  it('simulates rewarded success/failure and keeps interstitials shown', async () => {
    vi.useFakeTimers();

    const success = createMockAds('rewarded');
    const rewarded = success.showRewarded('revive');
    const interstitial = success.showInterstitial('wave_completed');
    await vi.advanceTimersByTimeAsync(1_200);
    await expect(rewarded).resolves.toBe('rewarded');
    await vi.advanceTimersByTimeAsync(200);
    await expect(interstitial).resolves.toBe('shown');

    const failure = createMockAds('rewarded-fail');
    const failed = failure.showRewarded('revive');
    const failureInterstitial = failure.showInterstitial('wave_completed');
    await vi.advanceTimersByTimeAsync(1_500);
    await expect(failed).resolves.toBe('failed');
    await expect(failureInterstitial).resolves.toBe('shown');

    await expect(createMockAds('fail').showRewarded('revive')).resolves.toBe('skipped');
  });
});

describe('BridgeAdapter platform events', () => {
  it('registers and removes pause listeners', () => {
    const fake = createFakeBridge();
    const adapter = new BridgeAdapter(fake.bridge);
    const listener = vi.fn();

    const unsubscribe = adapter.onPauseChanged(listener);
    expect(fake.listenerCount('pause_state_changed')).toBe(1);

    fake.emit('pause_state_changed', true);
    expect(listener).toHaveBeenCalledWith(true);

    unsubscribe();
    expect(fake.listenerCount('pause_state_changed')).toBe(0);
    fake.emit('pause_state_changed', false);
    expect(listener).toHaveBeenCalledOnce();
  });

  it('registers and removes audio listeners', () => {
    const fake = createFakeBridge();
    const adapter = new BridgeAdapter(fake.bridge);
    const listener = vi.fn();

    const unsubscribe = adapter.onAudioChanged(listener);
    expect(fake.listenerCount('audio_state_changed')).toBe(1);

    fake.emit('audio_state_changed', false);
    expect(listener).toHaveBeenCalledWith(false);

    unsubscribe();
    expect(fake.listenerCount('audio_state_changed')).toBe(0);
    fake.emit('audio_state_changed', true);
    expect(listener).toHaveBeenCalledOnce();
  });
});

describe('FallbackAdapter', () => {
  it('keeps storage, ads and events safe without the Bridge', async () => {
    const platform = createFallbackAdapter('en');

    await platform.storage.set(['bb.save'], ['value']);
    await expect(platform.storage.get(['bb.save'])).resolves.toEqual(['value']);
    await platform.storage.delete(['bb.save']);
    await expect(platform.storage.get(['bb.save'])).resolves.toEqual([null]);
    await expect(platform.ads.showInterstitial('results')).resolves.toBe('skipped');

    const listener = vi.fn();
    const unsubscribe = platform.onPauseChanged(listener);
    unsubscribe();
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('platform source constraints', () => {
  it('never references browser storage directly', () => {
    const root = fileURLToPath(new URL('..', import.meta.url));
    const files = [
      ...sourceFiles(path.join(root, 'src', 'platform')),
      ...sourceFiles(path.join(root, 'src', 'boot')),
    ];

    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const contents = readFileSync(file, 'utf8');
      expect(contents, path.relative(root, file)).not.toMatch(
        /localStorage|sessionStorage|indexedDB/,
      );
    }
  });

  it('ships a Bridge config valid for the installed 2.4.x schema', () => {
    const config = JSON.parse(
      readFileSync(new URL('../public/playgama-bridge-config.json', import.meta.url), 'utf8'),
    );

    expect(config.loadingScreenType).toBe('none');
    expect(config.showFullLoadingLogo).toBe(false);
    expect(config.sendAnalyticsEvents).toBe(false);
    expect(config.showLoadingText).toBe(true);
    expect(config.game.adaptToSafeArea).toBe(true);
    expect(config.advertisement.minimumDelayBetweenInterstitial).toBeGreaterThanOrEqual(0);
    expect(config.advertisement.initialInterstitialDelay).toBeGreaterThanOrEqual(0);
    expect(config.advertisement.interstitial.placementFallback).toEqual(expect.any(String));
    expect(config.platforms.mock.sendAnalyticsEvents).toBe(false);
    expect(config.platforms.mock.showFullLoadingLogo).toBe(false);
    expect(config.advertisement.banner).toBeUndefined();
  });
});
