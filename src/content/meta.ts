import type { MetaProgress } from '../game/contracts';
import { PERK_BY_ID } from './perks';

/** One perk that can be bought in the Workshop. */
export interface MetaUnlock {
  readonly id: string;
  readonly tier: number;
  readonly cost: number;
}

/**
 * Perks available from the first run. Starter perks are implicit in the save;
 * only bought unlocks are persisted in `meta.unlocks`.
 */
export const STARTER_PERK_IDS = [
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
] as const;

/** Locked perks and their Workshop prices, ordered by tier then cost. */
export const META_UNLOCKS: readonly MetaUnlock[] = [
  { id: 'second_chance', tier: 1, cost: 12 },
  { id: 'explosive_core', tier: 1, cost: 15 },
  { id: 'sticky_paddle', tier: 1, cost: 18 },
  { id: 'momentum', tier: 2, cost: 35 },
  { id: 'bombardier', tier: 2, cost: 40 },
  { id: 'boss_slayer', tier: 2, cost: 45 },
  { id: 'laser_focus', tier: 3, cost: 65 },
  { id: 'overcharge', tier: 3, cost: 65 },
  { id: 'hot_streak', tier: 3, cost: 75 },
  { id: 'overkill', tier: 4, cost: 100 },
  { id: 'shield_bash', tier: 4, cost: 110 },
  { id: 'conductor', tier: 4, cost: 120 },
];

const STARTER_SET: ReadonlySet<string> = new Set(STARTER_PERK_IDS);
const UNLOCK_BY_ID: ReadonlyMap<string, MetaUnlock> = new Map(
  META_UNLOCKS.map((unlock) => [unlock.id, unlock] as const),
);

export function getUnlock(id: string): MetaUnlock | undefined {
  return UNLOCK_BY_ID.get(id);
}

/** Starter perks plus every valid purchased unlock, without duplicates. */
export function getUnlockedPerkIds(meta: MetaProgress): string[] {
  const ids = new Set<string>(STARTER_PERK_IDS);
  for (const id of meta.unlocks) {
    if (UNLOCK_BY_ID.has(id)) ids.add(id);
  }
  return [...ids];
}

/** True for starter perks and for bought unlocks; locked perks return false. */
export function isPerkUnlocked(meta: MetaProgress, id: string): boolean {
  if (STARTER_SET.has(id)) return true;
  return UNLOCK_BY_ID.has(id) && meta.unlocks.includes(id);
}

/** Fresh copy of the ten starter ids, in catalog order. */
export function getStarterPerkIds(): string[] {
  return [...STARTER_PERK_IDS];
}

/** Catalog presentation for an unlock card; text lives in `perks.ts`. */
export function getUnlockPresentation(id: string): {
  name: string;
  description: string;
} | null {
  if (!UNLOCK_BY_ID.has(id)) return null;
  const perk = PERK_BY_ID.get(id);
  return {
    name: perk?.name ?? id,
    description: perk?.description ?? '',
  };
}
