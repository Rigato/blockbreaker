import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CRAZYGAMES_SDK_URL,
  CrazyGamesAdapter,
  isCrazyGamesHost,
} from '../src/platform/CrazyGamesAdapter';
import type {
  CrazyGamesAdCallbacks,
  CrazyGamesAdLike,
  CrazyGamesDataLike,
  CrazyGamesSettingsLike,
  CrazyGamesSdkLike,
} from '../src/platform/CrazyGamesAdapter';

type SettingsListener = (settings: CrazyGamesSettingsLike) => void;

interface FakeSdkOptions {
  version?: string;
  omitVersion?: boolean;
  stored?: Record<string, string>;
  getItem?: CrazyGamesDataLike['getItem'];
  setItem?: CrazyGamesDataLike['setItem'];
  removeItem?: CrazyGamesDataLike['removeItem'];
  requestAd?: CrazyGamesAdLike['requestAd'];
  includeGame?: boolean;
  muteAudio?: boolean;
}

function createFakeSdk(options: FakeSdkOptions = {}) {
  const values = new Map(Object.entries(options.stored ?? {}));
  const audioListeners = new Set<SettingsListener>();

  const getItemImpl: CrazyGamesDataLike['getItem'] =
    options.getItem ??
    (async (key: string): Promise<string | null> => values.get(key) ?? null);
  const setItemImpl: CrazyGamesDataLike['setItem'] =
    options.setItem ??
    (async (key: string, value: string): Promise<void> => {
      values.set(key, value);
    });
  const removeItemImpl: CrazyGamesDataLike['removeItem'] =
    options.removeItem ??
    (async (key: string): Promise<void> => {
      values.delete(key);
    });
  const requestAdImpl: CrazyGamesAdLike['requestAd'] =
    options.requestAd ?? (() => undefined);

  const getItem = vi.fn(getItemImpl);
  const setItem = vi.fn(setItemImpl);
  const removeItem = vi.fn(removeItemImpl);
  const requestAd = vi.fn(requestAdImpl);

  const game = {
    settings: { muteAudio: options.muteAudio ?? false },
    gameplayStart: vi.fn(),
    gameplayStop: vi.fn(),
    addSettingsChangeListener: vi.fn((listener: SettingsListener) => {
      audioListeners.add(listener);
    }),
    removeSettingsChangeListener: vi.fn((listener: SettingsListener) => {
      audioListeners.delete(listener);
    }),
  };

  const sdk: CrazyGamesSdkLike = {
    version: options.omitVersion
      ? null
      : (options.version ?? '3.14.0'),
    data: { getItem, setItem, removeItem },
    ad: { requestAd },
    game: options.includeGame === false ? undefined : game,
  };

  return {
    sdk,
    getItem,
    setItem,
    removeItem,
    requestAd,
    game,
    values,
    emitSettings(settings: CrazyGamesSettingsLike): void {
      for (const listener of [...audioListeners]) listener(settings);
    },
    audioListenerCount(): number {
      return audioListeners.size;
    },
  };
}

type FakeSdk = ReturnType<typeof createFakeSdk>;

function lastAdCallbacks(fake: FakeSdk): CrazyGamesAdCallbacks {
  const call = fake.requestAd.mock.calls.at(-1);
  if (!call) throw new Error('requestAd was not called');
  return call[1];
}

class FakeDocument extends EventTarget {
  hidden = false;
  visibilityState: DocumentVisibilityState = 'visible';

  setHidden(hidden: boolean): void {
    this.hidden = hidden;
    this.visibilityState = hidden ? 'hidden' : 'visible';
    this.dispatchEvent(new Event('visibilitychange'));
  }
}

const originalDocument: unknown = (
  globalThis as { document?: unknown }
).document;

function installDocument(): FakeDocument {
  const doc = new FakeDocument();
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    writable: true,
    value: doc,
  });
  return doc;
}

afterEach(() => {
  vi.useRealTimers();

  if (originalDocument === undefined) {
    Reflect.deleteProperty(globalThis, 'document');
  } else {
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      writable: true,
      value: originalDocument,
    });
  }
});

describe('isCrazyGamesHost', () => {
  it.each([
    'crazygames.com',
    'www.crazygames.com',
    'games.crazygames.com',
    'CRAZYGAMES.COM',
    'crazygames.com.',
    '1001juegos.com',
    'www.1001juegos.com',
  ])('accepts %s', (hostname) => {
    expect(isCrazyGamesHost(hostname)).toBe(true);
  });

  it.each([
    'crazygames.com.evil.com',
    'evilcrazygames.com',
    'crazygames.co',
    'crazygames.com.br',
    '1001juegos.com.evil.com',
    'not1001juegos.com',
    'localhost',
    '',
    '   ',
  ])('rejects %s', (hostname) => {
    expect(isCrazyGamesHost(hostname)).toBe(false);
  });
});

