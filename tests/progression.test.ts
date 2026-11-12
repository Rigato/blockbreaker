import { describe, expect, it } from 'vitest';
import { RunState, xpToNextForLevel } from '../src/progression/RunState';
import { BASE_RUN_MODIFIERS, GAME_CONFIG } from '../src/game/config';
import { STARTER_PERK_IDS } from '../src/content/meta';
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
    expect(modifiers.momentumDamageStep).toBe(0);
    expect(modifiers.momentumDamageCap).toBe(0);
    expect(modifiers.momentumXpStep).toBe(0);
    expect(modifiers.momentumXpCap).toBe(0);
    expect(modifiers.reviveCharges).toBe(0);
    expect(modifiers.bombardierEvery).toBeNull();
    expect(modifiers.bossSlayerEvery).toBeNull();
    expect(modifiers.hotStreakHits).toBe(0);
    expect(modifiers.hotStreakDamage).toBe(0);
    expect(modifiers.hotStreakDurationMs).toBe(0);
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
      momentumDamageStep: 0,
      momentumDamageCap: 0,
      momentumXpStep: 0,
      momentumXpCap: 0,
      reviveCharges: 0,
      bombardierEvery: null,
      bossSlayerEvery: null,
      hotStreakHits: 0,
      hotStreakDamage: 0,
      hotStreakDurationMs: 0,
      overkillMaxSplash: 0,
      shieldBashEvery: null,
      shieldBashDamage: 0,
      shieldBashRows: 0,
      conductorChainFactor: 0,
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

  it('derives Momentum damage and XP steps and caps by level', () => {
    const run = progressed();
    expect(run.modifiers.momentumDamageStep).toBe(0);
    expect(run.modifiers.momentumDamageCap).toBe(0);
    expect(run.modifiers.momentumXpStep).toBe(0);
    expect(run.modifiers.momentumXpCap).toBe(0);

    run.grantPerk('momentum');
    expect(run.modifiers.momentumDamageStep).toBeCloseTo(0.01);
    expect(run.modifiers.momentumDamageCap).toBeCloseTo(0.05);
    expect(run.modifiers.momentumXpStep).toBeCloseTo(0.02);
    expect(run.modifiers.momentumXpCap).toBeCloseTo(0.1);

    run.grantPerk('momentum');
    expect(run.modifiers.momentumDamageCap).toBeCloseTo(0.1);
    expect(run.modifiers.momentumXpCap).toBeCloseTo(0.2);

    run.grantPerk('momentum');
    expect(run.modifiers.momentumDamageCap).toBeCloseTo(0.15);
    expect(run.modifiers.momentumXpCap).toBeCloseTo(0.3);

    const maxed = run.grantPerk('momentum');
    expect(maxed.perk.level).toBe(3);
    expect(run.modifiers.momentumDamageCap).toBeCloseTo(0.15);
    expect(run.modifiers.momentumXpCap).toBeCloseTo(0.3);
  });

  it('grants a revive charge and no ball from Second Chance', () => {
    const run = progressed();
    const choice = run.grantPerk('second_chance');
    expect(choice.spawnedBalls).toBe(0);
    expect(run.modifiers.reviveCharges).toBe(1);
  });

  it('arms Bombardier and Boss Slayer at their unique levels', () => {
    const run = progressed();
    expect(run.modifiers.bombardierEvery).toBeNull();
    expect(run.modifiers.bossSlayerEvery).toBeNull();

    run.grantPerk('bombardier');
    expect(run.modifiers.bombardierEvery).toBe(12);
    expect(run.grantPerk('bombardier').perk.level).toBe(1);

    run.grantPerk('boss_slayer');
    expect(run.modifiers.bossSlayerEvery).toBe(10);
    expect(run.grantPerk('boss_slayer').perk.level).toBe(1);
  });

  it('scales Hot Streak damage without changing ball speed or score', () => {
    const run = progressed();
    expect(run.modifiers.hotStreakHits).toBe(0);
    expect(run.modifiers.hotStreakDamage).toBe(0);
    expect(run.modifiers.hotStreakDurationMs).toBe(0);

    run.grantPerk('hot_streak');
    expect(run.modifiers.hotStreakHits).toBe(5);
    expect(run.modifiers.hotStreakDamage).toBe(1);
    expect(run.modifiers.hotStreakDurationMs).toBe(3000);

    run.grantPerk('hot_streak');
    expect(run.modifiers.hotStreakDamage).toBe(2);
    expect(run.modifiers.hotStreakDurationMs).toBe(3000);
    expect(run.modifiers.ballSpeedMultiplier).toBe(1);
    expect(run.modifiers.scoreMultiplier).toBe(1);
    expect(run.grantPerk('hot_streak').perk.level).toBe(2);
  });

  it('derives the Tier 4 perk modifiers', () => {
    const run = progressed();
    expect(run.modifiers.overkillMaxSplash).toBe(0);
    expect(run.modifiers.shieldBashEvery).toBeNull();
    expect(run.modifiers.shieldBashDamage).toBe(0);
    expect(run.modifiers.shieldBashRows).toBe(0);
    expect(run.modifiers.conductorChainFactor).toBe(0);

    run.grantPerk('overkill');
    run.grantPerk('shield_bash');
    run.grantPerk('conductor');
    expect(run.modifiers.overkillMaxSplash).toBe(2);
    expect(run.modifiers.shieldBashEvery).toBe(8);
    expect(run.modifiers.shieldBashDamage).toBe(1);
    expect(run.modifiers.shieldBashRows).toBe(2);
    expect(run.modifiers.conductorChainFactor).toBeCloseTo(0.5);
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

  it('returns the twenty-two catalog perks without the fallback', () => {
    const run = progressed();
    const catalog = run.getCatalog();
    expect(catalog).toHaveLength(22);
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
      'momentum',
      'second_chance',
      'bombardier',
      'boss_slayer',
      'hot_streak',
      'overkill',
      'shield_bash',
      'conductor',
    ]);
  });
});

