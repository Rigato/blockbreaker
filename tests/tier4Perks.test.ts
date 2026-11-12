import { describe, expect, it } from 'vitest';
import {
  BASE_RUN_MODIFIERS,
  GAME_CONFIG,
  SIM_TUNING_DEFAULTS,
} from '../src/game/config';
import type { RunModifiers } from '../src/game/contracts';
import type { WaveDef } from '../src/content/types';
import { FIELD_WIDTH, World, type Ball, type Block } from '../src/sim/World';
import { addBall, addBlock, NO_INPUT } from './helpers/world';

const STEP_MS = 1000 / 120;

function withMods(overrides: Partial<RunModifiers>): RunModifiers {
  return { ...BASE_RUN_MODIFIERS, ...overrides };
}

function makeWorld(wave: Partial<WaveDef> = {}): World {
  const world = new World({
    wave: {
      id: 'tier4-test',
      name: 'Tier 4 Test',
      rows: [],
      legend: {},
      ballSpeed: 520,
      ...wave,
    },
    height: 1280,
    tuning: { ...SIM_TUNING_DEFAULTS },
    seed: 1,
  });
  world.reset();
  world.balls.length = 0;
  world.blocks.length = 0;
  return world;
}

/** Keeps the world in play while test blocks are rebuilt or inspected. */
function keepAlive(world: World): Ball {
  return addBall(world, {
    x: 40,
    y: 1100,
    vx: 0,
    vy: 0,
    spawnGraceMs: 0,
  });
}

function removeBall(world: World, ball: Ball): void {
  const index = world.balls.indexOf(ball);
  if (index >= 0) world.balls.splice(index, 1);
}

/** Places a ball next to `block` and steps once so it registers a direct hit. */
function hitBlock(world: World, block: Block): ReturnType<World['step']> {
  const ball = addBall(world, {
    x: block.left - SIM_TUNING_DEFAULTS.ballRadius - 1,
    y: block.top + block.height / 2,
    vx: 900,
    vy: 0,
    spawnGraceMs: 0,
  });
  const events = world.step(NO_INPUT, STEP_MS);
  removeBall(world, ball);
  return events;
}

/** Sends a ball into the paddle and returns the events from the hit step. */
function stepPaddleHit(world: World): ReturnType<World['step']> {
  const ball = addBall(world, {
    x: world.paddle.x,
    y:
      world.paddle.y -
      world.paddle.height / 2 -
      SIM_TUNING_DEFAULTS.ballRadius -
      5,
    vx: 0,
    vy: 600,
    spawnGraceMs: 0,
  });
  let events: ReturnType<World['step']> = [];
  for (let step = 0; step < 20; step += 1) {
    events = world.step(NO_INPUT, STEP_MS);
    if (events.some((event) => event.type === 'paddle:hit')) break;
  }
  removeBall(world, ball);
  return events;
}

function hitPaddle(world: World): boolean {
  return stepPaddleHit(world).some((event) => event.type === 'paddle:hit');
}

interface OverkillSetup {
  world: World;
  center: Block;
  up: Block;
  down: Block;
  left: Block;
  right: Block;
  diagonal: Block;
}

function overkillWorld(ballDamage: number): OverkillSetup {
  const world = makeWorld();
  keepAlive(world);
  world.applyRunModifiers(
    withMods({
      overkillMaxSplash: GAME_CONFIG.perks.overkillMaxSplash,
      ballDamage,
    }),
  );

  const center = addBlock(world, {
    id: 'overkill-center',
    left: 300,
    top: 400,
    width: 60,
    height: 60,
    hp: 1,
    maxHp: 1,
    row: 5,
    col: 5,
  });
  const up = addBlock(world, {
    id: 'overkill-up',
    left: 300,
    top: 300,
    width: 60,
    height: 60,
    hp: 10,
    maxHp: 10,
    row: 4,
    col: 5,
  });
  const down = addBlock(world, {
    id: 'overkill-down',
    left: 300,
    top: 500,
    width: 60,
    height: 60,
    hp: 10,
    maxHp: 10,
    row: 6,
    col: 5,
  });
  const left = addBlock(world, {
    id: 'overkill-left',
    left: 200,
    top: 400,
    width: 60,
    height: 60,
    hp: 10,
    maxHp: 10,
    row: 5,
    col: 4,
  });
  const right = addBlock(world, {
    id: 'overkill-right',
    left: 400,
    top: 400,
    width: 60,
    height: 60,
    hp: 10,
    maxHp: 10,
    row: 5,
    col: 6,
  });
  const diagonal = addBlock(world, {
    id: 'overkill-diagonal',
    left: 200,
    top: 300,
    width: 60,
    height: 60,
    hp: 10,
    maxHp: 10,
    row: 4,
    col: 4,
  });

  return { world, center, up, down, left, right, diagonal };
}