describe('CrazyGamesAdapter identity', () => {
  it('exposes the CrazyGames identity, diagnostics and ad support', () => {
    const fake = createFakeSdk({ version: '3.2.0' });
    const adapter = new CrazyGamesAdapter(fake.sdk, { initDurationMs: 42 });
    const expectedLanguage =
      typeof navigator === 'undefined' ? 'en' : navigator.language || 'en';

    expect(adapter.id).toBe('crazy_games');
    expect(adapter.language).toBe(expectedLanguage);
    expect(adapter.diagnostics).toEqual({
      source: 'crazygames',
      storageKind: 'bridge',
      bridgeVersion: '3.2.0',
      initDurationMs: 42,
    });
    expect(adapter.ads.isInterstitialSupported).toBe(true);
    expect(adapter.ads.isRewardedSupported).toBe(true);
  });

  it('falls back to the 3.x version label and a null init duration', () => {
    const adapter = new CrazyGamesAdapter(
      createFakeSdk({ omitVersion: true }).sdk,
    );

    expect(adapter.diagnostics.bridgeVersion).toBe('3.x');
    expect(adapter.diagnostics.initDurationMs).toBeNull();
  });

  it('targets the official v3 SDK script', () => {
    expect(CRAZYGAMES_SDK_URL).toBe(
      'https://sdk.crazygames.com/crazygames-sdk-v3.js',
    );
  });
});

describe('CrazyGamesAdapter storage', () => {
  it('reads, writes and removes keys through SDK data storage', async () => {
    const fake = createFakeSdk({ stored: { 'bb.save': 'save-1' } });
    const adapter = new CrazyGamesAdapter(fake.sdk);

    await expect(
      adapter.storage.get(['bb.save', 'bb.settings']),
    ).resolves.toEqual(['save-1', null]);
    expect(fake.getItem).toHaveBeenNthCalledWith(1, 'bb.save');
    expect(fake.getItem).toHaveBeenNthCalledWith(2, 'bb.settings');

    await adapter.storage.set(
      ['bb.save', 'bb.settings'],
      ['save-2', 'settings-1'],
    );
    expect(fake.setItem).toHaveBeenNthCalledWith(1, 'bb.save', 'save-2');
    expect(fake.setItem).toHaveBeenNthCalledWith(
      2,
      'bb.settings',
      'settings-1',
    );
    expect(fake.values.get('bb.save')).toBe('save-2');

    await adapter.storage.delete(['bb.save']);
    expect(fake.removeItem).toHaveBeenCalledWith('bb.save');
    await expect(
      adapter.storage.get(['bb.save', 'bb.settings']),
    ).resolves.toEqual([null, 'settings-1']);
    expect(adapter.diagnostics.storageKind).toBe('bridge');
  });

  it('short-circuits empty batches and rejects mismatched arrays', async () => {
    const fake = createFakeSdk();
    const adapter = new CrazyGamesAdapter(fake.sdk);

    await expect(adapter.storage.get([])).resolves.toEqual([]);
    await adapter.storage.set([], []);
    await adapter.storage.delete([]);
    expect(fake.getItem).not.toHaveBeenCalled();
    expect(fake.setItem).not.toHaveBeenCalled();
    expect(fake.removeItem).not.toHaveBeenCalled();

    await expect(adapter.storage.set(['a'], ['1', '2'])).rejects.toThrow(
      /same length/,
    );
    expect(fake.setItem).not.toHaveBeenCalled();
  });

  it('degrades to memory when getItem throws and keeps the session writable', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fake = createFakeSdk({
      getItem: () => {
        throw new Error('storage blocked');
      },
    });
    const adapter = new CrazyGamesAdapter(fake.sdk);

    await expect(
      adapter.storage.get(['bb.save', 'bb.settings']),
    ).resolves.toEqual([null, null]);
    expect(adapter.diagnostics.storageKind).toBe('memory');

    await adapter.storage.set(['bb.save'], ['memory-value']);
    expect(fake.setItem).not.toHaveBeenCalled();
    await expect(adapter.storage.get(['bb.save'])).resolves.toEqual([
      'memory-value',
    ]);
    expect(fake.getItem).toHaveBeenCalledTimes(2);

    warn.mockRestore();
  });

  it('degrades a failed write to memory', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fake = createFakeSdk({
      setItem: async () => {
        throw new Error('quota exceeded');
      },
    });
    const adapter = new CrazyGamesAdapter(fake.sdk);

    await adapter.storage.set(['bb.save'], ['memory-value']);
    expect(adapter.diagnostics.storageKind).toBe('memory');
    expect(fake.setItem).toHaveBeenCalledOnce();
    await expect(adapter.storage.get(['bb.save'])).resolves.toEqual([
      'memory-value',
    ]);
    expect(fake.getItem).not.toHaveBeenCalled();

    warn.mockRestore();
  });

  it('degrades a failed delete to memory', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fake = createFakeSdk({
      removeItem: async () => {
        throw new Error('storage unavailable');
      },
    });
    const adapter = new CrazyGamesAdapter(fake.sdk);

    await expect(adapter.storage.delete(['bb.save'])).resolves.toBeUndefined();
    expect(adapter.diagnostics.storageKind).toBe('memory');
    expect(fake.removeItem).toHaveBeenCalledWith('bb.save');

    warn.mockRestore();
  });
});

