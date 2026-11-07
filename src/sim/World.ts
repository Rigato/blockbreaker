import type { SimTuning } from '../game/contracts';
import { GAME_CONFIG } from '../game/config';
import { BLOCK_TYPES, type BlockTypeId } from './blocks';
import {
  aabbFromRect,
  reflectVelocity,
  rotateVelocity,
  sweptCircleAabb,
  type Aabb,
} from './collision';
import { createRng } from './rng';
import type { WaveDef } from './testWaves';

export const FIELD_WIDTH = GAME_CONFIG.logicalWidth;
export const BLOCK_TOP = 160;
export const BLOCK_GAP = 4;
export const PADDLE_BOTTOM_OFFSET = 120;
export const LOSS_MARGIN = 40;
export const BALL_SPAWN_GRACE_MS = 400;
export const MAX_BALLS = GAME_CONFIG.ball.maxBalls;

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
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
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
  | { type: 'block:hit'; blockId: string; ballId: number; hp: number }
  | { type: 'block:destroyed'; blockId: string; ballId: number; score: number }
  | { type: 'paddle:hit'; ballId: number }
  | { type: 'projectile:fired'; projectileId: number }
  | { type: 'projectile:hit'; projectileId: number; blockId: string }
  | { type: 'wave:cleared'; score: number }
  | { type: 'run:defeat' }
  | {
      type: 'anti-stall';
      kind: 'nudge' | 'horizontal' | 'teleport';
      ballId: number;
      atMs: number;
    };

interface Collider {
  kind: 'wall' | 'paddle' | 'block';
  box: Aabb;
  block?: Block;
}

