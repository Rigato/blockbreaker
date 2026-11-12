import { describe, expect, it } from 'vitest';
import { BASE_RUN_MODIFIERS, SIM_TUNING_DEFAULTS } from '../src/game/config';
import type { WaveDef } from '../src/content/types';
import { World } from '../src/sim/World';

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

describe('special blocks', () => {
  it('explosive blocks damage neighbours in the 1-cell ring', () => {
    const world = makeWorld({
      id: 'explosive',
      name: 'Explosive',
      rows: ['e1'],
      legend: { e: 'explosive', '1': 'crystal' },
      ballSpeed: 520,
    });

    const explosive = block(world, '0:0');
    const neighbour = block(world, '0:1');
    expect(world.damageBlock(explosive, explosive.hp)).toBe(true);

    expect(world.blocks).not.toContain(explosive);
    expect(world.blocks).not.toContain(neighbour);
    expect(world.events.some((event) => event.type === 'explosion')).toBe(true);
  });

  it('regenerates one HP after the timer and emits block:healed', () => {
    const world = makeWorld({
      id: 'regen',
      name: 'Regen',
      rows: ['r'],
      legend: { r: 'regenerative' },
      ballSpeed: 520,
    });

    const regenerative = block(world, '0:0');
    world.damageBlock(regenerative, 1);
    expect(regenerative.hp).toBe(2);

    let healed = false;
    for (let step = 0; step < 420 && !healed; step += 1) {
      const events = world.step({ paddleTargetX: null, paddleDirection: 0, launch: false }, 10);
      healed = events.some((event) => event.type === 'block:healed');
    }

    expect(healed).toBe(true);
    expect(regenerative.hp).toBe(3);
  });

  it('generators spawn a crystal in an empty adjacent cell', () => {
    const world = makeWorld({
      id: 'generator',
      name: 'Generator',
      rows: ['...', '.g.', '...'],
      legend: { g: 'generator' },
      ballSpeed: 520,
    });

    expect(world.blocks).toHaveLength(1);
    let spawned = false;
    for (let step = 0; step < 520 && !spawned; step += 1) {
      const events = world.step({ paddleTargetX: null, paddleDirection: 0, launch: false }, 10);
      spawned = events.some((event) => event.type === 'block:spawned');
    }

    expect(spawned).toBe(true);
    expect(world.blocks).toHaveLength(2);
  });

  it('multiplier blocks activate a timed XP/score buff', () => {
    const world = makeWorld({
      id: 'multiplier',
      name: 'Multiplier',
      rows: ['x1'],
      legend: { x: 'multiplier', '1': 'crystal' },
      ballSpeed: 520,
    });

    const multiplier = block(world, '0:0');
    world.damageBlock(multiplier, multiplier.hp);

    expect(world.multiplierState).not.toBeNull();
    expect(world.multiplierState!.xpFactor).toBe(2);
    expect(world.multiplierState!.scoreFactor).toBe(2);
    expect(world.events.some((event) => event.type === 'multiplier:activated')).toBe(true);

    const crystal = block(world, '0:1');
    world.damageBlock(crystal, crystal.hp);
    const destroyed = world.events
      .filter((event) => event.type === 'block:destroyed')
      .at(-1);
    expect(destroyed?.type).toBe('block:destroyed');
    if (destroyed?.type === 'block:destroyed') {
      expect(destroyed.score).toBe(20);
      expect(destroyed.xp).toBe(2);
    }
  });

  it('starts the Explosive Core count when the perk is acquired', () => {
    const world = makeWorld({
      id: 'explosive-core-counter',
      name: 'Counter',
      rows: ['11111', '11111', '11111', '11111'],
      legend: { '1': 'crystal' },
      ballSpeed: 520,
    });

    // Seven kills before the perk must not count toward Explosive Core.
    for (let index = 0; index < 7; index += 1) {
      world.damageBlock(world.blocks[0]!, 1);
    }
    world.drainEvents();
    world.applyRunModifiers({ ...BASE_RUN_MODIFIERS, explosiveEvery: 8 });

    world.damageBlock(world.blocks[0]!, 1);
    expect(world.events.some((event) => event.type === 'explosion')).toBe(false);

    for (let index = 0; index < 7; index += 1) {
      world.damageBlock(world.blocks[0]!, 1);
    }
    expect(world.events.some((event) => event.type === 'explosion')).toBe(true);
  });

  it('starts the Bombardier count when the perk is acquired', () => {
    const world = makeWorld({
      id: 'bombardier-counter',
      name: 'Counter',
      rows: ['11111', '11111', '11111', '11111', '11111'],
      legend: { '1': 'crystal' },
      ballSpeed: 520,
    });

    for (let index = 0; index < 11; index += 1) {
      world.damageBlock(world.blocks[0]!, 1);
    }
    world.drainEvents();
    world.applyRunModifiers({ ...BASE_RUN_MODIFIERS, bombardierEvery: 12 });

    world.damageBlock(world.blocks[0]!, 1);
    expect(world.bombardierArmed).toBe(false);

    for (let index = 0; index < 11; index += 1) {
      world.damageBlock(world.blocks[0]!, 1);
    }
    expect(world.bombardierArmed).toBe(true);
    expect(world.events.some((event) => event.type === 'explosion')).toBe(false);
  });

  it('linked blocks share damage with every member of their group', () => {
    const world = makeWorld({
      id: 'linked',
      name: 'Linked',
      rows: ['ll', 'l.'],
      legend: { l: 'linked' },
      ballSpeed: 520,
    });

    const first = block(world, '0:0');
    const right = block(world, '0:1');
    const below = block(world, '1:0');
    expect(first.linkGroup).toBeDefined();
    expect(right.linkGroup).toBe(first.linkGroup);
    expect(below.linkGroup).toBe(first.linkGroup);

    world.damageBlock(first, 1);
    expect(first.hp).toBe(1);
    expect(right.hp).toBe(1);
    expect(below.hp).toBe(1);
    expect(world.events.some((event) => event.type === 'link:pulse')).toBe(true);
  });
});
