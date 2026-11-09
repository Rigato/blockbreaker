import type { WaveDef } from '../content/types';

export type { WaveDef } from '../content/types';

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
    // Denser QA fixture: 7 columns, seven rows, mixed resistances, enough
    // HP for 4+ level ups across the M2 run.
    rows: [
      '1111111',
      '1222221',
      '1233321',
      '1222221',
      '1111111',
      '1123211',
      '1233321',
    ],
    legend: { '1': 'crystal', '2': 'stone', '3': 'obsidian' },
    ballSpeed: 560,
  },
  {
    id: 'm2-obsidian-gate',
    name: 'Obsidian Gate',
    // Final M2 QA fixture; faster ball and a closed obsidian core.
    rows: ['1.1.1.1', '1222221', '1233321', '1222221', '1.1.1.1'],
    legend: { '1': 'crystal', '2': 'stone', '3': 'obsidian' },
    ballSpeed: 600,
  },
];

export function getTestWaves(): readonly { id: string; name: string }[] {
  return TEST_WAVES.map((wave) => ({ id: wave.id, name: wave.name }));
}

export function getTestWave(id: string): WaveDef {
  const found = TEST_WAVES.find((wave) => wave.id === id);
  return found ?? TEST_WAVES[0]!;
}
