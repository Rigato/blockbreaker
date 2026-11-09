import type { EndingSummary } from '../game/contracts';
import { createRng } from '../sim/rng';
import type { BlockTypeId } from '../sim/blocks';
import { CONTENT_LEGEND } from './blocks';
import type { BossDef, LevelElement, PhaseDef, WaveDef } from './types';

/**
 * Endless mode content generator.
 *
 * One infinite phase whose waves are built deterministically from a run seed.
 * Waves 1-3 reuse readable fixed templates, later waves grow in density and
 * block variety, and every fifth wave spawns a rotating boss.
 */

export const ENDLESS_PHASE: PhaseDef = {
  id: 'endless',
  index: 0,
  name: 'Endless',
  waves: [],
};

export const ENDLESS_BASE_SPEED = 660;
export const ENDLESS_SPEED_STEP = 14;
export const ENDLESS_MAX_SPEED = 1100;
export const ENDLESS_MAX_ROWS = 12;

const ENDLESS_MAX_COLUMNS = 8;
/** Wave at which the design table saturates the ball speed at the cap. */
const ENDLESS_SPEED_CAP_WAVE = 32;

const CHAR_BY_TYPE: Readonly<Record<BlockTypeId, string>> = {
  crystal: '1',
  stone: '2',
  obsidian: '3',
  explosive: 'e',
  regenerative: 'r',
  moving: 'm',
  multiplier: 'x',
  generator: 'g',
  linked: 'l',
};

const BOSS_NAMES = ['Frost Sentinel', 'Ember Warden', 'Void Herald'] as const;
const BOSS_PATTERNS = ['sentinel', 'warden', 'void'] as const;

type SimpleKind = 'wall' | 'obstacle' | 'deflector' | 'mover' | 'gate' | 'rotor';

/** Waves below 1 or with a non-finite value collapse to wave 1. */
function normaliseWave(wave: number): number {
  if (!Number.isFinite(wave)) return 1;
  return Math.max(1, Math.floor(wave));
}

export function endlessBallSpeed(wave: number): number {
  const n = normaliseWave(wave);
  // The design table expects the cap to be reached at wave 32, which is one
  // step earlier than the raw linear ramp would reach 1100.
  if (n >= ENDLESS_SPEED_CAP_WAVE) return ENDLESS_MAX_SPEED;
  return Math.min(
    ENDLESS_MAX_SPEED,
    ENDLESS_BASE_SPEED + Math.max(0, n - 1) * ENDLESS_SPEED_STEP,
  );
}

function endlessRows(wave: number): number {
  return Math.min(ENDLESS_MAX_ROWS, 4 + Math.floor((wave - 1) / 2));
}

export function endlessBoss(wave: number): BossDef | null {
  const n = normaliseWave(wave);
  if (n % 5 !== 0) return null;

  const cycle = Math.floor(n / 5);
  const patternIndex = ((cycle - 1) % BOSS_PATTERNS.length + BOSS_PATTERNS.length) %
    BOSS_PATTERNS.length;
  const pattern = BOSS_PATTERNS[patternIndex]!;
  const name = BOSS_NAMES[patternIndex]!;

  return {
    id: `endless-w${n}-boss`,
    name,
    hp: 40 + n * 6,
    widthCells: pattern === 'warden' ? 4 : 3,
    heightCells: 2,
    row: 0,
    attackMs: Math.max(2200, 5000 - Math.floor(n / 5) * 300),
    moveSpeed: 90 + Math.floor(n / 5) * 15,
    pattern,
  };
}

/**
 * Element kind progression. Waves 2-13 each introduce a single mechanic;
 * wave 14 onwards combines every kind (including obstacles) in one row.
 */
function simpleKindsForWave(wave: number): readonly SimpleKind[] {
  if (wave < 6) return ['deflector'];
  if (wave < 8) return [];
  if (wave < 10) return ['mover'];
  if (wave < 12) return ['gate'];
  if (wave < 14) return ['rotor'];
  return [];
}

