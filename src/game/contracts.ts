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

// ---------------------------------------------------------------------------
// M1 — playable core contracts
// ---------------------------------------------------------------------------

/** Runtime phase of the M1 test run. */
export type HudPhase = 'menu' | 'playing' | 'paused' | 'cleared' | 'defeat';

/** Minimal state required by the DOM HUD. Emitted only when it changes. */
export interface HudSnapshot {
  phase: HudPhase;
  waveId: string;
  waveName: string;
  /** 1-based index within the provisional M1 test wave set. */
  waveIndex: number;
  waveCount: number;
  ballsActive: number;
  blocksRemaining: number;
  score: number;
  /** True while the ball is attached to the paddle waiting for launch. */
  ballStuck: boolean;
}

/** Mutable feel values exposed by the ?debug=1 panel. */
export interface SimTuning {
  /** Multiplier applied to the wave base speed. 1 = normal. */
  ballSpeedScale: number;
  paddleWidth: number;
  paddleMaxSpeed: number;
  ballRadius: number;
  paddleMaxAngleDeg: number;
  fixedStepHz: number;
}

export interface TestWaveInfo {
  id: string;
  name: string;
}

/**
 * Commands the DOM UI may send to the game. Implemented by BlockBreakerGame.
 * The UI never mutates simulation state directly.
 */
export interface GameCommands {
  /** Starts the currently selected test wave from the menu. */
  startRun(): void;
  pause(): void;
  resume(): void;
  togglePause(): void;
  /** Restarts the current wave with a fresh paddle/ball state. */
  restartWave(): void;
  /**
   * Selects a provisional test wave and resets to the menu with that wave
   * loaded. The caller starts it with startRun().
   */
  setTestWave(waveId: string): void;
  getTestWaves(): readonly TestWaveInfo[];
  getHudState(): HudSnapshot;
  getTuning(): SimTuning;
  /** Applies and clamps the provided values, then emits tuning:changed. */
  setTuning(patch: Partial<SimTuning>): void;
  resetTuning(): void;
  /** Debug-only: adds one ball, respecting the 8-ball cap. */
  spawnBall(): void;
  /** Debug-only: fires one projectile for collision/feel testing. */
  fireTestProjectile(): void;
}
