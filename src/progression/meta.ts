import type {
  MetaProgress,
  MetaPurchaseError,
  MetaState,
  MetaUnlockView,
} from '../game/contracts';
import {
  META_UNLOCKS,
  getUnlock,
  getUnlockPresentation,
  isPerkUnlocked,
  type MetaUnlock,
} from '../content/meta';

/** Maximum Sparks a single campaign or Endless run can award. */
export const MAX_SPARKS_PER_RUN = 30;

type UnknownRecord = Record<string, unknown>;

export type PurchaseUnlockResult =
  | { ok: true; meta: MetaProgress; unlock: MetaUnlock }
  | { ok: false; error: MetaPurchaseError; meta: MetaProgress };

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonNegativeInteger(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;
}

/** Safe parse of the persisted meta block; invalid entries fall back to zero. */
export function sanitizeMeta(value: unknown): MetaProgress {
  const record = isRecord(value) ? value : {};
  const sparks = nonNegativeInteger(record.sparks);
  const unlocks: string[] = [];
  const seen = new Set<string>();

  if (Array.isArray(record.unlocks)) {
    for (const id of record.unlocks) {
      if (typeof id !== 'string' || seen.has(id)) continue;
      if (getUnlock(id) === undefined) continue;
      seen.add(id);
      unlocks.push(id);
    }
  }

  return { sparks, unlocks };
}

/**
 * Pure purchase. Known, unowned and affordable unlocks debit Sparks and append
 * the id; every failure returns the sanitized input unchanged.
 */
export function purchaseUnlock(
  meta: MetaProgress,
  id: string,
): PurchaseUnlockResult {
  const current = sanitizeMeta(meta);
  const unlock = getUnlock(id);
  if (!unlock) return { ok: false, error: 'unknown', meta: current };
  if (current.unlocks.includes(id)) {
    return { ok: false, error: 'owned', meta: current };
  }
  if (current.sparks < unlock.cost) {
    return { ok: false, error: 'insufficient', meta: current };
  }

  return {
    ok: true,
    meta: {
      sparks: current.sparks - unlock.cost,
      unlocks: [...current.unlocks, id],
    },
    unlock,
  };
}

/** Sparks for one finished campaign phase, capped per run. */
export function sparksForCampaign({
  waves,
  bosses,
  firstClear,
}: {
  waves: number;
  bosses: number;
  firstClear: boolean;
}): number {
  const earned =
    nonNegativeInteger(waves) +
    nonNegativeInteger(bosses) * 3 +
    (firstClear ? 5 : 0);
  return Math.min(MAX_SPARKS_PER_RUN, earned);
}

/** Sparks for one finished Endless run: +3 per five waves, capped per run. */
export function sparksForEndless({ wave }: { wave: number }): number {
  const reached = nonNegativeInteger(wave);
  return Math.min(
    MAX_SPARKS_PER_RUN,
    reached + Math.floor(reached / 5) * 3,
  );
}

/** Workshop view built from the catalog, with all twelve current unlocks. */
export function getMetaState(meta: MetaProgress): MetaState {
  const current = sanitizeMeta(meta);
  const unlocks: MetaUnlockView[] = META_UNLOCKS.map((unlock) => {
    const presentation = getUnlockPresentation(unlock.id);
    return {
      id: unlock.id,
      name: presentation?.name ?? unlock.id,
      description: presentation?.description ?? '',
      cost: unlock.cost,
      tier: unlock.tier,
      unlocked: isPerkUnlocked(current, unlock.id),
      affordable: current.sparks >= unlock.cost,
      available: true,
    };
  });

  return { sparks: current.sparks, unlocks };
}
