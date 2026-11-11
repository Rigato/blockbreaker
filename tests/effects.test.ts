import { describe, expect, it } from 'vitest';
import { BASE_RUN_MODIFIERS, GAME_CONFIG } from '../src/game/config';
import type { RunModifiers } from '../src/game/contracts';
import { FIELD_WIDTH, World } from '../src/sim/World';
import { addBall, addBlock, createWorld, keeperBlock, NO_INPUT } from './helpers/world';

const STEP_MS = 1000 / 120;

function withMods(overrides: Partial<RunModifiers>): RunModifiers {
  return { ...BASE_RUN_MODIFIERS, ...overrides };
}

function keepAlive(world: World): void {
  // Launch once so the laser is armed, then keep a still ball far from the
  // action to prevent the "no balls" defeat check.
  if (world.blocks.length === 0) world.blocks.push(keeperBlock());
  if (!world.balls.some((ball) => ball.stuck)) world.spawnStuckBall();
  world.step({ ...NO_INPUT, launch: true }, STEP_MS);
  addBall(world, { x: 100, y: 1100, vx: 0, vy: 0 });
}

describe('run modifiers', () => {
  it('applies paddle width, ball radius and damage multipliers live', () => {
    const world = createWorld();
    world.blocks.push(keeperBlock());
    const existing = addBall(world, { x: 200, y: 1000, vx: 0, vy: 0 });

    world.applyRunModifiers(
      withMods({ paddleWidthMultiplier: 1.5, ballRadiusMultiplier: 2, ballDamage: 2 }),
    );

    expect(world.paddle.width).toBeCloseTo(GAME_CONFIG.paddle.width * 1.5, 5);
    expect(existing.radius).toBeCloseTo(GAME_CONFIG.ball.radius * 2, 5);
    expect(world.modifiers.ballDamage).toBe(2);

    const block = addBlock(world, {
      left: 340,
      top: 600,
      width: 40,
      height: 100,
      type: 'obsidian',
      hp: 3,
      maxHp: 3,
    });
    addBall(world, { x: 310, y: 650, vx: 900, vy: 0 });

    world.step(NO_INPUT, 1000 / 30);

    expect(block.hp).toBe(1);
    const hit = world.events.find((event) => event.type === 'block:hit');
    expect(hit && hit.type === 'block:hit' ? hit.damage : null).toBe(2);
  });

  it('clamps a huge paddle width inside the field', () => {
    const world = createWorld();
    world.applyRunModifiers(withMods({ paddleWidthMultiplier: 100 }));

    expect(world.paddle.width).toBeLessThanOrEqual(FIELD_WIDTH);
  });

  it('caps multiball spawns at the base maximum of eight', () => {
    const world = createWorld();
    const created = world.spawnPerkBalls(10);

    expect(created).toBe(8);
    expect(world.balls).toHaveLength(8);
    // ±18°/±36° spread: first ball goes right, second goes left.
    expect(world.balls[0]!.vx).toBeGreaterThan(0);
    expect(world.balls[1]!.vx).toBeLessThan(0);
    expect(world.balls[0]!.vy).toBeLessThan(0);
  });

  it('respects a reduced maxBalls modifier', () => {
    const world = createWorld();
    world.spawnStuckBall();
    world.applyRunModifiers(withMods({ maxBalls: 4 }));

    expect(world.spawnPerkBalls(5)).toBe(3);
    expect(world.balls).toHaveLength(4);
  });
});

describe('sticky paddle', () => {
  function dropOntoPaddle(world: World): ReturnType<typeof addBall> {
    const ball = addBall(world, { x: world.paddle.x, y: 1000, vx: 0, vy: 400 });
    for (let step = 0; step < 300 && !ball.stuck; step += 1) {
      world.step(NO_INPUT, 8);
    }
    return ball;
  }

  it('catches the ball and releases it on launch input', () => {
    const world = createWorld();
    world.blocks.push(keeperBlock());
    world.applyRunModifiers(withMods({ stickyPaddle: true }));

    const ball = dropOntoPaddle(world);
    expect(ball.stuck).toBe(true);
    expect(ball.sticky).toBe(true);
    expect(ball.stickyHoldRemainingMs).toBeCloseTo(GAME_CONFIG.perks.stickyHoldMs, 0);

    world.step({ paddleTargetX: null, paddleDirection: 0, launch: true }, 8);

    expect(ball.stuck).toBe(false);
    expect(ball.sticky).toBe(false);
    expect(ball.vy).toBeLessThan(0);
  });

  it('releases automatically after the hold time, but not the initial ball', () => {
    const world = createWorld();
    world.blocks.push(keeperBlock());
    world.applyRunModifiers(withMods({ stickyPaddle: true }));

    const ball = dropOntoPaddle(world);
    expect(ball.stuck).toBe(true);

    for (let step = 0; step < 320; step += 1) world.step(NO_INPUT, 8);

    expect(ball.stuck).toBe(false);
    expect(ball.sticky).toBe(false);
    expect(ball.vy).toBeLessThan(0);

    // The wave-start ball has no sticky flag and must stay attached.
    const initial = world.spawnStuckBall();
    for (let step = 0; step < 400; step += 1) world.step(NO_INPUT, 8);
    expect(initial.stuck).toBe(true);
  });
});

