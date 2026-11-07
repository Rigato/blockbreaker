import { describe, expect, it } from 'vitest';
import { RunState } from '../src/progression/RunState';
import { PERK_CATALOG } from '../src/content/perks';

function withLevelUp(seed = 11): RunState {
  const run = new RunState();
  run.startRun(seed);
  run.addXp(20);
  return run;
}

function maxOut(run: RunState, skip: readonly string[] = []): void {
  for (const perk of PERK_CATALOG) {
    if (skip.includes(perk.id)) continue;
    for (let level = 0; level < perk.maxLevel; level += 1) {
      run.grantPerk(perk.id);
    }
  }
}

describe('M2 perk offers', () => {
  it('returns nothing without a pending level up', () => {
    const run = new RunState();
    run.startRun(1);
    expect(run.takeOffers()).toEqual([]);
  });

  it('offers three distinct perks with level metadata', () => {
    const run = withLevelUp();
    const offers = run.takeOffers();
    expect(offers).toHaveLength(3);
    expect(new Set(offers.map((offer) => offer.id)).size).toBe(3);
    for (const offer of offers) {
      expect(offer.currentLevel).toBe(0);
      expect(offer.nextLevel).toBe(1);
      expect(offer.maxLevel).toBeGreaterThanOrEqual(1);
      expect(offer.name).not.toBe('');
      expect(offer.description).not.toBe('');
      expect(['repeatable', 'unique']).toContain(offer.kind);
    }
  });

  it('never offers a maxed perk', () => {
    const run = withLevelUp();
    maxOut(run, ['multiball', 'power_ball']);
    const offers = run.takeOffers();
    expect(offers.map((offer) => offer.id).sort()).toEqual(
      ['multiball', 'power_ball', 'xp_fallback'].sort(),
    );
  });

  it('is deterministic for the same seed and same choices', () => {
    const a = withLevelUp(12345);
    const b = withLevelUp(12345);
    a.addXp(30);
    b.addXp(30);

    const firstA = a.takeOffers();
    const firstB = b.takeOffers();
    expect(firstA.map((offer) => offer.id)).toEqual(firstB.map((offer) => offer.id));

    const chosen = firstA[0]!.id;
    a.choosePerk(chosen);
    b.choosePerk(chosen);

    const secondA = a.takeOffers();
    const secondB = b.takeOffers();
    expect(secondA.map((offer) => offer.id)).toEqual(secondB.map((offer) => offer.id));
  });

  it('produces different offers for different seeds', () => {
    const runs = [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => {
      const run = withLevelUp(seed);
      return run.takeOffers().map((offer) => offer.id).join(',');
    });
    expect(new Set(runs).size).toBeGreaterThan(1);
  });

  it('fills with the XP fallback when fewer than three perks are eligible', () => {
    const run = withLevelUp();
    maxOut(run, ['multiball', 'wide_paddle']);
    const offers = run.takeOffers();
    expect(offers).toHaveLength(3);
    expect(new Set(offers.map((offer) => offer.id)).size).toBe(3);
    const fallback = offers.find((offer) => offer.id === 'xp_fallback');
    expect(fallback?.name).toBe('Arcane Insight');
    expect(fallback?.nextLevel).toBe(1);
  });

  it('returns fewer cards instead of duplicating when no normal perk is eligible', () => {
    const run = withLevelUp();
    maxOut(run);
    const offers = run.takeOffers();
    expect(offers).toHaveLength(1);
    expect(offers[0]?.id).toBe('xp_fallback');
  });

  it('returns the same cached offer until a perk is chosen', () => {
    const run = withLevelUp();
    const first = run.takeOffers();
    const second = run.takeOffers();
    expect(second.map((offer) => offer.id)).toEqual(first.map((offer) => offer.id));
  });
});

describe('M2 perk choice', () => {
  it('applies one level, clears the offer and consumes one pending level up', () => {
    const run = withLevelUp();
    const offers = run.takeOffers();
    const chosen = offers[0]!;
    const result = run.choosePerk(chosen.id);

    expect(result.perk.id).toBe(chosen.id);
    expect(result.perk.level).toBe(1);
    expect(result.pendingLevelUps).toBe(0);
    expect(result.modifiers).toEqual(run.modifiers);
    expect(run.takeOffers()).toEqual([]);
  });

  it('rejects a perk that is not in the current offer', () => {
    const run = withLevelUp();
    run.takeOffers();
    expect(() => run.choosePerk('not_a_perk')).toThrow(Error);
    expect(run.pendingLevelUps).toBe(1);
  });

  it('applies the fallback XP bonus when chosen', () => {
    const run = withLevelUp();
    maxOut(run);
    const offer = run.takeOffers()[0]!;
    const choice = run.choosePerk(offer.id);
    expect(choice.perk.id).toBe('xp_fallback');
    // Quick Study is already maxed (1.4) by maxOut, so the fallback adds 0.1.
    expect(choice.modifiers.xpMultiplier).toBeCloseTo(1.5);
  });

  it('grants debug perks without consuming pending level ups or offers', () => {
    const run = withLevelUp();
    const offers = run.takeOffers();
    const before = offers.map((offer) => offer.id);

    const choice = run.grantPerk('power_ball');
    expect(choice.perk.level).toBe(1);
    expect(choice.modifiers.ballDamage).toBe(2);
    expect(choice.pendingLevelUps).toBe(1);
    expect(choice.spawnedBalls).toBe(0);
    expect(run.takeOffers().map((offer) => offer.id)).toEqual(before);
  });

  it('does not throw when granting a maxed perk', () => {
    const run = withLevelUp();
    run.grantPerk('sticky_paddle');
    const choice = run.grantPerk('sticky_paddle');
    expect(choice.perk.level).toBe(1);
    expect(choice.spawnedBalls).toBe(0);
  });
});
