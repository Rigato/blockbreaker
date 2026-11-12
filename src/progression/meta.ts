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

/** Safety cap for a single campaign or Endless run; normal runs stay below it. */
export const MAX_SPARKS_PER_RUN = 250;

/** Sparks awarded for defeating a boss. */
export const SPARKS_PER_BOSS = 3;

/** Sparks awarded by every phase clear, before the first-clear bonus. */
export const SPARKS_PER_PHASE_CLEAR = 6;

/** Extra Sparks awarded the first time a phase is cleared. */
export const SPARKS_PER_FIRST_CLEAR = 6;

/** Consecutive block hits that each grant one Spark, once per wave. */
export const COMBO_SPARK_MILESTONES = [5, 10, 15] as const;

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

/**
 * Sparks for clearing one wave: plus one base Spark, one more per twelve
 * destroyed blocks, and one per combo milestone reached during the wave.
 */
export function sparksForWave({
  blocks,
  comboMilestones,
}: {
  blocks: number;
  comboMilestones: number;
}): number {
  const destroyed = nonNegativeInteger(blocks);
  const milestones = Math.min(
    COMBO_SPARK_MILESTONES.length,
    nonNegativeInteger(comboMilestones),
  );
  return 1 + Math.floor(destroyed / 12) + milestones;
}

/** Sparks for one phase clear: always six, twelve on the first clear. */
export function sparksForPhaseClear(firstClear: boolean): number {
  return SPARKS_PER_PHASE_CLEAR + (firstClear ? SPARKS_PER_FIRST_CLEAR : 0);
}

/** Clamps an accumulated run total to the per-run cap. */
export function capRunSparks(amount: number): number {
  return Math.min(MAX_SPARKS_PER_RUN, nonNegativeInteger(amount));
}

/**
 * Tracks which waves have already paid Sparks in one run. A wave claims its
 * key on the first award; reloading that key later in the same run suppresses
 * all of its wave, combo and boss awards.
 */
export class RunSparkWaveClaims {
  private readonly claimed = new Set<string>();
  private currentKey: string | null = null;
  private blocked = false;

  /** Clears every claim; call only when a new run starts. */
  reset(): void {
    this.claimed.clear();
    this.currentKey = null;
    this.blocked = false;
  }

  /** Starts one wave attempt; a previously claimed key is suppressed. */
  beginWave(key: string): void {
    this.currentKey = key;
    this.blocked = this.claimed.has(key);
  }

  /**
   * True when the current attempt may award Sparks. The first successful call
   * claims the current wave, while later calls in the same attempt still pay.
   */
  claim(): boolean {
    if (this.blocked) return false;
    if (this.currentKey !== null) this.claimed.add(this.currentKey);
    return true;
  }

  get isBlocked(): boolean {
    return this.blocked;
  }
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
