import { describe, expect, it } from 'vitest';
import { BASE_RUN_MODIFIERS, GAME_CONFIG, SIM_TUNING_DEFAULTS } from '../src/game/config';
import type { RunModifiers } from '../src/game/contracts';
import type { WaveDef } from '../src/content/types';
import { World, type Ball, type Block } from '../src/sim/World';
import { addBall, addBlock, NO_INPUT } from './helpers/world';

const STEP_MS = 1000 / 120;

function withMods(overrides: Partial<RunModifiers>): RunModifiers {
  return { ...BASE_RUN_MODIFIERS, ...overrides };
}

function makeWorld(wave: Partial<WaveDef> = {}): World {
  const world = new World({
    wave: {
      id: 'rework-test',
      name: 'Rework Test',
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

/** Keeps the world in play while time advances or test blocks are rebuilt. */
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

function damageFromHit(world: World, block: Block): number {
  const before = block.hp;
  const events = hitBlock(world, block);
  expect(events.some((event) => event.type === 'block:hit')).toBe(true);
  return before - block.hp;
}

/** Sends a ball into the paddle so the existing combo reset runs. */
function hitPaddle(world: World): boolean {
  const ball = addBall(world, {
    x: world.paddle.x,
    y: world.paddle.y - world.paddle.height / 2 - SIM_TUNING_DEFAULTS.ballRadius - 5,
    vx: 0,
    vy: 600,
    spawnGraceMs: 0,
  });
  let hit = false;
  for (let step = 0; step < 20 && !hit; step += 1) {
    const events = world.step(NO_INPUT, STEP_MS);
    hit = events.some((event) => event.type === 'paddle:hit');
  }
  removeBall(world, ball);
  return hit;
}

/** Registers one direct ball hit on the boss, then removes the ball. */
function hitBoss(world: World): boolean {
  const boss = world.boss;
  if (!boss) return false;
  boss.vx = 0;
  const ball = addBall(world, {
    x: boss.x,
    y: boss.y + boss.height + 12,
    vx: 0,
    vy: -500,
    spawnGraceMs: 0,
  });
  let hit = false;
  for (let step = 0; step < 20 && !hit; step += 1) {
    const events = world.step(NO_INPUT, STEP_MS);
    hit = events.some((event) => event.type === 'boss:hit');
  }
  removeBall(world, ball);
  return hit;
}

function momentumWorld(
  damageCap: number,
  xpCap: number,
): { world: World; block: Block } {
  const world = makeWorld();
  keepAlive(world);
  world.applyRunModifiers(
    withMods({
      momentumDamageStep: GAME_CONFIG.perks.momentumDamageStep,
      momentumDamageCap: damageCap,
      momentumXpStep: GAME_CONFIG.perks.momentumXpStep,
      momentumXpCap: xpCap,
    }),
  );
  const block = addBlock(world, {
    left: 300,
    top: 500,
    width: 60,
    height: 60,
    type: 'obsidian',
    hp: 1000,
    maxHp: 1000,
  });
  return { world, block };
}

describe('Momentum rework', () => {
  it('adds +1% damage per hit and caps at +5/+10/+15% by level', () => {
    const cases = [
      { level: 1, cap: 0.05, hitsToCap: 5 },
      { level: 2, cap: 0.1, hitsToCap: 10 },
      { level: 3, cap: 0.15, hitsToCap: 15 },
    ] as const;

    for (const { level, cap, hitsToCap } of cases) {
      const { world, block } = momentumWorld(cap, cap * 2);
      expect(damageFromHit(world, block)).toBeCloseTo(1.01);

      for (let hit = 2; hit <= hitsToCap; hit += 1) {
        const damage = damageFromHit(world, block);
        if (hit === hitsToCap) {
          expect(damage, `level ${level} should reach its damage cap`).toBeCloseTo(
            1 + cap,
          );
        }
      }

      for (let extra = 0; extra < 5; extra += 1) {
        expect(damageFromHit(world, block)).toBeCloseTo(1 + cap);
      }
    }
  });

  it('adds +2% XP per hit and caps at +10/+20/+30% by level', () => {
    const cases = [
      { cap: 0.1, hitsToCap: 5 },
      { cap: 0.2, hitsToCap: 10 },
      { cap: 0.3, hitsToCap: 15 },
    ] as const;

    for (const { cap, hitsToCap } of cases) {
      const world = makeWorld();
      keepAlive(world);
      world.applyRunModifiers(
        withMods({
          momentumXpStep: GAME_CONFIG.perks.momentumXpStep,
          momentumXpCap: cap,
        }),
      );
      addBlock(world, {
        left: 40,
        top: 900,
        width: 60,
        height: 60,
        type: 'obsidian',
        hp: 100,
        maxHp: 100,
      });

      for (let hit = 1; hit <= hitsToCap + 2; hit += 1) {
        const target = addBlock(world, {
          id: `xp-target-${hit}`,
          left: 300,
          top: 500,
          width: 60,
          height: 60,
          hp: 1,
          maxHp: 1,
          row: 50,
          col: 0,
        });
        const events = hitBlock(world, target);
        const destroyed = events.find((event) => event.type === 'block:destroyed');
        expect(destroyed?.type).toBe('block:destroyed');
        if (destroyed?.type !== 'block:destroyed') continue;

        const expected = 1 + Math.min(cap, hit * GAME_CONFIG.perks.momentumXpStep);
        if (hit === 1) expect(destroyed.xp).toBeCloseTo(1.02);
        if (hit === hitsToCap) expect(destroyed.xp).toBeCloseTo(1 + cap);
        expect(destroyed.xp).toBeCloseTo(expected);
      }
    }
  });

  it('resets the damage and XP streak when the ball touches the paddle', () => {
    const { world, block } = momentumWorld(0.15, 0.3);
    for (let hit = 0; hit < 8; hit += 1) damageFromHit(world, block);

    expect(world.comboCount).toBe(8);
    expect(damageFromHit(world, block)).toBeGreaterThan(1);

    expect(hitPaddle(world)).toBe(true);
    expect(world.comboCount).toBe(0);

    const target = addBlock(world, {
      id: 'reset-xp-target',
      left: 100,
      top: 500,
      width: 60,
      height: 60,
      hp: 1,
      maxHp: 1,
    });
    const events = hitBlock(world, target);
    const destroyed = events.find((event) => event.type === 'block:destroyed');
    expect(destroyed?.type).toBe('block:destroyed');
    if (destroyed?.type === 'block:destroyed') {
      expect(destroyed.xp).toBeCloseTo(1.02);
    }

    expect(hitPaddle(world)).toBe(true);
    expect(world.comboCount).toBe(0);
    expect(damageFromHit(world, block)).toBeCloseTo(1.01);
  });
});

describe('Bombardier rework', () => {
  it('arms on the 12th destroy and detonates the next block hit for 3x3 damage', () => {
    const world = makeWorld();
    keepAlive(world);
    world.applyRunModifiers(withMods({ bombardierEvery: 12 }));

    const cluster: Block[] = [];
    for (let row = 1; row <= 3; row += 1) {
      for (let col = 1; col <= 3; col += 1) {
        cluster.push(
          addBlock(world, {
            id: `cluster-${row}-${col}`,
            left: 200 + col * 100,
            top: 300 + row * 100,
            width: 60,
            height: 60,
            hp: 10,
            maxHp: 10,
            row,
            col,
          }),
        );
      }
    }
    const farBlock = addBlock(world, {
      id: 'far-block',
      left: 40,
      top: 900,
      width: 60,
      height: 60,
      hp: 10,
      maxHp: 10,
      row: 8,
      col: 8,
    });

    for (let index = 0; index < 12; index += 1) {
      const kill = addBlock(world, {
        id: `kill-${index}`,
        left: 40,
        top: 40,
        width: 20,
        height: 20,
        hp: 1,
        maxHp: 1,
        row: 20 + index,
        col: 20,
      });
      world.damageBlock(kill, 1);
    }

    expect(world.bombardierArmed).toBe(true);
    expect(world.bombardierProgress).toBe(0);
    expect(world.events.some((event) => event.type === 'explosion')).toBe(false);
    world.drainEvents();

    const center = cluster.find((block) => block.row === 2 && block.col === 2)!;
    const events = hitBlock(world, center);
    const explosion = events.find((event) => event.type === 'explosion');

    expect(explosion?.type).toBe('explosion');
    if (explosion?.type === 'explosion') {
      expect(explosion.blockIds).toHaveLength(9);
    }
    expect(world.bombardierArmed).toBe(false);
    expect(center.hp).toBeCloseTo(7); // 10 - 1 ball hit - 2 center blast
    for (const block of cluster) {
      if (block === center) continue;
      expect(block.hp).toBeCloseTo(9); // 10 - 1 ring blast
    }
    expect(farBlock.hp).toBe(10);

    const after = hitBlock(world, center);
    expect(after.some((event) => event.type === 'explosion')).toBe(false);
    expect(world.bombardierArmed).toBe(false);
  });
});

describe('Boss Slayer rework', () => {
  it('arms on the 10th destroy and adds +3 to the next direct boss hit', () => {
    const world = makeWorld({
      rows: [],
      legend: {},
      boss: {
        id: 'boss-rework',
        name: 'Rework Boss',
        hp: 20,
        widthCells: 3,
        heightCells: 2,
        row: 1,
        attackMs: 1000,
        moveSpeed: 100,
        pattern: 'sentinel',
      },
    });
    world.applyRunModifiers(withMods({ bossSlayerEvery: 10 }));

    for (let index = 0; index < 10; index += 1) {
      const kill = addBlock(world, {
        id: `boss-kill-${index}`,
        left: 40,
        top: 40,
        width: 20,
        height: 20,
        hp: 1,
        maxHp: 1,
        row: 20 + index,
        col: 20,
      });
      world.damageBlock(kill, 1);
    }

    expect(world.bossSlayerArmed).toBe(true);
    expect(world.bossSlayerProgress).toBe(0);
    const boss = world.boss!;
    const before = boss.hp;

    expect(hitBoss(world)).toBe(true);
    expect(boss.hp).toBe(before - 4); // 1 ball + 3 Boss Slayer
    expect(world.bossSlayerArmed).toBe(false);

    const afterCharge = boss.hp;
    expect(hitBoss(world)).toBe(true);
    expect(boss.hp).toBe(afterCharge - 1);
  });
});

describe('Hot Streak rework', () => {
  function hotStreakWorld(damage: number): { world: World; block: Block } {
    const world = makeWorld();
    keepAlive(world);
    world.applyRunModifiers(
      withMods({
        hotStreakHits: GAME_CONFIG.perks.hotStreakHits,
        hotStreakDamage: damage,
        hotStreakDurationMs: GAME_CONFIG.perks.hotStreakDurationMs,
      }),
    );
    const block = addBlock(world, {
      left: 300,
      top: 500,
      width: 60,
      height: 60,
      type: 'obsidian',
      hp: 1000,
      maxHp: 1000,
    });
    return { world, block };
  }

  it('triggers after five hits, refreshes on hits and expires after 3 seconds', () => {
    const { world, block } = hotStreakWorld(1);

    for (let hit = 0; hit < 5; hit += 1) {
      expect(damageFromHit(world, block)).toBeCloseTo(1);
    }
    expect(world.hotStreakActive).toBe(true);
    expect(world.hotStreakRemainingMs).toBeCloseTo(3000);
    expect(damageFromHit(world, block)).toBeCloseTo(2);

    world.step(NO_INPUT, 2000);
    expect(world.hotStreakActive).toBe(true);
    expect(world.hotStreakRemainingMs).toBeLessThan(1500);

    expect(damageFromHit(world, block)).toBeCloseTo(2);
    expect(world.hotStreakRemainingMs).toBeCloseTo(3000);

    world.step(NO_INPUT, 3001);
    expect(world.hotStreakActive).toBe(false);
    expect(damageFromHit(world, block)).toBeCloseTo(1);
    expect(world.hotStreakActive).toBe(true);
    expect(damageFromHit(world, block)).toBeCloseTo(2);
    expect(world.ballSpeed).toBeCloseTo(520);
  });

  it('grants +2 damage at level 2 without changing ball speed', () => {
    const { world, block } = hotStreakWorld(2);

    for (let hit = 0; hit < 5; hit += 1) damageFromHit(world, block);
    expect(damageFromHit(world, block)).toBeCloseTo(3);
    expect(world.ballSpeed).toBeCloseTo(520);
  });
});
