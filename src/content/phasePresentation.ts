import type { BlockTypeId } from '../sim/blocks';
import type { LevelElement, PhaseDef } from './types';

/** Short highlights shown on the campaign selection cards. */
const SPECIAL_BLOCK_FEATURES: Partial<Record<BlockTypeId, string>> = {
  moving: 'Moving',
  explosive: 'Explosives',
  regenerative: 'Regeneration',
  multiplier: '2× XP',
  linked: 'Linked',
  generator: 'Generators',
};

const ELEMENT_FEATURES: Record<LevelElement['kind'], string> = {
  deflector: 'Deflectors',
  portal: 'Portals',
  mover: 'Moving walls',
  rotor: 'Rotors',
  gate: 'Gates',
  wall: 'Walls',
  obstacle: 'Obstacles',
};

const BLOCK_FEATURE_ORDER: readonly BlockTypeId[] = [
  'generator',
  'linked',
  'multiplier',
  'moving',
  'explosive',
  'regenerative',
];

const ELEMENT_FEATURE_ORDER: readonly LevelElement['kind'][] = [
  'deflector',
  'portal',
  'mover',
  'rotor',
  'gate',
  'wall',
  'obstacle',
];

export interface PhaseSummary {
  readonly bossName: string | null;
  readonly features: readonly string[];
}

/**
 * Derives the content highlights of a phase from the actual wave data, so the
 * campaign cards stay truthful when waves change.
 */
export function summarizePhase(phase: PhaseDef): PhaseSummary {
  const blocks = new Set<BlockTypeId>();
  const elements = new Set<LevelElement['kind']>();
  let bossName: string | null = null;
  let timeLimit = false;
  let noLaser = false;

  for (const wave of phase.waves) {
    for (const row of wave.rows) {
      for (const char of row) {
        const block = wave.legend[char];
        if (block) blocks.add(block);
      }
    }
    for (const element of wave.elements ?? []) elements.add(element.kind);
    if (wave.boss) bossName = wave.boss.name;
    for (const rule of wave.rules ?? []) {
      if (rule.kind === 'timeLimit') timeLimit = true;
      if (rule.kind === 'noLaser') noLaser = true;
    }
  }

  const features: string[] = [];
  for (const id of BLOCK_FEATURE_ORDER) {
    if (blocks.has(id)) features.push(SPECIAL_BLOCK_FEATURES[id]!);
  }
  for (const kind of ELEMENT_FEATURE_ORDER) {
    if (elements.has(kind)) features.push(ELEMENT_FEATURES[kind]);
  }
  if (timeLimit) features.push('Time limit');
  if (noLaser) features.push('No laser');
  if (features.length === 0) features.push('Classic');

  return { bossName, features: features.slice(0, 4) };
}