function makeSimpleElement(
  kind: SimpleKind,
  wave: number,
  col: number,
  row: number,
  index: number,
): LevelElement {
  const id = `endless-w${wave}-${kind}-${index}`;
  switch (kind) {
    case 'wall':
      return { id, kind, col, row };
    case 'obstacle':
      return { id, kind, col, row };
    case 'deflector':
      return { id, kind, col, row, angleDeg: index % 2 === 0 ? 45 : 135 };
    case 'mover':
      return {
        id,
        kind,
        col,
        row,
        axis: 'horizontal',
        rangeCells: 0.5,
        periodMs: 2600,
        phaseMs: index * 400,
      };
    case 'gate':
      return { id, kind, col, row, closedMs: 1600, openMs: 1400, phaseMs: index * 500 };
    case 'rotor':
      return { id, kind, col, row, lengthCells: 1, periodMs: 3000, phaseMs: index * 600 };
  }
}

function portalPair(wave: number, row: number, columns: readonly number[]): LevelElement[] {
  const pairId = `endless-w${wave}-portal`;
  return columns.map((col, index) => ({
    id: `endless-w${wave}-portal-${index}`,
    kind: 'portal' as const,
    col,
    row,
    pairId,
  }));
}

function elementsForWave(wave: number, rows: number): LevelElement[] {
  if (wave < 2) return [];
  const row = rows - 1;

  if (wave < 4) {
    return [1, 6].map((col, index) => makeSimpleElement('wall', wave, col, row, index + 1));
  }
  if (wave < 6) {
    return [1, 3, 5, 7].map((col, index) =>
      makeSimpleElement('deflector', wave, col, row, index + 1),
    );
  }
  if (wave < 8) {
    return portalPair(wave, row, [2, 5]);
  }

  const simpleKinds = simpleKindsForWave(wave);
  if (simpleKinds.length > 0) {
    return [2, 5].map((col, index) =>
      makeSimpleElement(simpleKinds[0]!, wave, col, row, index + 1),
    );
  }

  // Wave 14+: combine all seven kinds across the reserved last row.
  const baseKinds: readonly SimpleKind[] = [
    'wall',
    'deflector',
    'mover',
    'gate',
    'rotor',
    'obstacle',
  ];
  const shift = wave % baseKinds.length;
  const slots = [0, 1, 3, 4, 5, 7];
  const simple = slots.map((col, index) => {
    const kind = baseKinds[(index + shift) % baseKinds.length]!;
    return makeSimpleElement(kind, wave, col, row, index + 1);
  });
  return [...simple, ...portalPair(wave, row, [2, 6])];
}

function pickBlockType(wave: number, rng: () => number): BlockTypeId {
  const specials: BlockTypeId[] = [];
  if (wave >= 4) specials.push('moving');
  if (wave >= 5) specials.push('explosive');
  if (wave >= 7) specials.push('regenerative');
  if (wave >= 9) specials.push('multiplier');
  if (wave >= 11) specials.push('linked');
  if (wave >= 13) specials.push('generator');

  const specialChance = Math.min(0.14, 0.03 + wave * 0.002);
  if (specials.length > 0 && rng() < specialChance) {
    return specials[Math.floor(rng() * specials.length)]!;
  }

  const weights: [BlockTypeId, number][] = [['crystal', 1]];
  if (wave >= 2) weights.push(['stone', Math.min(0.6, 0.2 + wave * 0.02)]);
  if (wave >= 4) weights.push(['obsidian', Math.min(0.5, 0.1 + (wave - 3) * 0.02)]);

  const total = weights.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rng() * total;
  for (const [type, weight] of weights) {
    roll -= weight;
    if (roll <= 0) return type;
  }
  return weights[weights.length - 1]![0];
}

const TEMPLATE_BY_WAVE: Readonly<Record<number, readonly string[]>> = {
  1: ['..1111..', '.122221.', '11222211', '11111111'],
  2: ['11....11', '12211221', '12222221', '11222211'],
  3: ['12222221', '12222221', '12222221', '11222211'],
};

