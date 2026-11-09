import { describe, expect, it } from 'vitest';
import { RunState, xpToNextForLevel } from '../src/progression/RunState';
import { BASE_RUN_MODIFIERS, GAME_CONFIG } from '../src/game/config';
import { PERK_CATALOG } from '../src/content/perks';

function progressed(seed = 7): RunState {
  const run = new RunState();
  run.startRun(seed);
  return run;
}

/** Grants every catalog perk except the skipped ids, clamping at max level. */
function maxOutCatalog(run: RunState, skip: readonly string[] = []): void {
  for (const perk of PERK_CATALOG) {
    if (skip.includes(perk.id)) continue;
    for (let level = 0; level < perk.maxLevel; level += 1) {
      run.grantPerk(perk.id);
    }
  }
}

describe('G4 XP curve', () => {
  it('uses 8/20/26 XP thresholds and starts at level 1', () => {
    const run = progressed();
    expect(run.level).toBe(1);
    expect(run.xpToNext).toBe(8);
    expect(xpToNextForLevel(1)).toBe(8);
    expect(xpToNextForLevel(2)).toBe(20);
    expect(xpToNextForLevel(3)).toBe(26);

    expect(run.addXp(8)).toMatchObject({
      baseAmount: 8,
      gained: 8,
      level: 2,
      xp: 0,
      xpToNext: 20,
      levelsGained: 1,
      pendingLevelUps: 1,
    });
    run.addXp(20);
    expect(run.level).toBe(3);
    expect(run.xpToNext).toBe(26);
  });

  it('carries overflow XP into the next level', () => {
    const run = progressed();
    const gain = run.addXp(25);
    expect(gain.level).toBe(2);
    expect(gain.xp).toBe(17);
    expect(gain.xpToNext).toBe(20);
    expect(gain.levelsGained).toBe(1);
  });

  it('queues two level ups from one add', () => {
    const run = progressed();
    const gain = run.addXp(40);
    expect(gain.level).toBe(3);
    expect(gain.xp).toBe(12);
    expect(gain.xpToNext).toBe(26);
    expect(gain.levelsGained).toBe(2);
    expect(gain.pendingLevelUps).toBe(2);
  });

  it('keeps pending level ups until a perk is chosen', () => {
    const run = progressed();
    run.addXp(40);
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

  it('scales Prism Laser, Multiball slots and Foresight modifiers', () => {
    const run = progressed();

    run.grantPerk('prism_laser');
    expect(run.modifiers.laserLevel).toBe(1);
    run.grantPerk('prism_laser');
    expect(run.modifiers.laserLevel).toBe(2);
    run.grantPerk('prism_laser');
    const maxedLaser = run.grantPerk('prism_laser');
    expect(maxedLaser.perk.level).toBe(3);
    expect(run.modifiers.laserLevel).toBe(3);

    run.grantPerk('multiball');
    expect(run.modifiers.multiballLevel).toBe(1);
    run.grantPerk('multiball');
    expect(run.modifiers.multiballLevel).toBe(2);

    run.grantPerk('foresight');
    expect(run.modifiers.trajectoryGuide).toBe(true);
    const maxedForesight = run.grantPerk('foresight');
    expect(maxedForesight.perk.level).toBe(1);
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
    expect(modifiers.laserLevel).toBe(1);
    expect(modifiers.safetyNetCharges).toBe(1);
    expect(modifiers.explosiveEvery).toBe(8);
    expect(modifiers.multiballLevel).toBe(0);
    expect(modifiers.trajectoryGuide).toBe(false);
    expect(modifiers.critChance).toBe(0);
    expect(modifiers.critMultiplier).toBe(2);
    expect(modifiers.laserTargetBonus).toBe(0);
    expect(modifiers.laserWidthMultiplier).toBe(1);
    expect(modifiers.laserCooldownMultiplier).toBe(1);
    expect(modifiers.comboStep).toBe(0);
    expect(modifiers.comboMax).toBe(0);
    expect(modifiers.reviveCharges).toBe(0);
    expect(modifiers.bombEvery).toBeNull();
    expect(modifiers.bossDamageBonus).toBe(0);
    expect(modifiers.ballSpeedMultiplier).toBe(1);
    expect(modifiers.scoreMultiplier).toBe(1);

    expect(BASE_RUN_MODIFIERS).toEqual({
      paddleWidthMultiplier: 1,
      ballRadiusMultiplier: 1,
      ballDamage: 1,
      xpMultiplier: 1,
      maxBalls: 8,
      turretInterval: null,
      stickyPaddle: false,
      laserCooldown: null,
      laserLevel: 0,
      safetyNetCharges: 0,
      explosiveEvery: null,
      multiballLevel: 0,
      trajectoryGuide: false,
      critChance: 0,
      critMultiplier: GAME_CONFIG.perks.critMultiplier,
      laserTargetBonus: 0,
      laserWidthMultiplier: 1,
      laserCooldownMultiplier: 1,
      comboStep: 0,
      comboMax: 0,
      reviveCharges: 0,
      bombEvery: null,
      bossDamageBonus: 0,
      ballSpeedMultiplier: 1,
      scoreMultiplier: 1,
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

describe('v0.2.0 derived modifiers', () => {
  it('scales Critical Strike chance per level', () => {
    const run = progressed();
    run.grantPerk('critical_strike');
    expect(run.modifiers.critChance).toBeCloseTo(0.08);
    run.grantPerk('critical_strike');
    expect(run.modifiers.critChance).toBeCloseTo(0.16);
    expect(run.modifiers.critMultiplier).toBe(GAME_CONFIG.perks.critMultiplier);
  });

  it('adds laser targets and beam width with Laser Focus', () => {
    const run = progressed();
    run.grantPerk('prism_laser');
    run.grantPerk('laser_focus');
    run.grantPerk('laser_focus');
    expect(run.modifiers.laserTargetBonus).toBe(2);
    expect(run.modifiers.laserWidthMultiplier).toBeCloseTo(1.24);
  });

  it('reduces the laser cooldown with Overcharge and floors the multiplier', () => {
    const run = progressed();
    run.grantPerk('prism_laser');
    run.grantPerk('overcharge');
    run.grantPerk('overcharge');
    run.grantPerk('overcharge');
    expect(run.modifiers.laserCooldownMultiplier).toBeCloseTo(0.64);
    expect(run.modifiers.laserCooldown).toBeCloseTo(5120);

    run.grantPerk('prism_laser');
    run.grantPerk('prism_laser');
    expect(run.modifiers.laserCooldownMultiplier).toBeCloseTo(0.64);
  });

  it('keeps the laser cooldown null without Prism Laser', () => {
    const run = progressed();
    expect(run.modifiers.laserCooldownMultiplier).toBeCloseTo(1);
    expect(run.modifiers.laserCooldown).toBeNull();
  });

  it('derives the Combo Master step and cap', () => {
    const run = progressed();
    run.grantPerk('combo_master');
    run.grantPerk('combo_master');
    run.grantPerk('combo_master');
    expect(run.modifiers.comboStep).toBeCloseTo(0.05);
    expect(run.modifiers.comboMax).toBeCloseTo(0.15);
  });

  it('grants a revive charge and no ball from Second Chance', () => {
    const run = progressed();
    const choice = run.grantPerk('second_chance');
    expect(choice.spawnedBalls).toBe(0);
    expect(run.modifiers.reviveCharges).toBe(1);
  });

  it('enables Bomb Ball drops and scales Boss Bane damage', () => {
    const run = progressed();
    expect(run.modifiers.bombEvery).toBeNull();
    run.grantPerk('bomb_ball');
    expect(run.modifiers.bombEvery).toBe(12);

    run.grantPerk('boss_bane');
    expect(run.modifiers.bossDamageBonus).toBe(1);
    run.grantPerk('boss_bane');
    expect(run.modifiers.bossDamageBonus).toBe(2);
  });

  it('scales ball speed and score with Swift Ball', () => {
    const run = progressed();
    run.grantPerk('swift_ball');
    run.grantPerk('swift_ball');
    expect(run.modifiers.ballSpeedMultiplier).toBeCloseTo(1.12);
    expect(run.modifiers.scoreMultiplier).toBeCloseTo(1.2);
  });

  it('hides Prism Laser dependants until Prism Laser is acquired', () => {
    const run = progressed();
    maxOutCatalog(run, ['prism_laser', 'laser_focus', 'overcharge']);
    run.addXp(8);
    const before = run.takeOffers().map((offer) => offer.id);
    expect(before).toContain('prism_laser');
    expect(before).not.toContain('laser_focus');
    expect(before).not.toContain('overcharge');

    const afterRun = progressed();
    afterRun.grantPerk('prism_laser');
    maxOutCatalog(afterRun, ['laser_focus', 'overcharge']);
    afterRun.addXp(8);
    const after = afterRun.takeOffers().map((offer) => offer.id);
    expect(after).toContain('laser_focus');
    expect(after).toContain('overcharge');
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
    expect(run.xpToNext).toBe(8);
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

  it('returns the nineteen catalog perks without the fallback', () => {
    const run = progressed();
    const catalog = run.getCatalog();
    expect(catalog).toHaveLength(19);
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
      'foresight',
      'explosive_core',
      'critical_strike',
      'laser_focus',
      'overcharge',
      'combo_master',
      'second_chance',
      'bomb_ball',
      'boss_bane',
      'swift_ball',
    ]);
  });
});
