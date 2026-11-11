import type {
  AdsService,
  InterstitialResult,
  PlatformDiagnostics,
  PlatformMessage,
  PlatformMessagePayload,
  PlatformService,
  RewardedResult,
  StorageService,
  Unsubscribe,
} from '../game/contracts';
import { withTimeout } from './async';
import { assertSameLength, MemoryStorage } from './MemoryStorage';

export const CRAZYGAMES_SDK_URL =
  'https://sdk.crazygames.com/crazygames-sdk-v3.js';

const AD_TIMEOUT_MS = 15_000;
const SDK_POLL_INTERVAL_MS = 50;
const DEFAULT_SDK_VERSION = '3.x';
const CRAZYGAMES_HOSTS = ['crazygames.com', '1001juegos.com'] as const;

export type CrazyGamesAdType = 'midgame' | 'rewarded';

export interface CrazyGamesAdCallbacks {
  adStarted?: () => void;
  adFinished?: () => void;
  adError?: (error?: unknown) => void;
}

export interface CrazyGamesAdLike {
  requestAd(type: CrazyGamesAdType, callbacks: CrazyGamesAdCallbacks): void;
}

/** CrazyGames data calls are Promise-based, but fakes may implement them synchronously. */
export interface CrazyGamesDataLike {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

export interface CrazyGamesSettingsLike {
  muteAudio?: boolean;
}

export interface CrazyGamesGameLike {
  settings?: CrazyGamesSettingsLike;
  gameplayStart?: () => void;
  gameplayStop?: () => void;
  addSettingsChangeListener?: (
    listener: (settings: CrazyGamesSettingsLike) => void,
  ) => void;
  removeSettingsChangeListener?: (
    listener: (settings: CrazyGamesSettingsLike) => void,
  ) => void;
}

/** Minimal surface of the CrazyGames v3 SDK used by Bricklike. */
export interface CrazyGamesSdkLike {
  readonly version?: string | null;
  readonly data: CrazyGamesDataLike;
  readonly ad: CrazyGamesAdLike;
  readonly game?: CrazyGamesGameLike;
}

/** SDK global as loaded by the official script. */
export interface CrazyGamesInitSdkLike extends CrazyGamesSdkLike {
  init(): void | Promise<void>;
}

export interface CrazyGamesAdapterOptions {
  initDurationMs?: number;
}

const NOOP_UNSUBSCRIBE: Unsubscribe = () => {
  // No platform events are available without the SDK.
};

/**
 * Matches only the apex CrazyGames domains and their real subdomains, so
 * lookalikes such as `crazygames.com.evil.com` are rejected.
 */
export function isCrazyGamesHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, '');
  if (host.length === 0) return false;

  return CRAZYGAMES_HOSTS.some(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  );
}

function browserLanguage(): string {
  if (typeof navigator === 'undefined') return 'en';
  return navigator.language || 'en';
}

function documentIsHidden(): boolean {
  if (typeof document === 'undefined') return false;
  if (typeof document.hidden === 'boolean') return document.hidden;
  return document.visibilityState === 'hidden';
}

function normalizeStoredValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Direct CrazyGames SDK v3 adapter. The SDK must already be initialized; boot
 * code is responsible for loading it through `createCrazyGamesService`.
 */
export class CrazyGamesAdapter implements PlatformService {
  readonly id = 'crazy_games';
  readonly language: string;
  readonly storage: StorageService;
  readonly ads: AdsService;

  private readonly sdk: CrazyGamesSdkLike;
  private readonly memory = new MemoryStorage();
  private readonly initDurationMs: number | null;
  private settings: CrazyGamesSettingsLike | null;
  private storageIsMemory = false;
  private warnedAboutStorage = false;

  constructor(sdk: CrazyGamesSdkLike, options: CrazyGamesAdapterOptions = {}) {
    this.sdk = sdk;
    this.language = browserLanguage();
    this.initDurationMs = options.initDurationMs ?? null;
    this.settings = sdk.game?.settings ?? null;

    this.storage = {
      get: (keys) => this.getFromStorage(keys),
      set: (keys, values) => this.setInStorage(keys, values),
      delete: (keys) => this.deleteFromStorage(keys),
    };

    this.ads = {
      isInterstitialSupported: true,
      isRewardedSupported: true,
      showInterstitial: (placement) => this.showInterstitial(placement),
      showRewarded: (placement) => this.showRewarded(placement),
    };
  }