describe('CrazyGamesAdapter interstitial ads', () => {
  it('requests a midgame ad and maps adFinished/adError', async () => {
    const fake = createFakeSdk();
    const adapter = new CrazyGamesAdapter(fake.sdk);

    const shown = adapter.ads.showInterstitial('results');
    expect(fake.requestAd).toHaveBeenLastCalledWith(
      'midgame',
      expect.objectContaining({
        adFinished: expect.any(Function),
        adError: expect.any(Function),
      }),
    );
    const shownCallbacks = lastAdCallbacks(fake);
    shownCallbacks.adFinished?.();
    shownCallbacks.adError?.(new Error('late error'));
    await expect(shown).resolves.toBe('shown');

    const failed = adapter.ads.showInterstitial('results');
    lastAdCallbacks(fake).adError?.(new Error('no fill'));
    await expect(failed).resolves.toBe('failed');
  });

  it('fails when requestAd throws', async () => {
    const fake = createFakeSdk({
      requestAd: () => {
        throw new Error('adblock');
      },
    });
    const adapter = new CrazyGamesAdapter(fake.sdk);

    await expect(adapter.ads.showInterstitial('results')).resolves.toBe(
      'failed',
    );
  });
});

describe('CrazyGamesAdapter rewarded ads', () => {
  it('rewards only after adFinished and maps adError to failed', async () => {
    const fake = createFakeSdk();
    const adapter = new CrazyGamesAdapter(fake.sdk);

    const rewarded = adapter.ads.showRewarded('revive');
    expect(fake.requestAd).toHaveBeenLastCalledWith(
      'rewarded',
      expect.objectContaining({
        adFinished: expect.any(Function),
        adError: expect.any(Function),
      }),
    );

    let settled = false;
    void rewarded.then(() => {
      settled = true;
    });
    const rewardedCallbacks = lastAdCallbacks(fake);
    rewardedCallbacks.adStarted?.();
    await Promise.resolve();
    expect(settled).toBe(false);

    rewardedCallbacks.adFinished?.();
    await expect(rewarded).resolves.toBe('rewarded');

    const failed = adapter.ads.showRewarded('revive');
    lastAdCallbacks(fake).adError?.(new Error('no fill'));
    await expect(failed).resolves.toBe('failed');
  });

  it('fails when requestAd throws', async () => {
    const fake = createFakeSdk({
      requestAd: () => {
        throw new Error('adblock');
      },
    });
    const adapter = new CrazyGamesAdapter(fake.sdk);

    await expect(adapter.ads.showRewarded('revive')).resolves.toBe('failed');
  });
});

