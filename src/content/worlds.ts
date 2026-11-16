import type { PhaseDef } from './types';

/** Campaign world metadata. Worlds are content, not save fields. */
export interface WorldDef {
  readonly id: string;
  /** Roman numeral shown in the world selector. */
  readonly numeral: string;
  readonly name: string;
  readonly tagline: string;
  /** Global phase index of the first phase (the tutorial is index 0). */
  readonly firstIndex: number;
  /** Number of playable phases; the tutorial is not counted. */
  readonly phaseCount: number;
  /** Highest allowed `ballSpeed` for authored waves in this world. */
  readonly speedMax: number;
  /** `true` only for the world that hosts the tutorial. */
  readonly tutorial: boolean;
  /** Accent used by the world pill and map header. */
  readonly accent: string;
}

export const WORLDS: readonly WorldDef[] = [
  {
    id: 'w1',
    numeral: 'I',
    name: 'Crystal Vale',
    tagline: 'Where the first shards fall.',
    firstIndex: 1,
    phaseCount: 6,
    speedMax: 780,
    tutorial: true,
    accent: '#7ef9ff',
  },
  {
    id: 'w2',
    numeral: 'II',
    name: 'Neon Lattice',
    tagline: 'The machine that held the void.',
    firstIndex: 7,
    phaseCount: 6,
    speedMax: 900,
    tutorial: false,
    accent: '#35e8ff',
  },
  {
    id: 'w3',
    numeral: 'III',
    name: 'Rustwake',
    tagline: 'The engine under the light.',
    firstIndex: 13,
    phaseCount: 6,
    speedMax: 920,
    tutorial: false,
    accent: '#d9a441',
  },
];

export const TUTORIAL_FIRST_INDEX = 0;

/** Last phase index of a world (tutorial included only for world I). */
export function lastPhaseIndex(world: WorldDef): number {
  return world.firstIndex + world.phaseCount - 1;
}

export function worldForPhaseIndex(index: number): WorldDef {
  if (!Number.isFinite(index)) return WORLDS[0]!;
  for (let i = WORLDS.length - 1; i >= 0; i -= 1) {
    const world = WORLDS[i]!;
    if (index >= world.firstIndex) return world;
  }
  return WORLDS[0]!;
}

/** 1-based phase position inside its world; 0 for the tutorial. */
export function localPhaseIndex(index: number): number {
  if (!Number.isFinite(index) || index <= 0) return 0;
  const world = worldForPhaseIndex(index);
  return index - world.firstIndex + 1;
}

export function worldById(id: string): WorldDef | undefined {
  return WORLDS.find((world) => world.id === id);
}

/** First global index after the tutorial (world I phase 1). */
export function worldPhaseOffset(world: WorldDef): number {
  return world.firstIndex;
}

/** True when the phase closes its world (boss/ending screen). */
export function isWorldFinal(phase: PhaseDef): boolean {
  const world = worldById(phase.worldId ?? '');
  if (!world) return false;
  return phase.index === lastPhaseIndex(world);
}

/** Number of campaign phases, tutorial excluded. */
export const CAMPAIGN_PHASE_COUNT = WORLDS.reduce(
  (total, world) => total + world.phaseCount,
  0,
);

/** Total phase entries, tutorial included. */
export const TOTAL_PHASE_COUNT = CAMPAIGN_PHASE_COUNT + 1;

/** Highest unlockedPhase value (the last campaign phase). */
export const MAX_PHASE_INDEX = TOTAL_PHASE_COUNT - 1;