  get isAudioEnabled(): boolean {
    const settings = this.settings ?? this.sdk.game?.settings;
    return !settings?.muteAudio;
  }

  get isPaused(): boolean {
    return documentIsHidden();
  }

  get diagnostics(): PlatformDiagnostics {
    return {
      source: 'crazygames',
      storageKind: this.storageIsMemory ? 'memory' : 'bridge',
      bridgeVersion: this.sdk.version ?? DEFAULT_SDK_VERSION,
      initDurationMs: this.initDurationMs,
    };
  }

  async sendMessage(
    message: PlatformMessage,
    _payload?: PlatformMessagePayload,
  ): Promise<void> {
    const game = this.sdk.game;

    try {
      if (message === 'level_started' || message === 'level_resumed') {
        await Promise.resolve(game?.gameplayStart?.());
      } else if (
        message === 'level_paused' ||
        message === 'level_completed' ||
        message === 'level_failed'
      ) {
        await Promise.resolve(game?.gameplayStop?.());
      }
      // `game_ready` (and any future message) has no CrazyGames equivalent.
    } catch {
      // Gameplay notifications must never break the game.
    }
  }

  onPauseChanged(listener: (paused: boolean) => void): Unsubscribe {
    if (
      typeof document === 'undefined' ||
      typeof document.addEventListener !== 'function'
    ) {
      return NOOP_UNSUBSCRIBE;
    }

    const handler = (): void => {
      listener(documentIsHidden());
    };

    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }

  onAudioChanged(listener: (enabled: boolean) => void): Unsubscribe {
    const game = this.sdk.game;
    if (!game || typeof game.addSettingsChangeListener !== 'function') {
      return NOOP_UNSUBSCRIBE;
    }

    const handler = (settings: CrazyGamesSettingsLike): void => {
      this.settings = settings;
      listener(!settings.muteAudio);
    };

    try {
      game.addSettingsChangeListener(handler);
    } catch {
      return NOOP_UNSUBSCRIBE;
    }

    let removed = false;
    return () => {
      if (removed) return;
      removed = true;

      try {
        game.removeSettingsChangeListener?.(handler);
      } catch {
        // Older SDK builds may not support removal; the handler is inert.
      }
    };
  }

  private async getFromStorage(
    keys: readonly string[],
  ): Promise<(string | null)[]> {
    if (keys.length === 0) return [];
    if (this.storageIsMemory) return this.memory.get(keys);

    try {
      return await Promise.all(
        keys.map(async (key) =>
          normalizeStoredValue(await this.sdk.data.getItem(key)),
        ),
      );
    } catch (error) {
      this.degradeStorage('read', error);
      return this.memory.get(keys);
    }
  }

  private async setInStorage(
    keys: readonly string[],
    values: readonly string[],
  ): Promise<void> {
    assertSameLength(keys, values);
    if (keys.length === 0) return;
    if (this.storageIsMemory) {
      await this.memory.set(keys, values);
      return;
    }

    try {
      for (let index = 0; index < keys.length; index += 1) {
        const key = keys[index];
        const value = values[index];
        if (key === undefined || value === undefined) {
          throw new Error('Storage keys and values must be defined');
        }
        await this.sdk.data.setItem(key, value);
      }
    } catch (error) {
      this.degradeStorage('write', error);
      await this.memory.set(keys, values);
    }
  }

  private async deleteFromStorage(keys: readonly string[]): Promise<void> {
    if (keys.length === 0) return;
    if (this.storageIsMemory) {
      await this.memory.delete(keys);
      return;
    }

    try {
      for (const key of keys) {
        await this.sdk.data.removeItem(key);
      }
    } catch (error) {
      this.degradeStorage('delete', error);
      await this.memory.delete(keys);
    }
  }

