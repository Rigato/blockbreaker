import { describe, expect, it } from 'vitest';
import { addBall, createWorld, keeperBlock, NO_INPUT } from './helpers/world';

const STEP_MS = 100;

function runFor(world: ReturnType<typeof createWorld>, ms: number): string[] {
  const kinds: string[] = [];
  const steps = Math.round(ms / STEP_MS);
  for (let step = 0; step < steps; step += 1) {
    for (const event of world.step(NO_INPUT, STEP_MS)) {
      if (event.type === 'anti-stall') kinds.push(event.kind);
    }
  }
  return kinds;
}

describe('anti-stall', () => {
  it('nudges after 6 s without a block or paddle hit', () => {
    const world = createWorld();
    world.blocks.push(keeperBlock());
    addBall(world, { x: 360, y: 1100, vx: 200, vy: -70 });

    const events = runFor(world, 6000);

    expect(events).toContain('nudge');
  });

  it('adds a vertical component after 3 s near horizontal', () => {
    const world = createWorld();
    world.blocks.push(keeperBlock());
    const ball = addBall(world, { x: 360, y: 900, vx: 200, vy: -10 });

    const events = runFor(world, 3000);

    expect(events).toContain('horizontal');
    expect(Math.abs(ball.vy)).toBeGreaterThan(Math.abs(-10));
  });

  it('teleports a ball trapped above the blocks after 8 s', () => {
    const world = createWorld();
    world.blocks.push(keeperBlock());
    const ball = addBall(world, { x: 360, y: 100, vx: 200, vy: 0 });

    const events = runFor(world, 8000);

    expect(events).toContain('teleport');
    expect(ball.y).toBeLessThan(world.paddle.y);
    expect(ball.vy).toBeLessThan(0);
  });
});