/** Waves 1-3 reuse the readable campaign templates, padded to `rows`. */
function templateRows(wave: number, rows: number, hasElements: boolean): string[] {
  const blockRowLimit = hasElements ? rows - 1 : rows;
  const template = TEMPLATE_BY_WAVE[wave] ?? TEMPLATE_BY_WAVE[1]!;
  const result = template.slice(0, blockRowLimit);
  while (result.length < blockRowLimit) result.push('.'.repeat(ENDLESS_MAX_COLUMNS));
  while (result.length < rows) result.push('.'.repeat(ENDLESS_MAX_COLUMNS));
  return result;
}

function generateRows(
  wave: number,
  rows: number,
  seed: number,
  hasBoss: boolean,
): string[] {
  const hasElements = elementsForWave(wave, rows).length > 0;
  const blockRowLimit = hasElements ? rows - 1 : rows;
  const firstBlockRow = hasBoss ? 2 : 0;
  const density = Math.min(0.92, 0.55 + wave * 0.015);
  const rng = createRng((seed ^ (wave * 0x9e3779b9)) >>> 0);

  const grid: string[][] = Array.from({ length: rows }, () =>
    Array.from({ length: ENDLESS_MAX_COLUMNS }, () => '.'),
  );
  const emptyCells: [number, number][] = [];

  for (let row = firstBlockRow; row < blockRowLimit; row += 1) {
    let rowCount = 0;
    for (let col = 0; col < ENDLESS_MAX_COLUMNS; col += 1) {
      if (rng() < density) {
        grid[row]![col] = CHAR_BY_TYPE[pickBlockType(wave, rng)];
        rowCount += 1;
      } else {
        emptyCells.push([row, col]);
      }
    }
    if (rowCount === 0) {
      const col = Math.floor(rng() * ENDLESS_MAX_COLUMNS);
      grid[row]![col] = CHAR_BY_TYPE[pickBlockType(wave, rng)];
    }
  }

  // Guarantee a playable minimum of 4 blocks even on sparse early waves.
  const blockCount = grid.reduce(
    (sum, row) => sum + row.filter((char) => char !== '.').length,
    0,
  );
  for (let index = 0; blockCount < 4 && index < emptyCells.length; index += 1) {
    const [row, col] = emptyCells[Math.floor(rng() * emptyCells.length)]!;
    if (grid[row]![col] !== '.') continue;
    grid[row]![col] = CHAR_BY_TYPE[pickBlockType(wave, rng)];
    emptyCells.splice(index, 1);
  }

  return grid.map((row) => row.join(''));
}

export function endlessWave(wave: number, seed: number): WaveDef {
  const n = normaliseWave(wave);
  const rows = endlessRows(n);
  const boss = endlessBoss(n);
  const elements = elementsForWave(n, rows);

  const rowStrings =
    n <= 3
      ? templateRows(n, rows, elements.length > 0)
      : generateRows(n, rows, Number.isFinite(seed) ? seed : 0, boss !== null);

  let intro: string | undefined;
  if (n === 1) {
    intro = 'Endless mode: survive as long as you can.';
  } else if (boss) {
    intro = `Boss wave: ${boss.name} awaits.`;
  }

  return {
    id: `endless-w${n}`,
    name: boss ? boss.name : `Wave ${n}`,
    rows: rowStrings,
    legend: CONTENT_LEGEND,
    ballSpeed: endlessBallSpeed(n),
    elements,
    ...(boss ? { boss } : {}),
    rules: [],
    ...(intro ? { intro } : {}),
  };
}

export function endlessEnding(wave: number, score: number): EndingSummary {
  const n = normaliseWave(wave);
  const rank = n >= 30 ? 'S' : n >= 15 ? 'A' : 'B';
  return {
    id: 'endless-defeat',
    title: 'The endless dark',
    body: `You reached wave ${n} with a score of ${Math.max(0, Math.floor(score))}.`,
    rank,
  };
}
