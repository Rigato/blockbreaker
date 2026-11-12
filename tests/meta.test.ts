import { describe, expect, it } from 'vitest';
import type { MetaProgress } from '../src/game/contracts';
import {
  META_UNLOCKS,
  STARTER_PERK_IDS,
  getStarterPerkIds,
  getUnlock,
  getUnlockedPerkIds,
  isPerkUnlocked,
} from '../src/content/meta';
import { PERK_BY_ID, PERK_CATALOG } from '../src/content/perks';
import {
  MAX_SPARKS_PER_RUN,
  getMetaState,
  purchaseUnlock,
  sanitizeMeta,
  sparksForCampaign,
  sparksForEndless,
} from '../src/progression/meta';

function emptyMeta(): MetaProgress {
  return { sparks: 0, unlocks: [] };
}

describe('meta content definitions', () => {
  it('ships exactly the ten starter perks', () => {
    expect(STARTER_PERK_IDS).toEqual([
      'multiball',
      'wide_paddle',
      'power_ball',
      'quick_study',
      'auto_turret',
      'giant_ball',
      'safety_net',
      'prism_laser',
      'foresight',
      'critical_strike',
    ]);
    expect(new Set(STARTER_PERK_IDS).size).toBe(10);
    for (const id of STARTER_PERK_IDS) {
      expect(PERK_BY_ID.has(id)).toBe(true);
    }
  });

  it('ships the nine current unlocks with the designed tiers and costs', () => {
    expect(
      META_UNLOCKS.map(({ id, tier, cost }) => ({ id, tier, cost })),
    ).toEqual([
      { id: 'second_chance', tier: 1, cost: 12 },
      { id: 'explosive_core', tier: 1, cost: 15 },
      { id: 'sticky_paddle', tier: 1, cost: 18 },
      { id: 'momentum', tier: 2, cost: 35 },
      { id: 'bombardier', tier: 2, cost: 40 },
      { id: 'boss_slayer', tier: 2, cost: 45 },
      { id: 'laser_focus', tier: 3, cost: 65 },
      { id: 'overcharge', tier: 3, cost: 65 },
      { id: 'hot_streak', tier: 3, cost: 75 },
    ]);
    for (const unlock of META_UNLOCKS) {
      expect(PERK_BY_ID.has(unlock.id)).toBe(true);
    }
  });

  it('partitions the catalog into starters and unlocks', () => {
    const starter = new Set<string>(STARTER_PERK_IDS);
    for (const unlock of META_UNLOCKS) {
      expect(starter.has(unlock.id)).toBe(false);
    }
    const all = new Set([...STARTER_PERK_IDS, ...META_UNLOCKS.map((unlock) => unlock.id)]);
    expect(all.size).toBe(PERK_CATALOG.length);
    expect([...all].sort()).toEqual(PERK_CATALOG.map((perk) => perk.id).sort());
  });

  it('looks up unlocks by id', () => {
    expect(getUnlock('second_chance')).toEqual({
      id: 'second_chance',
      tier: 1,
      cost: 12,
    });
    expect(getUnlock('not_a_perk')).toBeUndefined();
  });

  it('returns starter ids as a fresh copy', () => {
    const first = getStarterPerkIds();
    expect(first).toEqual([...STARTER_PERK_IDS]);
    first.push('second_chance');
    expect(getStarterPerkIds()).toHaveLength(10);
  });

  it('combines starters with valid purchases', () => {
    expect(getUnlockedPerkIds(emptyMeta())).toEqual([...STARTER_PERK_IDS]);

    const meta: MetaProgress = {
      sparks: 0,
      unlocks: ['second_chance', 'hot_streak', 'second_chance', 'unknown'],
    };
    const unlocked = getUnlockedPerkIds(meta);
    expect(unlocked).toHaveLength(12);
    expect(new Set(unlocked).size).toBe(12);
    expect(unlocked).toContain('second_chance');
    expect(unlocked).toContain('hot_streak');
    expect(unlocked).not.toContain('unknown');
  });

  it('reports starter, bought and locked perks', () => {
    const meta: MetaProgress = { sparks: 0, unlocks: ['second_chance'] };
    expect(isPerkUnlocked(meta, 'multiball')).toBe(true);
    expect(isPerkUnlocked(meta, 'foresight')).toBe(true);
    expect(isPerkUnlocked(meta, 'second_chance')).toBe(true);
    expect(isPerkUnlocked(meta, 'hot_streak')).toBe(false);
    expect(isPerkUnlocked(meta, 'not_a_perk')).toBe(false);
  });
});

