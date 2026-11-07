import Phaser from 'phaser';
import type {
  GameCommands,
  HudPhase,
  HudSnapshot,
  PerkSummary,
  SimTuning,
  TestWaveInfo,
} from './contracts';
import { GAME_CONFIG, SIM_TUNING_DEFAULTS, SIM_TUNING_LIMITS } from './config';
import { gameEvents } from './events';
import { InputController } from '../input/Input';
import { GameScene } from '../render/GameScene';
import { RunState } from '../progression/RunState';
import { FixedStepClock } from '../sim/fixedStep';
import { FIELD_WIDTH, World, type SimEvent } from '../sim/World';
import { getTestWave, getTestWaves, TEST_WAVES } from '../sim/testWaves';

export interface CanvasMetrics {
  readonly cssWidth: number;
  readonly cssHeight: number;
  readonly width: number;
  readonly height: number;
  /** Effective backing-store ratio (canvas pixels per CSS pixel). */
  readonly resolution: number;
}

const MAX_SUBSTEPS = GAME_CONFIG.maxStepsPerFrame;

function clampWorldHeight(cssWidth: number, cssHeight: number): number {
  if (cssWidth <= 0 || cssHeight <= 0) return GAME_CONFIG.worldHeight.min;
  const raw = Math.round((FIELD_WIDTH * cssHeight) / cssWidth);
  return Math.max(
    GAME_CONFIG.worldHeight.min,
    Math.min(GAME_CONFIG.worldHeight.max, raw),
  );
}

/**
 * Owns the Phaser instance, the pure simulation, the progression state and the
 * GameCommands seam used by the DOM UI.
 */
export class BlockBreakerGame implements GameCommands {
  readonly phaser: Phaser.Game;
  readonly ready: Promise<void>;

  private tuning: SimTuning = { ...SIM_TUNING_DEFAULTS };
  private readonly world: World;
  private readonly input: InputController;
  private readonly runState = new RunState();
  private readonly unsubscribePause: () => void;
  private phase: HudPhase = 'menu';
  private selectedWaveId: string = TEST_WAVES[0]!.id;
  private currentWaveIndex = 0;
  private runScore = 0;
  private waveScoreAtStart = 0;
  private pendingPerkBalls = 0;
  private runCount = 0;
  private readonly clock = new FixedStepClock();
  private pendingLaunch = false;
  private lastHud = '';

