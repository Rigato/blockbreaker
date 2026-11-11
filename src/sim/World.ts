import type { RunModifiers, SimTuning } from '../game/contracts';
import { BASE_RUN_MODIFIERS, GAME_CONFIG } from '../game/config';
import { BLOCK_TYPES, type BlockTypeId } from './blocks';
import { computeFieldScale } from './layout';
import {
  aabbFromRect,
  circleOverlapsAabb,
  circleSegmentHit,
  reflectVelocity,
  rotateVelocity,
  sweptCircleAabb,
  type Aabb,
} from './collision';
import { createRng } from './rng';
import type { LevelElement, WaveDef } from '../content/types';

export const FIELD_WIDTH = GAME_CONFIG.logicalWidth;
export const BLOCK_TOP = 160;
export const BLOCK_GAP = 4;
export const PADDLE_BOTTOM_OFFSET = 120;
export const LOSS_MARGIN = 40;
export const BALL_SPAWN_GRACE_MS = 400;
export const MAX_BALLS = GAME_CONFIG.ball.maxBalls;

/** Prism Laser beam width in logical units and its on-screen flash duration. */
export const LASER_BEAM_WIDTH = 24;
export const LASER_BEAM_MS = 180;
/** Explosion visual duration. */
export const EXPLOSION_FX_MS = 260;
/** Hard cap so a turret can never flood the projectile list. */
export const MAX_PROJECTILES = 16;
/** Boss shard fall speed and radius. */
export const BOSS_SHARD_SPEED = 260;
export const BOSS_SHARD_RADIUS = 7;

/** Anti-stall thresholds from the implementation plan (§4.4). */
export const ANTI_STALL = {
  nudgeMs: 6000,
  nudgeDeg: 4,
  horizontalMs: 3000,
  horizontalRatio: 0.22,
  verticalDeg: 35,
  aboveBlocksMs: 8000,
} as const;

export interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  stuck: boolean;
  /** True when the ball was caught by the Sticky Paddle perk. */
  sticky: boolean;
  /** Milliseconds before a sticky ball releases itself; 0 when not sticky. */
  stickyHoldRemainingMs: number;
  spawnGraceMs: number;
  /** Milliseconds since the last block/paddle impact. */
  sinceInteractionMs: number;
  horizontalMs: number;
  aboveBlocksMs: number;
}

export interface Paddle {
  /** Centre X in logical units. */
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
}

/** Oscillating block movement (horizontal by default). */
export interface BlockMotion {
  axis: 'horizontal' | 'vertical';
  baseLeft: number;
  baseTop: number;
  rangePx: number;
  periodMs: number;
  phaseMs: number;
}

export interface BlockRegen {
  everyMs: number;
  timerMs: number;
}

export interface BlockGenerator {
  everyMs: number;
  timerMs: number;
  maxSpawns: number;
  spawned: number;
}

export interface Block {
  id: string;
  type: BlockTypeId;
  hp: number;
  maxHp: number;
  row: number;
  col: number;
  left: number;
  top: number;
  width: number;
  height: number;
  /** Time (ms) until the impact flash ends. */
  flashMs: number;
  motion?: BlockMotion;
  regen?: BlockRegen;
  generator?: BlockGenerator;
  linkGroup?: number;
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

/** Transient laser beam state read by the renderer. */
export interface LaserBeamFx {
  x: number;
  width: number;
  remainingMs: number;
  durationMs: number;
}

/** Transient explosion state read by the renderer. */
export interface ExplosionFx {
  x: number;
  y: number;
  radius: number;
  remainingMs: number;
  durationMs: number;
}

/** Runtime representation of one phase element. */
export interface RuntimeElement {
  id: string;
  kind: LevelElement['kind'];
  left: number;
  top: number;
  width: number;
  height: number;
  active: boolean;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  baseLeft: number;
  baseTop: number;
  axis: 'horizontal' | 'vertical';
  rangePx: number;
  periodMs: number;
  phaseMs: number;
  angleRad: number;
  lengthPx: number;
  /** Closed window for gates, in milliseconds. */
  closedMs: number;
  pairId?: string;
}

/** Boss runtime entity. */
export interface Boss {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  width: number;
  height: number;
  x: number;
  y: number;
  vx: number;
  attackMs: number;
  attackTimerMs: number;
  phase: number;
  hurtMs: number;
  pattern: 'sentinel' | 'warden' | 'void';
}

/** Boss projectile that falls towards the paddle. */
export interface BossShard {
  id: number;
  bossId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

/** Temporary multiplier buff activated by a multiplier block. */
export interface MultiplierState {
  xpFactor: number;
  scoreFactor: number;
  remainingMs: number;
}

export type WorldOutcome = 'playing' | 'cleared' | 'defeat';

export interface SimInput {
  /** Absolute logical X the paddle should track (pointer/mouse). */
  paddleTargetX: number | null;
  /** Keyboard direction: -1 left, 1 right, 0 idle. */
  paddleDirection: number;
  /** True on the step where launch is requested. */
  launch: boolean;
}

export type SimEvent =
  | { type: 'ball:launched'; ballId: number }
  | { type: 'ball:lost'; ballId: number }
  | { type: 'block:hit'; blockId: string; ballId: number; hp: number; damage: number }
  | {
      type: 'block:destroyed';
      blockId: string;
      ballId: number;
      score: number;
      maxHp: number;
      xp: number;
    }
  | { type: 'block:healed'; blockId: string; hp: number }
  | {
      type: 'block:spawned';
      blockId: string;
      blockType: BlockTypeId;
      sourceBlockId: string;
      row: number;
      col: number;
    }
  | { type: 'paddle:hit'; ballId: number }
  | { type: 'projectile:fired'; projectileId: number }
  | { type: 'projectile:hit'; projectileId: number; blockId: string }
  | { type: 'laser:fired'; x: number; width: number; hits: number }
  | { type: 'explosion'; x: number; y: number; radius: number; blockIds: readonly string[] }
  | { type: 'safety-net'; ballId: number; charges: number }
  | { type: 'wave:cleared'; score: number }
  | { type: 'run:defeat' }
  | {
      type: 'anti-stall';
      kind: 'nudge' | 'horizontal' | 'teleport';
      ballId: number;
      atMs: number;
    }
  | { type: 'multiplier:activated'; xpFactor: number; scoreFactor: number; remainingMs: number }
  | { type: 'multiplier:expired' }
  | { type: 'critical'; blockId: string; ballId: number; damage: number }
  | { type: 'link:pulse'; blockId: string; group: number; linkedIds: readonly string[] }
  | { type: 'element:hit'; elementId: string; kind: LevelElement['kind']; ballId: number }
  | { type: 'portal:teleport'; ballId: number; fromId: string; toId: string }
  | { type: 'boss:spawned'; bossId: string; name: string; hp: number; maxHp: number }
  | { type: 'boss:hit'; bossId: string; hp: number; damage: number }
  | { type: 'boss:defeated'; bossId: string }
  | { type: 'boss:attack'; bossId: string; shards: number }
  | { type: 'boss:shard-hit'; bossId: string; corrosion: number }
  | { type: 'rule:failed'; kind: 'timeLimit' }
  | { type: 'combo:changed'; count: number; multiplier: number }
  | { type: 'revive'; ballId: number };

interface Collider {
  kind: 'wall' | 'paddle' | 'block' | 'boss';
  box: Aabb;
  block?: Block;
  element?: RuntimeElement;
  boss?: Boss;
}

const NO_INPUT: SimInput = {
  paddleTargetX: null,
  paddleDirection: 0,
  launch: false,
};

/** Fallback column count for boss-only waves with no block grid. */
const FALLBACK_COLUMNS = 7;

/**
 * Pure fixed-step simulation. It owns no Phaser or DOM objects and is safe to
 * unit-test in Node. `step()` is deterministic for a given seed and input
 * sequence.
 */
export class World {
  readonly width = FIELD_WIDTH;
  height: number;
  readonly paddle: Paddle;
  readonly balls: Ball[] = [];
  readonly blocks: Block[] = [];
  readonly projectiles: Projectile[] = [];
  readonly elements: RuntimeElement[] = [];
  readonly bossShards: BossShard[] = [];

  boss: Boss | null = null;
  multiplierState: MultiplierState | null = null;
  corrosionStacks = 0;
  comboCount = 0;

  score = 0;
  timeMs = 0;
  outcome: WorldOutcome = 'playing';

  private wave: WaveDef;
  private tuning: SimTuning;
  private modifiersValue: RunModifiers = { ...BASE_RUN_MODIFIERS };
  private safetyChargesValue = 0;
  private turretTimerMs = 0;
  private laserCooldownLeftMs = 0;
  private laserBeamFx: LaserBeamFx | null = null;
  /** The player must launch this wave's ball before the laser is armed. */
  private ballLaunched = false;
  private readonly explosionFx: ExplosionFx[] = [];
  private destroyedBlocks = 0;
  private explosionDepth = 0;
  private linkDepth = 0;
  /** Perk-local kill counters, reset when the perk is acquired. */
  private explosiveCoreProgress = 0;
  private bombBallProgress = 0;
  private rng: () => number;
  private readonly eventLog: SimEvent[] = [];
  private readonly eventHistory: SimEvent[] = [];
  private readonly blockCooldowns = new Map<number, Map<string, number>>();
  private readonly portalCooldowns = new Map<number, number>();
  private nextId = 1;
  private running = false;