describe('sanitizeMeta', () => {
  it('defaults missing, non-object and malformed values', () => {
    expect(sanitizeMeta(undefined)).toEqual({ sparks: 0, unlocks: [] });
    expect(sanitizeMeta(null)).toEqual({ sparks: 0, unlocks: [] });
    expect(sanitizeMeta('meta')).toEqual({ sparks: 0, unlocks: [] });
    expect(sanitizeMeta([])).toEqual({ sparks: 0, unlocks: [] });
    expect(sanitizeMeta({ sparks: '9', unlocks: 'second_chance' })).toEqual({
      sparks: 0,
      unlocks: [],
    });
  });

  it('floors non-negative sparks and keeps valid unlock ids once', () => {
    expect(
      sanitizeMeta({
        sparks: 12.9,
        unlocks: [
          'second_chance',
          'second_chance',
          'not_a_perk',
          'multiball',
          7,
          'explosive_core',
          null,
        ],
      }),
    ).toEqual({
      sparks: 12,
      unlocks: ['second_chance', 'explosive_core'],
    });
  });

  it('clamps negative, non-finite and missing sparks to zero', () => {
    expect(sanitizeMeta({ sparks: -3 }).sparks).toBe(0);
    expect(sanitizeMeta({ sparks: Number.NaN }).sparks).toBe(0);
    expect(sanitizeMeta({ sparks: Number.POSITIVE_INFINITY }).sparks).toBe(0);
    expect(sanitizeMeta({}).sparks).toBe(0);
  });
});

describe('purchaseUnlock', () => {
  it('debits Sparks, appends the unlock and stays pure', () => {
    const meta: MetaProgress = { sparks: 20, unlocks: [] };
    Object.freeze(meta);
    Object.freeze(meta.unlocks);

    const result = purchaseUnlock(meta, 'second_chance');

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected a successful purchase');
    expect(result.unlock).toEqual({
      id: 'second_chance',
      tier: 1,
      cost: 12,
    });
    expect(result.meta).toEqual({ sparks: 8, unlocks: ['second_chance'] });
    expect(result.meta).not.toBe(meta);
    expect(meta).toEqual({ sparks: 20, unlocks: [] });
  });

  it('rejects unknown perks without changing meta', () => {
    const meta: MetaProgress = { sparks: 100, unlocks: [] };
    const result = purchaseUnlock(meta, 'not_a_perk');
    expect(result).toMatchObject({ ok: false, error: 'unknown', meta });
  });

  it('rejects owned perks without charging twice', () => {
    const meta: MetaProgress = { sparks: 100, unlocks: ['sticky_paddle'] };
    const result = purchaseUnlock(meta, 'sticky_paddle');
    expect(result).toMatchObject({
      ok: false,
      error: 'owned',
      meta: { sparks: 100, unlocks: ['sticky_paddle'] },
    });
  });

  it('rejects purchases above the current balance', () => {
    const meta: MetaProgress = { sparks: 11, unlocks: [] };
    const result = purchaseUnlock(meta, 'second_chance');
    expect(result).toMatchObject({
      ok: false,
      error: 'insufficient',
      meta: { sparks: 11, unlocks: [] },
    });
  });

  it('allows buying at exactly the listed cost', () => {
    const result = purchaseUnlock({ sparks: 12, unlocks: [] }, 'second_chance');
    expect(result).toMatchObject({
      ok: true,
      meta: { sparks: 0, unlocks: ['second_chance'] },
    });
  });

  it('keeps multiple purchases in order', () => {
    const first = purchaseUnlock({ sparks: 100, unlocks: [] }, 'second_chance');
    if (!first.ok) throw new Error('expected first purchase');
    const second = purchaseUnlock(first.meta, 'hot_streak');
    expect(second).toMatchObject({
      ok: true,
      meta: { sparks: 13, unlocks: ['second_chance', 'hot_streak'] },
    });
  });
});