  constructor(parent: HTMLElement) {
    let resolveReady: () => void = () => {
      // Replaced synchronously below.
    };
    this.ready = new Promise<void>((resolve) => {
      resolveReady = resolve;
    });

    const cssWidth = Math.max(1, Math.round(parent.clientWidth || FIELD_WIDTH));
    const cssHeight = Math.max(
      1,
      Math.round(parent.clientHeight || GAME_CONFIG.worldHeight.min),
    );
    const worldHeight = clampWorldHeight(cssWidth, cssHeight);

    this.world = new World({
      wave: getTestWave(this.selectedWaveId),
      height: worldHeight,
      tuning: this.tuning,
      seed: 1,
    });

    const scene = new GameScene({
      world: this.world,
      onFrame: (deltaMs) => this.frame(deltaMs),
      onReady: () => resolveReady(),
    });

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

    this.input = new InputController(this.phaser.canvas, () => this.world.paddle.x);
    this.unsubscribePause = gameEvents.on('platform:pause-changed', ({ paused }) => {
      if (paused) this.pause();
    });
    document.addEventListener('visibilitychange', this.handleVisibility);

    this.runState.startRun(1);
    this.world.applyRunModifiers(this.runState.modifiers);
    this.syncHud(true);
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
  // GameCommands
  // -------------------------------------------------------------------------

  startRun(): void {
    this.startRunInternal(this.selectedWaveId);
  }

  restartRun(): void {
    this.startRunInternal(this.selectedWaveId);
  }

  restartWave(): void {
    if (this.phase === 'menu') return;
    this.runScore = this.waveScoreAtStart;
    this.pendingPerkBalls = 0;
    this.loadCurrentWaveForRun();
    this.phase = 'playing';
    this.clock.reset();
    this.pendingLaunch = false;
    this.input.resetTarget();
    this.syncHud(true);
  }

  nextWave(): void {
    if (this.phase !== 'cleared') return;
    if (this.currentWaveIndex + 1 >= TEST_WAVES.length) {
      this.phase = 'run-complete';
      this.syncHud(true);
      return;
    }

    this.currentWaveIndex += 1;
    this.waveScoreAtStart = this.runScore;
    this.pendingPerkBalls = 0;
    this.loadCurrentWaveForRun();
    this.phase = 'playing';
    this.clock.reset();
    this.pendingLaunch = false;
    this.input.resetTarget();
    this.syncHud(true);
  }

  setTestWave(waveId: string): void {
    const index = TEST_WAVES.findIndex((wave) => wave.id === waveId);
    if (index < 0) return;

    this.selectedWaveId = waveId;
    this.currentWaveIndex = index;
    this.world.loadWave(getTestWave(waveId));
    this.world.applyRunModifiers(this.runState.modifiers);
    this.world.setSafetyCharges(this.runState.modifiers.safetyNetCharges);
    this.phase = 'menu';
    this.clock.reset();
    this.pendingLaunch = false;
    this.input.resetTarget();
    this.syncHud(true);
  }

  pause(): void {
    if (this.phase !== 'playing') return;
    this.phase = 'paused';
    this.clock.reset();
    this.syncHud(true);
  }

  resume(): void {
    if (this.phase !== 'paused') return;
    this.phase = 'playing';
    this.clock.reset();
    this.syncHud(true);
  }

  togglePause(): void {
    if (this.phase === 'playing') this.pause();
    else if (this.phase === 'paused') this.resume();
  }

  getTestWaves(): readonly TestWaveInfo[] {
    return getTestWaves();
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
    this.input.dispose();
    this.phaser.destroy(true);
  }

  // -------------------------------------------------------------------------
  // Run flow
  // -------------------------------------------------------------------------

  private startRunInternal(startWaveId: string): void {
    const index = Math.max(
      0,
      TEST_WAVES.findIndex((wave) => wave.id === startWaveId),
    );
    this.currentWaveIndex = index;
    this.runState.startRun(this.nextSeed());
    this.runScore = 0;
    this.waveScoreAtStart = 0;
    this.pendingPerkBalls = 0;
    this.loadCurrentWaveForRun();
    this.phase = 'playing';
    this.clock.reset();
    this.pendingLaunch = false;
    this.input.resetTarget();
    this.syncHud(true);
  }

  private loadCurrentWaveForRun(): void {
    const wave = TEST_WAVES[this.currentWaveIndex] ?? TEST_WAVES[0]!;
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

    const offers = this.runState.takeOffers();
    this.syncHud(true);
    gameEvents.emit('levelup:offered', {
      offers,
      level: this.runState.level,
    });
  }

  private finishLevelUp(): void {
    this.phase = 'playing';
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
      this.finishDefeat();
      return;
    }
    this.syncHud(true);
  }

  private finishWave(): void {
    this.phase =
      this.currentWaveIndex + 1 >= TEST_WAVES.length
        ? 'run-complete'
        : 'cleared';
    this.clock.reset();
    this.pendingLaunch = false;
    this.pendingPerkBalls = 0;
    this.syncHud(true);
  }

  private finishDefeat(): void {
    this.phase = 'defeat';
    this.clock.reset();
    this.pendingLaunch = false;
    this.pendingPerkBalls = 0;
    this.syncHud(true);
  }

  // -------------------------------------------------------------------------
  // Frame loop
  // -------------------------------------------------------------------------

  private frame(deltaMs: number): void {
    const actions = this.input.consumeActions();
    if (actions.togglePause) this.togglePause();
    if (actions.laser) this.fireLaser();

    if (this.phase !== 'playing') {
      this.clock.reset();
      this.pendingLaunch = false;
      this.syncHud();
      return;
    }

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
      this.finishDefeat();
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

  /** Converts simulation events into run score, XP and level-up state. */
  private consumeEvents(events: readonly SimEvent[]): void {
    for (const event of events) {
      if (event.type === 'block:destroyed') {
        this.runScore += event.score;
        this.runState.addXp(event.maxHp);
      } else if (event.type === 'wave:cleared') {
        this.runScore += 100;
      }
    }
  }

  private readonly handleVisibility = (): void => {
    if (document.hidden) this.pause();
  };

  // -------------------------------------------------------------------------
  // HUD
  // -------------------------------------------------------------------------

  private buildHud(): HudSnapshot {
    const modifiers = this.runState.modifiers;
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
      waveId: this.world.waveId,
      waveName: this.world.waveName,
      waveIndex: this.currentWaveIndex + 1,
      waveCount: TEST_WAVES.length,
      ballsActive: this.world.balls.length,
      blocksRemaining: this.world.blocks.length,
      score: this.runScore,
      ballStuck: this.world.balls.some((ball) => ball.stuck),
      level: this.runState.level,
      xp: Math.floor(this.runState.xp),
      xpToNext: this.runState.xpToNext,
      perks: this.runState.perks,
      laser,
      seed: this.runState.seed,
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
