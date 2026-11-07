import { describe, expect, it } from 'vitest';
import { RunState, xpToNextForLevel } from '../src/progression/RunState';
import { BASE_RUN_MODIFIERS, GAME_CONFIG } from '../src/game/config';

function progressed(seed = 7): RunState {
  const run = new RunState();
  run.startRun(seed);
  return run;
}

describe('M2 XP curve', () => {
  it('uses 20/30/40 XP thresholds and starts at level 1', () => {
    const run = progressed();
    expect(run.level).toBe(1);
    expect(run.xpToNext).toBe(20);
    expect(xpToNextForLevel(1)).toBe(20);
    expect(xpToNextForLevel(2)).toBe(30);
    expect(xpToNextForLevel(3)).toBe(40);

    expect(run.addXp(20)).toMatchObject({
      baseAmount: 20,
      gained: 20,
      level: 2,
      xp: 0,
      xpToNext: 30,
      levelsGained: 1,
      pendingLevelUps: 1,
    });
    run.addXp(30);
    expect(run.level).toBe(3);
    expect(run.xpToNext).toBe(40);
  });

  it('carries overflow XP into the next level', () => {
    const run = progressed();
    const gain = run.addXp(25);
    expect(gain.level).toBe(2);
    expect(gain.xp).toBe(5);
    expect(gain.xpToNext).toBe(30);
    expect(gain.levelsGained).toBe(1);
  });

  it('queues two level ups from one add', () => {
    const run = progressed();
    const gain = run.addXp(55);
    expect(gain.level).toBe(3);
    expect(gain.xp).toBe(5);
    expect(gain.xpToNext).toBe(40);
    expect(gain.levelsGained).toBe(2);
    expect(gain.pendingLevelUps).toBe(2);
  });

  it('keeps pending level ups until a perk is chosen', () => {
    const run = progressed();
    run.addXp(55);
    expect(run.pendingLevelUps).toBe(2);
    run.takeOffers();
    expect(run.pendingLevelUps).toBe(2);
    const offer = run.takeOffers()[0];
    expect(offer).toBeDefined();
    run.choosePerk(offer!.id);
    expect(run.pendingLevelUps).toBe(1);
  });
});

describe('M2 perk stacking', () => {
  it('applies Quick Study to gained XP with floating point precision', () => {
    const run = progressed();
    run.grantPerk('quick_study');
    expect(run.modifiers.xpMultiplier).toBeCloseTo(1.2);
    const gain = run.addXp(1);
    expect(gain.gained).toBeCloseTo(1.2);
    expect(run.xp).toBeCloseTo(1.2);
  });

  it('stacks Quick Study up to its maximum', () => {
    const run = progressed();
    run.grantPerk('quick_study');
    run.grantPerk('quick_study');
    expect(run.perks.find((perk) => perk.id === 'quick_study')?.level).toBe(2);
    expect(run.modifiers.xpMultiplier).toBeCloseTo(1.4);

    const maxed = run.grantPerk('quick_study');
    expect(maxed.perk.level).toBe(2);
    expect(maxed.spawnedBalls).toBe(0);
    expect(run.modifiers.xpMultiplier).toBeCloseTo(1.4);
  });

  it('stacks repeatable perks and clamps at max level', () => {
    const run = progressed();
    run.grantPerk('wide_paddle');
    run.grantPerk('wide_paddle');
    expect(run.modifiers.paddleWidthMultiplier).toBeCloseTo(1.24);

    run.grantPerk('power_ball');
    run.grantPerk('power_ball');
    run.grantPerk('power_ball');
    expect(run.modifiers.ballDamage).toBe(4);
    const maxedPower = run.grantPerk('power_ball');
    expect(maxedPower.perk.level).toBe(3);
    expect(run.modifiers.ballDamage).toBe(4);
  });

  it('limits unique perks to one level', () => {
    const run = progressed();
    const first = run.grantPerk('sticky_paddle');
    expect(first.perk.level).toBe(1);
    expect(first.modifiers.stickyPaddle).toBe(true);

    const second = run.grantPerk('sticky_paddle');
    expect(second.perk.level).toBe(1);
    expect(second.spawnedBalls).toBe(0);
    expect(run.perks.filter((perk) => perk.id === 'sticky_paddle')).toHaveLength(1);
  });

  it('spawns one extra ball for Multiball without raising the cap', () => {
    const run = progressed();
    const choice = run.grantPerk('multiball');
    expect(choice.spawnedBalls).toBe(1);
    expect(choice.modifiers.maxBalls).toBe(GAME_CONFIG.ball.maxBalls);
    expect(choice.modifiers.maxBalls).toBe(8);
  });
});

