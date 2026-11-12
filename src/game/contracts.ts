/**
 * Shared contracts frozen at the end of M0.
 *
 * Gameplay must never branch on platform identity. All platform access goes
 * through PlatformService, and all persistent data is a string handled by the
 * StorageService (the Bridge receives arrays of equal length).
 */

export type Unsubscribe = () => void;

export type PlatformSource = 'bridge' | 'fallback' | 'crazygames';
export type StorageKind = 'bridge' | 'memory';

export interface StorageService {
  /** Returns one value per requested key; missing keys are `null`. */
  get(keys: readonly string[]): Promise<(string | null)[]>;
  /** Keys and values must have the same length. */
  set(keys: readonly string[], values: readonly string[]): Promise<void>;
  delete(keys: readonly string[]): Promise<void>;
}

export type InterstitialResult = 'shown' | 'skipped' | 'failed';
export type RewardedResult = 'rewarded' | 'closed' | 'failed' | 'skipped';

/** UI state emitted while a results or mid-run ad is requested/finished. */
export type AdState = 'requested' | 'finished';

export interface AdsService {
  readonly isInterstitialSupported: boolean;
  readonly isRewardedSupported: boolean;
  showInterstitial(placement: string): Promise<InterstitialResult>;
  showRewarded(placement: string): Promise<RewardedResult>;
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

/** Persisted Endless-mode statistics. */
export interface EndlessStats {
  bestWave: number;
  bestScore: number;
  runs: number;
}

/** Persisted save. Active runs are intentionally not saved. */
export interface SaveV1 {
  version: 1;
  /** 0 = tutorial only; 1..6 = campaign phases unlocked. */
  unlockedPhase: number;
  phases: Record<string, PhaseStats>;
  endless: EndlessStats;
  /** True once phase 6 has been cleared; unlocks Endless mode. */
  campaignComplete: boolean;
  updatedAt: number;
}

export interface SettingsV1 {
  version: 1;
  /** Sound effects. */
  sound: boolean;
  /** Ambient music loop, independent from SFX. */
  music: boolean;
  /** Camera shake feedback. */
  screenShake: boolean;
}

export interface SaveSnapshot {
  save: SaveV1;
  settings: SettingsV1;
}

/** Persistence boundary used by the M3 game; backed by PlatformService storage. */
export interface SaveRepository {
  load(): Promise<SaveSnapshot>;
  save(save: SaveV1): Promise<void>;
  saveSettings(settings: SettingsV1): Promise<void>;
  reset(): Promise<void>;
}

/** Derived modifier values consumed by gameplay. Base tuning is never mutated. */
export interface RunModifiers {
  paddleWidthMultiplier: number;
  ballRadiusMultiplier: number;
  ballDamage: number;
  xpMultiplier: number;
  maxBalls: number;
  /** Milliseconds between automatic turret shots; null when not acquired. */
  turretInterval: number | null;
  stickyPaddle: boolean;
  /** Laser cooldown in milliseconds; null when not acquired. */
  laserCooldown: number | null;
  /** Prism Laser level (0–3): damage per beam and extra targets scale with it. */
  laserLevel: number;
  safetyNetCharges: number;
  explosiveEvery: number | null;
  /** Number of extra Multiball slots that can respawn after a loss. */
  multiballLevel: number;
  /** Foresight: draw a short dotted prediction ahead of each ball. */
  trajectoryGuide: boolean;
  /** Critical strike chance in [0, 1]. */
  critChance: number;
  /** Damage multiplier applied on a critical hit. */
  critMultiplier: number;
  /** Extra laser targets granted by perks. */
  laserTargetBonus: number;
  /** Multiplier applied to the laser beam width. */
  laserWidthMultiplier: number;
  /** Multiplier applied to the laser cooldown (lower is faster). */
  laserCooldownMultiplier: number;
  /** Momentum: damage bonus fraction added per consecutive block hit. */
  momentumDamageStep: number;
  /** Momentum: maximum damage bonus fraction. */
  momentumDamageCap: number;
  /** Momentum: XP bonus fraction added per consecutive block hit. */
  momentumXpStep: number;
  /** Momentum: maximum XP bonus fraction. */
  momentumXpCap: number;
  /** Remaining Second Chance revives for the run. */
  reviveCharges: number;
  /** Blocks destroyed between Bombardier charges; null when not acquired. */
  bombardierEvery: number | null;
  /** Blocks destroyed between Boss Slayer charges; null when not acquired. */
  bossSlayerEvery: number | null;
  /** Hot Streak: consecutive block hits required to trigger; 0 when not acquired. */
  hotStreakHits: number;
  /** Hot Streak: bonus ball damage while the buff is active. */
  hotStreakDamage: number;
  /** Hot Streak: buff duration in milliseconds. */
  hotStreakDurationMs: number;
  /** Extra damage against bosses. */
  bossDamageBonus: number;
  /** Multiplier applied to the base ball speed. */
  ballSpeedMultiplier: number;
  /** Global score multiplier. */
  scoreMultiplier: number;
}

// ---------------------------------------------------------------------------
// M1 — playable core contracts
// ---------------------------------------------------------------------------

/** Runtime phase of the run. */
export type HudPhase =
  | 'menu'
  | 'playing'
  | 'paused'
  | 'levelup'
  | 'tutorial'
  | 'cleared'
  | 'revive-offer'
  | 'run-complete'
  | 'defeat';

export type PerkKind = 'repeatable' | 'unique';

/** Catalog entry shown by the debug force-perk control. */
export interface PerkSummary {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  kind: PerkKind;
}

/** One of the three cards presented at level up. */
export interface PerkOffer extends PerkSummary {
  currentLevel: number;
  nextLevel: number;
}

/** An acquired perk, used by the HUD. */
export interface PerkState {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
}

export interface LaserHudState {
  acquired: boolean;
  ready: boolean;
  cooldownMs: number;
  remainingMs: number;
  /** Why the laser cannot fire, when blocked. */
  blocked?: 'stuck' | 'rule' | null;
}

/** Read-only phase card data for the phase select screen. */
export interface PhaseSelectInfo {
  id: string;
  name: string;
  /** 0 for the optional tutorial, 1..6 for the campaign. */
  index: number;
  /** True for the tutorial phase that gates the campaign on a fresh save. */
  tutorial: boolean;
  unlocked: boolean;
  bestTimeMs: number | null;
  bestScore: number | null;
  attempts: number;
  clears: number;
  /** Short flavour line used by the new campaign screen. */
  tagline: string;
  /** Theme id used for the card art (`crystal`, `ruins`, ...). */
  themeId: string;
  /** CSS hex accent for the card. */
  accent: string;
  /** Human-readable content highlights, e.g. `Moving blocks`, `Boss: ...`. */
  features: readonly string[];
  /** Boss name for phases 4-6; null otherwise. */
  bossName: string | null;
  /** Number of waves in the phase. */
  waves: number;
}

/** Epilogue and rank shown on the results screen. */
export interface EndingSummary {
  id: string;
  title: string;
  body: string;
  rank: 'S' | 'A' | 'B';
}

/** Final summary shown after a phase victory or defeat. */
export interface PhaseResult {
  phaseId: string;
  phaseName: string;
  phaseIndex: number;
  phaseCount: number;
  /** True when the result belongs to the tutorial phase. */
  tutorial?: boolean;
  victory: boolean;
  score: number;
  timeMs: number;
  level: number;
  perks: readonly PerkState[];
  bestScore: number | null;
  bestTimeMs: number | null;
  nextPhaseId: string | null;
  /** Epilogue/rank for boss and campaign endings; null when none. */
  ending?: EndingSummary | null;
  /** True when the result belongs to an Endless run. */
  endless?: boolean;
  /** Wave reached in the finished Endless run. */
  waveReached?: number;
  /** Best wave after recording the result. */
  bestWave?: number;
}

/** Contextual tutorial coach marks shown only during the tutorial phase. */
export type TutorialStep =
  | 'move'
  | 'levelup'
  | 'specials'
  | 'bosses'
  | 'endless';

export type TutorialPosition = 'bottom' | 'top' | 'center';

export interface TutorialState {
  step: TutorialStep;
  /** 1-based position in the five tutorial steps. */
  stepIndex: number;
  stepCount: number;
  canSkip: boolean;
  /** Where the coach card is anchored; the game is paused while it is open. */
  position: TutorialPosition;
}

/** Minimal state required by the DOM HUD. Emitted only when it changes. */
export interface HudSnapshot {
  phase: HudPhase;
  phaseId: string;
  phaseName: string;
  phaseIndex: number;
  phaseCount: number;
  waveId: string;
  waveName: string;
  /** 1-based index within the current phase. */
  waveIndex: number;
  waveCount: number;
  ballsActive: number;
  /** Milliseconds until a lost Multiball extra respawns; null when none. */
  ballRespawnMs: number | null;
  blocksRemaining: number;
  score: number;
  /** True while the ball is attached to the paddle waiting for launch. */
  ballStuck: boolean;
  level: number;
  xp: number;
  xpToNext: number;
  perks: readonly PerkState[];
  /** Null until Prism Laser is acquired. */
  laser: LaserHudState | null;
  seed: number;
  elapsedMs: number;
  bestScore: number | null;
  bestTimeMs: number | null;
  soundEnabled: boolean;
  musicEnabled: boolean;
  screenShakeEnabled: boolean;
  /** True once the campaign has been cleared at least once. */
  campaignComplete: boolean;
  /** Endless unlocks only after the campaign is complete. */
  endlessUnlocked: boolean;
  /** Non-null only while the results screen is open. */
  result: PhaseResult | null;
  /** True while the active phase is the tutorial. */
  isTutorial?: boolean;
  /** Contextual coach marks for the tutorial phase; null outside it. */
  tutorial?: TutorialState | null;
  /** Boss health for the current wave; optional until integrated. */
  boss?: { name: string; hp: number; maxHp: number; phase: number } | null;
  /** Active wave challenge; optional until integrated. */
  rule?: { kind: 'timeLimit' | 'noLaser'; remainingMs: number | null } | null;
  /** Multiplier block buff; optional until integrated. */
  multiplier?: { xpFactor: number; scoreFactor: number; remainingMs: number } | null;
  /** Consecutive-block combo; optional until integrated. */
  combo?: { count: number; multiplier: number } | null;
  /** Wave intro text; optional until integrated. */
  waveIntro?: string | null;
  /** True when the one-per-run rewarded revive offer was already shown. */
  adReviveUsed?: boolean;
  /** True while the active run is Endless mode. */
  endless?: boolean;
  /** Persisted best wave for the HUD. */
  endlessBestWave?: number;
  /** Persisted best score for the HUD. */
  endlessBestScore?: number;
}

/** Result of one XP grant, including overflow and queued level ups. */
export interface XpGain {
  baseAmount: number;
  gained: number;
  level: number;
  xp: number;
  xpToNext: number;
  levelsGained: number;
  pendingLevelUps: number;
}

/** Result of choosing or force-granting a perk. */
export interface PerkChoice {
  perk: PerkState;
  modifiers: RunModifiers;
  pendingLevelUps: number;
  /** Extra balls to spawn when gameplay resumes (Multiball). */
  spawnedBalls: number;
}

/**
 * Pure progression contract implemented by S2. The game owns when XP is
 * granted and when the level-up overlay is shown; this service owns the curve,
 * offers, choices and derived modifiers.
 */
export interface ProgressionService {
  readonly seed: number;
  readonly level: number;
  readonly xp: number;
  readonly xpToNext: number;
  readonly pendingLevelUps: number;
  readonly modifiers: RunModifiers;
  readonly perks: readonly PerkState[];