  private fieldScaleValue = 1;
  private cell = 60;
  private offsetX = 0;
  private gridColumns = 0;
  private gridRows = 0;
  private timeLimitRemainingMsValue: number | null = null;
  private noLaserValue = false;

  constructor(options: {
    wave: WaveDef;
    height: number;
    tuning: SimTuning;
    seed?: number;
  }) {
    this.wave = options.wave;
    this.height = options.height;
    this.tuning = { ...options.tuning };
    this.rng = createRng(options.seed ?? 1);
    this.paddle = {
      x: FIELD_WIDTH / 2,
      y: this.height - PADDLE_BOTTOM_OFFSET,
      width: this.tuning.paddleWidth,
      height: GAME_CONFIG.paddle.height,
      vx: 0,
    };
    this.loadWave(options.wave);
  }

  get waveId(): string {
    return this.wave.id;
  }

  get waveName(): string {
    return this.wave.name;
  }

  get ballSpeed(): number {
    return this.wave.ballSpeed * this.tuning.ballSpeedScale * this.modifiersValue.ballSpeedMultiplier;
  }

  get tuningState(): SimTuning {
    return { ...this.tuning };
  }

  /** Layout scale computed on wave load; never changes with resize. */
  get fieldScale(): number {
    return this.fieldScaleValue;
  }

  /** Remaining time for a `timeLimit` rule; null when the wave has no limit. */
  get timeLimitRemainingMs(): number | null {
    return this.timeLimitRemainingMsValue;
  }

  /** True while the active wave forbids the Prism Laser. */
  get noLaserRule(): boolean {
    return this.noLaserValue;
  }

  /** Re-seeds the deterministic launch/multiball RNG for a new run or wave. */
  setSeed(seed: number): void {
    this.rng = createRng((seed >>> 0) || 1);
  }

  /** Current derived run modifiers (perk hooks). */
  get modifiers(): RunModifiers {
    return { ...this.modifiersValue };
  }

  /** Maximum simultaneous balls allowed by the current modifiers. */
  get maxBalls(): number {
    return Math.min(MAX_BALLS, Math.max(1, Math.floor(this.modifiersValue.maxBalls)));
  }

  get safetyCharges(): number {
    return this.safetyChargesValue;
  }

  get laserCooldownRemainingMs(): number {
    return this.laserCooldownLeftMs;
  }

  /** Alias used by HUD wiring for the cooldown countdown. */
  get laserRemainingMs(): number {
    return this.laserCooldownLeftMs;
  }

  get laserCooldownMs(): number | null {
    return this.modifiersValue.laserCooldown;
  }

  /** Why the laser cannot fire right now, or null when it can. */
  get laserBlockedReason(): 'stuck' | 'rule' | null {
    if (this.noLaserValue) return 'rule';
    // A freshly loaded wave starts with a parked ball. Require an explicit
    // launch so a laser build cannot chip blocks before the serve.
    if (!this.ballLaunched) return 'stuck';
    return this.balls.some((ball) => !ball.stuck) ? null : 'stuck';
  }

  get laserReady(): boolean {
    return (
      this.modifiersValue.laserCooldown !== null &&
      this.modifiersValue.laserLevel > 0 &&
      this.laserCooldownLeftMs <= 0 &&
      this.laserBlockedReason === null
    );
  }

  get laserBeam(): LaserBeamFx | null {
    return this.laserBeamFx;
  }

  get explosions(): readonly ExplosionFx[] {
    return this.explosionFx;
  }

  get destroyedBlockCount(): number {
    return this.destroyedBlocks;
  }

  get isRunning(): boolean {
    return this.running;
  }

  get events(): readonly SimEvent[] {
    return this.eventLog;
  }

  /** Rolling log of recent events, useful for the debug panel. */
  get history(): readonly SimEvent[] {
    return this.eventHistory;
  }

  /**
   * Returns and clears the per-step event log. The game loop drains events
   * after every step and after out-of-step commands such as the laser, so no
   * score/XP event is consumed twice.
   */
  drainEvents(): readonly SimEvent[] {
    if (this.eventLog.length === 0) return [];
    const events = [...this.eventLog];
    this.eventLog.length = 0;
    return events;
  }

  /** Loads a wave's grid, elements, boss and challenge rules. */
  loadWave(wave: WaveDef): void {
    this.wave = wave;
    this.computeLayout(wave);
    this.blocks.length = 0;
    this.balls.length = 0;
    this.projectiles.length = 0;
    this.bossShards.length = 0;
    this.blockCooldowns.clear();
    this.score = 0;
    this.timeMs = 0;
    this.outcome = 'playing';
    this.running = false;
    this.paddle.x = FIELD_WIDTH / 2;
    this.paddle.vx = 0;
    this.resetEffectState();
    this.buildBlocks(wave);
    this.buildElements(wave);
    this.buildBoss(wave);
  }

  /** Starts a fresh run state on the loaded wave (ball attached to paddle). */
  reset(): void {
    this.balls.length = 0;
    this.projectiles.length = 0;
    this.bossShards.length = 0;
    this.blockCooldowns.clear();
    this.score = 0;
    this.timeMs = 0;
    this.outcome = 'playing';
    this.running = true;
    this.paddle.x = FIELD_WIDTH / 2;
    this.paddle.vx = 0;
    this.resetEffectState();
    this.blocks.length = 0;
    this.buildBlocks(this.wave);
    this.elements.length = 0;
    this.buildElements(this.wave);
    this.buildBoss(this.wave);
    this.spawnStuckBall();
  }

  private resetEffectState(): void {
    this.turretTimerMs = 0;
    this.laserCooldownLeftMs = 0;
    this.laserBeamFx = null;
    this.ballLaunched = false;
    this.explosionFx.length = 0;
    this.destroyedBlocks = 0;
    this.explosionDepth = 0;
    this.linkDepth = 0;
    this.explosiveCoreProgress = 0;
    this.bombBallProgress = 0;
    this.safetyChargesValue = this.modifiersValue.safetyNetCharges;
    this.multiplierState = null;
    this.corrosionStacks = 0;
    this.comboCount = 0;
    this.portalCooldowns.clear();
    this.applyRules(this.wave);
    this.applyEffectiveSize();
  }

  private applyRules(wave: WaveDef): void {
    this.timeLimitRemainingMsValue = null;
    this.noLaserValue = false;
    for (const rule of wave.rules ?? []) {
      if (rule.kind === 'timeLimit') {
        this.timeLimitRemainingMsValue = Math.max(0, rule.ms);
      } else if (rule.kind === 'noLaser') {
        this.noLaserValue = true;
      }
    }
  }

  resize(height: number): void {
    this.height = height;
    this.paddle.y = height - PADDLE_BOTTOM_OFFSET;
    this.clampPaddle();
    for (const ball of this.balls) {
      if (ball.stuck) this.parkBall(ball);
    }
  }

  applyTuning(tuning: SimTuning): void {
    this.tuning = { ...tuning };
    this.applyEffectiveSize();
    const targetSpeed = this.ballSpeed;
    for (const ball of this.balls) {
      if (ball.stuck) continue;
      const speed = Math.hypot(ball.vx, ball.vy);
      if (speed > 0) {
        ball.vx = (ball.vx / speed) * targetSpeed;
        ball.vy = (ball.vy / speed) * targetSpeed;
      }
    }
  }

  /**
   * Applies derived perk modifiers live. Base tuning (and the debug panel
   * values) are never mutated: multipliers are applied on top of them.
   */
  applyRunModifiers(modifiers: RunModifiers): void {
    const previousExplosiveEvery = this.modifiersValue.explosiveEvery;
    const previousBombEvery = this.modifiersValue.bombEvery;
    this.modifiersValue = {
      ...modifiers,
      paddleWidthMultiplier: Math.max(0.1, modifiers.paddleWidthMultiplier),
      ballRadiusMultiplier: Math.max(0.1, modifiers.ballRadiusMultiplier),
      xpMultiplier: Math.max(0, modifiers.xpMultiplier),
      ballDamage: Math.max(1, Math.floor(modifiers.ballDamage)),
      maxBalls: Math.max(1, Math.min(MAX_BALLS, Math.floor(modifiers.maxBalls))),
      turretInterval:
        modifiers.turretInterval !== null && modifiers.turretInterval > 0
          ? modifiers.turretInterval
          : null,
      laserCooldown:
        modifiers.laserCooldown !== null && modifiers.laserCooldown > 0
          ? modifiers.laserCooldown
          : null,
      laserLevel: Math.max(0, Math.min(3, Math.floor(modifiers.laserLevel))),
      safetyNetCharges: Math.max(0, Math.floor(modifiers.safetyNetCharges)),
      explosiveEvery:
        modifiers.explosiveEvery !== null && modifiers.explosiveEvery > 0
          ? Math.floor(modifiers.explosiveEvery)
          : null,
      critChance: Math.max(0, Math.min(1, modifiers.critChance)),
      critMultiplier: Math.max(1, modifiers.critMultiplier),
      laserTargetBonus: Math.max(0, Math.floor(modifiers.laserTargetBonus)),
      laserWidthMultiplier: Math.max(0.1, modifiers.laserWidthMultiplier),
      laserCooldownMultiplier: Math.max(0.1, modifiers.laserCooldownMultiplier),
      comboStep: Math.max(0, modifiers.comboStep),
      comboMax: Math.max(0, modifiers.comboMax),
      reviveCharges: Math.max(0, Math.floor(modifiers.reviveCharges)),
      bombEvery:
        modifiers.bombEvery !== null && modifiers.bombEvery > 0
          ? Math.floor(modifiers.bombEvery)
          : null,
      bossDamageBonus: Math.max(0, modifiers.bossDamageBonus),
      ballSpeedMultiplier: Math.max(0.1, modifiers.ballSpeedMultiplier),
      scoreMultiplier: Math.max(0, modifiers.scoreMultiplier),
    };

    if (previousExplosiveEvery !== this.modifiersValue.explosiveEvery) {
      this.explosiveCoreProgress = 0;
    }
    if (previousBombEvery !== this.modifiersValue.bombEvery) {
      this.bombBallProgress = 0;
    }

    this.safetyChargesValue = this.modifiersValue.safetyNetCharges;
    this.turretTimerMs = 0;
    this.laserCooldownLeftMs = 0;
    this.laserBeamFx = null;
    this.applyEffectiveSize();
  }