describe('Overkill', () => {
  it('splashes excess damage to the four orthogonal neighbours only', () => {
    const { world, center, up, down, left, right, diagonal } = overkillWorld(2);

    const events = hitBlock(world, center);
    expect(
      events.some(
        (event) =>
          event.type === 'block:destroyed' &&
          event.blockId === 'overkill-center',
      ),
    ).toBe(true);
    expect(world.blocks).not.toContain(center);
    expect(up.hp).toBe(9);
    expect(down.hp).toBe(9);
    expect(left.hp).toBe(9);
    expect(right.hp).toBe(9);
    expect(diagonal.hp).toBe(10);
  });

  it('caps the splash at the configured maximum', () => {
    const { world, center, up, down, left, right } = overkillWorld(5);

    hitBlock(world, center);
    expect(up.hp).toBe(8);
    expect(down.hp).toBe(8);
    expect(left.hp).toBe(8);
    expect(right.hp).toBe(8);
  });

  it('does not chain Overkill from its own splash', () => {
    const world = makeWorld();
    keepAlive(world);
    world.applyRunModifiers(
      withMods({
        overkillMaxSplash: GAME_CONFIG.perks.overkillMaxSplash,
        ballDamage: 5,
      }),
    );

    const center = addBlock(world, {
      id: 'splash-center',
      left: 300,
      top: 500,
      width: 60,
      height: 60,
      hp: 1,
      maxHp: 1,
      row: 5,
      col: 5,
    });
    const bridge = addBlock(world, {
      id: 'splash-bridge',
      left: 300,
      top: 400,
      width: 60,
      height: 60,
      hp: 1,
      maxHp: 1,
      row: 4,
      col: 5,
    });
    const beyond = addBlock(world, {
      id: 'splash-beyond',
      left: 300,
      top: 300,
      width: 60,
      height: 60,
      hp: 10,
      maxHp: 10,
      row: 3,
      col: 5,
    });

    hitBlock(world, center);
    expect(world.blocks).not.toContain(bridge);
    expect(beyond.hp).toBe(10);
  });

  it('does not trigger from explosion damage', () => {
    const world = makeWorld();
    keepAlive(world);
    world.applyRunModifiers(
      withMods({ overkillMaxSplash: GAME_CONFIG.perks.overkillMaxSplash }),
    );

    const explosive = addBlock(world, {
      id: 'explosion-center',
      type: 'explosive',
      left: 300,
      top: 500,
      width: 60,
      height: 60,
      hp: 1,
      maxHp: 1,
      row: 5,
      col: 5,
    });
    const ring = addBlock(world, {
      id: 'explosion-ring',
      left: 300,
      top: 400,
      width: 60,
      height: 60,
      hp: 0.5,
      maxHp: 1,
      row: 4,
      col: 5,
    });
    const beyond = addBlock(world, {
      id: 'explosion-beyond',
      left: 300,
      top: 300,
      width: 60,
      height: 60,
      hp: 10,
      maxHp: 10,
      row: 3,
      col: 5,
    });

    hitBlock(world, explosive);
    expect(world.blocks).not.toContain(ring);
    expect(beyond.hp).toBe(10);
  });

  it('does not trigger from link damage', () => {
    const world = makeWorld();
    keepAlive(world);
    world.applyRunModifiers(
      withMods({ overkillMaxSplash: GAME_CONFIG.perks.overkillMaxSplash }),
    );

    const center = addBlock(world, {
      id: 'link-center',
      type: 'linked',
      left: 300,
      top: 500,
      width: 60,
      height: 60,
      hp: 1,
      maxHp: 1,
      row: 5,
      col: 5,
    });
    const linked = addBlock(world, {
      id: 'link-neighbour',
      type: 'linked',
      left: 300,
      top: 400,
      width: 60,
      height: 60,
      hp: 0.5,
      maxHp: 1,
      row: 4,
      col: 5,
    });
    const beyond = addBlock(world, {
      id: 'link-beyond',
      left: 300,
      top: 300,
      width: 60,
      height: 60,
      hp: 10,
      maxHp: 10,
      row: 3,
      col: 5,
    });
    center.linkGroup = 1;
    linked.linkGroup = 1;

    hitBlock(world, center);
    expect(world.blocks).not.toContain(linked);
    expect(beyond.hp).toBe(10);
  });
});