  startRun(seed: number): void;
  reset(): void;
  /** Applies the Quick Study multiplier and queues level ups. */
  addXp(baseAmount: number): XpGain;
  /** Generates the next three-card offer; call only when pendingLevelUps > 0. */
  takeOffers(): readonly PerkOffer[];
  choosePerk(perkId: string): PerkChoice;
  /** Debug-only: grants one level without consuming a queued level up. */
  grantPerk(perkId: string): PerkChoice;
  getCatalog(): readonly PerkSummary[];
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
  /** Starts the run at the selected test wave, or wave 1. */
  startRun(): void;
  /** Starts a fresh Endless run at wave 1. */
  startEndless(): void;
  /** Returns the persisted Endless statistics. */
  getEndlessStats(): EndlessStats;
  pause(): void;
  resume(): void;
  togglePause(): void;
  /** Restarts the current wave with a fresh paddle/ball state. */
  restartWave(): void;
  /** Debug-only: advances to the next wave, finishing the phase on the last. */
  debugNextWave(): void;
  /** Restarts the whole run from wave 1 with reset XP/perks. */
  restartRun(): void;
  /** Advances from a cleared wave to the next one. */
  nextWave(): void;
  /**
   * Selects a provisional starting wave and resets to the menu with it
   * loaded. The caller starts the run with startRun().
   */
  setTestWave(waveId: string): void;
  getTestWaves(): readonly TestWaveInfo[];
  getHudState(): HudSnapshot;
  /** Chooses a card from the current level-up offer. */
  choosePerk(perkId: string): void;
  fireLaser(): void;
  getPerkCatalog(): readonly PerkSummary[];
  getTuning(): SimTuning;
  /** Applies and clamps the provided values, then emits tuning:changed. */
  setTuning(patch: Partial<SimTuning>): void;
  resetTuning(): void;
  /** Debug-only: adds one ball, respecting the 8-ball cap. */
  spawnBall(): void;
  /** Debug-only: fires one projectile for collision/feel testing. */
  fireTestProjectile(): void;
  /** Debug-only: grants one perk level and applies its effect immediately. */
  debugGrantPerk(perkId: string): void;
  /** Debug-only: grants XP, triggering queued level ups. */
  debugAddXp(amount: number): void;
  /** Debug-only: ends the current run in defeat immediately. */
  debugDefeat(): void;
  /** Debug-only: ends the current phase in victory immediately. */
  debugVictory(): void;

  // M3 — phases, save and results
  /** Starts a specific content phase from its first wave. */
  startPhase(phaseId: string): void;
  /** Acknowledges the open tutorial coach mark and resumes/advances it. */
  acknowledgeTutorial(): void;
  /** Completes the tutorial immediately and unlocks level 1. */
  skipTutorial(): void;
  /** Retries the current phase from wave 1 (results screen). */
  restartPhase(): void;
  /** Moves from a victory result to the next unlocked phase. */
  nextPhase(): void;
  /** Returns to the menu/phase selection state. */
  returnToMenu(): void;
  /** Accepts the one-per-run rewarded ad revive offer on defeat. */
  acceptAdRevive(): void;
  /** Declines the rewarded ad revive offer and finishes the run. */
  declineAdRevive(): void;
  getPhaseSelectInfo(): readonly PhaseSelectInfo[];
  setSound(enabled: boolean): void;
  /** Toggles the ambient music loop without touching SFX. */
  setMusic(enabled: boolean): void;
  /** Toggles camera shake feedback. */
  setScreenShake(enabled: boolean): void;
  /** Debug-only: clears the persisted save and resets unlock progress. */
  resetSave(): Promise<void>;
}