  /** Reloads Safety Net charges at the start of a wave. */
  setSafetyCharges(charges: number): void {
    this.safetyChargesValue = Number.isFinite(charges)
      ? Math.max(0, Math.floor(charges))
      : 0;
  }

  private effectiveBallRadius(): number {
    return Math.max(1, this.tuning.ballRadius * this.modifiersValue.ballRadiusMultiplier);
  }

  private effectivePaddleWidth(): number {
    const corrosion = 1 - this.corrosionStacks * GAME_CONFIG.elements.bossCorrosionStep;
    return Math.max(
      20,
      Math.min(
        FIELD_WIDTH,
        this.tuning.paddleWidth * this.modifiersValue.paddleWidthMultiplier * corrosion,
      ),
    );
  }

  private applyEffectiveSize(): void {
    this.paddle.width = this.effectivePaddleWidth();
    this.clampPaddle();

    const radius = this.effectiveBallRadius();
    for (const ball of this.balls) {
      ball.radius = radius;
      if (ball.stuck) this.parkBall(ball);
    }
  }

  spawnStuckBall(): Ball {
    const ball: Ball = {
      id: this.nextId++,
      x: this.paddle.x,
      y: this.paddle.y,
      vx: 0,
      vy: 0,
      radius: this.effectiveBallRadius(),
      stuck: true,
      sticky: false,
      stickyHoldRemainingMs: 0,
      spawnGraceMs: BALL_SPAWN_GRACE_MS,
      sinceInteractionMs: 0,
      horizontalMs: 0,
      aboveBlocksMs: 0,
    };
    this.parkBall(ball);
    this.balls.push(ball);
    return ball;
  }

  /** Debug/Future multiball: adds one in-play ball, respecting the cap. */
  spawnBall(): Ball | null {
    if (this.balls.length >= this.maxBalls) return null;
    const speed = this.ballSpeed;
    const sign = this.rng() < 0.5 ? -1 : 1;
    const angle = (18 * Math.PI) / 180 * sign;
    const ball: Ball = {
      id: this.nextId++,
      x: this.paddle.x,
      y: this.paddle.y - this.paddle.height / 2 - this.effectiveBallRadius() - 2,
      vx: Math.sin(angle) * speed,
      vy: -Math.cos(angle) * speed,
      radius: this.effectiveBallRadius(),
      stuck: false,
      sticky: false,
      stickyHoldRemainingMs: 0,
      spawnGraceMs: BALL_SPAWN_GRACE_MS,
      sinceInteractionMs: 0,
      horizontalMs: 0,
      aboveBlocksMs: 0,
    };
    this.balls.push(ball);
    return ball;
  }

  /**
   * Multiball perk hook: adds `count` live balls from the paddle using the
   * plan's ±18°/±36° spread. Returns how many were actually created.
   */
  spawnPerkBalls(count: number): number {
    const angles = [18, -18, 36, -36];
    const total = Math.max(0, Math.floor(count));
    let created = 0;
    for (let index = 0; index < total; index += 1) {
      if (this.balls.length >= this.maxBalls) break;
      const angle = ((angles[index % angles.length] ?? 18) * Math.PI) / 180;
      const speed = this.ballSpeed;
      const radius = this.effectiveBallRadius();
      const ball: Ball = {
        id: this.nextId++,
        x: this.paddle.x,
        y: this.paddle.y - this.paddle.height / 2 - radius - 2,
        vx: Math.sin(angle) * speed,
        vy: -Math.cos(angle) * speed,
        radius,
        stuck: false,
        sticky: false,
        stickyHoldRemainingMs: 0,
        spawnGraceMs: BALL_SPAWN_GRACE_MS,
        sinceInteractionMs: 0,
        horizontalMs: 0,
        aboveBlocksMs: 0,
      };
      this.balls.push(ball);
      created += 1;
    }
    return created;
  }

  /**
   * Prism Laser: vertical beam at the paddle column. Level L deals L damage to
   * the first `laserTargetsBase + (L - 1) * laserTargetsPerLevel + bonus`
   * blocks in the beam, ordered from the one nearest the paddle upwards.
   * Walls and obstacles stop the beam. Requires at least one free ball.
   */
  fireLaser(): boolean {
    const cooldown = this.modifiersValue.laserCooldown;
    const level = this.modifiersValue.laserLevel;
    if (cooldown === null || level <= 0 || this.laserCooldownLeftMs > 0) return false;
    if (this.outcome !== 'playing' || !this.running) return false;
    if (this.laserBlockedReason !== null) return false;

    const x = this.paddle.x;
    const width = LASER_BEAM_WIDTH * this.modifiersValue.laserWidthMultiplier;
    const half = width / 2;

    const entries: { top: number; block?: Block }[] = [];
    for (const block of this.blocks) {
      if (block.left < x + half && block.left + block.width > x - half) {
        entries.push({ top: block.top, block });
      }
    }
    for (const element of this.elements) {
      if (!this.isSolidElement(element)) continue;
      if (element.left < x + half && element.left + element.width > x - half) {
        entries.push({ top: element.top });
      }
    }
    entries.sort((a, b) => b.top - a.top);

    const targetCount = Math.max(
      1,
      GAME_CONFIG.perks.laserTargetsBase +
        (level - 1) * GAME_CONFIG.perks.laserTargetsPerLevel +
        this.modifiersValue.laserTargetBonus,
    );
    const hitTargets: Block[] = [];
    for (const entry of entries) {
      if (!entry.block) break;
      hitTargets.push(entry.block);
      if (hitTargets.length >= targetCount) break;
    }

    this.laserCooldownLeftMs = cooldown;
    this.laserBeamFx = {
      x,
      width,
      remainingMs: LASER_BEAM_MS,
      durationMs: LASER_BEAM_MS,
    };
    this.pushEvent({
      type: 'laser:fired',
      x,
      width,
      hits: hitTargets.length,
    });

    // applyDamage validates membership, so blocks destroyed by a chained
    // explosion mid-loop are safely skipped.
    for (const target of hitTargets) this.applyDamage(target, level, -1);

    if (this.boss && this.boss.hp > 0 && this.beamOverlapsBoss(x, half, this.boss)) {
      // A solid element below the boss (closer to the paddle) stops the beam.
      const blockedBeforeBoss = entries.some((entry) => !entry.block && entry.top > this.boss!.y);
      if (!blockedBeforeBoss) {
        this.damageBossTotal(level + this.modifiersValue.bossDamageBonus);
      }
    }
    return true;
  }

  fireProjectile(): Projectile | null {
    if (this.projectiles.length >= MAX_PROJECTILES) return null;
    const projectile: Projectile = {
      id: this.nextId++,
      x: this.paddle.x,
      y: this.paddle.y - this.paddle.height / 2 - 6,
      vx: 0,
      vy: -900,
      radius: 4,
    };
    this.projectiles.push(projectile);
    this.pushEvent({ type: 'projectile:fired', projectileId: projectile.id });
    return projectile;
  }

  /** Second Chance hook: restores play after a defeat with a fresh ball. */
  revive(): boolean {
    if (this.outcome !== 'defeat') return false;
    this.outcome = 'playing';
    this.running = true;
    // A time-limit defeat would otherwise re-trigger on the next step. Give
    // the revived ball a short grace window instead of an instant re-defeat.
    if (this.timeLimitRemainingMsValue !== null && this.timeLimitRemainingMsValue <= 0) {
      this.timeLimitRemainingMsValue = 10_000;
    }
    const ball = this.spawnStuckBall();
    this.pushEvent({ type: 'revive', ballId: ball.id });
    return true;
  }

  /** Applies block damage through the normal pipeline (tests/debug). */
  damageBlock(block: Block, damage: number, sourceBallId = -1): boolean {
    return this.applyDamage(block, damage, sourceBallId);
  }

  /** Applies boss damage through the normal pipeline (tests/debug). */
  damageBoss(amount: number): void {
    this.damageBossTotal(amount);
  }