interface ShieldBashSetup {
  world: World;
  bottom: Block;
  next: Block;
  far: Block;
}

function shieldBashWorld(
  overrides: Partial<RunModifiers> = {},
): ShieldBashSetup {
  const world = makeWorld();
  world.applyRunModifiers(
    withMods({
      shieldBashEvery: GAME_CONFIG.perks.shieldBashEvery,
      shieldBashDamage: GAME_CONFIG.perks.shieldBashDamage,
      shieldBashRows: GAME_CONFIG.perks.shieldBashRows,
      ...overrides,
    }),
  );

  const bottom = addBlock(world, {
    id: 'shield-bottom',
    left: 100,
    top: 900,
    width: 60,
    height: 60,
    hp: 10,
    maxHp: 10,
    row: 5,
    col: 1,
  });
  const next = addBlock(world, {
    id: 'shield-next',
    left: 200,
    top: 800,
    width: 60,
    height: 60,
    hp: 10,
    maxHp: 10,
    row: 4,
    col: 2,
  });
  const far = addBlock(world, {
    id: 'shield-far',
    left: 300,
    top: 600,
    width: 60,
    height: 60,
    hp: 10,
    maxHp: 10,
    row: 2,
    col: 3,
  });
  return { world, bottom, next, far };
}

describe('Shield Bash', () => {
  it('triggers on the eighth paddle hit, hits only the bottom rows and resets', () => {
    const { world, bottom, next, far } = shieldBashWorld();

    for (let hit = 0; hit < 7; hit += 1) {
      expect(hitPaddle(world)).toBe(true);
    }
    expect(world.shieldBashProgress).toBe(7);
    expect(bottom.hp).toBe(10);
    expect(next.hp).toBe(10);
    expect(far.hp).toBe(10);

    const events = stepPaddleHit(world);
    const explosion = events.find((event) => event.type === 'explosion');
    expect(explosion?.type).toBe('explosion');
    if (explosion?.type === 'explosion') {
      expect(explosion.x).toBe(FIELD_WIDTH / 2);
      expect(explosion.radius).toBe(FIELD_WIDTH / 2);
      expect(explosion.blockIds).toEqual(
        expect.arrayContaining(['shield-bottom', 'shield-next']),
      );
      expect(explosion.blockIds).not.toContain('shield-far');
    }
    expect(world.shieldBashProgress).toBe(0);
    expect(bottom.hp).toBe(9);
    expect(next.hp).toBe(9);
    expect(far.hp).toBe(10);

    for (let hit = 0; hit < 7; hit += 1) hitPaddle(world);
    expect(bottom.hp).toBe(9);
    expect(next.hp).toBe(9);
    expect(hitPaddle(world)).toBe(true);
    expect(bottom.hp).toBe(8);
    expect(next.hp).toBe(8);
  });

  it('anchors to the highest present row when the bottom row is empty', () => {
    const world = makeWorld();
    world.applyRunModifiers(
      withMods({
        shieldBashEvery: GAME_CONFIG.perks.shieldBashEvery,
        shieldBashDamage: GAME_CONFIG.perks.shieldBashDamage,
        shieldBashRows: GAME_CONFIG.perks.shieldBashRows,
      }),
    );
    const emptyBottom = 9;
    const bottom = addBlock(world, {
      id: 'empty-bottom',
      left: 100,
      top: 900,
      width: 60,
      height: 60,
      hp: 10,
      maxHp: 10,
      row: emptyBottom - 1,
      col: 1,
    });
    const next = addBlock(world, {
      id: 'empty-next',
      left: 200,
      top: 800,
      width: 60,
      height: 60,
      hp: 10,
      maxHp: 10,
      row: emptyBottom - 2,
      col: 2,
    });
    const above = addBlock(world, {
      id: 'empty-above',
      left: 300,
      top: 700,
      width: 60,
      height: 60,
      hp: 10,
      maxHp: 10,
      row: emptyBottom - 3,
      col: 3,
    });

    for (let hit = 0; hit < 8; hit += 1) hitPaddle(world);
    expect(bottom.hp).toBe(9);
    expect(next.hp).toBe(9);
    expect(above.hp).toBe(10);
  });

  it('resets its counter when the run resets', () => {
    const { world } = shieldBashWorld();
    for (let hit = 0; hit < 7; hit += 1) hitPaddle(world);
    expect(world.shieldBashProgress).toBe(7);

    world.reset();
    expect(world.shieldBashProgress).toBe(0);

    const bottom = addBlock(world, {
      id: 'after-reset-bottom',
      left: 100,
      top: 900,
      width: 60,
      height: 60,
      hp: 10,
      maxHp: 10,
      row: 5,
      col: 1,
    });
    const next = addBlock(world, {
      id: 'after-reset-next',
      left: 200,
      top: 800,
      width: 60,
      height: 60,
      hp: 10,
      maxHp: 10,
      row: 4,
      col: 2,
    });
    for (let hit = 0; hit < 7; hit += 1) hitPaddle(world);
    expect(bottom.hp).toBe(10);
    expect(next.hp).toBe(10);
    expect(hitPaddle(world)).toBe(true);
    expect(bottom.hp).toBe(9);
    expect(next.hp).toBe(9);
  });

  it('resets its counter when the perk is acquired', () => {
    const world = makeWorld();
    const bottom = addBlock(world, {
      id: 'acquired-bottom',
      left: 100,
      top: 900,
      width: 60,
      height: 60,
      hp: 10,
      maxHp: 10,
      row: 5,
      col: 1,
    });

    for (let hit = 0; hit < 7; hit += 1) hitPaddle(world);
    expect(world.shieldBashProgress).toBe(7);

    world.applyRunModifiers(
      withMods({
        shieldBashEvery: GAME_CONFIG.perks.shieldBashEvery,
        shieldBashDamage: GAME_CONFIG.perks.shieldBashDamage,
        shieldBashRows: GAME_CONFIG.perks.shieldBashRows,
      }),
    );
    expect(world.shieldBashProgress).toBe(0);

    for (let hit = 0; hit < 7; hit += 1) hitPaddle(world);
    expect(bottom.hp).toBe(10);
    expect(hitPaddle(world)).toBe(true);
    expect(bottom.hp).toBe(9);
  });

  it('does not trigger Overkill from its shockwave', () => {
    const world = makeWorld();
    world.applyRunModifiers(
      withMods({
        shieldBashEvery: 8,
        shieldBashDamage: 3,
        shieldBashRows: 2,
        overkillMaxSplash: 2,
      }),
    );
    const bottom = addBlock(world, {
      id: 'bash-bottom',
      left: 100,
      top: 900,
      width: 60,
      height: 60,
      hp: 1,
      maxHp: 1,
      row: 5,
      col: 1,
    });
    const next = addBlock(world, {
      id: 'bash-next',
      left: 200,
      top: 800,
      width: 60,
      height: 60,
      hp: 10,
      maxHp: 10,
      row: 4,
      col: 2,
    });
    const above = addBlock(world, {
      id: 'bash-above',
      left: 300,
      top: 700,
      width: 60,
      height: 60,
      hp: 10,
      maxHp: 10,
      row: 3,
      col: 3,
    });

    for (let hit = 0; hit < 8; hit += 1) hitPaddle(world);
    expect(world.blocks).not.toContain(bottom);
    expect(next.hp).toBe(7);
    expect(above.hp).toBe(10);
  });
});

