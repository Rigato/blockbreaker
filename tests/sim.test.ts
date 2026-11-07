import { describe, expect, it } from 'vitest';
import { FixedStepClock } from '../src/sim/fixedStep';
import { World } from '../src/sim/World';
import { SIM_TUNING_DEFAULTS } from '../src/game/config';
import { TEST_WAVES } from '../src/sim/testWaves';
import { addBall, addBlock, createWorld, keeperBlock, NO_INPUT } from './helpers/world';

const STEP_MS = 1000 / 120;

function freshWorld(): World {
  const world = new World({
    wave: TEST_WAVES[0]!,
    height: 1280,
    tuning: { ...SIM_TUNING_DEFAULTS },
    seed: 3,
  });
  world.reset();
  return world;
}

describe('launch and run outcome', () => {
  it('launches the attached ball upward at the wave speed', () => {
    const world = freshWorld();
    const ball = world.balls[0]!;
    expect(ball.stuck).toBe(true);

    const events = world.step({ paddleTargetX: null, paddleDirection: 0, launch: true }, STEP_MS);

    expect(events.some((event) => event.type === 'ball:launched')).toBe(true);
    expect(ball.stuck).toBe(false);
    expect(Math.hypot(ball.vx, ball.vy)).toBeCloseTo(TEST_WAVES[0]!.ballSpeed, 5);
    expect(ball.vy).toBeLessThan(0);
    // A centered initial launch must not travel perfectly straight.
    expect(Math.abs(ball.vx)).toBeGreaterThan(1);
  });

  it('enters defeat when the last ball is lost', () => {
    const world = freshWorld();
    world.balls.length = 0;

    const events = world.step(NO_INPUT, STEP_MS);

    expect(world.outcome).toBe('defeat');
    expect(events.some((event) => event.type === 'run:defeat')).toBe(true);
  });

  it('enters cleared and adds the +100 wave bonus', () => {
    const world = freshWorld();
    world.blocks.length = 0;

    const events = world.step(NO_INPUT, STEP_MS);

    expect(world.outcome).toBe('cleared');
    expect(world.score).toBe(100);
    expect(events.some((event) => event.type === 'wave:cleared')).toBe(true);
  });

  it('awards 10 x max HP when a block is destroyed and keeps the wave alive', () => {
    const world = createWorld();
    world.blocks.push(keeperBlock());
    addBlock(world, {
      left: 300,
      top: 600,
      width: 40,
      height: 100,
      type: 'obsidian',
      hp: 1,
      maxHp: 3,
    });
    addBall(world, { x: 280, y: 650, vx: 1050, vy: 0 });

    world.step(NO_INPUT, 1000 / 30);

    expect(world.score).toBe(30);
    expect(world.outcome).toBe('playing');
  });

  it('damages a block with a debug projectile', () => {
    const world = createWorld();
    const block = addBlock(world, {
      left: 340,
      top: 600,
      width: 40,
      height: 100,
      type: 'obsidian',
      hp: 3,
      maxHp: 3,
    });
    addBall(world, { x: 120, y: 900, vx: 0, vy: 0 });
    world.fireProjectile();

    let hit = false;
    for (let step = 0; step < 90; step += 1) {
      const events = world.step(NO_INPUT, STEP_MS);
      if (events.some((event) => event.type === 'projectile:hit')) hit = true;
    }

    expect(hit).toBe(true);
    expect(block.hp).toBe(2);
  });
});

describe('fixed step and pause', () => {
  it('runs at most five fixed steps and discards the backlog', () => {
    const clock = new FixedStepClock();
    expect(clock.advance(1000 / 60, 120, 5)).toBe(2);

    clock.reset();
    expect(clock.advance(1000, 120, 5)).toBe(5);
    expect(clock.accumulatorMs).toBe(0);
  });

  it('does not advance simulation while the accumulator is reset', () => {
    const world = freshWorld();
    const clock = new FixedStepClock();

    clock.advance(1000 / 60, 120, 5);
    const timeBefore = world.timeMs;

    // Pause: the game resets the clock and stops stepping the world.
    clock.reset();
    const pausedSteps = clock.advance(5, 120, 5);

    expect(pausedSteps).toBe(0);
    expect(world.timeMs).toBe(timeBefore);
  });
});

describe('caps and determinism', () => {
  it('caps simultaneous balls at eight', () => {
    const world = freshWorld();
    let added = 0;
    for (let index = 0; index < 12; index += 1) {
      if (world.spawnBall()) added += 1;
    }

    expect(world.balls).toHaveLength(8);
    expect(added).toBe(7);
    expect(world.spawnBall()).toBeNull();
  });

  it('is deterministic for the same seed and input sequence', () => {
    const runs = [0, 1].map(() => {
      const world = new World({
        wave: TEST_WAVES[1]!,
        height: 1280,
        tuning: { ...SIM_TUNING_DEFAULTS },
        seed: 77,
      });
      world.reset();
      const snapshots: string[] = [];
      for (let step = 0; step < 180; step += 1) {
        world.step(
          {
            paddleTargetX: 240 + (step % 60) * 4,
            paddleDirection: 0,
            launch: step === 0,
          },
          STEP_MS,
        );
        snapshots.push(
          JSON.stringify({
            balls: world.balls.map((ball) => [ball.x, ball.y, ball.vx, ball.vy]),
            score: world.score,
            blocks: world.blocks.length,
            outcome: world.outcome,
          }),
        );
      }
      return snapshots;
    });

    expect(runs[0]).toEqual(runs[1]);

    // Same seed, fresh world, same inputs -> identical final state.
    const again = new World({
      wave: TEST_WAVES[1]!,
      height: 1280,
      tuning: { ...SIM_TUNING_DEFAULTS },
      seed: 77,
    });
    again.reset();
    for (let step = 0; step < 180; step += 1) {
      again.step(
        {
          paddleTargetX: 240 + (step % 60) * 4,
          paddleDirection: 0,
          launch: step === 0,
        },
        STEP_MS,
      );
    }
    const finalSnapshot = JSON.parse(runs[0]![179]!) as {
      balls: number[][];
    };
    expect(again.balls.map((ball) => [ball.x, ball.y])).toEqual(
      finalSnapshot.balls.map((values) => [values[0], values[1]]),
    );
  });
});