  step(input: SimInput = NO_INPUT, dtMs: number = 1000 / GAME_CONFIG.fixedStepHz): readonly SimEvent[] {
    this.eventLog.length = 0;
    if (this.outcome !== 'playing' || !this.running) return this.eventLog;

    const dt = Math.max(0, dtMs) / 1000;
    this.timeMs += dtMs;

    this.updatePaddle(input, dt);
    if (input.launch) this.launchStuckBalls();
    this.updateTimers(dtMs);
    if (this.outcome !== 'playing') return this.eventLog;

    for (const block of this.blocks) {
      if (block.flashMs > 0) block.flashMs = Math.max(0, block.flashMs - dtMs);
    }

    this.updateBlockBehaviors(dtMs);
    this.updateElements();
    this.updateBoss(dt, dtMs);
    this.updateBalls(dt, dtMs);
    this.updateTurret(dtMs);
    this.updateProjectiles(dt);
    this.updateOutcome();

    return this.eventLog;
  }

  private updateTimers(dtMs: number): void {
    if (this.laserCooldownLeftMs > 0) {
      this.laserCooldownLeftMs = Math.max(0, this.laserCooldownLeftMs - dtMs);
    }
    if (this.laserBeamFx) {
      this.laserBeamFx.remainingMs -= dtMs;
      if (this.laserBeamFx.remainingMs <= 0) this.laserBeamFx = null;
    }
    for (let index = this.explosionFx.length - 1; index >= 0; index -= 1) {
      const fx = this.explosionFx[index]!;
      fx.remainingMs -= dtMs;
      if (fx.remainingMs <= 0) this.explosionFx.splice(index, 1);
    }

    if (this.multiplierState) {
      this.multiplierState.remainingMs = Math.max(0, this.multiplierState.remainingMs - dtMs);
      if (this.multiplierState.remainingMs <= 0) {
        this.multiplierState = null;
        this.pushEvent({ type: 'multiplier:expired' });
      }
    }

    if (this.timeLimitRemainingMsValue !== null) {
      this.timeLimitRemainingMsValue = Math.max(0, this.timeLimitRemainingMsValue - dtMs);
      if (this.timeLimitRemainingMsValue <= 0) {
        this.outcome = 'defeat';
        this.pushEvent({ type: 'rule:failed', kind: 'timeLimit' });
      }
    }
  }

  /** Arcane Turret perk: fires a projectile every `turretInterval` ms. */
  private updateTurret(dtMs: number): void {
    const interval = this.modifiersValue.turretInterval;
    if (interval === null) return;
    this.turretTimerMs += dtMs;
    let shots = 0;
    while (this.turretTimerMs >= interval && shots < 4) {
      this.turretTimerMs -= interval;
      this.fireProjectile();
      shots += 1;
    }
    if (this.turretTimerMs >= interval) this.turretTimerMs = interval - 1;
  }

  // -------------------------------------------------------------------------
  // Layout, grid and elements
  // -------------------------------------------------------------------------

  private computeLayout(wave: WaveDef): void {
    const rows = wave.rows.length;
    const rawColumns = wave.rows[0]?.length ?? 0;
    const columns = rawColumns > 0 ? rawColumns : FALLBACK_COLUMNS;

    let maxRow = rows;
    for (const element of wave.elements ?? []) {
      maxRow = Math.max(maxRow, element.row + (element.heightCells ?? 1));
    }
    if (wave.boss) {
      maxRow = Math.max(maxRow, wave.boss.row + wave.boss.heightCells);
    }
    const extraRows = Math.max(0, maxRow - rows);

    this.fieldScaleValue = computeFieldScale(rows, columns, extraRows);
    this.cell = (FIELD_WIDTH / columns) * this.fieldScaleValue;
    this.offsetX = (FIELD_WIDTH - columns * this.cell) / 2;
    this.gridColumns = rawColumns;
    this.gridRows = rows;
  }

  private buildBlocks(wave: WaveDef): void {
    const rows = wave.rows;
    if (rows.length === 0) return;
    const cell = this.cell;
    const cellHeight = cell;
    const columns = rows[0]?.length ?? 0;
    const rowCount = rows.length;

    rows.forEach((row, rowIndex) => {
      for (let col = 0; col < row.length; col += 1) {
        const char = row[col] ?? '.';
        const typeId = wave.legend[char];
        if (!typeId) continue;
        const type = BLOCK_TYPES[typeId];
        const left = this.offsetX + col * cell + BLOCK_GAP / 2;
        const top = BLOCK_TOP + rowIndex * cellHeight + BLOCK_GAP / 2;
        const block: Block = {
          id: `${rowIndex}:${col}`,
          type: typeId,
          hp: type.hp,
          maxHp: type.hp,
          row: rowIndex,
          col,
          left,
          top,
          width: cell - BLOCK_GAP,
          height: cellHeight - BLOCK_GAP,
          flashMs: 0,
        };

        if (type.behavior === 'moving') {
          const periodMs = GAME_CONFIG.elements.movingPeriodMs;
          const phaseSeed = (rowIndex * 7 + col * 13) % 17;
          block.motion = {
            axis: 'horizontal',
            baseLeft: left,
            baseTop: top,
            rangePx: cell * GAME_CONFIG.elements.movingRangeCells,
            periodMs,
            phaseMs: (phaseSeed / 17) * periodMs,
          };
        } else if (type.behavior === 'regenerative') {
          block.regen = {
            everyMs: GAME_CONFIG.elements.regenEveryMs,
            timerMs: GAME_CONFIG.elements.regenEveryMs,
          };
        } else if (type.behavior === 'generator') {
          block.generator = {
            everyMs: GAME_CONFIG.elements.generatorEveryMs,
            timerMs: GAME_CONFIG.elements.generatorEveryMs,
            maxSpawns: GAME_CONFIG.elements.generatorMaxSpawns,
            spawned: 0,
          };
        }

        this.blocks.push(block);
      }
    });

    // Keep stable references for the grid bounds even when the wave is sparse.
    this.gridRows = Math.max(this.gridRows, rowCount);
    this.gridColumns = Math.max(this.gridColumns, columns);
    this.assignLinkGroups();
  }

  private assignLinkGroups(): void {
    const linked = this.blocks.filter((block) => BLOCK_TYPES[block.type].behavior === 'linked');
    const byCell = new Map<string, Block>();
    for (const block of linked) {
      block.linkGroup = undefined;
      byCell.set(`${block.row}:${block.col}`, block);
    }

    const visited = new Set<string>();
    let group = 0;
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ] as const;

    for (const start of linked) {
      const startKey = `${start.row}:${start.col}`;
      if (visited.has(startKey)) continue;
      group += 1;
      const stack: Block[] = [start];
      visited.add(startKey);
      while (stack.length > 0) {
        const current = stack.pop()!;
        current.linkGroup = group;
        for (const [dRow, dCol] of directions) {
          const key = `${current.row + dRow}:${current.col + dCol}`;
          if (visited.has(key)) continue;
          const neighbour = byCell.get(key);
          if (!neighbour) continue;
          visited.add(key);
          stack.push(neighbour);
        }
      }
    }
  }

  private buildElements(wave: WaveDef): void {
    for (const definition of wave.elements ?? []) {
      const widthCells = definition.widthCells ?? 1;
      const heightCells = definition.heightCells ?? 1;
      const width = widthCells * this.cell - BLOCK_GAP;
      const height = heightCells * this.cell - BLOCK_GAP;
      const left = this.offsetX + definition.col * this.cell + BLOCK_GAP / 2;
      const top = BLOCK_TOP + definition.row * this.cell + BLOCK_GAP / 2;

      const element: RuntimeElement = {
        id: definition.id,
        kind: definition.kind,
        left,
        top,
        width,
        height,
        active: true,
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
        baseLeft: left,
        baseTop: top,
        axis: 'horizontal',
        rangePx: 0,
        periodMs: 0,
        phaseMs: 0,
        angleRad: 0,
        lengthPx: 0,
        closedMs: 0,
      };

      if (definition.kind === 'deflector') {
        const centreX = left + width / 2;
        const centreY = top + height / 2;
        // 60% of the cell diagonal: readable, but no longer dominates the lane.
        element.lengthPx = Math.hypot(width, height) * 0.6;
        element.angleRad = (definition.angleDeg * Math.PI) / 180;
        this.setSegment(element, centreX, centreY);
      } else if (definition.kind === 'portal') {
        element.pairId = definition.pairId;
      } else if (definition.kind === 'mover') {
        element.axis = definition.axis;
        element.rangePx = definition.rangeCells * this.cell;
        element.periodMs = definition.periodMs;
        element.phaseMs = definition.phaseMs ?? 0;
      } else if (definition.kind === 'rotor') {
        const centreX = left + width / 2;
        const centreY = top + height / 2;
        element.lengthPx = definition.lengthCells * this.cell;
        element.periodMs = definition.periodMs;
        element.phaseMs = definition.phaseMs ?? 0;
        element.angleRad = (element.phaseMs / element.periodMs) * Math.PI * 2;
        this.setSegment(element, centreX, centreY);
      } else if (definition.kind === 'gate') {
        element.periodMs = Math.max(1, definition.closedMs + definition.openMs);
        element.phaseMs = definition.phaseMs ?? 0;
        element.closedMs = Math.max(0, definition.closedMs);
        element.active = this.gateClosed(element);
      }

      this.elements.push(element);
    }
  }

