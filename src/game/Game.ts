import Phaser from 'phaser';
import type {
  AdsService,
  EndlessStats,
  GameCommands,
  HudPhase,
  HudSnapshot,
  InterstitialResult,
  PerkSummary,
  PhaseResult,
  PhaseSelectInfo,
  PlatformMessage,
  PlatformMessagePayload,
  PlatformService,
  RewardedResult,
  SaveRepository,
  SaveSnapshot,
  SaveV1,
  SettingsV1,
  SimTuning,
  TestWaveInfo,
  TutorialStep,
} from './contracts';
import { GAME_CONFIG, SIM_TUNING_DEFAULTS, SIM_TUNING_LIMITS } from './config';
import { shouldShowWaveInterstitial } from './adSchedule';
import { gameEvents } from './events';
import { AudioService } from '../audio';
import { ENDLESS_PHASE, endlessEnding, endlessWave } from '../content/endless';
import { endingForResult } from '../content/endings';
import { CAMPAIGN_PHASE_COUNT, PHASES } from '../content/phases';
import { summarizePhase } from '../content/phasePresentation';
import type { PhaseDef, WaveDef } from '../content/types';
import { InputController } from '../input/Input';
import { MemoryStorage } from '../platform/MemoryStorage';
import {
  StorageSaveRepository,
  applyEndlessResult,
  applyPhaseResult,
  createDefaultSave,
  createDefaultSettings,
  getEndlessStats,
  getPhaseStats,
} from '../progression/Save';
import { RunState } from '../progression/RunState';
import { GameScene } from '../render/GameScene';
import { hexToCss, themeForPhase } from '../render/themes';
import { FixedStepClock } from '../sim/fixedStep';
import { FIELD_WIDTH, World, type SimEvent } from '../sim/World';

export interface CanvasMetrics {
  readonly cssWidth: number;
  readonly cssHeight: number;
  readonly width: number;
  readonly height: number;
  /** Effective backing-store ratio (canvas pixels per CSS pixel). */
  readonly resolution: number;
}

const MAX_SUBSTEPS = GAME_CONFIG.maxStepsPerFrame;
const WAVE_TRANSITION_MS = 1200;
const LEVEL_UP_REVEAL_MS = 450;
const BALL_RESPAWN_MS = GAME_CONFIG.ball.respawnMs;
/** Avoid stacking an exit ad immediately after a wave/rewarded ad. */
const AD_EXIT_COOLDOWN_MS = 60_000;
const INTERSTITIAL_PLACEMENT = 'phase_completed';
const PAUSE_EXIT_INTERSTITIAL_PLACEMENT = 'pause_menu';
const WAVE_INTERSTITIAL_PLACEMENT = 'wave_completed';
const ENDLESS_INTERSTITIAL_PLACEMENT = 'endless_wave_completed';
const REVIVE_REWARDED_PLACEMENT = 'revive';

const NO_ADS: AdsService = {
  isInterstitialSupported: false,
  isRewardedSupported: false,
  async showInterstitial(): Promise<InterstitialResult> {
    return 'skipped';
  },
  async showRewarded(): Promise<RewardedResult> {
    return 'skipped';
  },
};

function clampWorldHeight(cssWidth: number, cssHeight: number): number {
  if (cssWidth <= 0 || cssHeight <= 0) return GAME_CONFIG.worldHeight.min;
  const raw = Math.round((FIELD_WIDTH * cssHeight) / cssWidth);
  return Math.max(
    GAME_CONFIG.worldHeight.min,
    Math.min(GAME_CONFIG.worldHeight.max, raw),
  );
}

/**
 * Owns the Phaser instance, the pure simulation, M3 phase/save flow and the
 * GameCommands seam used by the DOM UI.
 */
export class BlockBreakerGame implements GameCommands {
  readonly phaser: Phaser.Game;
  readonly ready: Promise<void>;
  readonly saveReady: Promise<void>;

  private tuning: SimTuning = { ...SIM_TUNING_DEFAULTS };
  private readonly world: World;
  private readonly input: InputController;
  private readonly scene: GameScene;
  private readonly audio: AudioService;
  private readonly platform: PlatformService | null;
  private readonly ads: AdsService;
  private readonly runState = new RunState();
  private readonly saveRepository: SaveRepository;
  private readonly unsubscribePause: () => void;
  private readonly unsubscribeAudio: () => void;
  private phase: HudPhase = 'menu';
  private mode: 'campaign' | 'endless' = 'campaign';
  private currentPhase: PhaseDef | null = null;
  private currentWaveDef: WaveDef | null = null;
  private currentWaveIndex = 0;
  private phaseElapsedMs = 0;
  private phaseResult: PhaseResult | null = null;
  private runScore = 0;
  private waveScoreAtStart = 0;
  private pendingPerkBalls = 0;
  /** Extra Multiball slots waiting for the player's first launch this wave. */
  private pendingMultiballBalls = 0;
  private multiballLaunchArmed = false;
  private nextMultiballLaunchAt = 0;
  private runCount = 0;
  private runSeed = 1;
  private nextWaveAt = 0;
  private levelUpRevealAt = 0;
  private ballRespawnLeftMs = 0;
  private adBusy = false;
  private save: SaveV1 = createDefaultSave();
  private settings: SettingsV1 = createDefaultSettings();
  private readonly clock = new FixedStepClock();
  private pendingLaunch = false;
  private lastHud = '';
  private waveIntroUntil = 0;
  private reviveUsed = false;
  private adReviveUsed = false;
  private tutorialStep: TutorialStep | null = null;
  private lastInterstitialAt = Number.NEGATIVE_INFINITY;
  private lastRewardedAt = Number.NEGATIVE_INFINITY;

