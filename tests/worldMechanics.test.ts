import { describe, expect, it } from 'vitest';
import { BASE_RUN_MODIFIERS, SIM_TUNING_DEFAULTS } from '../src/game/config';
import type { WaveDef } from '../src/content/types';
import { World } from '../src/sim/World';
import { addBall, addBlock, createWorld, NO_INPUT } from './helpers/world';

function makeWorld(wave: WaveDef): World {
  const world = new World({
    wave,
    height: 1280,
    tuning: { ...SIM_TUNING_DEFAULTS },
    seed: 1,
  });
  world.reset();
  return world;
}

function block(world: World, id: string) {
  const found = world.blocks.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`missing block ${id}`);
  return found;
}

describe('world II and III blocks', () => {
  it('plated blocks resist tool damage but not direct ball hits', () => {
    const world = makeWorld({
      id: 'plated',
      name: 'Plated',
      rows: ['t'],
      legend: { t: 'plated' },
      ballSpeed: 520,
    });
    const plated = block(world, '0:0');
    expect(plated.hp).toBe(4);
    world.damageBlock(plated, 2);
    expect(plated.hp).toBe(3);
    world.damageBlock(plated, 2, 1);
    expect(plated.hp).toBe(1);
  });

  it('phased blocks ignore damage while armored and expose a window', () => {
    const world = makeWorld({
      id: 'phased',
      name: 'Phased',
      rows: ['p'],
      legend: { p: 'phased' },
      ballSpeed: 520,
    });
    const phased = block(world, '0:0');
    phased.armored = true;
    world.damageBlock(phased, 1, 1);
    expect(phased.hp).toBe(3);
    phased.armored = false;
    world.damageBlock(phased, 1, 1);
    expect(phased.hp).toBe(2);
  });

  it('entangled blocks mirror one damage to their pair', () => {
    const world = makeWorld({
      id: 'entangled',
      name: 'Entangled',
      rows: ['nn'],
      legend: { n: 'entangled' },
      ballSpeed: 520,
    });
    const left = block(world, '0:0');
    const right = block(world, '0:1');
    world.damageBlock(left, 1, 1);
    expect(left.hp).toBe(2);
    expect(right.hp).toBe(2);
  });

  it('fused circuits propagate one damage to the group', () => {
    const world = makeWorld({
      id: 'fused',
      name: 'Fused',
      rows: ['ff'],
      legend: { f: 'fused' },
      ballSpeed: 520,
    });
    const left = block(world, '0:0');
    const right = block(world, '0:1');
    world.damageBlock(left, 1, 1);
    expect(right.hp).toBe(2);
  });

  it('splitting blocks leave up to two crystals once', () => {
    const world = makeWorld({
      id: 'splitting',
      name: 'Splitting',
      rows: ['.s.'],
      legend: { s: 'splitting' },
      ballSpeed: 520,
    });
    const splitter = block(world, '0:1');
    world.damageBlock(splitter, 2, 1);
    expect(world.blocks.filter((candidate) => candidate.type === 'crystal')).toHaveLength(2);
  });

  it('relays power gates until the last relay is destroyed', () => {
    const world = makeWorld({
      id: 'relay',
      name: 'Relay',
      rows: ['.y..'],
      legend: { y: 'relay' },
      ballSpeed: 520,
      elements: [
        {
          id: 'relay-gate',
          kind: 'gate',
          col: 2,
          row: 0,
          closedMs: 1000,
          openMs: 1000,
        },
      ],
    });
    const gate = world.elements[0]!;
    expect(world.relayPowered).toBe(true);
    world.damageBlock(block(world, '0:1'), 2, 1);
    expect(world.relayPowered).toBe(false);
    world.step({ paddleTargetX: null, paddleDirection: 0, launch: false }, 16);
    expect(gate.active).toBe(false);
  });
});

