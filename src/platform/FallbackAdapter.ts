import type {
  AdsService,
  PlatformDiagnostics,
  PlatformService,
  PlatformMessage,
  StorageService,
  Unsubscribe,
} from '../game/contracts';
import { MemoryStorage } from './MemoryStorage';

const SKIPPED_ADS: AdsService = {
  isInterstitialSupported: false,
  async showInterstitial(): Promise<'skipped'> {
    return 'skipped';
  },
};

const NOOP_UNSUBSCRIBE: Unsubscribe = () => {
  // No platform events are available without the Bridge.
};

/**
 * Degraded platform used when the Bridge is absent, blocked or fails to
 * initialize. The game keeps running with in-memory storage for the session.
 */
export class FallbackAdapter implements PlatformService {
  readonly id = 'mock';
  readonly language: string;
  readonly isAudioEnabled = true;
  readonly isPaused = false;
  readonly storage: StorageService = new MemoryStorage();
  readonly ads: AdsService = SKIPPED_ADS;
  readonly diagnostics: PlatformDiagnostics = {
    source: 'fallback',
    storageKind: 'memory',
    bridgeVersion: null,
    initDurationMs: null,
  };

  constructor(language = 'en') {
    this.language = language;
  }

  async sendMessage(_message: PlatformMessage): Promise<void> {
    // No-op: there is no platform to notify.
  }

  onPauseChanged(_listener: (paused: boolean) => void): Unsubscribe {
    return NOOP_UNSUBSCRIBE;
  }

  onAudioChanged(_listener: (enabled: boolean) => void): Unsubscribe {
    return NOOP_UNSUBSCRIBE;
  }
}

export function createFallbackAdapter(language: string): PlatformService {
  return new FallbackAdapter(language);
}