const NO_INPUT: SimInput = {
  paddleTargetX: null,
  paddleDirection: 0,
  launch: false,
};

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

  score = 0;
  timeMs = 0;
  outcome: WorldOutcome = 'playing';

  private wave: WaveDef;
  private tuning: SimTuning;
  private readonly rng: () => number;
  private readonly eventLog: SimEvent[] = [];
  private readonly eventHistory: SimEvent[] = [];
  private readonly blockCooldowns = new Map<number, Map<string, number>>();
  private nextId = 1;
  private running = false;

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
    return this.wave.ballSpeed * this.tuning.ballSpeedScale;
  }

  get tuningState(): SimTuning {
    return { ...this.tuning };
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

  /** Loads a wave's block grid and clears every transient entity. */
  loadWave(wave: WaveDef): void {
    this.wave = wave;
    this.blocks.length = 0;
    this.balls.length = 0;
    this.projectiles.length = 0;
    this.blockCooldowns.clear();
    this.score = 0;
    this.timeMs = 0;
    this.outcome = 'playing';
    this.running = false;
    this.paddle.x = FIELD_WIDTH / 2;
    this.paddle.vx = 0;
    this.buildBlocks(wave);
  }

  /** Starts a fresh run state on the loaded wave (ball attached to paddle). */
  reset(): void {
    this.balls.length = 0;
    this.projectiles.length = 0;
    this.blockCooldowns.clear();
    this.score = 0;
    this.timeMs = 0;
    this.outcome = 'playing';
    this.running = true;
    this.paddle.x = FIELD_WIDTH / 2;
    this.paddle.vx = 0;
    this.blocks.length = 0;
    this.buildBlocks(this.wave);
    this.spawnStuckBall();
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
    this.paddle.width = tuning.paddleWidth;
    this.clampPaddle();
    const targetSpeed = this.ballSpeed;
    for (const ball of this.balls) {
      ball.radius = tuning.ballRadius;
      if (ball.stuck) {
        this.parkBall(ball);
        continue;
      }
      const speed = Math.hypot(ball.vx, ball.vy);
      if (speed > 0) {
        ball.vx = (ball.vx / speed) * targetSpeed;
        ball.vy = (ball.vy / speed) * targetSpeed;
      }
    }
  }

  spawnStuckBall(): Ball {
    const ball: Ball = {
      id: this.nextId++,
      x: this.paddle.x,
      y: this.paddle.y,
      vx: 0,
      vy: 0,
      radius: this.tuning.ballRadius,
      stuck: true,
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
    if (this.balls.length >= MAX_BALLS) return null;
    const speed = this.ballSpeed;
    const sign = this.rng() < 0.5 ? -1 : 1;
    const angle = (18 * Math.PI) / 180 * sign;
    const ball: Ball = {
      id: this.nextId++,
      x: this.paddle.x,
      y: this.paddle.y - this.paddle.height / 2 - this.tuning.ballRadius - 2,
      vx: Math.sin(angle) * speed,
      vy: -Math.cos(angle) * speed,
      radius: this.tuning.ballRadius,
      stuck: false,
      spawnGraceMs: BALL_SPAWN_GRACE_MS,
      sinceInteractionMs: 0,
      horizontalMs: 0,
      aboveBlocksMs: 0,
    };
    this.balls.push(ball);
    return ball;
  }

  fireProjectile(): Projectile | null {
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

  step(input: SimInput = NO_INPUT, dtMs: number = 1000 / GAME_CONFIG.fixedStepHz): readonly SimEvent[] {
    this.eventLog.length = 0;
    if (this.outcome !== 'playing' || !this.running) return this.eventLog;

    const dt = Math.max(0, dtMs) / 1000;
    this.timeMs += dtMs;

    this.updatePaddle(input, dt);
    if (input.launch) this.launchStuckBalls();

    for (const block of this.blocks) {
      if (block.flashMs > 0) block.flashMs = Math.max(0, block.flashMs - dtMs);
    }

    this.updateBalls(dt, dtMs);
    this.updateProjectiles(dt);
    this.updateOutcome();

    return this.eventLog;
  }

  // -------------------------------------------------------------------------
  // Grid
  // -------------------------------------------------------------------------

  private buildBlocks(wave: WaveDef): void {
    const rows = wave.rows;
    const columns = rows[0]?.length ?? 0;
    if (columns === 0) return;
    const cell = FIELD_WIDTH / columns;
    const cellHeight = cell;

    rows.forEach((row, rowIndex) => {
      for (let col = 0; col < row.length; col += 1) {
        const char = row[col] ?? '.';
        const typeId = wave.legend[char];
        if (!typeId) continue;
        const type = BLOCK_TYPES[typeId];
        this.blocks.push({
          id: `${rowIndex}:${col}`,
          type: typeId,
          hp: type.hp,
          maxHp: type.hp,
          row: rowIndex,
          col,
          left: col * cell + BLOCK_GAP / 2,
          top: BLOCK_TOP + rowIndex * cellHeight + BLOCK_GAP / 2,
          width: cell - BLOCK_GAP,
          height: cellHeight - BLOCK_GAP,
          flashMs: 0,
        });
      }
    });
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
    const speed = this.ballSpeed;
    for (const ball of this.balls) {
      if (!ball.stuck) continue;
      const offset = Math.max(-1, Math.min(1, (this.paddle.x - FIELD_WIDTH / 2) / (FIELD_WIDTH / 2)));
      const angle = (offset * 50 * Math.PI) / 180;
      ball.vx = Math.sin(angle) * speed;
      ball.vy = -Math.cos(angle) * speed;
      ball.stuck = false;
      ball.spawnGraceMs = BALL_SPAWN_GRACE_MS;
      ball.sinceInteractionMs = 0;
      this.pushEvent({ type: 'ball:launched', ballId: ball.id });
    }
  }

  // -------------------------------------------------------------------------
  // Balls
  // -------------------------------------------------------------------------

  private updateBalls(dt: number, dtMs: number): void {
    for (const ball of this.balls) {
      ball.spawnGraceMs = Math.max(0, ball.spawnGraceMs - dtMs);
      if (ball.stuck) continue;

      this.moveBall(ball, dt);
      if (ball.y - ball.radius > this.height + LOSS_MARGIN) {
        this.removeBall(ball);
        continue;
      }
      this.updateAntiStall(ball, dtMs);
    }
  }

  private moveBall(ball: Ball, dt: number): void {
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
      } else if (collider.kind === 'block' && collider.block) {
        this.handleBlockHit(ball, collider.block);
        reflectVelocity(ball, hit.nx, hit.ny);
      } else {
        reflectVelocity(ball, hit.nx, hit.ny);
      }

      ball.x += hit.nx * hit.depth;
      ball.y += hit.ny * hit.depth;
      impacts += 1;
    }
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

    return colliders;
  }

  private handlePaddleHit(ball: Ball, nx: number, ny: number): void {
    ball.sinceInteractionMs = 0;
    ball.horizontalMs = 0;
    ball.aboveBlocksMs = 0;
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
    block.flashMs = 80;
    block.hp -= 1;
    this.pushEvent({ type: 'block:hit', blockId: block.id, ballId: ball.id, hp: block.hp });

    if (block.hp > 0) return;

    const index = this.blocks.indexOf(block);
    if (index >= 0) this.blocks.splice(index, 1);
    this.score += block.maxHp * 10;
    this.pushEvent({
      type: 'block:destroyed',
      blockId: block.id,
      ballId: ball.id,
      score: block.maxHp * 10,
    });
  }

  private removeBall(ball: Ball): void {
    const index = this.balls.indexOf(ball);
    if (index >= 0) this.balls.splice(index, 1);
    this.blockCooldowns.delete(ball.id);
    this.pushEvent({ type: 'ball:lost', ballId: ball.id });
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
    block.flashMs = 80;
    block.hp -= 1;
    this.pushEvent({
      type: 'projectile:hit',
      projectileId: projectile.id,
      blockId: block.id,
    });
    if (block.hp > 0) return;
    const index = this.blocks.indexOf(block);
    if (index >= 0) this.blocks.splice(index, 1);
    this.score += block.maxHp * 10;
    this.pushEvent({
      type: 'block:destroyed',
      blockId: block.id,
      ballId: -projectile.id,
      score: block.maxHp * 10,
    });
  }

  private updateOutcome(): void {
    if (this.outcome !== 'playing') return;
    if (this.blocks.length === 0) {
      this.outcome = 'cleared';
      this.score += 100;
      this.pushEvent({ type: 'wave:cleared', score: this.score });
      return;
    }
    if (this.balls.length === 0) {
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