  constructor(parent: HTMLElement, platform?: PlatformService) {
    let resolveReady: () => void = () => {
      // Replaced synchronously below.
    };
    this.ready = new Promise<void>((resolve) => {
      resolveReady = resolve;
    });

    this.saveRepository = new StorageSaveRepository(
      platform?.storage ?? new MemoryStorage(),
    );
    this.platform = platform ?? null;
    this.ads = platform?.ads ?? NO_ADS;
    this.audio = new AudioService({
      enabled: true,
      platformEnabled: platform?.isAudioEnabled ?? true,
    });

    const preview = PHASES[0]?.waves[0];
    if (!preview) throw new Error('No M3 phase content available');

    const cssWidth = Math.max(1, Math.round(parent.clientWidth || FIELD_WIDTH));
    const cssHeight = Math.max(
      1,
      Math.round(parent.clientHeight || GAME_CONFIG.worldHeight.min),
    );
    const worldHeight = clampWorldHeight(cssWidth, cssHeight);

    this.world = new World({
      wave: preview,
      height: worldHeight,
      tuning: this.tuning,
      seed: 1,
    });

    const scene = new GameScene({
      world: this.world,
      onFrame: (deltaMs) => this.frame(deltaMs),
      onReady: () => resolveReady(),
    });
    this.scene = scene;
    scene.setPhase(PHASES[0]!.id, 1);

    this.phaser = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width: FIELD_WIDTH,
      height: worldHeight,
      backgroundColor: '#080b16',
      banner: false,
      pixelArt: true,
      roundPixels: true,
      antialias: false,
      disableContextMenu: true,
      transparent: false,
      audio: { noAudio: true },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: FIELD_WIDTH,
        height: worldHeight,
        expandParent: false,
      },
      render: {
        powerPreference: 'high-performance',
      },
      fps: {
        target: 60,
        forceSetTimeOut: false,
      },
      scene: [scene],
    });

    this.phaser.canvas.tabIndex = -1;
    this.phaser.canvas.style.outline = 'none';

    this.input = new InputController(
      this.phaser.canvas,
      () => this.world.paddle.x,
      () => this.phase === 'playing',
    );
    this.unsubscribePause = gameEvents.on('platform:pause-changed', ({ paused }) => {
      if (paused) this.pause();
    });
    this.unsubscribeAudio = gameEvents.on('platform:audio-changed', ({ enabled }) => {
      this.audio.setPlatformEnabled(enabled);
    });
    document.addEventListener('visibilitychange', this.handleVisibility);

    this.runState.startRun(1);
    this.world.applyRunModifiers(this.runState.modifiers);
    this.syncHud(true);

    this.saveReady = this.loadPersistedState();
  }

  get fps(): number {
    return this.phaser.loop.actualFps;
  }

  get canvasMetrics(): CanvasMetrics {
    const canvas = this.phaser.canvas;
    const cssWidth = canvas?.clientWidth ?? 0;
    const width = canvas?.width ?? 0;
    return {
      cssWidth,
      cssHeight: canvas?.clientHeight ?? 0,
      width,
      height: canvas?.height ?? 0,
      resolution: cssWidth > 0 ? width / cssWidth : 1,
    };
  }

  get stageSize(): { width: number; height: number } {
    return {
      width: this.phaser.scale.width,
      height: this.phaser.scale.height,
    };
  }

  /** Receives the CSS size of the portrait stage and reshapes the field. */
  resize(width: number, height: number): void {
    if (width < 1 || height < 1) return;
    const worldHeight = clampWorldHeight(width, height);
    this.world.resize(worldHeight);
    this.phaser.scale.setGameSize(FIELD_WIDTH, worldHeight);
    this.phaser.scale.refresh();
    this.clock.reset();
    this.syncHud();
  }

  // -------------------------------------------------------------------------
  // GameCommands — phase/menu/save
  // -------------------------------------------------------------------------

  startRun(): void {
    const target =
      [...this.getPhaseSelectInfo()].reverse().find((phase) => phase.unlocked) ??
      this.getPhaseSelectInfo()[0];
    if (target) this.startPhase(target.id);
  }

  restartRun(): void {
    this.restartPhase();
  }

  startEndless(): void {
    if (!this.save.campaignComplete) return;
    this.mode = 'endless';
    this.currentPhase = ENDLESS_PHASE;
    this.currentWaveDef = null;
    this.currentWaveIndex = 0;
    this.phaseElapsedMs = 0;
    this.phaseResult = null;
    this.runScore = 0;
    this.waveScoreAtStart = 0;
    this.pendingPerkBalls = 0;
    this.nextWaveAt = 0;
    this.levelUpRevealAt = 0;
    this.ballRespawnLeftMs = 0;
    this.runSeed = this.nextSeed();
    this.reviveUsed = false;
    this.adReviveUsed = false;
    this.tutorialStep = null;
    this.waveIntroUntil = 0;
    this.runState.startRun(this.runSeed);
    this.loadEndlessWave(1);
    this.scene.setPhase('phase-6', 5);
    this.scene.setMenuMode(false);
    this.audio.setSuspended(false);
    this.phase = 'playing';
    this.sendPlatform('level_started', { world: 'endless', level: 1 });
    this.focusGameplay();
    this.clock.reset();
    this.pendingLaunch = false;
    this.input.resetTarget();
    this.syncHud(true);
  }

  getEndlessStats(): EndlessStats {
    return getEndlessStats(this.save);
  }

  startPhase(phaseId: string): void {
    const phase = PHASES.find((candidate) => candidate.id === phaseId);
    if (!phase || phase.index > this.save.unlockedPhase) return;

    this.mode = 'campaign';
    this.currentWaveDef = null;
    this.currentPhase = phase;
    this.currentWaveIndex = 0;
    this.phaseElapsedMs = 0;
    this.phaseResult = null;
    this.runScore = 0;
    this.waveScoreAtStart = 0;
    this.pendingPerkBalls = 0;
    this.nextWaveAt = 0;
    this.levelUpRevealAt = 0;
    this.ballRespawnLeftMs = 0;
    this.runSeed = this.nextSeed();
    this.reviveUsed = false;
    this.adReviveUsed = false;
    this.tutorialStep = phase.tutorial ? 'move' : null;
    this.waveIntroUntil = 0;
    this.runState.startRun(this.runSeed);
    this.loadPhaseWave(0);
    this.scene.setPhase(phase.id, phase.index);
    this.scene.setMenuMode(false);
    this.audio.setSuspended(false);
    this.phase = 'playing';
    this.sendPlatform('level_started', {
      world: phase.id,
      level: phase.index,
    });
    this.focusGameplay();
    this.clock.reset();
    this.pendingLaunch = false;
    this.input.resetTarget();
    this.syncHud(true);
  }

  restartPhase(): void {
    if (this.mode === 'endless') {
      if (this.phase === 'defeat' || this.phase === 'run-complete') {
        void this.runResultsAction(() => this.startEndless());
      } else {
        this.startEndless();
      }
      return;
    }

    if (this.phase === 'run-complete' || this.phase === 'defeat') {
      void this.runResultsAction(() => {
        if (this.currentPhase) this.startPhase(this.currentPhase.id);
        else this.doReturnToMenu();
      });
      return;
    }

    if (this.currentPhase) {
      this.startPhase(this.currentPhase.id);
    } else {
      this.returnToMenu();
    }
  }

  /** Completes the tutorial immediately; only valid during its run. */
  skipTutorial(): void {
    if (this.mode !== 'campaign' || !this.currentPhase?.tutorial) return;
    if (this.phase === 'run-complete' || this.phase === 'defeat') return;
    this.tutorialStep = null;
    this.finishPhase(true);
  }

  nextPhase(): void {
    if (this.mode === 'endless') return;
    if (this.phase !== 'run-complete') return;
    const nextId = this.phaseResult?.nextPhaseId ?? null;
    if (!nextId) return;
    void this.runResultsAction(() => this.startPhase(nextId));
  }

  returnToMenu(): void {
    if (this.phase === 'run-complete' || this.phase === 'defeat') {
      void this.runResultsAction(() => this.doReturnToMenu());
      return;
    }
    if (this.phase === 'paused') {
      void this.runPauseExitAction(() => this.doReturnToMenu());
      return;
    }
    this.doReturnToMenu();
  }

  private doReturnToMenu(): void {
    this.phase = 'menu';
    this.mode = 'campaign';
    this.currentPhase = null;
    this.currentWaveDef = null;
    this.currentWaveIndex = 0;
    this.phaseElapsedMs = 0;
    this.phaseResult = null;
    this.runScore = 0;
    this.waveScoreAtStart = 0;
    this.pendingPerkBalls = 0;
    this.pendingMultiballBalls = 0;
    this.multiballLaunchArmed = false;
    this.nextMultiballLaunchAt = 0;
    this.nextWaveAt = 0;
    this.levelUpRevealAt = 0;
    this.ballRespawnLeftMs = 0;
    this.reviveUsed = false;
    this.adReviveUsed = false;
    this.tutorialStep = null;
    this.waveIntroUntil = 0;
    this.runState.reset();
    const preview = PHASES[0]?.waves[0];
    if (preview) {
      this.world.loadWave(preview);
      this.world.applyRunModifiers(this.runState.modifiers);
    }
    this.scene.setPhase(PHASES[0]!.id, 1);
    this.scene.setMenuMode(true);
    this.audio.setSuspended(false);
    this.clock.reset();
    this.pendingLaunch = false;
    this.input.resetTarget();
    this.syncHud(true);
  }

  getPhaseSelectInfo(): readonly PhaseSelectInfo[] {
    return PHASES.map((phase) => {
      const stats = getPhaseStats(this.save, phase.id);
      const theme = themeForPhase(phase.id, phase.index);
      const summary = summarizePhase(phase);
      return {
        id: phase.id,
        name: phase.name,
        index: phase.index,
        tutorial: phase.tutorial === true,
        unlocked: phase.index <= this.save.unlockedPhase,
        bestTimeMs: stats.bestTimeMs,
        bestScore: stats.bestScore,
        attempts: stats.attempts,
        clears: stats.clears,
        tagline: phase.tagline ?? '',
        themeId: theme.shape,
        accent: hexToCss(theme.accent),
        features: summary.features,
        bossName: summary.bossName,
        waves: phase.waves.length,
      };
    });
  }

  setSound(enabled: boolean): void {
    this.settings = { ...this.settings, sound: enabled };
    this.audio.setEnabled(enabled);
    this.persistSettings();
    this.syncHud(true);
  }

  setMusic(enabled: boolean): void {
    this.settings = { ...this.settings, music: enabled };
    this.audio.setMusicEnabled(enabled);
    this.persistSettings();
    this.syncHud(true);
  }

  setScreenShake(enabled: boolean): void {
    this.settings = { ...this.settings, screenShake: enabled };
    this.scene.setScreenShakeEnabled(enabled);
    this.persistSettings();
    this.syncHud(true);
  }

  private persistSettings(): void {
    void this.saveRepository.saveSettings(this.settings).catch((error: unknown) => {
      console.warn('[save] could not persist settings', error);
    });
  }

  async resetSave(): Promise<void> {
    try {
      await this.saveRepository.reset();
    } catch (error) {
      console.warn('[save] could not clear storage', error);
    }
    this.save = createDefaultSave();
    this.settings = createDefaultSettings();
    this.mode = 'campaign';
    this.currentPhase = null;
    this.currentWaveDef = null;
    this.currentWaveIndex = 0;
    this.phaseElapsedMs = 0;
    this.phaseResult = null;
    this.runScore = 0;
    this.phase = 'menu';
    this.pendingMultiballBalls = 0;
    this.multiballLaunchArmed = false;
    this.nextMultiballLaunchAt = 0;
    this.levelUpRevealAt = 0;
    this.ballRespawnLeftMs = 0;
    this.reviveUsed = false;
    this.adReviveUsed = false;
    this.tutorialStep = null;
    this.waveIntroUntil = 0;
    const preview = PHASES[0]?.waves[0];
    if (preview) {
      this.world.loadWave(preview);
      this.world.applyRunModifiers(this.runState.modifiers);
    }
    this.scene.setPhase(PHASES[0]!.id, 1);
    this.scene.setMenuMode(true);
    this.audio.setEnabled(true);
    this.audio.setMusicEnabled(true);
    this.scene.setScreenShakeEnabled(true);
    this.audio.setSuspended(false);
    this.syncHud(true);
    gameEvents.emit('save:reset', {
      keys: [GAME_CONFIG.storage.saveKey, GAME_CONFIG.storage.settingsKey],
    });
  }

  // -------------------------------------------------------------------------
  // GameCommands — run flow
  // -------------------------------------------------------------------------

  pause(): void {
    if (this.phase !== 'playing') return;
    this.phase = 'paused';
    this.audio.setSuspended(true);
    this.sendLevelMessage('level_paused');
    this.clock.reset();
    this.syncHud(true);
  }

  resume(): void {
    if (this.phase !== 'paused') return;
    this.phase = 'playing';
    this.audio.setSuspended(false);
    this.sendLevelMessage('level_resumed');
    this.focusGameplay();
    this.clock.reset();
    this.syncHud(true);
  }

  togglePause(): void {
    if (this.phase === 'playing') this.pause();
    else if (this.phase === 'paused') this.resume();
  }

  restartWave(): void {
    if (!this.currentPhase || this.phase === 'menu') return;
    this.runScore = this.waveScoreAtStart;
    this.pendingPerkBalls = 0;
    this.nextWaveAt = 0;
    this.levelUpRevealAt = 0;
    this.ballRespawnLeftMs = 0;
    this.loadCurrentWave();
    if (this.mode === 'endless') {
      this.scene.setPhase('phase-6', 5);
      this.tutorialStep = null;
    } else {
      this.scene.setPhase(this.currentPhase.id, this.currentPhase.index);
      this.tutorialStep = this.currentPhase.tutorial
        ? this.currentWaveIndex === 0
          ? 'move'
          : 'specials'
        : null;
    }
    this.audio.setSuspended(false);
    this.phase = 'playing';
    this.focusGameplay();
    this.clock.reset();
    this.pendingLaunch = false;
    this.input.resetTarget();
    this.syncHud(true);
  }

  nextWave(): void {
    if (this.phase !== 'cleared' || !this.currentPhase) return;
    // The wave ad owns the transition while it is open.
    if (this.adBusy) return;

    if (this.mode === 'endless') {
      this.currentWaveIndex += 1;
      this.waveScoreAtStart = this.runScore;
      this.pendingPerkBalls = 0;
      this.nextWaveAt = 0;
      this.levelUpRevealAt = 0;
      this.ballRespawnLeftMs = 0;
      this.loadEndlessWave(this.currentWaveIndex + 1);
      this.scene.setPhase('phase-6', 5);
      this.tutorialStep = null;
      this.audio.setSuspended(false);
      this.phase = 'playing';
      this.focusGameplay();
      this.clock.reset();
      this.pendingLaunch = false;
      this.input.resetTarget();
      this.syncHud(true);
      return;
    }

    if (this.currentWaveIndex + 1 >= this.currentPhase.waves.length) {
      this.finishPhase(true);
      return;
    }

    this.currentWaveIndex += 1;
    this.waveScoreAtStart = this.runScore;
    this.pendingPerkBalls = 0;
    this.nextWaveAt = 0;
    this.levelUpRevealAt = 0;
    this.ballRespawnLeftMs = 0;
    this.loadPhaseWave(this.currentWaveIndex);
    this.scene.setPhase(this.currentPhase.id, this.currentPhase.index);
    if (this.currentPhase.tutorial) this.tutorialStep = 'specials';
    this.audio.setSuspended(false);
    this.phase = 'playing';
    this.focusGameplay();
    this.clock.reset();
    this.pendingLaunch = false;
    this.input.resetTarget();
    this.syncHud(true);
  }

  setTestWave(_waveId: string): void {
    // M3 uses phase selection; kept for contract stability.
  }

  getTestWaves(): readonly TestWaveInfo[] {
    return [];
  }

  getHudState(): HudSnapshot {
    return this.buildHud();
  }

  /** Debug-only rolling log from the pure simulation (anti-stall, hits...). */
  get simEvents(): readonly SimEvent[] {
    return this.world.history;
  }

  getPerkCatalog(): readonly PerkSummary[] {
    return this.runState.getCatalog();
  }

  choosePerk(perkId: string): void {
    if (this.phase !== 'levelup') return;

    try {
      const previousSafety = this.world.safetyCharges;
      const choice = this.runState.choosePerk(perkId);
      this.pendingPerkBalls += choice.spawnedBalls;
      this.world.applyRunModifiers(choice.modifiers);
      this.world.setSafetyCharges(
        choice.perk.id === 'safety_net'
          ? choice.modifiers.safetyNetCharges
          : previousSafety,
      );

      if (choice.pendingLevelUps > 0) {
        const offers = this.runState.takeOffers();
        this.syncHud(true);
        gameEvents.emit('levelup:offered', {
          offers,
          level: this.runState.level,
        });
        return;
      }

      this.finishLevelUp();
    } catch (error) {
      console.warn('[progression] could not choose perk', error);
    }
  }

  fireLaser(): void {
    if (this.phase !== 'playing') return;
    if (!this.world.fireLaser()) {
      // Stuck ball or a `noLaser` wave: reflect the block reason in the HUD.
      this.syncHud(true);
      return;
    }

    this.consumeEvents(this.world.drainEvents());
    if (this.runState.pendingLevelUps > 0) {
      this.startLevelUp();
      return;
    }
    this.syncHud(true);
  }

  getTuning(): SimTuning {
    return { ...this.tuning };
  }

  setTuning(patch: Partial<SimTuning>): void {
    const next: SimTuning = { ...this.tuning };
    for (const key of Object.keys(SIM_TUNING_LIMITS) as (keyof SimTuning)[]) {
      const value = patch[key];
      if (typeof value !== 'number' || !Number.isFinite(value)) continue;
      const limits = SIM_TUNING_LIMITS[key];
      const stepped =
        limits.min +
        Math.round((value - limits.min) / limits.step) * limits.step;
      next[key] = Math.max(limits.min, Math.min(limits.max, stepped));
    }

    this.tuning = next;
    this.world.applyTuning(this.tuning);
    this.clock.reset();
    gameEvents.emit('tuning:changed', this.getTuning());
    this.syncHud(true);
  }

  resetTuning(): void {
    this.tuning = { ...SIM_TUNING_DEFAULTS };
    this.world.applyTuning(this.tuning);
    this.clock.reset();
    gameEvents.emit('tuning:changed', this.getTuning());
    this.syncHud(true);
  }

  spawnBall(): void {
    if (this.phase !== 'playing' && this.phase !== 'paused') return;
    if (this.world.spawnBall()) this.syncHud(true);
  }

  fireTestProjectile(): void {
    if (this.phase !== 'playing' && this.phase !== 'paused') return;
    if (this.world.fireProjectile()) this.syncHud(true);
  }

  debugGrantPerk(perkId: string): void {
    if (this.phase !== 'playing' && this.phase !== 'paused') return;

    const previousSafety = this.world.safetyCharges;
    const choice = this.runState.grantPerk(perkId);
    this.world.applyRunModifiers(choice.modifiers);
    this.world.setSafetyCharges(
      choice.perk.id === 'safety_net'
        ? choice.modifiers.safetyNetCharges
        : previousSafety,
    );
    if (choice.spawnedBalls > 0) {
      this.world.spawnPerkBalls(choice.spawnedBalls);
    }
    this.syncHud(true);
  }

  debugAddXp(amount: number): void {
    if (this.phase !== 'playing') return;
    this.runState.addXp(amount);
    if (this.runState.pendingLevelUps > 0) {
      this.startLevelUp();
    } else {
      this.syncHud(true);
    }
  }

  /** Debug-only deterministic defeat for E2E/layout QA. */
  debugDefeat(): void {
    if (this.phase === 'menu' || this.phase === 'run-complete' || this.phase === 'defeat') {
      return;
    }
    this.world.balls.length = 0;
    if (this.ads.isRewardedSupported && !this.adReviveUsed) {
      // QA path for the rewarded revive offer. The normal debug shortcut stays
      // deterministic on mock platforms without rewarded support.
      this.world.outcome = 'defeat';
      this.handleDefeat();
      return;
    }
    // QA shortcut: bypass Second Chance and the rewarded revive offer so E2E
    // always reaches the results screen deterministically.
    this.finishPhase(false);
  }

  /** Debug-only: skips to the next wave, or finishes the phase on the last. */
  debugNextWave(): void {
    if (!this.currentPhase) return;
    if (
      this.phase === 'menu' ||
      this.phase === 'levelup' ||
      this.phase === 'run-complete' ||
      this.phase === 'defeat'
    ) {
      return;
    }
    // `nextWave` owns the transition; temporarily mark the wave as cleared so
    // the QA button can skip without waiting for the last block.
    this.phase = 'cleared';
    this.nextWave();
  }

  /** Debug-only deterministic victory for results/unlock E2E. */
  debugVictory(): void {
    if (this.phase === 'menu' || this.phase === 'run-complete' || this.phase === 'defeat') {
      return;
    }
    if (this.mode === 'endless') {
      // QA shortcut: an Endless run has no victory, so it ends as a defeat.
      this.finishEndless();
      return;
    }
    this.finishPhase(true);
  }

  /**
   * Debug-only jump used by campaign E2E. Starts a phase and immediately loads
   * the requested wave, bypassing normal unlock checks for QA only.
   */
  debugStartWave(phaseId: string, waveIndex: number): void {
    const phase = PHASES.find((candidate) => candidate.id === phaseId);
    if (!phase) return;

    const previousUnlock = this.save.unlockedPhase;
    if (phase.index > previousUnlock) {
      this.save = { ...this.save, unlockedPhase: phase.index };
    }
    this.startPhase(phaseId);
    this.save = { ...this.save, unlockedPhase: previousUnlock };
    if (this.currentPhase?.id !== phase.id) return;

    const index = Math.max(0, Math.min(phase.waves.length - 1, Math.floor(waveIndex)));
    if (index === 0) return;

    this.currentWaveIndex = index;
    this.waveScoreAtStart = 0;
    this.pendingPerkBalls = 0;
    this.nextWaveAt = 0;
    this.levelUpRevealAt = 0;
    this.ballRespawnLeftMs = 0;
    this.loadPhaseWave(index);
    this.scene.setPhase(phase.id, phase.index);
    if (phase.tutorial) this.tutorialStep = index === 0 ? 'move' : 'specials';
    this.phase = 'playing';
    this.pendingLaunch = false;
    this.input.resetTarget();
    this.clock.reset();
    this.syncHud(true);
  }

  destroy(): void {
    document.removeEventListener('visibilitychange', this.handleVisibility);
    this.unsubscribePause();
    this.unsubscribeAudio();
    this.audio.dispose();
    this.input.dispose();
    this.phaser.destroy(true);
  }

  /** Keeps Space/arrow keys on the field instead of a stale DOM button. */
  private focusGameplay(): void {
    const active = document.activeElement;
    if (active instanceof HTMLElement && active.closest('#ui-root')) active.blur();
    this.phaser.canvas.focus({ preventScroll: true });
  }

  // -------------------------------------------------------------------------
  // Phase flow
  // -------------------------------------------------------------------------

  private async loadPersistedState(): Promise<void> {
    try {
      const snapshot: SaveSnapshot = await this.saveRepository.load();
      this.save = snapshot.save;
      this.settings = snapshot.settings;
    } catch (error) {
      console.warn('[save] could not load save; using defaults', error);
      this.save = createDefaultSave();
      this.settings = createDefaultSettings();
    }
    this.audio.setEnabled(this.settings.sound);
    this.audio.setMusicEnabled(this.settings.music);
    this.scene.setScreenShakeEnabled(this.settings.screenShake);
    this.syncHud(true);
  }

  private loadPhaseWave(index: number): void {
    const phase = this.currentPhase;
    if (!phase) return;
    const wave = phase.waves[index];
    if (!wave) return;
    this.currentWaveDef = wave;
    this.world.setSeed(
      (this.runSeed ^ ((index + 1) * 0x9e3779b9)) >>> 0,
    );
    this.world.loadWave(wave);
    this.world.applyRunModifiers(this.runState.modifiers);
    this.world.setSafetyCharges(this.runState.modifiers.safetyNetCharges);
    this.world.reset();
    // Discard load-time events (notably the duplicated `boss:spawned`) so the
    // first real step only reports fresh simulation events.
    this.world.drainEvents();
    this.armMultiballForWave();
    this.waveIntroUntil = wave.intro ? performance.now() + 3500 : 0;
  }

  /**
   * Multiball slots are re-armed on every wave. The player still launches one
   * ball; the extra balls follow automatically in a short sequence.
   */
  private armMultiballForWave(): void {
    this.pendingMultiballBalls = Math.max(
      0,
      Math.floor(this.runState.modifiers.multiballLevel),
    );
    this.multiballLaunchArmed = false;
    this.nextMultiballLaunchAt = 0;
  }

  /** Loads the stored campaign wave or regenerates the current Endless wave. */
  private loadCurrentWave(): void {
    if (this.mode === 'endless') {
      this.loadEndlessWave(this.currentWaveIndex + 1);
      return;
    }
    this.loadPhaseWave(this.currentWaveIndex);
  }

  private loadEndlessWave(waveNumber: number): void {
    const wave = endlessWave(waveNumber, this.runSeed);
    this.currentWaveIndex = waveNumber - 1;
    this.currentWaveDef = wave;
    this.world.setSeed((this.runSeed ^ ((waveNumber + 1) * 0x9e3779b9)) >>> 0);
    this.world.loadWave(wave);
    this.world.applyRunModifiers(this.runState.modifiers);
    this.world.setSafetyCharges(this.runState.modifiers.safetyNetCharges);
    this.world.reset();
    this.world.drainEvents();
    this.armMultiballForWave();
    this.waveIntroUntil = wave.intro ? performance.now() + 3500 : 0;
  }

  private nextSeed(): number {
    this.runCount += 1;
    return (Date.now() + Math.imul(this.runCount, 0x9e3779b9)) >>> 0;
  }

  private startLevelUp(): void {
    if (this.phase !== 'playing') return;
    if (this.currentPhase?.tutorial && this.tutorialStep === 'move') {
      this.tutorialStep = 'levelup';
    }
    this.phase = 'levelup';
    this.clock.reset();
    this.pendingLaunch = false;

    this.audio.play('level-up');
    this.audio.setSuspended(true);
    this.scene.celebrate();
    this.sendLevelMessage('level_paused');
    this.levelUpRevealAt = performance.now() + LEVEL_UP_REVEAL_MS;

    this.syncHud(true);
  }

  /** Shows the perk cards after the XP bar flash has had time to read. */
  private revealLevelUp(): void {
    if (this.phase !== 'levelup' || this.levelUpRevealAt <= 0) return;
    this.levelUpRevealAt = 0;
    const offers = this.runState.takeOffers();
    gameEvents.emit('levelup:offered', {
      offers,
      level: this.runState.level,
    });
  }

  private finishLevelUp(): void {
    this.phase = 'playing';
    this.levelUpRevealAt = 0;
    this.audio.setSuspended(false);
    this.sendLevelMessage('level_resumed');
    this.focusGameplay();
    this.clock.reset();

    if (this.pendingPerkBalls > 0) {
      this.world.spawnPerkBalls(this.pendingPerkBalls);
      this.pendingPerkBalls = 0;
    }

    gameEvents.emit('levelup:closed', { level: this.runState.level });

    if (this.world.outcome === 'cleared') {
      this.finishWave();
      return;
    }
    if (this.world.outcome === 'defeat') {
      this.handleDefeat();
      return;
    }
    this.syncHud(true);
  }

  /**
   * Second Chance hook: consumes the single revive charge for this run.
   * Returns false when unavailable or the world is not defeated.
   */
  private tryRevive(): boolean {
    if (this.reviveUsed) return false;
    if (this.runState.modifiers.reviveCharges <= 0) return false;
    if (!this.world.revive()) return false;
    this.reviveUsed = true;
    this.audio.play('safety');
    this.syncHud(true);
    return true;
  }

  /** Handles a lost run: Second Chance, rewarded revive offer, then results. */
  private handleDefeat(): void {
    if (this.phase === 'revive-offer') return;
    if (this.tryRevive()) return;
    if (!this.adReviveUsed && this.ads.isRewardedSupported) {
      this.openAdReviveOffer();
      return;
    }
    this.finishPhase(false);
  }

  private openAdReviveOffer(): void {
    if (this.phase === 'run-complete' || this.phase === 'defeat') return;
    this.adReviveUsed = true;
    this.phase = 'revive-offer';
    this.clock.reset();
    this.pendingLaunch = false;
    this.nextWaveAt = 0;
    this.levelUpRevealAt = 0;
    this.audio.setSuspended(true);
    this.sendLevelMessage('level_paused');
    this.syncHud(true);
  }

  acceptAdRevive(): void {
    if (this.phase !== 'revive-offer') return;
    void this.runRewardedRevive();
  }

  declineAdRevive(): void {
    if (this.phase !== 'revive-offer' || this.adBusy) return;
    this.finishPhase(false);
  }

  private async runRewardedRevive(): Promise<void> {
    if (this.phase !== 'revive-offer' || this.adBusy) return;
    this.adBusy = true;
    this.lastRewardedAt = performance.now();
    this.audio.setBackground(true);
    gameEvents.emit('ad:state', { state: 'requested' });

    let result: RewardedResult = 'failed';
    try {
      result = await this.ads.showRewarded(REVIVE_REWARDED_PLACEMENT);
    } catch (error) {
      console.warn('[ads] rewarded revive failed', error);
    } finally {
      // Always release the overlay/mute lock, even if the ad service throws.
      this.adBusy = false;
      this.audio.setBackground(false);
      gameEvents.emit('ad:state', { state: 'finished' });
    }

    // The UI cannot normally act behind the blocking overlay, but a platform
    // event or debug command may still have changed the phase mid-ad.
    if (this.phase !== 'revive-offer') return;

    if (result === 'rewarded' && this.world.revive()) {
      this.phase = 'playing';
      this.phaseResult = null;
      this.nextWaveAt = 0;
      this.levelUpRevealAt = 0;
      this.ballRespawnLeftMs = 0;
      this.audio.setSuspended(false);
      this.sendLevelMessage('level_resumed');
      this.focusGameplay();
      this.clock.reset();
      this.pendingLaunch = false;
      this.input.resetTarget();
      this.syncHud(true);
      return;
    }

    this.finishPhase(false);
  }

  private finishWave(): void {
    if (!this.currentPhase) return;

    const waveNumber = this.currentWaveIndex + 1;
    const lastCampaignWave =
      this.mode === 'campaign' && waveNumber >= this.currentPhase.waves.length;

    // The tutorial finishes with two short "what's next" coach marks before
    // the results screen. Everyone else goes straight to the phase results.
    if (lastCampaignWave && this.currentPhase.tutorial) {
      this.beginWaveClear();
      this.tutorialStep = 'bosses';
      this.nextWaveAt = performance.now() + 2600;
      this.syncHud(true);
      return;
    }

    // Never put a wave interstitial between the last block and the phase
    // results. The natural break belongs after the player leaves the results.
    if (lastCampaignWave) {
      this.finishPhase(true);
      return;
    }

    const adDue = this.shouldShowWaveAd();
    this.beginWaveClear();

    if (!adDue) {
      this.scheduleNextWaveOrResults(false);
      return;
    }

    const placement =
      this.mode === 'endless'
        ? ENDLESS_INTERSTITIAL_PLACEMENT
        : WAVE_INTERSTITIAL_PLACEMENT;
    this.showWaveInterstitial(placement, () => {
      this.scheduleNextWaveOrResults(false);
    });
  }

  /** True when the just-cleared wave should trigger a mid-run interstitial. */
  private shouldShowWaveAd(): boolean {
    if (!this.ads.isInterstitialSupported || this.adBusy) return false;
    if (this.currentPhase?.tutorial) return false;
    // Campaign ads only appear before a following wave. Endless has no final
    // wave, so its every-fourth-wave cadence remains unchanged.
    const phaseComplete =
      this.mode === 'campaign' &&
      this.currentWaveIndex + 1 >= this.currentPhase!.waves.length;
    return shouldShowWaveInterstitial(
      this.mode,
      this.currentWaveIndex + 1,
      phaseComplete,
    );
  }

  private beginWaveClear(): void {
    this.phase = 'cleared';
    this.nextWaveAt = 0;
    this.levelUpRevealAt = 0;
    this.ballRespawnLeftMs = 0;
    this.clock.reset();
    this.pendingLaunch = false;
    this.pendingPerkBalls = 0;
    this.syncHud(true);
  }

  private scheduleNextWaveOrResults(lastCampaignWave: boolean): void {
    if (this.phase !== 'cleared') return;
    if (lastCampaignWave) {
      this.finishPhase(true);
      return;
    }
    this.nextWaveAt = performance.now() + WAVE_TRANSITION_MS;
    this.syncHud(true);
  }

  private showWaveInterstitial(placement: string, after: () => void): void {
    if (this.adBusy) {
      after();
      return;
    }

    const phaseAtStart = this.phase;
    this.adBusy = true;
    this.lastInterstitialAt = performance.now();
    this.audio.setBackground(true);
    gameEvents.emit('ad:state', { state: 'requested' });

    void (async () => {
      let result: InterstitialResult = 'failed';
      try {
        result = await this.ads.showInterstitial(placement);
      } catch (error) {
        console.warn('[ads] wave interstitial failed', error);
      } finally {
        // Always release the overlay/mute lock, even if the ad service throws.
        this.adBusy = false;
        this.audio.setBackground(false);
        gameEvents.emit('ad:state', { state: 'finished', result });
      }

      // A restart/menu action may have won the race while the ad was open.
      if (this.phase !== phaseAtStart) return;
      after();
    })();
  }

  private finishPhase(victory: boolean): void {
    if (this.mode === 'endless') {
      this.finishEndless();
      return;
    }

    const phase = this.currentPhase;
    if (!phase) return;
    // Terminal states are final. `revive-offer` is intentionally allowed so a
    // declined or failed rewarded revive can finish the run.
    if (this.phase === 'run-complete' || this.phase === 'defeat') return;

    const nextPhase = victory
      ? PHASES.find((candidate) => candidate.index === phase.index + 1) ?? null
      : null;
    const score = this.runScore;
    const timeMs = Math.max(0, Math.round(this.phaseElapsedMs));
    const ending = endingForResult({
      phaseIndex: phase.index,
      phaseName: phase.name,
      phaseCount: CAMPAIGN_PHASE_COUNT,
      victory,
      score,
      timeMs,
    });

    const provisional: PhaseResult = {
      phaseId: phase.id,
      phaseName: phase.name,
      phaseIndex: phase.index,
      phaseCount: CAMPAIGN_PHASE_COUNT,
      tutorial: phase.tutorial === true,
      victory,
      score,
      timeMs,
      level: this.runState.level,
      perks: this.runState.perks,
      bestScore: null,
      bestTimeMs: null,
      nextPhaseId: nextPhase?.id ?? null,
      ending,
    };

    const updated = applyPhaseResult(this.save, provisional);
    this.save = updated;
    const stats = getPhaseStats(updated, phase.id);
    this.phaseResult = {
      ...provisional,
      bestScore: stats.bestScore,
      bestTimeMs: stats.bestTimeMs,
    };
    this.phase = victory ? 'run-complete' : 'defeat';
    this.nextWaveAt = 0;
    this.levelUpRevealAt = 0;
    this.ballRespawnLeftMs = 0;
    this.clock.reset();
    this.pendingLaunch = false;
    this.pendingPerkBalls = 0;
    this.audio.setSuspended(false);
    this.audio.play(victory ? 'victory' : 'defeat');
    if (victory) this.scene.celebrate();
    this.sendPlatform(victory ? 'level_completed' : 'level_failed', {
      world: phase.id,
      level: phase.index,
    });
    this.syncHud(true);

    void this.saveRepository.save(updated).catch((error: unknown) => {
      console.warn('[save] could not persist phase result', error);
    });
  }

  /** Records and presents the end of an Endless run (always a defeat). */
  private finishEndless(): void {
    if (this.phase === 'defeat' || this.phase === 'run-complete') return;

    const wave = Math.max(1, this.currentWaveIndex + 1);
    const score = this.runScore;
    const timeMs = Math.max(0, Math.round(this.phaseElapsedMs));
    const updated = applyEndlessResult(this.save, wave, score);
    this.save = updated;
    const stats = getEndlessStats(updated);

    this.phaseResult = {
      phaseId: 'endless',
      phaseName: 'Endless',
      phaseIndex: 0,
      phaseCount: 0,
      victory: false,
      score,
      timeMs,
      level: this.runState.level,
      perks: this.runState.perks,
      bestScore: stats.bestScore,
      bestTimeMs: null,
      nextPhaseId: null,
      ending: endlessEnding(wave, score),
      endless: true,
      waveReached: wave,
      bestWave: stats.bestWave,
    };
    this.phase = 'defeat';
    this.nextWaveAt = 0;
    this.levelUpRevealAt = 0;
    this.ballRespawnLeftMs = 0;
    this.pendingMultiballBalls = 0;
    this.multiballLaunchArmed = false;
    this.nextMultiballLaunchAt = 0;
    this.clock.reset();
    this.pendingLaunch = false;
    this.pendingPerkBalls = 0;
    this.audio.setSuspended(false);
    this.audio.play('defeat');
    this.sendPlatform('level_failed', { world: 'endless', level: wave });
    this.syncHud(true);

    void this.saveRepository.save(updated).catch((error: unknown) => {
      console.warn('[save] could not persist endless result', error);
    });
  }

  /**
   * True when an exit ad is supported and not stacked on a recent one.
   * Pause-menu exits also avoid a rewarded revive that just happened; results
   * exits only avoid another interstitial, so a second death can still offer
   * the normal results ad.
   */
  private canShowExitAd(pauseExit: boolean): boolean {
    if (!this.ads.isInterstitialSupported || this.adBusy) return false;
    if (this.currentPhase?.tutorial) return false;
    const now = performance.now();
    if (now - this.lastInterstitialAt < AD_EXIT_COOLDOWN_MS) return false;
    if (pauseExit && now - this.lastRewardedAt < AD_EXIT_COOLDOWN_MS) return false;
    return true;
  }

  private async showExitAd(
    placement: string,
    action: () => void,
    pauseExit = false,
  ): Promise<void> {
    if (!this.canShowExitAd(pauseExit)) {
      action();
      return;
    }

    const phaseAtStart = this.phase;
    this.adBusy = true;
    this.lastInterstitialAt = performance.now();
    this.audio.setBackground(true);
    gameEvents.emit('ad:state', { state: 'requested' });

    let result: InterstitialResult = 'failed';
    try {
      result = await this.ads.showInterstitial(placement);
    } catch (error) {
      console.warn('[ads] interstitial failed', error);
    } finally {
      // Always release the overlay/mute lock, even if the ad service throws.
      this.adBusy = false;
      this.audio.setBackground(false);
      gameEvents.emit('ad:state', { state: 'finished', result });
    }

    // A menu/pause action may have won the race while the ad was open.
    if (this.phase !== phaseAtStart) return;
    action();
  }

  /** Pauses audio, blocks the results UI and shows at most one interstitial. */
  private async runResultsAction(action: () => void): Promise<void> {
    if (this.adBusy) return;
    await this.showExitAd(INTERSTITIAL_PLACEMENT, action);
  }

  /** Natural pause: leaving a live run through the pause menu. */
  private async runPauseExitAction(action: () => void): Promise<void> {
    if (this.adBusy) return;
    await this.showExitAd(PAUSE_EXIT_INTERSTITIAL_PLACEMENT, action, true);
  }

  private sendLevelMessage(message: 'level_paused' | 'level_resumed'): void {
    const phase = this.currentPhase;
    if (!phase) return;
    this.sendPlatform(message, { world: phase.id, level: phase.index });
  }

  private sendPlatform(
    message: PlatformMessage,
    payload?: PlatformMessagePayload,
  ): void {
    if (!this.platform) return;
    void this.platform.sendMessage(message, payload).catch((error: unknown) => {
      console.warn('[platform] message was not accepted', message, error);
    });
  }

  // -------------------------------------------------------------------------
  // Frame loop
  // -------------------------------------------------------------------------

  private frame(deltaMs: number): void {
    if (
      this.phase === 'levelup' &&
      this.levelUpRevealAt > 0 &&
      performance.now() >= this.levelUpRevealAt
    ) {
      this.revealLevelUp();
      return;
    }

    if (
      this.phase === 'cleared' &&
      this.nextWaveAt > 0 &&
      performance.now() >= this.nextWaveAt
    ) {
      this.nextWaveAt = 0;
      if (this.currentPhase?.tutorial && this.tutorialStep === 'bosses') {
        this.tutorialStep = 'endless';
        this.nextWaveAt = performance.now() + 2600;
        this.syncHud(true);
        return;
      }
      if (this.currentPhase?.tutorial && this.tutorialStep === 'endless') {
        this.tutorialStep = null;
        this.finishPhase(true);
        return;
      }
      this.nextWave();
      return;
    }

    const actions = this.input.consumeActions();
    if (actions.togglePause) this.togglePause();
    if (actions.laser) this.fireLaser();

    if (this.phase !== 'playing') {
      this.clock.reset();
      this.pendingLaunch = false;
      this.syncHud();
      return;
    }

    // Only active gameplay advances the run clock. Pause, level-up, results,
    // wave ads and the revive offer all keep `phase !== 'playing'`, so their
    // time is never counted in `phaseElapsedMs`.
    this.phaseElapsedMs += Math.max(0, Math.min(deltaMs, 250));
    this.tickBallRespawn(deltaMs);

    if (actions.launch) this.pendingLaunch = true;

    const steps = this.clock.advance(deltaMs, this.tuning.fixedStepHz, MAX_SUBSTEPS);
    const stepMs = 1000 / this.tuning.fixedStepHz;
    let leveledUp = false;

    for (let index = 0; index < steps; index += 1) {
      const sampled = this.input.sample();
      this.world.step(
        {
          paddleTargetX: sampled.paddleTargetX,
          paddleDirection: sampled.paddleDirection,
          launch: this.pendingLaunch,
        },
        stepMs,
      );
      this.pendingLaunch = false;
      this.consumeEvents(this.world.drainEvents());

      if (this.runState.pendingLevelUps > 0) {
        leveledUp = true;
        break;
      }
    }

    this.armMultiballFromLaunch(actions.launch);

    if (this.world.outcome === 'defeat') {
      this.handleDefeat();
      return;
    }
    if (leveledUp) {
      this.startLevelUp();
      return;
    }
    if (this.world.outcome === 'cleared') {
      this.finishWave();
      return;
    }

    this.tickMultiballLaunch(performance.now());
    this.syncHud();
  }

  /**
   * The first launch releases the attached ball and arms the extra Multiball
   * slots. They are spawned one at a time so the player can read the field.
   */
  private armMultiballFromLaunch(launchRequested: boolean): void {
    if (!launchRequested || this.pendingMultiballBalls <= 0) return;
    if (!this.world.balls.some((ball) => !ball.stuck)) return;
    if (this.multiballLaunchArmed) return;
    this.multiballLaunchArmed = true;
    this.nextMultiballLaunchAt = performance.now() + 180;
  }

  private tickMultiballLaunch(now: number): void {
    if (!this.multiballLaunchArmed || this.pendingMultiballBalls <= 0) return;
    if (this.phase !== 'playing' || !this.world.isRunning) return;
    if (now < this.nextMultiballLaunchAt) return;
    if (!this.world.balls.some((ball) => !ball.stuck)) {
      this.nextMultiballLaunchAt = now + 500;
      return;
    }
    if (this.world.balls.length >= this.world.maxBalls) {
      this.nextMultiballLaunchAt = now + 500;
      return;
    }
    if (this.world.spawnPerkBalls(1) > 0) {
      this.pendingMultiballBalls -= 1;
      this.nextMultiballLaunchAt = now + 220;
    } else {
      this.nextMultiballLaunchAt = now + 500;
    }
    if (this.pendingMultiballBalls <= 0) this.multiballLaunchArmed = false;
  }

  /** Converts simulation events into run score, XP, feedback and level-up state. */
  private consumeEvents(events: readonly SimEvent[]): void {
    if (events.length === 0) return;
    this.scene.pushEvents(events);

    for (const event of events) {
      switch (event.type) {
        case 'block:destroyed':
          this.runScore += event.score;
          this.runState.addXp(event.xp);
          this.audio.play('block-break');
          break;
        case 'block:hit':
          if (event.hp > 0) {
            this.audio.play('block-damage', {
              rate: 0.96 + Math.min(3, Math.max(1, event.damage)) * 0.025,
              volume: 0.9,
            });
          }
          break;
        case 'paddle:hit':
          this.audio.play('paddle');
          break;
        case 'ball:launched':
          if (this.currentPhase?.tutorial && this.tutorialStep === 'move') {
            this.tutorialStep = 'levelup';
          }
          break;
        case 'ball:lost':
          this.audio.play('ball-lost');
          this.scheduleBallRespawn();
          break;
        case 'laser:fired':
          this.audio.play('laser');
          break;
        case 'explosion':
          this.audio.play('explosion');
          break;
        case 'safety-net':
          this.audio.play('safety');
          break;
        case 'wave:cleared':
          this.runScore += 100;
          this.audio.play('wave-clear');
          break;
        case 'critical':
          this.audio.play('block-damage', { rate: 1.35 });
          break;
        case 'block:healed':
          this.audio.play('block-hit', { rate: 1.3, volume: 0.5 });
          break;
        case 'block:spawned':
          this.audio.play('block-hit', { rate: 0.8, volume: 0.5 });
          break;
        case 'multiplier:activated':
          this.audio.play('safety', { rate: 1.2, volume: 0.8 });
          break;
        case 'link:pulse':
          this.audio.play('block-damage', { rate: 1.1, volume: 0.6 });
          break;
        case 'element:hit':
          this.audio.play('paddle', { rate: 0.8, volume: 0.5 });
          break;
        case 'portal:teleport':
          this.audio.play('safety', { rate: 1.5, volume: 0.6 });
          break;
        case 'boss:spawned':
          this.audio.play('explosion', { rate: 0.7, volume: 0.8 });
          break;
        case 'boss:hit':
          this.audio.play('block-damage', { rate: 0.7, volume: 0.8 });
          break;
        case 'boss:defeated':
          this.audio.play('explosion', { rate: 0.6 });
          break;
        case 'boss:attack':
          this.audio.play('laser', { rate: 0.6, volume: 0.6 });
          break;
        case 'boss:shard-hit':
          this.audio.play('ball-lost', { rate: 1.4, volume: 0.5 });
          break;
        case 'revive':
          this.audio.play('safety');
          break;
        case 'rule:failed':
        case 'combo:changed':
        case 'multiplier:expired':
          break;
        default:
          break;
      }
    }
  }

  private readonly handleVisibility = (): void => {
    this.audio.setBackground(document.hidden);
    if (document.hidden) this.pause();
  };

  /**
   * Schedules one lost Multiball extra to come back after a long cooldown.
   * The timer is pause-aware and refills one ball at a time.
   */
  private scheduleBallRespawn(): void {
    if (this.phase !== 'playing' || this.world.outcome !== 'playing') return;
    const multiballLevel = this.runState.modifiers.multiballLevel;
    if (multiballLevel <= 0) return;
    const target = 1 + multiballLevel;
    if (this.world.balls.length >= target) return;
    if (this.ballRespawnLeftMs <= 0) this.ballRespawnLeftMs = BALL_RESPAWN_MS;
  }

  private tickBallRespawn(deltaMs: number): void {
    if (this.ballRespawnLeftMs <= 0) return;
    this.ballRespawnLeftMs = Math.max(
      0,
      this.ballRespawnLeftMs - Math.max(0, Math.min(deltaMs, 250)),
    );
    if (this.ballRespawnLeftMs > 0) return;

    const target = 1 + this.runState.modifiers.multiballLevel;
    if (this.world.outcome === 'playing' && this.world.balls.length < target) {
      this.world.spawnBall();
    }

    if (
      this.world.outcome === 'playing' &&
      this.world.balls.length < target
    ) {
      this.ballRespawnLeftMs = BALL_RESPAWN_MS;
    } else {
      this.ballRespawnLeftMs = 0;
    }
    this.syncHud(true);
  }

  // -------------------------------------------------------------------------
  // HUD
  // -------------------------------------------------------------------------

  private buildHud(): HudSnapshot {
    const modifiers = this.runState.modifiers;
    const phase = this.currentPhase;
    const endless = this.mode === 'endless';
    const wave = this.currentWaveDef ?? phase?.waves[this.currentWaveIndex] ?? null;
    const stats = !endless && phase ? getPhaseStats(this.save, phase.id) : null;
    const endlessStats = endless ? getEndlessStats(this.save) : null;
    const laser =
      modifiers.laserCooldown !== null
        ? {
            acquired: true,
            ready: this.world.laserReady,
            blocked: this.world.laserBlockedReason,
            cooldownMs: Math.max(1, Math.round(modifiers.laserCooldown)),
            remainingMs: Math.max(
              0,
              Math.ceil(this.world.laserRemainingMs / 100) * 100,
            ),
          }
        : null;
    const timeLimitRemainingMs = this.world.timeLimitRemainingMs;
    const rule =
      this.world.noLaserRule
        ? { kind: 'noLaser' as const, remainingMs: null }
        : timeLimitRemainingMs !== null
          ? {
              kind: 'timeLimit' as const,
              remainingMs: Math.max(0, Math.ceil(timeLimitRemainingMs / 250) * 250),
            }
          : null;
    const multiplierState = this.world.multiplierState;
    const multiplier = multiplierState
      ? {
          xpFactor: multiplierState.xpFactor,
          scoreFactor: multiplierState.scoreFactor,
          remainingMs: Math.max(0, Math.ceil(multiplierState.remainingMs / 100) * 100),
        }
      : null;
    const combo =
      this.world.comboCount > 0
        ? {
            count: this.world.comboCount,
            multiplier:
              1 +
              Math.min(
                modifiers.comboMax,
                this.world.comboCount * modifiers.comboStep,
              ),
          }
        : null;
    const boss = this.world.boss;
    const waveIntro =
      this.phase === 'playing' &&
      this.waveIntroUntil > 0 &&
      performance.now() < this.waveIntroUntil
        ? wave?.intro ?? null
        : null;
    const tutorial =
      !endless && phase?.tutorial === true
        ? {
            step: this.tutorialStep ?? 'move',
            stepIndex: this.tutorialStepIndex(),
            stepCount: 5,
            canSkip: true,
          }
        : null;

    return {
      phase: this.phase,
      phaseId: phase?.id ?? '',
      phaseName: phase?.name ?? '',
      phaseIndex: phase?.index ?? 0,
      phaseCount: endless ? 0 : CAMPAIGN_PHASE_COUNT,
      isTutorial: phase?.tutorial === true,
      waveId: wave?.id ?? '',
      waveName: wave?.name ?? '',
      waveIndex: phase ? this.currentWaveIndex + 1 : 0,
      waveCount: endless ? 0 : phase?.waves.length ?? 0,
      ballsActive: this.world.balls.length,
      ballRespawnMs:
        this.ballRespawnLeftMs > 0
          ? Math.ceil(this.ballRespawnLeftMs / 1000) * 1000
          : null,
      blocksRemaining: this.world.blocks.length,
      score: this.runScore,
      ballStuck: this.world.balls.some((ball) => ball.stuck),
      level: this.runState.level,
      xp: Math.floor(this.runState.xp),
      xpToNext: this.runState.xpToNext,
      perks: this.runState.perks,
      laser,
      seed: this.runState.seed,
      elapsedMs: Math.floor(this.phaseElapsedMs / 1000) * 1000,
      bestScore: endless ? endlessStats?.bestScore ?? null : stats?.bestScore ?? null,
      bestTimeMs: endless ? null : stats?.bestTimeMs ?? null,
      soundEnabled: this.settings.sound,
      musicEnabled: this.settings.music,
      screenShakeEnabled: this.settings.screenShake,
      campaignComplete: this.save.campaignComplete,
      endlessUnlocked: this.save.campaignComplete,
      boss:
        boss && boss.hp > 0
          ? { name: boss.name, hp: boss.hp, maxHp: boss.maxHp, phase: boss.phase }
          : null,
      rule,
      multiplier,
      combo,
      waveIntro,
      tutorial,
      adReviveUsed: this.adReviveUsed,
      endless,
      endlessBestWave: this.save.endless.bestWave,
      endlessBestScore: this.save.endless.bestScore,
      result:
        this.phase === 'run-complete' || this.phase === 'defeat'
          ? this.phaseResult
          : null,
    };
  }

  private tutorialStepIndex(): number {
    switch (this.tutorialStep ?? 'move') {
      case 'move':
        return 1;
      case 'levelup':
        return 2;
      case 'specials':
        return 3;
      case 'bosses':
        return 4;
      case 'endless':
        return 5;
      default:
        return 1;
    }
  }

  private syncHud(force = false): void {
    const snapshot = this.buildHud();
    const serialized = JSON.stringify(snapshot);
    if (!force && serialized === this.lastHud) return;
    this.lastHud = serialized;
    gameEvents.emit('hud:changed', snapshot);
  }
}
