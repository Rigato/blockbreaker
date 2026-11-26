import type {
  AdsService,
  InterstitialResult,
  PlatformDiagnostics,
  PlatformMessage,
  PlatformMessagePayload,
  PlatformService,
  RewardedResult,
  Unsubscribe,
} from '../game/contracts';
import { BrowserStorage } from '../storage/BrowserStorage';

const SKIPPED_ADS: AdsService = {
  isInterstitialSupported: false,
  isRewardedSupported: false,
  async showInterstitial(): Promise<InterstitialResult> {
    return 'skipped';
  },
  async showRewarded(): Promise<RewardedResult> {
    return 'skipped';
  },
};

const NOOP_UNSUBSCRIBE: Unsubscribe = () => {
  // No platform SDK is available in the clean build.
};

function browserLanguage(): string {
  if (typeof navigator === 'undefined') return 'en';
  return navigator.language || 'en';
}

function documentIsHidden(): boolean {
  if (typeof document === 'undefined') return false;
  if (typeof document.hidden === 'boolean') return document.hidden;
  return document.visibilityState === 'hidden';
}

/**
 * Platform used by the clean ZIP: no Playgama Bridge, no CrazyGames SDK and no
 * ads. Save/settings use browser storage; visibility and focus events provide
 * the pause signal that the SDK would otherwise deliver.
 *
 * The public contract (`PlatformService`) is unchanged. The clean build reports
 * `source: 'fallback'` and `storageKind: 'bridge'`/`'memory'` for compatibility;
 * the menu/debug UI uses `BootResult.storagePersistent` and `storageLabel` for
 * the honest storage status.
 */
export class CleanAdapter implements PlatformService {
  readonly id = 'clean';
  readonly language: string;
  readonly isAudioEnabled = true;
  readonly storage: BrowserStorage;
  readonly ads: AdsService = SKIPPED_ADS;

  constructor(storage: BrowserStorage = new BrowserStorage()) {
    this.language = browserLanguage();
    this.storage = storage;
  }

  get isPaused(): boolean {
    return documentIsHidden();
  }

  get diagnostics(): PlatformDiagnostics {
    return {
      source: 'fallback',
      storageKind: this.storage.isPersistent ? 'bridge' : 'memory',
      bridgeVersion: null,
      initDurationMs: null,
    };
  }

  get storagePersistent(): boolean {
    return this.storage.isPersistent;
  }

  get storageLabel(): string {
    return this.storage.label;
  }

  async sendMessage(
    _message: PlatformMessage,
    _payload?: PlatformMessagePayload,
  ): Promise<void> {
    // No platform to notify in the clean build (game_ready is a no-op).
  }

  onPauseChanged(listener: (paused: boolean) => void): Unsubscribe {
    if (
      typeof document === 'undefined' ||
      typeof window === 'undefined' ||
      typeof document.addEventListener !== 'function' ||
      typeof window.addEventListener !== 'function'
    ) {
      return NOOP_UNSUBSCRIBE;
    }

    const onVisibility = (): void => listener(documentIsHidden());
    const onBlur = (): void => listener(true);
    const onFocus = (): void => listener(documentIsHidden());

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    };
  }

  onAudioChanged(_listener: (enabled: boolean) => void): Unsubscribe {
    return NOOP_UNSUBSCRIBE;
  }
}

export function createCleanAdapter(
  storage: BrowserStorage = new BrowserStorage(),
): CleanAdapter {
  return new CleanAdapter(storage);
}
