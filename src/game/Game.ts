import Phaser from 'phaser';
import type {
  AdsService,
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
  SaveRepository,
  SaveSnapshot,
  SaveV1,
  SettingsV1,
  SimTuning,
  TestWaveInfo,
} from './contracts';
import { GAME_CONFIG, SIM_TUNING_DEFAULTS, SIM_TUNING_LIMITS } from './config';
import { gameEvents } from './events';
import { AudioService } from '../audio';
import { PHASES } from '../content/phases';
import type { PhaseDef } from '../content/types';
import { InputController } from '../input/Input';
import { MemoryStorage } from '../platform/MemoryStorage';
import {
  StorageSaveRepository,
  applyPhaseResult,
  createDefaultSave,
  createDefaultSettings,
  getPhaseStats,
} from '../progression/Save';
import { RunState } from '../progression/RunState';
import { GameScene } from '../render/GameScene';
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
const INTERSTITIAL_PLACEMENT = 'phase_completed';

const NO_ADS: AdsService = {
  isInterstitialSupported: false,
  async showInterstitial(): Promise<InterstitialResult> {
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
  private currentPhase: PhaseDef | null = null;
  private currentWaveIndex = 0;
  private phaseElapsedMs = 0;
  private phaseResult: PhaseResult | null = null;
  private runScore = 0;
  private waveScoreAtStart = 0;
  private pendingPerkBalls = 0;
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

    this.input = new InputController(this.phaser.canvas, () => this.world.paddle.x);
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

  startPhase(phaseId: string): void {
    const phase = PHASES.find((candidate) => candidate.id === phaseId);
    if (!phase || phase.index > this.save.unlockedPhase) return;

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
    this.runState.startRun(this.runSeed);
    this.loadPhaseWave(0);
    this.scene.setPhase(phase.id, phase.index);
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
    if (this.phase === 'run-complete' || this.phase === 'defeat') {
      void this.runResultsAction(() => {
        if (this.currentPhase) this.startPhase(this.currentPhase.id);
        else this.returnToMenu();
      });
      return;
    }

    if (this.currentPhase) {
      this.startPhase(this.currentPhase.id);
    } else {
      this.returnToMenu();
    }
  }

  nextPhase(): void {
    if (this.phase !== 'run-complete') return;
    const nextId = this.phaseResult?.nextPhaseId ?? null;
    if (!nextId) return;
    void this.runResultsAction(() => this.startPhase(nextId));
  }

  returnToMenu(): void {
    this.phase = 'menu';
    this.currentPhase = null;
    this.currentWaveIndex = 0;
    this.phaseElapsedMs = 0;
    this.phaseResult = null;
    this.runScore = 0;
    this.waveScoreAtStart = 0;
    this.pendingPerkBalls = 0;
    this.nextWaveAt = 0;
    this.levelUpRevealAt = 0;
    this.ballRespawnLeftMs = 0;
    this.runState.reset();
    const preview = PHASES[0]?.waves[0];
    if (preview) {
      this.world.loadWave(preview);
      this.world.applyRunModifiers(this.runState.modifiers);
    }
    this.scene.setPhase(PHASES[0]!.id, 1);
    this.audio.setSuspended(false);
    this.clock.reset();
    this.pendingLaunch = false;
    this.input.resetTarget();
    this.syncHud(true);
  }

  getPhaseSelectInfo(): readonly PhaseSelectInfo[] {
    return PHASES.map((phase) => {
      const stats = getPhaseStats(this.save, phase.id);
      return {
        id: phase.id,
        name: phase.name,
        index: phase.index,
        unlocked: phase.index <= this.save.unlockedPhase,
        bestTimeMs: stats.bestTimeMs,
        bestScore: stats.bestScore,
        attempts: stats.attempts,
        clears: stats.clears,
      };
    });
  }

  setSound(enabled: boolean): void {
    this.settings = { version: 1, sound: enabled };
    this.audio.setEnabled(enabled);
    void this.saveRepository.saveSettings(this.settings).catch((error: unknown) => {
      console.warn('[save] could not persist settings', error);
    });
    this.syncHud(true);
  }

  async resetSave(): Promise<void> {
    try {
      await this.saveRepository.reset();
    } catch (error) {
      console.warn('[save] could not clear storage', error);
    }
    this.save = createDefaultSave();
    this.settings = createDefaultSettings();
    this.currentPhase = null;
    this.currentWaveIndex = 0;
    this.phaseElapsedMs = 0;
    this.phaseResult = null;
    this.runScore = 0;
    this.phase = 'menu';
    this.levelUpRevealAt = 0;
    this.ballRespawnLeftMs = 0;
    const preview = PHASES[0]?.waves[0];
    if (preview) {
      this.world.loadWave(preview);
      this.world.applyRunModifiers(this.runState.modifiers);
    }
    this.scene.setPhase(PHASES[0]!.id, 1);
    this.audio.setEnabled(true);
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
    this.loadPhaseWave(this.currentWaveIndex);
    this.scene.setPhase(this.currentPhase.id, this.currentPhase.index);
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
    if (!this.world.fireLaser()) return;

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
    this.syncHud(true);
  }

  private loadPhaseWave(index: number): void {
    const phase = this.currentPhase;
    if (!phase) return;
    const wave = phase.waves[index];
    if (!wave) return;
    this.world.setSeed(
      (this.runSeed ^ ((index + 1) * 0x9e3779b9)) >>> 0,
    );
    this.world.loadWave(wave);
    this.world.applyRunModifiers(this.runState.modifiers);
    this.world.setSafetyCharges(this.runState.modifiers.safetyNetCharges);
    this.world.reset();
  }

  private nextSeed(): number {
    this.runCount += 1;
    return (Date.now() + Math.imul(this.runCount, 0x9e3779b9)) >>> 0;
  }

  private startLevelUp(): void {
    if (this.phase !== 'playing') return;
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
      this.finishPhase(false);
      return;
    }
    this.syncHud(true);
  }

  private finishWave(): void {
    if (!this.currentPhase) return;
    if (this.currentWaveIndex + 1 >= this.currentPhase.waves.length) {
      this.finishPhase(true);
      return;
    }

    this.phase = 'cleared';
    this.nextWaveAt = performance.now() + WAVE_TRANSITION_MS;
    this.levelUpRevealAt = 0;
    this.ballRespawnLeftMs = 0;
    this.clock.reset();
    this.pendingLaunch = false;
    this.pendingPerkBalls = 0;
    this.syncHud(true);
  }

  private finishPhase(victory: boolean): void {
    const phase = this.currentPhase;
    if (!phase) return;
    if (this.phase === 'run-complete' || this.phase === 'defeat') return;

    const nextPhase = victory
      ? PHASES.find((candidate) => candidate.index === phase.index + 1) ?? null
      : null;

    const provisional: PhaseResult = {
      phaseId: phase.id,
      phaseName: phase.name,
      phaseIndex: phase.index,
      phaseCount: PHASES.length,
      victory,
      score: this.runScore,
      timeMs: Math.max(0, Math.round(this.phaseElapsedMs)),
      level: this.runState.level,
      perks: this.runState.perks,
      bestScore: null,
      bestTimeMs: null,
      nextPhaseId: nextPhase?.id ?? null,
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

  /** Pauses audio, blocks the results UI and shows at most one interstitial. */
  private async runResultsAction(action: () => void): Promise<void> {
    if (this.adBusy) return;

    if (!this.ads.isInterstitialSupported) {
      action();
      return;
    }

    const phaseAtStart = this.phase;
    this.adBusy = true;
    this.audio.setBackground(true);
    gameEvents.emit('ad:state', { state: 'requested' });

    let result: InterstitialResult = 'failed';
    try {
      result = await this.ads.showInterstitial(INTERSTITIAL_PLACEMENT);
    } catch (error) {
      console.warn('[ads] interstitial failed', error);
      result = 'failed';
    }

    this.audio.setBackground(false);
    this.adBusy = false;
    gameEvents.emit('ad:state', { state: 'finished', result });

    // A menu/pause action may have won the race while the ad was open.
    if (this.phase !== phaseAtStart) return;
    action();
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

    if (this.world.outcome === 'defeat') {
      this.finishPhase(false);
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

    this.syncHud();
  }

  /** Converts simulation events into run score, XP, feedback and level-up state. */
  private consumeEvents(events: readonly SimEvent[]): void {
    if (events.length === 0) return;
    this.scene.pushEvents(events);

    for (const event of events) {
      switch (event.type) {
        case 'block:destroyed':
          this.runScore += event.score;
          this.runState.addXp(event.maxHp);
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
    const wave = phase?.waves[this.currentWaveIndex] ?? null;
    const stats = phase ? getPhaseStats(this.save, phase.id) : null;
    const laser =
      modifiers.laserCooldown !== null
        ? {
            acquired: true,
            ready: this.world.laserReady,
            cooldownMs: Math.max(1, Math.round(modifiers.laserCooldown)),
            remainingMs: Math.max(
              0,
              Math.ceil(this.world.laserRemainingMs / 100) * 100,
            ),
          }
        : null;

    return {
      phase: this.phase,
      phaseId: phase?.id ?? '',
      phaseName: phase?.name ?? '',
      phaseIndex: phase?.index ?? 0,
      phaseCount: PHASES.length,
      waveId: wave?.id ?? '',
      waveName: wave?.name ?? '',
      waveIndex: phase ? this.currentWaveIndex + 1 : 0,
      waveCount: phase?.waves.length ?? 0,
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
      bestScore: stats?.bestScore ?? null,
      bestTimeMs: stats?.bestTimeMs ?? null,
      soundEnabled: this.settings.sound,
      result:
        this.phase === 'run-complete' || this.phase === 'defeat'
          ? this.phaseResult
          : null,
    };
  }

  private syncHud(force = false): void {
    const snapshot = this.buildHud();
    const serialized = JSON.stringify(snapshot);
    if (!force && serialized === this.lastHud) return;
    this.lastHud = serialized;
    gameEvents.emit('hud:changed', snapshot);
  }
}