function laserWorld(level: number, factor: number): World {
  const world = makeWorld();
  world.applyRunModifiers(
    withMods({
      laserCooldown: GAME_CONFIG.perks.laserCooldownMs,
      laserLevel: level,
      conductorChainFactor: factor,
    }),
  );
  return world;
}

function launchForLaser(world: World): void {
  world.spawnStuckBall();
  world.step({ ...NO_INPUT, launch: true }, STEP_MS);
}

describe('Conductor', () => {
  it('chains once to an orthogonal neighbour for half the laser level', () => {
    const world = laserWorld(3, GAME_CONFIG.perks.conductorChainFactor);
    const primary = addBlock(world, {
      id: 'laser-primary',
      left: 330,
      top: 400,
      width: 60,
      height: 60,
      hp: 10,
      maxHp: 10,
      row: 5,
      col: 3,
    });
    const neighbour = addBlock(world, {
      id: 'laser-neighbour',
      left: 400,
      top: 400,
      width: 60,
      height: 60,
      hp: 10,
      maxHp: 10,
      row: 5,
      col: 4,
    });
    launchForLaser(world);

    expect(world.fireLaser()).toBe(true);
    expect(primary.hp).toBe(7);
    expect(neighbour.hp).toBe(8);
  });

  it('uses the minimum of one damage at laser level one', () => {
    const world = laserWorld(1, GAME_CONFIG.perks.conductorChainFactor);
    const primary = addBlock(world, {
      id: 'laser-low-primary',
      left: 330,
      top: 400,
      width: 60,
      height: 60,
      hp: 10,
      maxHp: 10,
      row: 5,
      col: 3,
    });
    const neighbour = addBlock(world, {
      id: 'laser-low-neighbour',
      left: 400,
      top: 400,
      width: 60,
      height: 60,
      hp: 10,
      maxHp: 10,
      row: 5,
      col: 4,
    });
    launchForLaser(world);

    expect(world.fireLaser()).toBe(true);
    expect(primary.hp).toBe(9);
    expect(neighbour.hp).toBe(9);
  });

  it('does not chain without the perk', () => {
    const world = laserWorld(3, 0);
    const primary = addBlock(world, {
      id: 'laser-off-primary',
      left: 330,
      top: 400,
      width: 60,
      height: 60,
      hp: 10,
      maxHp: 10,
      row: 5,
      col: 3,
    });
    const neighbour = addBlock(world, {
      id: 'laser-off-neighbour',
      left: 400,
      top: 400,
      width: 60,
      height: 60,
      hp: 10,
      maxHp: 10,
      row: 5,
      col: 4,
    });
    launchForLaser(world);

    expect(world.fireLaser()).toBe(true);
    expect(primary.hp).toBe(7);
    expect(neighbour.hp).toBe(10);
  });

  it('chains only once even with several adjacent blocks', () => {
    const world = laserWorld(3, GAME_CONFIG.perks.conductorChainFactor);
    addBlock(world, {
      id: 'laser-many-primary',
      left: 330,
      top: 400,
      width: 60,
      height: 60,
      hp: 10,
      maxHp: 10,
      row: 5,
      col: 3,
    });
    const left = addBlock(world, {
      id: 'laser-many-left',
      left: 260,
      top: 400,
      width: 60,
      height: 60,
      hp: 10,
      maxHp: 10,
      row: 5,
      col: 2,
    });
    const right = addBlock(world, {
      id: 'laser-many-right',
      left: 400,
      top: 400,
      width: 60,
      height: 60,
      hp: 10,
      maxHp: 10,
      row: 5,
      col: 4,
    });
    launchForLaser(world);

    expect(world.fireLaser()).toBe(true);
    const damaged = [left, right].filter((block) => block.hp < 10);
    expect(damaged).toHaveLength(1);
    expect(damaged[0]!.hp).toBe(8);
  });

  it('never chains to a block already hit by the beam', () => {
    const world = laserWorld(3, GAME_CONFIG.perks.conductorChainFactor);
    const primary = addBlock(world, {
      id: 'laser-beam-primary',
      left: 330,
      top: 400,
      width: 60,
      height: 60,
      hp: 10,
      maxHp: 10,
      row: 5,
      col: 3,
    });
    const inBeam = addBlock(world, {
      id: 'laser-beam-neighbour',
      left: 330,
      top: 300,
      width: 60,
      height: 60,
      hp: 10,
      maxHp: 10,
      row: 4,
      col: 3,
    });
    launchForLaser(world);

    expect(world.fireLaser()).toBe(true);
    expect(primary.hp).toBe(7);
    expect(inBeam.hp).toBe(7);
  });

  it('ships the configured Tier 4 tuning', () => {
    expect(GAME_CONFIG.perks.overkillMaxSplash).toBe(2);
    expect(GAME_CONFIG.perks.shieldBashEvery).toBe(8);
    expect(GAME_CONFIG.perks.shieldBashDamage).toBe(1);
    expect(GAME_CONFIG.perks.shieldBashRows).toBe(2);
    expect(GAME_CONFIG.perks.conductorChainFactor).toBe(0.5);
  });
});
