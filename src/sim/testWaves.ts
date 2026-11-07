import type { BlockTypeId } from './blocks';

/**
 * Provisional wave definition for M1. This mirrors the content `WaveDef`
 * described in the plan (§4.5); the real content pipeline arrives in M3.
 */
export interface WaveDef {
  id: string;
  name: string;
  /** Every row must have the same length; characters map through `legend`. */
  rows: readonly string[];
  legend: Record<string, BlockTypeId>;
  /** Base ball speed in logical units per second. */
  ballSpeed: number;
}

/** Fixtures only — not final content. */
export const TEST_WAVES: readonly WaveDef[] = [
  {
    id: 'm1-first-light',
    name: 'First Light',
    rows: ['..111..', '.12221.', '1123211'],
    legend: { '1': 'crystal', '2': 'stone', '3': 'obsidian' },
    ballSpeed: 520,
  },
  {
    id: 'm1-dense',
    name: 'Dense Hall',
    // Denser QA fixture: 7 columns, five rows, mixed resistances.
    rows: ['1111111', '1222221', '1233321', '1222221', '1111111'],
    legend: { '1': 'crystal', '2': 'stone', '3': 'obsidian' },
    ballSpeed: 560,
  },
];

export function getTestWaves(): readonly { id: string; name: string }[] {
  return TEST_WAVES.map((wave) => ({ id: wave.id, name: wave.name }));
}

export function getTestWave(id: string): WaveDef {
  const found = TEST_WAVES.find((wave) => wave.id === id);
  return found ?? TEST_WAVES[0]!;
}