  private setSegment(element: RuntimeElement, centreX: number, centreY: number): void {
    const half = element.lengthPx / 2;
    const cos = Math.cos(element.angleRad);
    const sin = Math.sin(element.angleRad);
    element.x1 = centreX - cos * half;
    element.y1 = centreY - sin * half;
    element.x2 = centreX + cos * half;
    element.y2 = centreY + sin * half;
  }

  private gateClosed(element: RuntimeElement): boolean {
    if (element.periodMs <= 0) return true;
    const elapsed = (this.timeMs + element.phaseMs) % element.periodMs;
    const closedMs = element.closedMs > 0 ? element.closedMs : element.periodMs / 2;
    return elapsed < closedMs;
  }

  private buildBoss(wave: WaveDef): void {
    this.boss = null;
    this.bossShards.length = 0;
    const definition = wave.boss;
    if (!definition) return;

    const width = Math.max(this.cell, definition.widthCells * this.cell - BLOCK_GAP);
    const height = Math.max(this.cell, definition.heightCells * this.cell - BLOCK_GAP);
    const boss: Boss = {
      id: definition.id,
      name: definition.name,
      hp: definition.hp,
      maxHp: definition.hp,
      width,
      height,
      x: FIELD_WIDTH / 2,
      y: BLOCK_TOP + definition.row * this.cell,
      vx: definition.moveSpeed,
      attackMs: definition.attackMs,
      attackTimerMs: definition.attackMs,
      phase: 1,
      hurtMs: 0,
      pattern: definition.pattern,
    };
    this.boss = boss;
    this.pushEvent({
      type: 'boss:spawned',
      bossId: boss.id,
      name: boss.name,
      hp: boss.hp,
      maxHp: boss.maxHp,
    });
  }

  // -------------------------------------------------------------------------
  // Block behaviours
  // -------------------------------------------------------------------------

  private updateBlockBehaviors(dtMs: number): void {
    if (this.blocks.length === 0) return;
    const snapshot = [...this.blocks];

    for (const block of snapshot) {
      if (block.motion) {
        const motion = block.motion;
        if (motion.periodMs > 0) {
          const phase = ((this.timeMs + motion.phaseMs) / motion.periodMs) * Math.PI * 2;
          const offset = Math.sin(phase) * motion.rangePx;
          if (motion.axis === 'horizontal') {
            block.left = motion.baseLeft + offset;
            block.top = motion.baseTop;
          } else {
            block.left = motion.baseLeft;
            block.top = motion.baseTop + offset;
          }
        }
      }

      if (block.regen) {
        const regen = block.regen;
        regen.timerMs -= dtMs;
        if (regen.timerMs <= 0) {
          regen.timerMs += regen.everyMs;
          if (block.hp > 0 && block.hp < block.maxHp) {
            block.hp = Math.min(block.maxHp, block.hp + 1);
            block.flashMs = 80;
            this.pushEvent({ type: 'block:healed', blockId: block.id, hp: block.hp });
          }
        }
      }

      if (block.generator) {
        const generator = block.generator;
        generator.timerMs -= dtMs;
        if (generator.timerMs <= 0) {
          generator.timerMs += generator.everyMs;
          if (generator.spawned < generator.maxSpawns) {
            if (this.spawnGeneratorBlock(block)) {
              generator.spawned += 1;
            }
          }
        }
      }
    }
  }

  private spawnGeneratorBlock(source: Block): Block | null {
    if (this.gridColumns <= 0 || this.gridRows <= 0) return null;
    const directions = [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ] as const;

    for (const [dRow, dCol] of directions) {
      const row = source.row + dRow;
      const col = source.col + dCol;
      if (row < 0 || row >= this.gridRows || col < 0 || col >= this.gridColumns) continue;
      if (this.blockAt(row, col)) continue;

      const type = BLOCK_TYPES.crystal;
      const left = this.offsetX + col * this.cell + BLOCK_GAP / 2;
      const top = BLOCK_TOP + row * this.cell + BLOCK_GAP / 2;
      const block: Block = {
        id: `${row}:${col}`,
        type: 'crystal',
        hp: type.hp,
        maxHp: type.hp,
        row,
        col,
        left,
        top,
        width: this.cell - BLOCK_GAP,
        height: this.cell - BLOCK_GAP,
        flashMs: 0,
      };
      this.blocks.push(block);
      this.pushEvent({
        type: 'block:spawned',
        blockId: block.id,
        blockType: block.type,
        sourceBlockId: source.id,
        row,
        col,
      });
      return block;
    }
    return null;
  }

  private blockAt(row: number, col: number): Block | undefined {
    return this.blocks.find((block) => block.row === row && block.col === col);
  }

  // -------------------------------------------------------------------------
  // Elements
  // -------------------------------------------------------------------------

  private updateElements(): void {
    for (const element of this.elements) {
      if (element.kind === 'mover') {
        if (element.periodMs <= 0) continue;
        const phase = ((this.timeMs + element.phaseMs) / element.periodMs) * Math.PI * 2;
        const offset = Math.sin(phase) * element.rangePx;
        if (element.axis === 'horizontal') {
          element.left = element.baseLeft + offset;
          element.top = element.baseTop;
        } else {
          element.left = element.baseLeft;
          element.top = element.baseTop + offset;
        }
      } else if (element.kind === 'rotor') {
        if (element.periodMs <= 0) continue;
        element.angleRad = ((this.timeMs + element.phaseMs) / element.periodMs) * Math.PI * 2;
        const centreX = element.left + element.width / 2;
        const centreY = element.top + element.height / 2;
        this.setSegment(element, centreX, centreY);
      } else if (element.kind === 'gate') {
        element.active = this.gateClosed(element);
      }
    }
  }

  private isSolidElement(element: RuntimeElement): boolean {
    if (element.kind === 'wall' || element.kind === 'obstacle' || element.kind === 'mover') {
      return true;
    }
    return element.kind === 'gate' && element.active;
  }

  private isSegmentElement(element: RuntimeElement): boolean {
    return (element.kind === 'deflector' || element.kind === 'rotor') && element.active;
  }

  // -------------------------------------------------------------------------
  // Paddle
  // -------------------------------------------------------------------------

  private updatePaddle(input: SimInput, dt: number): void {
    const previousX = this.paddle.x;
    const maxSpeed = this.tuning.paddleMaxSpeed;

    if (input.paddleTargetX !== null && Number.isFinite(input.paddleTargetX)) {
      const target = input.paddleTargetX;
      const delta = target - this.paddle.x;
      const maxMove = maxSpeed * dt;
      if (Math.abs(delta) <= maxMove) {
        this.paddle.x = target;
        this.paddle.vx = dt > 0 ? delta / dt : 0;
      } else {
        const direction = Math.sign(delta);
        this.paddle.x += direction * maxMove;
        this.paddle.vx = direction * maxSpeed;
      }
    } else if (input.paddleDirection !== 0) {
      const acceleration = maxSpeed * 4;
      this.paddle.vx += input.paddleDirection * acceleration * dt;
      this.paddle.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.paddle.vx));
      this.paddle.x += this.paddle.vx * dt;
    } else {
      const acceleration = maxSpeed * 6;
      const brake = acceleration * dt;
      if (Math.abs(this.paddle.vx) <= brake) {
        this.paddle.vx = 0;
      } else {
        this.paddle.vx -= Math.sign(this.paddle.vx) * brake;
      }
      this.paddle.x += this.paddle.vx * dt;
    }