describe('Sparks formulas', () => {
  it('awards campaign waves, bosses and the first clear bonus', () => {
    expect(
      sparksForCampaign({ waves: 5, bosses: 1, firstClear: false }),
    ).toBe(8);
    expect(
      sparksForCampaign({ waves: 5, bosses: 1, firstClear: true }),
    ).toBe(13);
    expect(
      sparksForCampaign({ waves: 0, bosses: 0, firstClear: true }),
    ).toBe(5);
  });

  it('caps campaign Sparks at 30 per run', () => {
    expect(
      sparksForCampaign({ waves: 22, bosses: 3, firstClear: true }),
    ).toBe(MAX_SPARKS_PER_RUN);
    expect(MAX_SPARKS_PER_RUN).toBe(30);
  });

  it('ignores negative and fractional campaign inputs', () => {
    expect(
      sparksForCampaign({ waves: -4, bosses: -2, firstClear: false }),
    ).toBe(0);
    expect(
      sparksForCampaign({ waves: 3.9, bosses: 1.8, firstClear: false }),
    ).toBe(6);
  });

  it('awards Endless Sparks per wave plus three every five waves', () => {
    expect(sparksForEndless({ wave: 0 })).toBe(0);
    expect(sparksForEndless({ wave: 1 })).toBe(1);
    expect(sparksForEndless({ wave: 5 })).toBe(8);
    expect(sparksForEndless({ wave: 6 })).toBe(9);
    expect(sparksForEndless({ wave: 10 })).toBe(16);
    expect(sparksForEndless({ wave: 20 })).toBe(30);
  });

  it('caps Endless Sparks at 30 and clamps invalid waves', () => {
    expect(sparksForEndless({ wave: 99 })).toBe(MAX_SPARKS_PER_RUN);
    expect(sparksForEndless({ wave: -7 })).toBe(0);
    expect(sparksForEndless({ wave: Number.NaN })).toBe(0);
    expect(sparksForEndless({ wave: 5.9 })).toBe(8);
  });
});

describe('getMetaState', () => {
  it('lists every unlock with catalog presentation and affordability', () => {
    const state = getMetaState({ sparks: 12, unlocks: [] });

    expect(state.sparks).toBe(12);
    expect(state.unlocks).toHaveLength(9);
    expect(state.unlocks.map((unlock) => unlock.id)).toEqual(
      META_UNLOCKS.map((unlock) => unlock.id),
    );

    const secondChance = state.unlocks.find(
      (unlock) => unlock.id === 'second_chance',
    );
    expect(secondChance).toMatchObject({
      id: 'second_chance',
      name: PERK_BY_ID.get('second_chance')?.name,
      description: PERK_BY_ID.get('second_chance')?.description,
      cost: 12,
      tier: 1,
      unlocked: false,
      affordable: true,
      available: true,
    });

    const hotStreak = state.unlocks.find(
      (unlock) => unlock.id === 'hot_streak',
    );
    expect(hotStreak?.affordable).toBe(false);
    expect(hotStreak?.description).not.toBe('');
  });

  it('marks owned unlocks and tolerates invalid stored ids', () => {
    const state = getMetaState({
      sparks: 40,
      unlocks: ['second_chance', 'second_chance', 'not_a_perk'],
    });

    expect(state.sparks).toBe(40);
    expect(state.unlocks.filter((unlock) => unlock.unlocked)).toHaveLength(1);
    expect(
      state.unlocks.find((unlock) => unlock.id === 'second_chance'),
    ).toMatchObject({ unlocked: true, affordable: true });
    expect(
      state.unlocks.find((unlock) => unlock.id === 'explosive_core'),
    ).toMatchObject({ unlocked: false, affordable: true });
  });

  it('sanitizes sparks before building the view', () => {
    const state = getMetaState({ sparks: -9, unlocks: [] });
    expect(state.sparks).toBe(0);
    expect(state.unlocks.every((unlock) => unlock.affordable === false)).toBe(
      true,
    );
  });
});