describe('safety net', () => {
  it('saves the last ball while charges remain', () => {
    const world = createWorld();
    world.blocks.push(keeperBlock());
    world.applyRunModifiers(withMods({ safetyNetCharges: 1 }));
    world.setSafetyCharges(1);

    const events = world.step(NO_INPUT, STEP_MS);

    expect(world.outcome).toBe('playing');
    expect(world.safetyCharges).toBe(0);
    expect(world.balls).toHaveLength(1);
    expect(world.balls[0]!.vy).toBeLessThan(0);
    const saved = events.find((event) => event.type === 'safety-net');
    expect(saved && saved.type === 'safety-net' ? saved.charges : null).toBe(0);
  });

  it('defeats normally when no charge is left', () => {
    const world = createWorld();
    world.blocks.push(keeperBlock());
    world.applyRunModifiers(withMods({ safetyNetCharges: 0 }));

    const events = world.step(NO_INPUT, STEP_MS);

    expect(world.outcome).toBe('defeat');
    expect(events.some((event) => event.type === 'run:defeat')).toBe(true);
  });
});

describe('prism laser', () => {
  /** Five stacked blocks in the paddle column plus one block outside the beam. */
  function buildColumn(world: World, hp = 4): { column: ReturnType<typeof addBlock>[]; outside: ReturnType<typeof addBlock> } {
    const column: ReturnType<typeof addBlock>[] = [];
    for (let index = 0; index < 5; index += 1) {
      column.push(
        addBlock(world, {
          left: 340,
          top: 600 + index * 50,
          width: 40,
          height: 40,
          hp,
          maxHp: hp,
          row: index,
          col: 3,
        }),
      );
    }
    const outside = addBlock(world, {
      left: 100,
      top: 600,
      width: 40,
      height: 40,
      hp,
      maxHp: hp,
      row: 0,
      col: 0,
    });
    return { column, outside };
  }

  function prepare(level: number): World {
    const world = createWorld();
    world.blocks.push(keeperBlock());
    world.applyRunModifiers(
      withMods({
        laserCooldown: GAME_CONFIG.perks.laserCooldownMs,
        laserLevel: level,
      }),
    );
    keepAlive(world);
    return world;
  }

  it('level 1 hits the 3 nearest blocks for 1 damage each', () => {
    const world = prepare(1);
    const { column, outside } = buildColumn(world);

    expect(world.laserReady).toBe(true);
    expect(world.fireLaser()).toBe(true);

    // Targets are ordered by `top`: the three nearest the paddle take damage.
    expect(column.map((block) => block.hp)).toEqual([4, 4, 3, 3, 3]);
    expect(outside.hp).toBe(4);
    expect(world.laserBeam).not.toBeNull();
    const fired = world.events.find((event) => event.type === 'laser:fired');
    expect(fired && fired.type === 'laser:fired' ? fired.hits : null).toBe(3);
  });

  it('level 2 hits 4 blocks for 2 damage each', () => {
    const world = prepare(2);
    const { column, outside } = buildColumn(world);

    expect(world.fireLaser()).toBe(true);

    expect(column.map((block) => block.hp)).toEqual([4, 2, 2, 2, 2]);
    expect(outside.hp).toBe(4);
    const fired = world.events.find((event) => event.type === 'laser:fired');
    expect(fired && fired.type === 'laser:fired' ? fired.hits : null).toBe(4);
  });

  it('level 3 hits 5 blocks for 3 damage each', () => {
    const world = prepare(3);
    const { column, outside } = buildColumn(world);

    expect(world.fireLaser()).toBe(true);

    expect(column.map((block) => block.hp)).toEqual([1, 1, 1, 1, 1]);
    expect(outside.hp).toBe(4);
    const fired = world.events.find((event) => event.type === 'laser:fired');
    expect(fired && fired.type === 'laser:fired' ? fired.hits : null).toBe(5);
  });

  it('runs the 8 s cooldown', () => {
    const world = prepare(1);
    buildColumn(world);

    expect(world.fireLaser()).toBe(true);
    // A second shot is refused while the 8 s cooldown runs.
    expect(world.fireLaser()).toBe(false);
    expect(world.laserCooldownRemainingMs).toBe(GAME_CONFIG.perks.laserCooldownMs);

    world.step(NO_INPUT, 1000);
    expect(world.laserCooldownRemainingMs).toBeCloseTo(
      GAME_CONFIG.perks.laserCooldownMs - 1000,
      5,
    );
    expect(world.laserReady).toBe(false);
    expect(world.laserBeam).toBeNull();

    for (let secondIndex = 0; secondIndex < 7; secondIndex += 1) {
      world.step(NO_INPUT, 1000);
    }
    expect(world.laserCooldownRemainingMs).toBe(0);
    expect(world.laserReady).toBe(true);
  });

  it('does nothing without the laser modifier or at level 0', () => {
    const world = createWorld();
    world.blocks.push(keeperBlock());
    keepAlive(world);

    expect(world.fireLaser()).toBe(false);
    expect(world.laserReady).toBe(false);

    // A cooldown alone (level 0) is not enough to own the laser.
    world.applyRunModifiers(withMods({ laserCooldown: GAME_CONFIG.perks.laserCooldownMs }));
    expect(world.laserReady).toBe(false);
    expect(world.fireLaser()).toBe(false);
  });
});

