import { describe, expect, it } from 'vitest';
import { BASE_RUN_MODIFIERS } from '../src/game/config';
import type { SimEvent } from '../src/sim/World';
import { addBall, addBlock, createWorld, NO_INPUT } from './helpers/world';

const STEP_MS = 1000 / 120;

function hitBlock(damage: number, hp: number) {
  const world = createWorld(1);
  addBlock(world, {
    id: 'target',
    type: hp > 1 ? 'stone' : 'crystal',
    hp,
    maxHp: hp,
    left: 330,
    top: 500,
    width: 60,
    height: 40,
  });
  const ball = addBall(world, { x: 360, y: 600, vx: 0, vy: -600 });
  world.applyRunModifiers({ ...BASE_RUN_MODIFIERS, ballDamage: damage });

  let events: readonly SimEvent[] = [];
  for (let step = 0; step < 40; step += 1) {
    events = world.step(NO_INPUT, STEP_MS);
    if (world.blocks.length === 0) break;
  }

  return { world, ball, events };
}

describe('lethal excess pierce', () => {
  it('pierces when damage exceeds HP by at least 1', () => {
    const { world, ball, events } = hitBlock(2, 1);

    expect(world.blocks).toHaveLength(0);
    expect(ball.vy).toBeLessThan(0);
    expect(events.some((event) => event.type === 'block:pierced')).toBe(true);
    const pierced = events.find((event) => event.type === 'block:pierced');
    if (pierced?.type === 'block:pierced') {
      expect(pierced.blockId).toBe('target');
      expect(pierced.x).toBe(360);
      expect(pierced.y).toBe(520);
    }
  });

  it('pierces a 2 HP block with 3 damage', () => {
    const { world, ball } = hitBlock(3, 2);

    expect(world.blocks).toHaveLength(0);
    expect(ball.vy).toBeLessThan(0);
  });

  it('destroys but bounces when damage equals HP', () => {
    const { world, ball, events } = hitBlock(2, 2);

    expect(world.blocks).toHaveLength(0);
    expect(ball.vy).toBeGreaterThan(0);
    expect(events.some((event) => event.type === 'block:pierced')).toBe(false);
  });

  it('does not pierce with only 1 damage against 1 HP', () => {
    const { world, ball, events } = hitBlock(1, 1);

    expect(world.blocks).toHaveLength(0);
    expect(ball.vy).toBeGreaterThan(0);
    expect(events.some((event) => event.type === 'block:pierced')).toBe(false);
  });
});