describe('world II and III elements', () => {
  it('presses travel vertically and stay solid', () => {
    const world = makeWorld({
      id: 'press',
      name: 'Press',
      rows: ['........'],
      legend: {},
      ballSpeed: 520,
      elements: [
        {
          id: 'press-a',
          kind: 'press',
          col: 2,
          row: 0,
          rangeCells: 2,
          periodMs: 1000,
        },
      ],
    });
    const press = world.elements[0]!;
    const start = press.top;
    world.step({ paddleTargetX: null, paddleDirection: 0, launch: false }, 250);
    expect(press.top).not.toBe(start);
    expect(press.active).toBe(true);
  });

  it('belts rotate the ball while preserving its speed', () => {
    const world = makeWorld({
      id: 'belt',
      name: 'Belt',
      rows: ['........'],
      legend: {},
      ballSpeed: 520,
      elements: [{ id: 'belt-a', kind: 'belt', col: 2, row: 2, direction: 'right' }],
    });
    const belt = world.elements[0]!;
    const ball = world.spawnBall()!;
    ball.x = belt.left + belt.width / 2;
    ball.y = belt.top + belt.height / 2;
    ball.vx = 300;
    ball.vy = -300;
    const before = Math.hypot(ball.vx, ball.vy);
    world.step({ paddleTargetX: null, paddleDirection: 0, launch: false }, 16);
    const after = Math.hypot(ball.vx, ball.vy);
    expect(after).toBeCloseTo(before, 4);
    expect(Math.abs(ball.vx - 300) + Math.abs(ball.vy + 300)).toBeGreaterThan(1);
  });

  it('rails accelerate the ball above the authored wave speed', () => {
    const world = makeWorld({
      id: 'rail',
      name: 'Rail',
      rows: ['........'],
      legend: {},
      ballSpeed: 520,
      elements: [{ id: 'rail-a', kind: 'rail', col: 2, row: 2, direction: 'right' }],
    });
    const rail = world.elements[0]!;
    const ball = world.spawnBall()!;
    ball.x = rail.left + rail.width / 2;
    ball.y = rail.top + rail.height / 2;
    ball.vx = 100;
    ball.vy = -100;
    const before = Math.hypot(ball.vx, ball.vy);
    for (let step = 0; step < 20; step += 1) {
      world.step({ paddleTargetX: null, paddleDirection: 0, launch: false }, 16);
    }
    expect(Math.hypot(ball.vx, ball.vy)).toBeGreaterThan(before);
    expect(Math.hypot(ball.vx, ball.vy)).toBeLessThanOrEqual(1100);
  });

  it('gust curves the ball without changing its speed', () => {
    const world = makeWorld({
      id: 'gust',
      name: 'Gust',
      rows: ['........'],
      legend: {},
      ballSpeed: 520,
      rules: [{ kind: 'gust', periodMs: 4000, strength: 200 }],
    });
    const ball = world.spawnBall()!;
    ball.x = 360;
    ball.y = 800;
    ball.vx = 0;
    ball.vy = -500;
    const before = Math.hypot(ball.vx, ball.vy);
    world.step({ paddleTargetX: null, paddleDirection: 0, launch: false }, 16);
    expect(Math.hypot(ball.vx, ball.vy)).toBeCloseTo(before, 4);
    expect(Math.abs(ball.vx)).toBeGreaterThan(0);
  });
});

describe('new boss patterns', () => {
  const patterns = [
    ['spread', 3],
    ['charger', 1],
    ['aimed', 1],
    ['matron', 2],
    ['riveter', 3],
    ['engine', 4],
  ] as const;

  for (const [pattern, shards] of patterns) {
    it(`${pattern} spawns ${shards} shard(s) per attack`, () => {
      const world = makeWorld({
        id: `boss-${pattern}`,
        name: pattern,
        rows: ['........', '........'],
        legend: {},
        ballSpeed: 520,
        boss: {
          id: `boss-${pattern}`,
          name: pattern,
          hp: 100,
          widthCells: 4,
          heightCells: 2,
          row: 0,
          attackMs: 1,
          moveSpeed: 100,
          pattern,
        },
      });
      world.step({ paddleTargetX: null, paddleDirection: 0, launch: false }, 16);
      expect(world.bossShards).toHaveLength(shards);
    });
  }
});

describe('last-block magnet assist', () => {
  it('turns a free ball toward the last block without changing speed', () => {
    const world = createWorld(1);
    addBlock(world, { left: 600, top: 200, width: 90, height: 90 });
    const ball = addBall(world, { x: 200, y: 800, vx: 0, vy: -500 });
    world.applyRunModifiers({
      ...BASE_RUN_MODIFIERS,
      lastBlockMagnetTurnRate: 3.5,
    });

    for (let step = 0; step < 60; step += 1) {
      world.step(NO_INPUT, 1000 / 120);
    }

    expect(ball.vx).toBeGreaterThan(50);
    expect(Math.hypot(ball.vx, ball.vy)).toBeCloseTo(500, 4);
  });

  it('stays off while more than one block remains', () => {
    const world = createWorld(1);
    addBlock(world, { left: 600, top: 200, width: 90, height: 90 });
    addBlock(world, { left: 100, top: 200, width: 90, height: 90 });
    const ball = addBall(world, { x: 200, y: 800, vx: 0, vy: -500 });
    world.applyRunModifiers({
      ...BASE_RUN_MODIFIERS,
      lastBlockMagnetTurnRate: 3.5,
    });

    for (let step = 0; step < 60; step += 1) {
      world.step(NO_INPUT, 1000 / 120);
    }

    expect(ball.vx).toBe(0);
  });
});