  private degradeStorage(action: string, error: unknown): void {
    this.storageIsMemory = true;
    if (this.warnedAboutStorage) return;
    this.warnedAboutStorage = true;
    console.warn(
      `[platform] CrazyGames storage ${action} failed; using in-memory storage for this session.`,
      error,
    );
  }

  private showInterstitial(_placement: string): Promise<InterstitialResult> {
    return this.requestAd('midgame', 'shown');
  }

  private showRewarded(_placement: string): Promise<RewardedResult> {
    return this.requestAd('rewarded', 'rewarded');
  }

  /**
   * CrazyGames exposes ad results only through callbacks. The reward is granted
   * solely on `adFinished`; errors and the 15 s watchdog resolve as failures.
   */
  private requestAd<TResult extends 'shown' | 'rewarded'>(
    type: CrazyGamesAdType,
    success: TResult,
  ): Promise<TResult | 'failed'> {
    return new Promise<TResult | 'failed'>((resolve) => {
      let settled = false;
      let timer: ReturnType<typeof setTimeout> | undefined;

      const finish = (result: TResult | 'failed'): void => {
        if (settled) return;
        settled = true;
        if (timer !== undefined) clearTimeout(timer);
        resolve(result);
      };

      timer = setTimeout(() => finish('failed'), AD_TIMEOUT_MS);

      try {
        this.sdk.ad.requestAd(type, {
          adFinished: () => finish(success),
          adError: () => finish('failed'),
        });
      } catch {
        finish('failed');
      }
    });
  }
}

interface CrazyGamesWindowLike {
  CrazyGames?: {
    SDK?: CrazyGamesInitSdkLike;
  };
}

function getGlobalSdk(): CrazyGamesInitSdkLike | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as CrazyGamesWindowLike).CrazyGames?.SDK;
}

/** Injects the official script at most once, reusing an existing tag. */
function injectSdkScript(): HTMLScriptElement | null {
  if (typeof document === 'undefined') return null;

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${CRAZYGAMES_SDK_URL}"]`,
  );
  if (existing) return existing;

  const script = document.createElement('script');
  script.src = CRAZYGAMES_SDK_URL;
  script.async = true;

  const parent = document.head || document.body || document.documentElement;
  if (!parent) return null;
  parent.appendChild(script);
  return script;
}

/** Resolves with the SDK global, or null on script error/timeout. */
function waitForSdk(
  timeoutMs: number,
): Promise<CrazyGamesInitSdkLike | null> {
  const ready = getGlobalSdk();
  if (ready) return Promise.resolve(ready);

  const script = injectSdkScript();
  if (!script) return Promise.resolve(null);

  return new Promise<CrazyGamesInitSdkLike | null>((resolve) => {
    let settled = false;
    let poll: ReturnType<typeof setInterval> | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const finish = (sdk: CrazyGamesInitSdkLike | null): void => {
      if (settled) return;
      settled = true;
      if (poll !== undefined) clearInterval(poll);
      if (timeout !== undefined) clearTimeout(timeout);
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
      resolve(sdk);
    };

    const check = (): void => {
      const sdk = getGlobalSdk();
      if (sdk) finish(sdk);
    };

    const onLoad = (): void => check();
    const onError = (): void => finish(null);

    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });
    poll = setInterval(check, SDK_POLL_INTERVAL_MS);
    timeout = setTimeout(() => finish(null), timeoutMs);
    check();
  });
}

/**
 * Loads and initializes the CrazyGames SDK v3. Returns null on any failure so
 * the boot path can fall back to the local adapter instead of hanging.
 */
export async function createCrazyGamesService(
  timeoutMs: number = 10_000,
): Promise<PlatformService | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  const startedAt = performance.now();

  let sdk: CrazyGamesInitSdkLike | null;
  try {
    sdk = await withTimeout(waitForSdk(timeoutMs), timeoutMs, 'crazygames.sdk');
  } catch {
    return null;
  }

  if (!sdk) return null;

  try {
    await withTimeout(Promise.resolve(sdk.init()), timeoutMs, 'crazygames.init');
  } catch {
    return null;
  }

  try {
    return new CrazyGamesAdapter(sdk, {
      initDurationMs: Math.round(performance.now() - startedAt),
    });
  } catch {
    return null;
  }
}
