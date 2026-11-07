/**
 * Shared contracts frozen at the end of M0.
 *
 * Gameplay must never branch on platform identity. All platform access goes
 * through PlatformService, and all persistent data is a string handled by the
 * StorageService (the Bridge receives arrays of equal length).
 */

export type Unsubscribe = () => void;

export type PlatformSource = 'bridge' | 'fallback';
export type StorageKind = 'bridge' | 'memory';

export interface StorageService {
  /** Returns one value per requested key; missing keys are `null`. */
  get(keys: readonly string[]): Promise<(string | null)[]>;
  /** Keys and values must have the same length. */
  set(keys: readonly string[], values: readonly string[]): Promise<void>;
  delete(keys: readonly string[]): Promise<void>;
}

export type InterstitialResult = 'shown' | 'skipped' | 'failed';

export interface AdsService {
  readonly isInterstitialSupported: boolean;
  showInterstitial(placement: string): Promise<InterstitialResult>;
}

export type PlatformMessage =
  | 'game_ready'
  | 'level_started'
  | 'level_paused'
  | 'level_resumed'
  | 'level_completed'
  | 'level_failed';

export interface PlatformMessagePayload {
  world?: string | number;
  level?: string | number;
  [key: string]: string | number | undefined;
}

export interface PlatformDiagnostics {
  readonly source: PlatformSource;
  readonly storageKind: StorageKind;
  readonly bridgeVersion: string | null;
  readonly initDurationMs: number | null;
}

export interface PlatformService {
  /** Bridge platform id (`mock`, `playgama`, `crazy_games`, ...). */
  readonly id: string;
  /** Language reported by the platform; UI strings stay English in the MVP. */
  readonly language: string;
  readonly isAudioEnabled: boolean;
  readonly isPaused: boolean;
  readonly storage: StorageService;
  readonly ads: AdsService;
  readonly diagnostics: PlatformDiagnostics;

  sendMessage(message: PlatformMessage, payload?: PlatformMessagePayload): Promise<void>;
  onPauseChanged(listener: (paused: boolean) => void): Unsubscribe;
  onAudioChanged(listener: (enabled: boolean) => void): Unsubscribe;
}

export interface PhaseStats {
  bestTimeMs: number | null;
  bestScore: number | null;
  attempts: number;
  clears: number;
  bestLevel: number;
}

/** Persisted save. Active runs are intentionally not saved. */
export interface SaveV1 {
  version: 1;
  unlockedPhase: number;
  phases: Record<string, PhaseStats>;
  updatedAt: number;
}

export interface SettingsV1 {
  version: 1;
  sound: boolean;
}

/** Derived modifier values consumed by gameplay. Base tuning is never mutated. */
export interface RunModifiers {
  paddleWidthMultiplier: number;
  ballRadiusMultiplier: number;
  ballDamage: number;
  xpMultiplier: number;
  maxBalls: number;
  turretInterval: number | null;
  stickyPaddle: boolean;
  laserCooldown: number | null;
  safetyNetCharges: number;
  explosiveEvery: number | null;
}