    this.clampPaddle();
    if (this.paddle.x === previousX) this.paddle.vx = 0;
    for (const ball of this.balls) {
      if (ball.stuck) this.parkBall(ball);
    }
  }

  private clampPaddle(): void {
    const half = this.paddle.width / 2;
    const min = half;
    const max = FIELD_WIDTH - half;
    if (this.paddle.x < min) {
      this.paddle.x = min;
      this.paddle.vx = 0;
    } else if (this.paddle.x > max) {
      this.paddle.x = max;
      this.paddle.vx = 0;
    }
  }

  private parkBall(ball: Ball): void {
    ball.x = this.paddle.x;
    ball.y = this.paddle.y - this.paddle.height / 2 - ball.radius - 1;
  }

  private launchStuckBalls(): void {
    for (const ball of this.balls) {
      if (!ball.stuck) continue;
      this.launchBall(ball);
    }
  }

  private launchBall(ball: Ball): void {
    const speed = this.ballSpeed;
    const isStickyRelease = ball.sticky;
    const offset = Math.max(-1, Math.min(1, (this.paddle.x - FIELD_WIDTH / 2) / (FIELD_WIDTH / 2)));
    let angle = (offset * 50 * Math.PI) / 180;

    // A perfectly straight launch lets a player tap once and clear a whole
    // column without aiming. The initial launch gets a small random side bias;
    // sticky releases keep the player's chosen angle.
    if (!isStickyRelease) {
      const magnitude = (2.5 + this.rng() * 2.5) * (this.rng() < 0.5 ? -1 : 1);
      angle += (magnitude * Math.PI) / 180;
      const maxAngle = (50 * Math.PI) / 180;
      angle = Math.max(-maxAngle, Math.min(maxAngle, angle));
    }

    ball.vx = Math.sin(angle) * speed;
    ball.vy = -Math.cos(angle) * speed;
    ball.stuck = false;
    this.ballLaunched = true;
    ball.sticky = false;
    ball.stickyHoldRemainingMs = 0;
    ball.spawnGraceMs = BALL_SPAWN_GRACE_MS;
    ball.sinceInteractionMs = 0;
    this.pushEvent({ type: 'ball:launched', ballId: ball.id });
  }

  // -------------------------------------------------------------------------
  // Balls
  // -------------------------------------------------------------------------

  private updateBalls(dt: number, dtMs: number): void {
    for (const ball of this.balls) {
      ball.spawnGraceMs = Math.max(0, ball.spawnGraceMs - dtMs);
      if (ball.stuck) {
        // Only balls caught by Sticky Paddle auto-release; the initial ball
        // stays attached until the player launches it.
        if (ball.sticky && ball.stickyHoldRemainingMs > 0) {
          ball.stickyHoldRemainingMs = Math.max(0, ball.stickyHoldRemainingMs - dtMs);
          if (ball.stickyHoldRemainingMs <= 0) this.launchBall(ball);
        }
        continue;
      }

      this.moveBall(ball, dt);
      if (!this.balls.includes(ball)) continue;
      if (ball.y - ball.radius > this.height + LOSS_MARGIN) {
        this.removeBall(ball);
        continue;
      }
      this.updateAntiStall(ball, dtMs);
    }
  }

  private moveBall(ball: Ball, dt: number): void {
    const hasSegments = this.elements.some((element) => this.isSegmentElement(element));
    if (!hasSegments) {
      this.moveBallAabb(ball, dt);
      this.checkPortals(ball);
      return;
    }

    const speed = Math.hypot(ball.vx, ball.vy);
    const distance = speed * dt;
    const maxStep = GAME_CONFIG.elements.rotorMaxStepPx;
    const steps = Math.max(1, Math.ceil(distance / Math.max(1, maxStep)));
    const subDt = dt / steps;

    for (let stepIndex = 0; stepIndex < steps; stepIndex += 1) {
      this.moveBallAabb(ball, subDt);
      this.resolveSegments(ball);
      if (ball.stuck) break;
      if (this.checkPortals(ball)) continue;
      if (!this.balls.includes(ball)) break;
    }
  }

  private moveBallAabb(ball: Ball, dt: number): void {
    let remaining = dt;
    let impacts = 0;

    while (remaining > 1e-9 && impacts < 4) {
      const colliders = this.collectColliders(ball);
      let best: { hit: ReturnType<typeof sweptCircleAabb>; collider: Collider } | null = null;

      for (const collider of colliders) {
        const hit = sweptCircleAabb(
          ball.x,
          ball.y,
          ball.radius,
          ball.vx,
          ball.vy,
          remaining,
          collider.box,
        );
        if (!hit) continue;
        if (!best || hit.t < best.hit!.t) best = { hit, collider };
      }

      if (!best || !best.hit) {
        ball.x += ball.vx * remaining;
        ball.y += ball.vy * remaining;
        break;
      }

      const { hit, collider } = best;
      ball.x += ball.vx * remaining * hit.t;
      ball.y += ball.vy * remaining * hit.t;
      remaining *= 1 - hit.t;

      if (collider.kind === 'paddle') {
        this.handlePaddleHit(ball, hit.nx, hit.ny);
        if (ball.stuck) break;
      } else if (collider.kind === 'block' && collider.block) {
        this.handleBlockHit(ball, collider.block);
        reflectVelocity(ball, hit.nx, hit.ny);
      } else if (collider.kind === 'boss' && collider.boss) {
        this.handleBossBallHit(ball, collider.boss);
        reflectVelocity(ball, hit.nx, hit.ny);
      } else {
        reflectVelocity(ball, hit.nx, hit.ny);
        if (collider.element) {
          this.pushEvent({
            type: 'element:hit',
            elementId: collider.element.id,
            kind: collider.element.kind,
            ballId: ball.id,
          });
        }
      }

      ball.x += hit.nx * hit.depth;
      ball.y += hit.ny * hit.depth;
      impacts += 1;
    }
  }

  private resolveSegments(ball: Ball): void {
    for (const element of this.elements) {
      if (!this.isSegmentElement(element)) continue;
      const hit = circleSegmentHit(
        ball.x,
        ball.y,
        ball.radius,
        element.x1,
        element.y1,
        element.x2,
        element.y2,
      );
      if (!hit) continue;

      let { nx, ny } = hit;
      // The normal must oppose the velocity so the reflection flips it.
      if (ball.vx * nx + ball.vy * ny > 0) {
        nx = -nx;
        ny = -ny;
      }
      ball.x += nx * hit.depth;
      ball.y += ny * hit.depth;
      reflectVelocity(ball, nx, ny);
      ball.sinceInteractionMs = 0;
      ball.horizontalMs = 0;
      ball.aboveBlocksMs = 0;
      this.pushEvent({
        type: 'element:hit',
        elementId: element.id,
        kind: element.kind,
        ballId: ball.id,
      });
    }
  }

  private checkPortals(ball: Ball): boolean {
    for (const element of this.elements) {
      if (element.kind !== 'portal') continue;
      const box = aabbFromRect(element.left, element.top, element.width, element.height);
      if (!circleOverlapsAabb(ball.x, ball.y, ball.radius, box)) continue;

      const last = this.portalCooldowns.get(ball.id);
      if (last !== undefined && this.timeMs - last < GAME_CONFIG.elements.portalCooldownMs) {
        continue;
      }
      const pair = this.elements.find(
        (candidate) =>
          candidate !== element &&
          candidate.kind === 'portal' &&
          candidate.pairId === element.pairId,
      );
      if (!pair) continue;

      this.portalCooldowns.set(ball.id, this.timeMs);
      ball.x = pair.left + pair.width / 2;
      ball.y = pair.top + pair.height / 2;
      this.pushEvent({
        type: 'portal:teleport',
        ballId: ball.id,
        fromId: element.id,
        toId: pair.id,
      });
      return true;
    }
    return false;
  }

  private collectColliders(ball: Ball): Collider[] {
    const colliders: Collider[] = [
      { kind: 'wall', box: { left: -200, top: -200, right: 0, bottom: this.height + 200 } },
      {
        kind: 'wall',
        box: { left: FIELD_WIDTH, top: -200, right: FIELD_WIDTH + 200, bottom: this.height + 200 },
      },
      { kind: 'wall', box: { left: -200, top: -200, right: FIELD_WIDTH + 200, bottom: 0 } },
    ];

    if (ball.spawnGraceMs <= 0) {
      colliders.push({
        kind: 'paddle',
        box: aabbFromRect(
          this.paddle.x - this.paddle.width / 2,
          this.paddle.y - this.paddle.height / 2,
          this.paddle.width,
          this.paddle.height,
        ),
      });
    }

    const cooldowns = this.blockCooldowns.get(ball.id);
    for (const block of this.blocks) {
      if (cooldowns) {
        const last = cooldowns.get(block.id);
        if (last !== undefined && this.timeMs - last < 50) continue;
      }
      colliders.push({
        kind: 'block',
        box: aabbFromRect(block.left, block.top, block.width, block.height),
        block,
      });
    }

    for (const element of this.elements) {
      if (!this.isSolidElement(element)) continue;
      colliders.push({
        kind: 'wall',
        box: aabbFromRect(element.left, element.top, element.width, element.height),
        element,
      });
    }

    if (this.boss && this.boss.hp > 0) {
      colliders.push({
        kind: 'boss',
        box: this.bossBox(this.boss),
        boss: this.boss,
      });
    }

    return colliders;
  }

  private handlePaddleHit(ball: Ball, nx: number, ny: number): void {
    ball.sinceInteractionMs = 0;
    ball.horizontalMs = 0;
    ball.aboveBlocksMs = 0;
    this.resetCombo();
    this.pushEvent({ type: 'paddle:hit', ballId: ball.id });

    if (ny > 0) {
      // Hitting the underside: plain reflection, never an angular relaunch.
      reflectVelocity(ball, nx, ny);
      return;
    }

    const offset = Math.max(
      -1,
      Math.min(1, (ball.x - this.paddle.x) / (this.paddle.width / 2)),
    );
    const angle = (offset * this.tuning.paddleMaxAngleDeg * Math.PI) / 180;
    const speed = this.ballSpeed;
    let vx = Math.sin(angle) * speed + this.paddle.vx * 0.15;
    let vy = -Math.cos(angle) * speed;
    const magnitude = Math.hypot(vx, vy) || 1;
    vx = (vx / magnitude) * speed;
    vy = (vy / magnitude) * speed;
    if (vy > -speed * 0.05) vy = -speed * 0.05;
    ball.vx = vx;
    ball.vy = vy;

    // Sticky Paddle catches the ball; it releases on input or after the hold.
    if (this.modifiersValue.stickyPaddle) {
      ball.stuck = true;
      ball.sticky = true;
      ball.stickyHoldRemainingMs = GAME_CONFIG.perks.stickyHoldMs;
      ball.vx = 0;
      ball.vy = 0;
      this.parkBall(ball);
      return;
    }

    // Keep the ball above the paddle so the same contact cannot repeat.
    ball.y = this.paddle.y - this.paddle.height / 2 - ball.radius - 0.02;
  }

  private handleBlockHit(ball: Ball, block: Block): void {
    let cooldowns = this.blockCooldowns.get(ball.id);
    if (!cooldowns) {
      cooldowns = new Map();
      this.blockCooldowns.set(ball.id, cooldowns);
    }
    cooldowns.set(block.id, this.timeMs);

    ball.sinceInteractionMs = 0;
    ball.horizontalMs = 0;
    ball.aboveBlocksMs = 0;

    let damage = this.modifiersValue.ballDamage;
    if (this.modifiersValue.critChance > 0 && this.rng() < this.modifiersValue.critChance) {
      damage = Math.max(1, Math.round(damage * this.modifiersValue.critMultiplier));
      this.pushEvent({ type: 'critical', blockId: block.id, ballId: ball.id, damage });
    }
    this.applyDamage(block, damage, ball.id);
  }

  /**
   * Central damage path shared by balls, laser, projectiles and explosions.
   * Emits `block:hit`, then `block:destroyed` with the XP payload.
   */
  private applyDamage(
    block: Block,
    damage: number,
    sourceBallId: number,
    allowLinks = true,
  ): boolean {
    if (damage <= 0 || !this.blocks.includes(block)) return false;
    if (block.regen) block.regen.timerMs = block.regen.everyMs;
    block.flashMs = 80;
    block.hp -= damage;
    this.pushEvent({
      type: 'block:hit',
      blockId: block.id,
      ballId: sourceBallId,
      hp: block.hp,
      damage,
    });

    const destroyed = block.hp <= 0;
    if (destroyed) this.destroyBlock(block, sourceBallId);
    if (allowLinks) this.propagateLinks(block, sourceBallId);
    return destroyed;
  }

  private propagateLinks(block: Block, sourceBallId: number): void {
    if (this.linkDepth >= 3 || block.linkGroup === undefined) return;
    const linked = this.blocks.filter(
      (candidate) =>
        candidate !== block &&
        candidate.linkGroup === block.linkGroup &&
        BLOCK_TYPES[candidate.type].behavior === 'linked',
    );
    if (linked.length === 0) return;

    this.pushEvent({
      type: 'link:pulse',
      blockId: block.id,
      group: block.linkGroup,
      linkedIds: linked.map((candidate) => candidate.id),
    });

    this.linkDepth += 1;
    try {
      for (const candidate of linked) {
        this.applyDamage(candidate, 1, sourceBallId, false);
      }
    } finally {
      this.linkDepth -= 1;
    }
  }

  private comboMultiplier(): number {
    return 1 + Math.min(this.modifiersValue.comboMax, this.comboCount * this.modifiersValue.comboStep);
  }

  private resetCombo(): void {
    if (this.comboCount === 0) return;
    this.comboCount = 0;
    this.pushEvent({ type: 'combo:changed', count: 0, multiplier: this.comboMultiplier() });
  }

  private destroyBlock(block: Block, sourceBallId: number): void {
    const index = this.blocks.indexOf(block);
    if (index < 0) return;
    this.blocks.splice(index, 1);

    this.comboCount += 1;
    const comboMult = this.comboMultiplier();
    this.pushEvent({
      type: 'combo:changed',
      count: this.comboCount,
      multiplier: comboMult,
    });

    const type = BLOCK_TYPES[block.type];
    const multiplier = this.multiplierState;
    const score = Math.max(
      0,
      Math.round(
        type.score *
          this.modifiersValue.scoreMultiplier *
          comboMult *
          (multiplier?.scoreFactor ?? 1),
      ),
    );
    const xp = Math.max(
      0,
      Math.round(block.maxHp * comboMult * (multiplier?.xpFactor ?? 1)),
    );

    this.score += score;
    this.destroyedBlocks += 1;
    this.pushEvent({
      type: 'block:destroyed',
      blockId: block.id,
      ballId: sourceBallId,
      score,
      maxHp: block.maxHp,
      xp,
    });

    const behavior = type.behavior;
    if (behavior === 'multiplier') {
      this.activateMultiplier();
    } else if (behavior === 'explosive') {
      this.explode(block, 2, 1, sourceBallId);
    }

    this.maybeBomb(block, sourceBallId);
    this.maybeExplodePerk(block, sourceBallId);
  }

  private activateMultiplier(): void {
    const state: MultiplierState = {
      xpFactor: GAME_CONFIG.elements.multiplierXpFactor,
      scoreFactor: GAME_CONFIG.elements.multiplierScoreFactor,
      remainingMs: GAME_CONFIG.elements.multiplierDurationMs,
    };
    this.multiplierState = state;
    this.pushEvent({
      type: 'multiplier:activated',
      xpFactor: state.xpFactor,
      scoreFactor: state.scoreFactor,
      remainingMs: state.remainingMs,
    });
  }

  /** Explosive blocks and Bomb Ball: 1-cell ring damage. */
  private explode(block: Block, damage: number, radiusCells: number, sourceBallId: number): void {
    if (this.explosionDepth >= 3) return;
    const radius = this.cell * radiusCells;
    const centerX = block.left + block.width / 2;
    const centerY = block.top + block.height / 2;
    const targets = this.blocks.filter(
      (candidate) =>
        Math.abs(candidate.row - block.row) <= radiusCells &&
        Math.abs(candidate.col - block.col) <= radiusCells,
    );

    this.explosionFx.push({
      x: centerX,
      y: centerY,
      radius,
      remainingMs: EXPLOSION_FX_MS,
      durationMs: EXPLOSION_FX_MS,
    });
    this.pushEvent({
      type: 'explosion',
      x: centerX,
      y: centerY,
      radius,
      blockIds: targets.map((candidate) => candidate.id),
    });

    this.explosionDepth += 1;
    try {
      for (const target of targets) this.applyDamage(target, damage, sourceBallId);
    } finally {
      this.explosionDepth -= 1;
    }

    if (this.boss && this.boss.hp > 0) {
      const box = this.bossBox(this.boss);
      const nearestX = Math.max(box.left, Math.min(centerX, box.right));
      const nearestY = Math.max(box.top, Math.min(centerY, box.bottom));
      if (Math.hypot(centerX - nearestX, centerY - nearestY) <= radius) {
        this.damageBossTotal(damage + this.modifiersValue.bossDamageBonus);
      }
    }
  }

  /** Bomb Ball: every `bombEvery` kills drops a 1-cell, 2-damage blast. */
  private maybeBomb(block: Block, sourceBallId: number): void {
    const every = this.modifiersValue.bombEvery;
    if (every === null) return;
    this.bombBallProgress += 1;
    if (this.bombBallProgress < every) return;
    this.bombBallProgress = 0;
    this.explode(block, 2, 1, sourceBallId);
  }

  /** Explosive Core: every `explosiveEvery` kills, blast the 1-cell ring. */
  private maybeExplodePerk(block: Block, sourceBallId: number): void {
    const every = this.modifiersValue.explosiveEvery;
    if (every === null) return;
    this.explosiveCoreProgress += 1;
    if (this.explosiveCoreProgress < every) return;
    this.explosiveCoreProgress = 0;
    this.explode(block, 1, 1, sourceBallId);
  }

  private removeBall(ball: Ball): void {
    const index = this.balls.indexOf(ball);
    if (index >= 0) this.balls.splice(index, 1);
    this.blockCooldowns.delete(ball.id);
    this.portalCooldowns.delete(ball.id);
    this.pushEvent({ type: 'ball:lost', ballId: ball.id });
  }

  // -------------------------------------------------------------------------
  // Boss
  // -------------------------------------------------------------------------

  private bossBox(boss: Boss): Aabb {
    return aabbFromRect(boss.x - boss.width / 2, boss.y, boss.width, boss.height);
  }

  private beamOverlapsBoss(x: number, half: number, boss: Boss): boolean {
    const box = this.bossBox(boss);
    return box.left < x + half && box.right > x - half;
  }

  private bossPhase(boss: Boss): number {
    if (boss.maxHp <= 0) return 3;
    const ratio = boss.hp / boss.maxHp;
    if (ratio > 0.66) return 1;
    if (ratio > 0.33) return 2;
    return 3;
  }

  private updateBoss(dt: number, dtMs: number): void {
    const boss = this.boss;
    if (!boss || boss.hp <= 0) return;

    if (boss.hurtMs > 0) boss.hurtMs = Math.max(0, boss.hurtMs - dtMs);
    boss.phase = this.bossPhase(boss);

    boss.x += boss.vx * dt;
    const half = boss.width / 2;
    if (boss.x - half < 0) {
      boss.x = half;
      boss.vx = Math.abs(boss.vx);
    } else if (boss.x + half > FIELD_WIDTH) {
      boss.x = FIELD_WIDTH - half;
      boss.vx = -Math.abs(boss.vx);
    }

    const interval = boss.attackMs * (1 - 0.15 * (boss.phase - 1));
    boss.attackTimerMs -= dtMs;
    if (boss.attackTimerMs <= 0) {
      boss.attackTimerMs += Math.max(1, interval);
      this.spawnBossShards(boss);
    }

    this.updateBossShards(dt);
  }

  private spawnBossShards(boss: Boss): void {
    const count = boss.pattern === 'sentinel' ? 1 : boss.pattern === 'warden' ? 2 : 3;
    for (let index = 0; index < count; index += 1) {
      const offset = count === 1 ? 0 : (index / (count - 1) - 0.5) * boss.width * 0.7;
      this.bossShards.push({
        id: this.nextId++,
        bossId: boss.id,
        x: boss.x + offset,
        y: boss.y + boss.height + BOSS_SHARD_RADIUS,
        vx: 0,
        vy: BOSS_SHARD_SPEED,
        radius: BOSS_SHARD_RADIUS,
      });
    }
    this.pushEvent({ type: 'boss:attack', bossId: boss.id, shards: count });
  }

  private updateBossShards(dt: number): void {
    const boss = this.boss;
    if (!boss) return;
    const paddleBox = aabbFromRect(
      this.paddle.x - this.paddle.width / 2,
      this.paddle.y - this.paddle.height / 2,
      this.paddle.width,
      this.paddle.height,
    );

    for (let index = this.bossShards.length - 1; index >= 0; index -= 1) {
      const shard = this.bossShards[index]!;
      shard.x += shard.vx * dt;
      shard.y += shard.vy * dt;

      if (circleOverlapsAabb(shard.x, shard.y, shard.radius, paddleBox)) {
        this.bossShards.splice(index, 1);
        if (this.corrosionStacks < GAME_CONFIG.elements.bossCorrosionStacks) {
          this.corrosionStacks += 1;
          this.applyEffectiveSize();
        }
        this.pushEvent({
          type: 'boss:shard-hit',
          bossId: boss.id,
          corrosion: this.corrosionStacks,
        });
        continue;
      }

      if (shard.y - shard.radius > this.height + LOSS_MARGIN) {
        this.bossShards.splice(index, 1);
      }
    }
  }

  private handleBossBallHit(ball: Ball, boss: Boss): void {
    let damage = this.modifiersValue.ballDamage + this.modifiersValue.bossDamageBonus;
    if (this.modifiersValue.critChance > 0 && this.rng() < this.modifiersValue.critChance) {
      damage = Math.max(1, Math.round(damage * this.modifiersValue.critMultiplier));
      this.pushEvent({ type: 'critical', blockId: boss.id, ballId: ball.id, damage });
    }
    ball.sinceInteractionMs = 0;
    this.damageBossTotal(damage);
  }

  private damageBossTotal(amount: number): void {
    const boss = this.boss;
    if (!boss || boss.hp <= 0) return;
    const damage = Math.max(0, Math.round(amount));
    if (damage <= 0) return;

    boss.hp = Math.max(0, boss.hp - damage);
    boss.hurtMs = 120;
    boss.phase = this.bossPhase(boss);
    this.pushEvent({ type: 'boss:hit', bossId: boss.id, hp: boss.hp, damage });

    if (boss.hp <= 0) {
      this.bossShards.length = 0;
      this.explosionFx.push({
        x: boss.x,
        y: boss.y + boss.height / 2,
        radius: boss.width * 0.6,
        remainingMs: EXPLOSION_FX_MS,
        durationMs: EXPLOSION_FX_MS,
      });
      this.pushEvent({ type: 'boss:defeated', bossId: boss.id });
    }
  }

  // -------------------------------------------------------------------------
  // Anti-stall
  // -------------------------------------------------------------------------

  private updateAntiStall(ball: Ball, dtMs: number): void {
    const speed = Math.hypot(ball.vx, ball.vy);
    if (speed <= 0) return;

    ball.sinceInteractionMs += dtMs;

    // A ball lingering over the block field is trapped in the top corridor.
    // Wait for the full teleport window instead of nudging it back into blocks.
    if (this.blocks.length > 0 && ball.y < BLOCK_TOP) {
      ball.aboveBlocksMs += dtMs;
      if (ball.aboveBlocksMs >= ANTI_STALL.aboveBlocksMs) {
        ball.x = this.paddle.x;
        ball.y = this.paddle.y - this.paddle.height / 2 - ball.radius - 30;
        ball.vx = 0;
        ball.vy = -speed;
        ball.aboveBlocksMs = 0;
        ball.sinceInteractionMs = 0;
        ball.horizontalMs = 0;
        this.pushEvent({
          type: 'anti-stall',
          kind: 'teleport',
          ballId: ball.id,
          atMs: this.timeMs,
        });
      }
      return;
    }

    ball.aboveBlocksMs = 0;

    if (Math.abs(ball.vy) < speed * ANTI_STALL.horizontalRatio) {
      ball.horizontalMs += dtMs;
    } else {
      ball.horizontalMs = 0;
    }

    if (ball.horizontalMs >= ANTI_STALL.horizontalMs) {
      const directionX = ball.vx >= 0 ? 1 : -1;
      const directionY = ball.vy > 0 ? 1 : -1;
      const vertical = (ANTI_STALL.verticalDeg * Math.PI) / 180;
      ball.vx = Math.cos(vertical) * speed * directionX;
      ball.vy = Math.sin(vertical) * speed * directionY;
      ball.horizontalMs = 0;
      ball.sinceInteractionMs = 0;
      this.pushEvent({
        type: 'anti-stall',
        kind: 'horizontal',
        ballId: ball.id,
        atMs: this.timeMs,
      });
      return;
    }

    if (ball.sinceInteractionMs >= ANTI_STALL.nudgeMs) {
      const rotation = ball.vx >= 0 ? ANTI_STALL.nudgeDeg : -ANTI_STALL.nudgeDeg;
      rotateVelocity(ball, rotation);
      ball.sinceInteractionMs = 0;
      ball.horizontalMs = 0;
      this.pushEvent({
        type: 'anti-stall',
        kind: 'nudge',
        ballId: ball.id,
        atMs: this.timeMs,
      });
    }
  }

  // -------------------------------------------------------------------------
  // Projectiles and outcome
  // -------------------------------------------------------------------------

  private updateProjectiles(dt: number): void {
    for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
      const projectile = this.projectiles[index]!;
      let removed = false;
      const travel = Math.hypot(projectile.vx, projectile.vy) * dt;
      const steps = Math.max(1, Math.ceil(travel / 8));
      const subDt = dt / steps;
      for (let stepIndex = 0; stepIndex < steps && !removed; stepIndex += 1) {
        projectile.x += projectile.vx * subDt;
        projectile.y += projectile.vy * subDt;

        for (const element of this.elements) {
          if (!this.isSolidElement(element)) continue;
          if (
            circleOverlapsAabb(
              projectile.x,
              projectile.y,
              projectile.radius,
              aabbFromRect(element.left, element.top, element.width, element.height),
            )
          ) {
            removed = true;
            break;
          }
        }
        if (removed) break;

        if (this.boss && this.boss.hp > 0) {
          if (
            circleOverlapsAabb(
              projectile.x,
              projectile.y,
              projectile.radius,
              this.bossBox(this.boss),
            )
          ) {
            this.pushEvent({
              type: 'projectile:hit',
              projectileId: projectile.id,
              blockId: this.boss.id,
            });
            this.damageBossTotal(1 + this.modifiersValue.bossDamageBonus);
            removed = true;
            break;
          }
        }

        for (const block of this.blocks) {
          if (
            projectile.x + projectile.radius < block.left ||
            projectile.x - projectile.radius > block.left + block.width ||
            projectile.y + projectile.radius < block.top ||
            projectile.y - projectile.radius > block.top + block.height
          ) {
            continue;
          }
          this.damageBlockByProjectile(block, projectile);
          removed = true;
          break;
        }
      }
      if (removed || projectile.y < -20) this.projectiles.splice(index, 1);
    }
  }

  private damageBlockByProjectile(block: Block, projectile: Projectile): void {
    this.pushEvent({
      type: 'projectile:hit',
      projectileId: projectile.id,
      blockId: block.id,
    });
    this.applyDamage(block, 1, -projectile.id);
  }

  private spawnSafetyBall(): Ball {
    const radius = this.effectiveBallRadius();
    const ball: Ball = {
      id: this.nextId++,
      x: this.paddle.x,
      y: this.paddle.y - this.paddle.height / 2 - radius - 30,
      vx: 0,
      vy: -this.ballSpeed,
      radius,
      stuck: false,
      sticky: false,
      stickyHoldRemainingMs: 0,
      spawnGraceMs: BALL_SPAWN_GRACE_MS,
      sinceInteractionMs: 0,
      horizontalMs: 0,
      aboveBlocksMs: 0,
    };
    this.balls.push(ball);
    return ball;
  }

  private updateOutcome(): void {
    if (this.outcome !== 'playing') return;
    const bossAlive = this.boss !== null && this.boss.hp > 0;
    if (this.blocks.length === 0 && !bossAlive) {
      this.outcome = 'cleared';
      this.score += 100;
      this.pushEvent({ type: 'wave:cleared', score: this.score });
      return;
    }
    if (this.balls.length === 0) {
      if (this.safetyChargesValue > 0) {
        this.safetyChargesValue -= 1;
        const ball = this.spawnSafetyBall();
        this.pushEvent({
          type: 'safety-net',
          ballId: ball.id,
          charges: this.safetyChargesValue,
        });
        return;
      }
      this.outcome = 'defeat';
      this.pushEvent({ type: 'run:defeat' });
    }
  }

  private pushEvent(event: SimEvent): void {
    this.eventLog.push(event);
    this.eventHistory.push(event);
    if (this.eventHistory.length > 400) this.eventHistory.shift();
  }
}
