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
  alloy: 'Alloy hulls',
  bastion: 'Bastion hulls',
  entangled: 'Entangled',
  relay: 'Relay blocks',
  phased: 'Phased armor',
  plated: 'Plated armor',
  fused: 'Fused circuits',
  splitting: 'Splitters',
};

const ELEMENT_FEATURES: Record<LevelElement['kind'], string> = {
  deflector: 'Deflectors',
  portal: 'Portals',
  mover: 'Moving walls',
  rotor: 'Rotors',
  gate: 'Gates',
  wall: 'Walls',
  obstacle: 'Obstacles',
  press: 'Presses',
  belt: 'Belts',
  rail: 'Maglev rails',
};

const BLOCK_FEATURE_ORDER: readonly BlockTypeId[] = [
  'generator',
  'linked',
  'fused',
  'multiplier',
  'moving',
  'explosive',
  'regenerative',
  'alloy',
  'bastion',
  'entangled',
  'relay',
  'phased',
  'plated',
  'splitting',
];

const ELEMENT_FEATURE_ORDER: readonly LevelElement['kind'][] = [
  'deflector',
  'portal',
  'mover',
  'rotor',
  'gate',
  'press',
  'belt',
  'rail',
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
  let noMultiball = false;
  let gust = false;

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
      if (rule.kind === 'noMultiball') noMultiball = true;
      if (rule.kind === 'gust') gust = true;
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
  if (noMultiball) features.push('One ball');
  if (gust) features.push('Gusts');
  if (features.length === 0) features.push('Classic');

  return { bossName, features: features.slice(0, 4) };
}