describe('M2 derived modifiers', () => {
  it('derives every field from perk levels without mutating the base', () => {
    const run = progressed();
    run.grantPerk('wide_paddle');
    run.grantPerk('giant_ball');
    run.grantPerk('power_ball');
    run.grantPerk('quick_study');
    run.grantPerk('auto_turret');
    run.grantPerk('sticky_paddle');
    run.grantPerk('safety_net');
    run.grantPerk('prism_laser');
    run.grantPerk('explosive_core');

    const modifiers = run.modifiers;
    expect(modifiers.paddleWidthMultiplier).toBeCloseTo(1.12);
    expect(modifiers.ballRadiusMultiplier).toBeCloseTo(1.15);
    expect(modifiers.ballDamage).toBe(2);
    expect(modifiers.xpMultiplier).toBeCloseTo(1.2);
    expect(modifiers.maxBalls).toBe(8);
    expect(modifiers.turretInterval).toBeCloseTo(3200);
    expect(modifiers.stickyPaddle).toBe(true);
    expect(modifiers.laserCooldown).toBe(8000);
    expect(modifiers.safetyNetCharges).toBe(1);
    expect(modifiers.explosiveEvery).toBe(8);

    expect(BASE_RUN_MODIFIERS).toEqual({
      paddleWidthMultiplier: 1,
      ballRadiusMultiplier: 1,
      ballDamage: 1,
      xpMultiplier: 1,
      maxBalls: 8,
      turretInterval: null,
      stickyPaddle: false,
      laserCooldown: null,
      safetyNetCharges: 0,
      explosiveEvery: null,
    });
  });

  it('scales turret interval down with level and keeps null at level 0', () => {
    const run = progressed();
    expect(run.modifiers.turretInterval).toBeNull();
    run.grantPerk('auto_turret');
    expect(run.modifiers.turretInterval).toBeCloseTo(3200);
    run.grantPerk('auto_turret');
    expect(run.modifiers.turretInterval).toBeCloseTo(2800);
    run.grantPerk('auto_turret');
    expect(run.modifiers.turretInterval).toBeCloseTo(2400);
  });

  it('exposes acquired perks for the HUD in catalog order', () => {
    const run = progressed();
    run.grantPerk('power_ball');
    run.grantPerk('multiball');
    expect(run.perks).toEqual([
      { id: 'multiball', name: 'Multiball', level: 1, maxLevel: 3 },
      { id: 'power_ball', name: 'Power Ball', level: 1, maxLevel: 3 },
    ]);
  });
});

describe('M2 run lifecycle', () => {
  it('resets XP, level, perks, pending and offers but keeps the seed', () => {
    const run = progressed(99);
    run.addXp(55);
    run.grantPerk('power_ball');
    run.takeOffers();

    run.reset();
    expect(run.seed).toBe(99);
    expect(run.level).toBe(1);
    expect(run.xp).toBe(0);
    expect(run.xpToNext).toBe(20);
    expect(run.pendingLevelUps).toBe(0);
    expect(run.perks).toEqual([]);
    expect(run.takeOffers()).toEqual([]);
    expect(run.modifiers).toEqual(BASE_RUN_MODIFIERS);
  });

  it('starts a fresh run with a new seed', () => {
    const run = progressed(1);
    run.addXp(55);
    run.startRun(42);
    expect(run.seed).toBe(42);
    expect(run.level).toBe(1);
    expect(run.pendingLevelUps).toBe(0);
    expect(run.perks).toEqual([]);
  });

  it('returns the ten catalog perks without the fallback', () => {
    const run = progressed();
    const catalog = run.getCatalog();
    expect(catalog).toHaveLength(10);
    expect(catalog.map((perk) => perk.id)).not.toContain('xp_fallback');
    expect(catalog.map((perk) => perk.id)).toEqual([
      'multiball',
      'wide_paddle',
      'power_ball',
      'quick_study',
      'auto_turret',
      'giant_ball',
      'sticky_paddle',
      'safety_net',
      'prism_laser',
      'explosive_core',
    ]);
  });
});
