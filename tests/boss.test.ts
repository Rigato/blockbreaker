import { describe, expect, it } from 'vitest';
import { BASE_RUN_MODIFIERS, SIM_TUNING_DEFAULTS } from '../src/game/config';
import type { WaveDef } from '../src/content/types';
import { World } from '../src/sim/World';

const STEP_MS = 1000 / 120;

function makeBossWave(): WaveDef {
  return {
    id: 'boss-fixture',
    name: 'Boss Fixture',
    rows: ['.......'],
    legend: {},
    ballSpeed: 520,
    boss: {
      id: 'boss-test',
      name: 'Test Boss',
      hp: 10,
      widthCells: 3,
      heightCells: 2,
      row: 1,
      attackMs: 1000,
      moveSpeed: 100,
      pattern: 'sentinel',
    },
  };
}

function makeWorld(): World {
  const world = new World({
    wave: makeBossWave(),
    height: 1280,
    tuning: { ...SIM_TUNING_DEFAULTS },
    seed: 1,
  });
  world.reset();
  return world;
}

describe('boss waves', () => {
  it('spawns a boss even when the wave has no blocks', () => {
    const world = makeWorld();
    expect(world.blocks).toHaveLength(0);
    expect(world.boss).not.toBeNull();
    expect(world.boss!.hp).toBe(10);
    expect(world.events.some((event) => event.type === 'boss:spawned')).toBe(true);
  });

  it('takes ball damage including the boss damage bonus', () => {
    const world = makeWorld();
    world.applyRunModifiers({ ...BASE_RUN_MODIFIERS, bossDamageBonus: 2 });
    const boss = world.boss!;
    world.balls.push({
      id: 999,
      x: boss.x,
      y: boss.y + boss.height + 15,
      vx: 0,
      vy: -500,
      radius: SIM_TUNING_DEFAULTS.ballRadius,
      stuck: false,
      sticky: false,
      stickyHoldRemainingMs: 0,
      spawnGraceMs: 0,
      sinceInteractionMs: 0,
      horizontalMs: 0,
      aboveBlocksMs: 0,
    });

    world.step({ paddleTargetX: null, paddleDirection: 0, launch: false }, 1000 / 30);

    expect(boss.hp).toBe(7);
    expect(world.events.some((event) => event.type === 'boss:hit')).toBe(true);
  });

  it('clears the wave only after the boss reaches zero HP', () => {
    const world = makeWorld();
    world.damageBoss(4);
    expect(world.boss!.hp).toBe(6);

    world.step({ paddleTargetX: null, paddleDirection: 0, launch: false }, STEP_MS);
    expect(world.outcome).toBe('playing');

    world.damageBoss(99);
    expect(world.boss!.hp).toBe(0);
    expect(world.events.some((event) => event.type === 'boss:defeated')).toBe(true);

    world.step({ paddleTargetX: null, paddleDirection: 0, launch: false }, STEP_MS);
    expect(world.outcome).toBe('cleared');
  });

  it('boss shards hitting the paddle add corrosion stacks', () => {
    const world = makeWorld();
    const boss = world.boss!;
    boss.attackTimerMs = 0;
    world.step({ paddleTargetX: null, paddleDirection: 0, launch: false }, STEP_MS);
    expect(world.bossShards).toHaveLength(1);

    const shard = world.bossShards[0]!;
    shard.x = world.paddle.x;
    shard.y = world.paddle.y - world.paddle.height / 2 - shard.radius + 1;
    const widthBefore = world.paddle.width;

    world.step({ paddleTargetX: null, paddleDirection: 0, launch: false }, STEP_MS);

    expect(world.corrosionStacks).toBe(1);
    expect(world.paddle.width).toBeLessThan(widthBefore);
    expect(world.bossShards).toHaveLength(0);
    expect(world.events.some((event) => event.type === 'boss:shard-hit')).toBe(true);
  });
});
