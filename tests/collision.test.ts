import { describe, expect, it } from 'vitest';
import { aabbFromRect, sweptCircleAabb } from '../src/sim/collision';
import { addBall, addBlock, createWorld, keeperBlock, NO_INPUT } from './helpers/world';

describe('swept circle vs AABB', () => {
  it('catches a 1050 u/s ball crossing a thin block in one long step', () => {
    const hit = sweptCircleAabb(
      280,
      650,
      9,
      1050,
      0,
      1 / 30,
      aabbFromRect(300, 600, 4, 100),
    );

    expect(hit).not.toBeNull();
    expect(hit!.t).toBeGreaterThan(0);
    expect(hit!.t).toBeLessThan(1);
    expect(hit!.nx).toBeCloseTo(-1);
    expect(hit!.ny).toBeCloseTo(0);
  });

  it('reflects both axes on a corner hit', () => {
    const hit = sweptCircleAabb(
      90,
      90,
      9,
      200,
      200,
      0.2,
      aabbFromRect(120, 120, 40, 40),
    );

    expect(hit).not.toBeNull();
    expect(hit!.nx).toBeLessThan(0);
    expect(hit!.ny).toBeLessThan(0);
    expect(Math.hypot(hit!.nx, hit!.ny)).toBeCloseTo(1);
  });

  it('depenetrates a circle that already overlaps a box', () => {
    const hit = sweptCircleAabb(100, 100, 9, 10, 0, 1 / 120, aabbFromRect(100, 90, 40, 20));

    expect(hit).not.toBeNull();
    expect(hit!.t).toBe(0);
    expect(hit!.depth).toBeGreaterThan(0);
  });
});

describe('world collisions', () => {
  it('does not tunnel through a thin block at 1050 u/s', () => {
    const world = createWorld();
    world.blocks.push(keeperBlock());
    const block = addBlock(world, {
      left: 300,
      top: 600,
      width: 4,
      height: 100,
      type: 'crystal',
      hp: 1,
      maxHp: 1,
    });
    const ball = addBall(world, { x: 280, y: 650, vx: 1050, vy: 0 });

    world.step(NO_INPUT, 1000 / 30);

    expect(block.hp).toBeLessThanOrEqual(0);
    expect(ball.vx).toBeLessThan(0);
    expect(world.score).toBe(10);
    expect(world.blocks).not.toContain(block);
  });

  it('registers two balls hitting the same block in one step', () => {
    const world = createWorld();
    world.blocks.push(keeperBlock());
    const block = addBlock(world, {
      left: 300,
      top: 600,
      width: 40,
      height: 100,
      type: 'obsidian',
      hp: 3,
      maxHp: 3,
    });
    addBall(world, { x: 280, y: 650, vx: 1050, vy: 0 });
    addBall(world, { x: 360, y: 650, vx: -1050, vy: 0 });

    const events = world.step(NO_INPUT, 1000 / 30);
    const hits = events.filter((event) => event.type === 'block:hit');

    expect(hits).toHaveLength(2);
    expect(block.hp).toBe(1);
  });

  it('uses the contact offset for the angular paddle bounce', () => {
    const world = createWorld();
    world.blocks.push(keeperBlock());
    const paddle = world.paddle;
    const ball = addBall(world, {
      x: paddle.x + paddle.width * 0.4,
      y: paddle.y - paddle.height / 2 - 11,
      vx: 0,
      vy: 500,
    });

    world.step(NO_INPUT, 1000 / 120);

    expect(ball.vx).toBeGreaterThan(0);
    expect(ball.vy).toBeLessThan(0);
    expect(Math.hypot(ball.vx, ball.vy)).toBeCloseTo(520, 0);
  });
});