describe('meta gating in a run', () => {
  it('keeps every offer inside the starter set across many level ups', () => {
    const run = new RunState();
    run.startRun(7, STARTER_PERK_IDS);
    run.addXp(1000);

    const starter = new Set<string>(STARTER_PERK_IDS);
    let offersSeen = 0;
    while (run.pendingLevelUps > 0) {
      const offers = run.takeOffers();
      expect(offers.length).toBeGreaterThan(0);
      for (const offer of offers) {
        expect(
          starter.has(offer.id) || offer.id === 'xp_fallback',
        ).toBe(true);
      }
      offersSeen += 1;
      run.choosePerk(offers[0]!.id);
    }

    expect(offersSeen).toBeGreaterThan(3);
  });

  it('adds an explicitly unlocked perk to the offer pool', () => {
    const run = new RunState();
    run.startRun(7, [...STARTER_PERK_IDS, 'second_chance']);
    const starter = new Set<string>(STARTER_PERK_IDS);
    for (const perk of PERK_CATALOG) {
      if (!starter.has(perk.id)) continue;
      for (let level = 0; level < perk.maxLevel; level += 1) {
        run.grantPerk(perk.id);
      }
    }
    run.addXp(8);

    expect(run.takeOffers().map((offer) => offer.id)).toContain('second_chance');
  });

  it('defaults to the full catalog when no unlock set is passed', () => {
    const starter = new Set<string>(STARTER_PERK_IDS);
    const offered = new Set<string>();

    for (let seed = 1; seed <= 10; seed += 1) {
      const run = new RunState();
      run.startRun(seed);
      run.addXp(8);
      for (const offer of run.takeOffers()) offered.add(offer.id);
    }

    expect(offered.size).toBeGreaterThan(3);
    expect([...offered].some((id) => !starter.has(id))).toBe(true);
  });
});