describe('CrazyGamesAdapter ad watchdog', () => {
  it('fails interstitial and rewarded requests after 15 s', async () => {
    vi.useFakeTimers();
    const adapter = new CrazyGamesAdapter(createFakeSdk().sdk);

    const interstitial = adapter.ads.showInterstitial('results');
    const rewarded = adapter.ads.showRewarded('revive');
    expect(vi.getTimerCount()).toBe(2);

    await vi.advanceTimersByTimeAsync(15_000);

    await expect(interstitial).resolves.toBe('failed');
    await expect(rewarded).resolves.toBe('failed');
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('CrazyGamesAdapter platform messages', () => {
  it('maps gameplay messages to gameplayStart/gameplayStop', async () => {
    const fake = createFakeSdk();
    const adapter = new CrazyGamesAdapter(fake.sdk);

    await adapter.sendMessage('game_ready');
    expect(fake.game.gameplayStart).not.toHaveBeenCalled();
    expect(fake.game.gameplayStop).not.toHaveBeenCalled();

    await adapter.sendMessage('level_started');
    await adapter.sendMessage('level_resumed');
    expect(fake.game.gameplayStart).toHaveBeenCalledTimes(2);
    expect(fake.game.gameplayStop).not.toHaveBeenCalled();

    await adapter.sendMessage('level_paused');
    await adapter.sendMessage('level_completed');
    await adapter.sendMessage('level_failed');
    expect(fake.game.gameplayStop).toHaveBeenCalledTimes(3);
    expect(fake.game.gameplayStart).toHaveBeenCalledTimes(2);
  });

  it('never rejects when SDK gameplay calls throw', async () => {
    const fake = createFakeSdk();
    const adapter = new CrazyGamesAdapter(fake.sdk);
    fake.game.gameplayStart.mockImplementation(() => {
      throw new Error('offline');
    });
    fake.game.gameplayStop.mockImplementation(() => {
      throw new Error('offline');
    });

    await expect(
      adapter.sendMessage('level_started'),
    ).resolves.toBeUndefined();
    await expect(
      adapter.sendMessage('level_paused'),
    ).resolves.toBeUndefined();
  });

  it('accepts messages without a game API', async () => {
    const adapter = new CrazyGamesAdapter(
      createFakeSdk({ includeGame: false }).sdk,
    );

    await expect(
      adapter.sendMessage('level_started'),
    ).resolves.toBeUndefined();
    await expect(
      adapter.sendMessage('level_failed'),
    ).resolves.toBeUndefined();
  });
});

describe('CrazyGamesAdapter pause state', () => {
  it('tracks document visibility and unsubscribes', () => {
    const doc = installDocument();
    const adapter = new CrazyGamesAdapter(createFakeSdk().sdk);

    expect(adapter.isPaused).toBe(false);

    const listener = vi.fn();
    const unsubscribe = adapter.onPauseChanged(listener);

    doc.setHidden(true);
    expect(listener).toHaveBeenLastCalledWith(true);
    expect(adapter.isPaused).toBe(true);

    doc.setHidden(false);
    expect(listener).toHaveBeenLastCalledWith(false);
    expect(adapter.isPaused).toBe(false);

    unsubscribe();
    doc.setHidden(true);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('returns a safe no-op subscription without a document', () => {
    const adapter = new CrazyGamesAdapter(createFakeSdk().sdk);
    const listener = vi.fn();

    const unsubscribe = adapter.onPauseChanged(listener);
    expect(() => unsubscribe()).not.toThrow();
    expect(listener).not.toHaveBeenCalled();
    expect(adapter.isPaused).toBe(false);
  });
});

describe('CrazyGamesAdapter audio state', () => {
  it('reads initial settings and notifies on changes', () => {
    const fake = createFakeSdk({ muteAudio: false });
    const adapter = new CrazyGamesAdapter(fake.sdk);
    const listener = vi.fn();

    expect(adapter.isAudioEnabled).toBe(true);

    const unsubscribe = adapter.onAudioChanged(listener);
    fake.emitSettings({ muteAudio: true });
    expect(listener).toHaveBeenLastCalledWith(false);
    expect(adapter.isAudioEnabled).toBe(false);

    fake.emitSettings({ muteAudio: false });
    expect(listener).toHaveBeenLastCalledWith(true);
    expect(adapter.isAudioEnabled).toBe(true);

    unsubscribe();
    expect(fake.game.removeSettingsChangeListener).toHaveBeenCalledOnce();
    expect(fake.audioListenerCount()).toBe(0);
  });

  it('starts disabled when the SDK reports muted audio', () => {
    const adapter = new CrazyGamesAdapter(
      createFakeSdk({ muteAudio: true }).sdk,
    );

    expect(adapter.isAudioEnabled).toBe(false);
  });

  it('is safe without a game API or settings listeners', () => {
    const adapter = new CrazyGamesAdapter(
      createFakeSdk({ includeGame: false }).sdk,
    );
    const listener = vi.fn();

    expect(adapter.isAudioEnabled).toBe(true);
    const unsubscribe = adapter.onAudioChanged(listener);
    expect(() => unsubscribe()).not.toThrow();
    expect(listener).not.toHaveBeenCalled();
  });

  it('swallows listener registration and removal failures', () => {
    const registrationFailure = createFakeSdk();
    registrationFailure.game.addSettingsChangeListener.mockImplementation(
      () => {
        throw new Error('settings unavailable');
      },
    );
    const registrationAdapter = new CrazyGamesAdapter(
      registrationFailure.sdk,
    );
    const listener = vi.fn();
    const registrationUnsubscribe =
      registrationAdapter.onAudioChanged(listener);

    expect(() => registrationUnsubscribe()).not.toThrow();
    expect(listener).not.toHaveBeenCalled();

    const removalFailure = createFakeSdk();
    const removalAdapter = new CrazyGamesAdapter(removalFailure.sdk);
    const removalUnsubscribe = removalAdapter.onAudioChanged(vi.fn());
    removalFailure.game.removeSettingsChangeListener.mockImplementation(
      () => {
        throw new Error('listener already gone');
      },
    );

    expect(() => removalUnsubscribe()).not.toThrow();
  });
});