describe('arcane turret', () => {
  it('fires automatically and the projectile deals 1 damage', () => {
    const world = createWorld();
    world.blocks.push(keeperBlock());
    world.applyRunModifiers(withMods({ turretInterval: 500 }));
    keepAlive(world);

    const block = addBlock(world, {
      left: 340,
      top: 600,
      width: 40,
      height: 50,
      type: 'stone',
      hp: 2,
      maxHp: 2,
    });

    let fired = false;
    for (let step = 0; step < 80 && !fired; step += 1) {
      const events = world.step(NO_INPUT, 10);
      fired = events.some((event) => event.type === 'projectile:fired');
    }

    expect(fired).toBe(true);
    expect(world.projectiles.length).toBeGreaterThan(0);

    for (let step = 0; step < 300 && block.hp === 2; step += 1) {
      world.step(NO_INPUT, 10);
    }

    expect(block.hp).toBe(1);
  });

  it('does not fire without the turret modifier', () => {
    const world = createWorld();
    world.blocks.push(keeperBlock());
    keepAlive(world);

    for (let step = 0; step < 200; step += 1) world.step(NO_INPUT, 10);

    expect(world.projectiles).toHaveLength(0);
  });
});

describe('explosive core', () => {
  function fireLaserWave(world: World, shots: number): void {
    for (let shot = 0; shot < shots; shot += 1) {
      expect(world.fireLaser()).toBe(true);
      for (let second = 0; second < 8; second += 1) {
        world.step(NO_INPUT, 1000);
      }
    }
  }

  it('explodes in a Chebyshev radius of 1 every eight kills', () => {
    const world = createWorld();
    world.applyRunModifiers(
      withMods({
        laserCooldown: GAME_CONFIG.perks.laserCooldownMs,
        laserLevel: 1,
        explosiveEvery: GAME_CONFIG.perks.explosiveEvery,
      }),
    );
    keepAlive(world);

    const targets = [];
    for (let row = 0; row < 8; row += 1) {
      targets.push(
        addBlock(world, {
          left: 340,
          top: 200 + row * 50,
          width: 40,
          height: 40,
          row,
          col: 0,
        }),
      );
    }
    // The eighth sequential laser kill is the top block, so put the neighbour
    // in that block's 1-cell blast ring.
    const neighbour = addBlock(world, {
      left: 390,
      top: 200,
      width: 40,
      height: 40,
      type: 'stone',
      hp: 2,
      maxHp: 2,
      row: 0,
      col: 1,
    });

    // Level 1 hits 3 blocks per shot, so 8 kills land on the third shot
    // (3 + 3 + 2). Fire it last so the explosion visual is still alive.
    fireLaserWave(world, 2);
    expect(world.fireLaser()).toBe(true);
    for (const block of targets) expect(world.blocks).not.toContain(block);
    expect(world.destroyedBlockCount).toBe(8);
    expect(world.explosions).toHaveLength(1);

    const explosion = world.events.find((event) => event.type === 'explosion');
    expect(explosion).toBeDefined();
    expect(neighbour.hp).toBe(1);
  });

  it('does not explode without the modifier', () => {
    const world = createWorld();
    world.applyRunModifiers(
      withMods({ laserCooldown: GAME_CONFIG.perks.laserCooldownMs, laserLevel: 1 }),
    );
    keepAlive(world);

    for (let row = 0; row < 8; row += 1) {
      addBlock(world, { left: 340, top: 200 + row * 50, width: 40, height: 40, row, col: 0 });
    }

    fireLaserWave(world, 3);

    expect(world.destroyedBlockCount).toBe(8);
    expect(world.explosions).toHaveLength(0);
  });
});

describe('XP payload', () => {
  it('includes maxHp and xp on block:destroyed', () => {
    const world = createWorld();
    world.blocks.push(keeperBlock());
    const block = addBlock(world, {
      left: 340,
      top: 600,
      width: 40,
      height: 100,
      type: 'stone',
      hp: 1,
      maxHp: 2,
    });
    addBall(world, { x: 310, y: 650, vx: 900, vy: 0, radius: 9 });

    world.step(NO_INPUT, 1000 / 30);

    expect(world.blocks).not.toContain(block);
    const destroyed = world.events.find((event) => event.type === 'block:destroyed');
    expect(destroyed).toBeDefined();
    if (destroyed && destroyed.type === 'block:destroyed') {
      expect(destroyed.maxHp).toBe(2);
      expect(destroyed.xp).toBe(2);
      expect(destroyed.score).toBe(20);
    }
  });
});
