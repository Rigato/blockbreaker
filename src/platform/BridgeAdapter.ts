import type { PlaygamaBridge } from '@playgama/bridge';
import type {
  AdsService,
  InterstitialResult,
  PlatformDiagnostics,
  PlatformService,
  PlatformMessage,
  PlatformMessagePayload,
  RewardedResult,
  StorageKind,
  StorageService,
  Unsubscribe,
} from '../game/contracts';
import { GAME_CONFIG } from '../game/config';
import { withTimeout } from './async';
import { assertSameLength, MemoryStorage } from './MemoryStorage';
import { getBridge } from './bridgeGlobal';

const STORAGE_EVENT_GET = 'bridge.storage.get';
const STORAGE_EVENT_SET = 'bridge.storage.set';
const STORAGE_EVENT_DELETE = 'bridge.storage.delete';
const INTERSTITIAL_TIMEOUT_MS = 15_000;
const REWARDED_TIMEOUT_MS = 15_000;

export interface BridgeAdapterOptions {
  initDurationMs?: number;
  storageTimeoutMs?: number;
}

function normalizeStoredValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export class BridgeAdapter implements PlatformService {
  readonly storage: StorageService;
  readonly ads: AdsService;

  private readonly bridge: PlaygamaBridge;
  private readonly memory = new MemoryStorage();
  private readonly storageTimeoutMs: number;
  private readonly initDurationMs: number | null;
  private storageIsMemory = false;
  private warnedAboutStorage = false;

  constructor(bridge: PlaygamaBridge, options: BridgeAdapterOptions = {}) {
    this.bridge = bridge;
    this.storageTimeoutMs = options.storageTimeoutMs ?? GAME_CONFIG.boot.storageTimeoutMs;
    this.initDurationMs = options.initDurationMs ?? null;

    this.storage = {
      get: (keys) => this.getFromStorage(keys),
      set: (keys, values) => this.setInStorage(keys, values),
      delete: (keys) => this.deleteFromStorage(keys),
    };

    const sdk = this.bridge;
    this.ads = {
      // Read live so a platform that enables/disables ads after boot is
      // reflected without rebuilding the adapter.
      get isInterstitialSupported(): boolean {
        return sdk.advertisement.isInterstitialSupported;
      },
      get isRewardedSupported(): boolean {
        return sdk.advertisement.isRewardedSupported;
      },
      showInterstitial: (placement) => this.showInterstitial(placement),
      showRewarded: (placement) => this.showRewarded(placement),
    };
  }

  get id(): string {
    return this.bridge.platform.id;
  }

  get language(): string {
    return this.bridge.platform.language || 'en';
  }

  get isAudioEnabled(): boolean {
    return this.bridge.platform.isAudioEnabled;
  }

  get isPaused(): boolean {
    return this.bridge.platform.isPaused;
  }

  get diagnostics(): PlatformDiagnostics {
    const storageKind: StorageKind = this.storageIsMemory ? 'memory' : 'bridge';
    return {
      source: 'bridge',
      storageKind,
      bridgeVersion: this.bridge.version,
      initDurationMs: this.initDurationMs,
    };
  }

  async sendMessage(
    message: PlatformMessage,
    payload?: PlatformMessagePayload,
  ): Promise<void> {
    await this.bridge.platform.sendMessage(message, payload ?? {});
  }

  onPauseChanged(listener: (paused: boolean) => void): Unsubscribe {
    const handler = (...args: unknown[]): void => {
      listener(Boolean(args[0]));
    };
    this.bridge.on('pause_state_changed', handler);
    return () => this.bridge.off('pause_state_changed', handler);
  }

  onAudioChanged(listener: (enabled: boolean) => void): Unsubscribe {
    const handler = (...args: unknown[]): void => {
      listener(Boolean(args[0]));
    };
    this.bridge.on('audio_state_changed', handler);
    return () => this.bridge.off('audio_state_changed', handler);
  }

  private async getFromStorage(keys: readonly string[]): Promise<(string | null)[]> {
    if (keys.length === 0) return [];
    if (this.storageIsMemory) return this.memory.get(keys);

    try {
      const raw = await withTimeout(
        Promise.resolve(this.bridge.storage.get([...keys], false)),
        this.storageTimeoutMs,
        STORAGE_EVENT_GET,
      );

      let values: unknown[];
      if (Array.isArray(raw)) {
        values = raw;
      } else if (isRecord(raw)) {
        values = keys.map((key) => raw[key]);
      } else {
        values = [raw];
      }

      return keys.map((_, index) => normalizeStoredValue(values[index]));
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
      await withTimeout(
        Promise.resolve(this.bridge.storage.set([...keys], [...values])),
        this.storageTimeoutMs,
        STORAGE_EVENT_SET,
      );
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
      await withTimeout(
        Promise.resolve(this.bridge.storage.delete([...keys])),
        this.storageTimeoutMs,
        STORAGE_EVENT_DELETE,
      );
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
      `[platform] Bridge storage ${action} failed; using in-memory storage for this session.`,
      error,
    );
  }

  private showInterstitial(placement: string): Promise<InterstitialResult> {
    if (!this.bridge.advertisement.isInterstitialSupported) {
      return Promise.resolve('skipped');
    }

    return new Promise<InterstitialResult>((resolve) => {
      let settled = false;
      let timer: ReturnType<typeof setTimeout> | undefined;

      const onState = (state: unknown): void => {
        if (state === 'closed') finish('shown');
        else if (state === 'failed') finish('failed');
      };

      const finish = (result: InterstitialResult): void => {
        if (settled) return;
        settled = true;
        if (timer !== undefined) clearTimeout(timer);
        try {
          this.bridge.off('interstitial_state_changed', onState);
        } catch {
          // The SDK may already be gone; the promise must still settle.
        }
        resolve(result);
      };

      try {
        this.bridge.on('interstitial_state_changed', onState);
      } catch {
        resolve('failed');
        return;
      }

      timer = setTimeout(() => finish('failed'), INTERSTITIAL_TIMEOUT_MS);

      try {
        this.bridge.advertisement.showInterstitial(placement);
      } catch {
        finish('failed');
      }
    });
  }

  private showRewarded(placement: string): Promise<RewardedResult> {
    if (!this.bridge.advertisement.isRewardedSupported) {
      return Promise.resolve('skipped');
    }

    return new Promise<RewardedResult>((resolve) => {
      let settled = false;
      let rewarded = false;
      let timer: ReturnType<typeof setTimeout> | undefined;

      const onState = (state: unknown): void => {
        if (state === 'rewarded') {
          rewarded = true;
          finish('rewarded');
        } else if (state === 'closed') {
          finish(rewarded ? 'rewarded' : 'closed');
        } else if (state === 'failed') {
          finish('failed');
        }
      };

      const finish = (result: RewardedResult): void => {
        if (settled) return;
        settled = true;
        if (timer !== undefined) clearTimeout(timer);
        try {
          this.bridge.off('rewarded_state_changed', onState);
        } catch {
          // The SDK may already be gone; the promise must still settle.
        }
        resolve(result);
      };

      try {
        this.bridge.on('rewarded_state_changed', onState);
      } catch {
        resolve('failed');
        return;
      }

      timer = setTimeout(() => finish('failed'), REWARDED_TIMEOUT_MS);

      try {
        this.bridge.advertisement.showRewarded(placement);
      } catch {
        finish('failed');
      }
    });
  }
}

/**
 * Initializes the Bridge with a hard timeout. Returns `null` when the SDK is
 * missing, blocked or does not become ready, so the caller can use the
 * FallbackAdapter instead of hanging the boot.
 */
export async function createBridgeService(
  timeoutMs: number = GAME_CONFIG.boot.bridgeInitTimeoutMs,
): Promise<PlatformService | null> {
  const bridge = getBridge();
  if (!bridge) return null;

  const startedAt = performance.now();

  try {
    const initialize = Promise.resolve(bridge.initialize());
    await withTimeout(initialize, timeoutMs, 'bridge.initialize');
  } catch {
    return null;
  }

  if (!bridge.isInitialized) return null;

  try {
    return new BridgeAdapter(bridge, {
      initDurationMs: Math.round(performance.now() - startedAt),
    });
  } catch {
    return null;
  }
}
