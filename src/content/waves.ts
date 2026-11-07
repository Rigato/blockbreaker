import { CONTENT_LEGEND } from './blocks';
import type { WaveDef } from './types';

/**
 * Final M3 waves.
 *
 * All grids are 8 columns wide on the 720-unit logical field. At the
 * conservative 720-unit validation height the grid bottom is 520, well above
 * the paddle top (591), so no block can occupy the paddle zone.
 *
 * Difficulty grows wave by wave: average HP and the HP x density score rise
 * monotonically. Crystal/stone carry phase 1, stone/obsidian phases 2-3.
 */

export const PHASE_1_WAVES: readonly WaveDef[] = [
  {
    id: 'p1w1',
    name: 'First Light',
    rows: ['..1111..', '.122221.', '11222211', '11111111'],
    legend: CONTENT_LEGEND,
    ballSpeed: 520,
  },
  {
    id: 'p1w2',
    name: 'Glimmer Path',
    rows: ['11....11', '12211221', '12222221', '11222211'],
    legend: CONTENT_LEGEND,
    ballSpeed: 560,
  },
  {
    id: 'p1w3',
    name: 'Crystal Crown',
    rows: ['12222221', '12222221', '12222221', '11222211'],
    legend: CONTENT_LEGEND,
    ballSpeed: 600,
  },
];

export const PHASE_2_WAVES: readonly WaveDef[] = [
  {
    id: 'p2w1',
    name: 'Broken Colonnade',
    rows: ['1.2332.1', '12333321', '12333321', '1.2332.1'],
    legend: CONTENT_LEGEND,
    ballSpeed: 560,
  },
  {
    id: 'p2w2',
    name: 'Collapsed Vault',
    rows: ['12333321', '12333321', '12333321', '12333321'],
    legend: CONTENT_LEGEND,
    ballSpeed: 600,
  },
  {
    id: 'p2w3',
    name: 'Hall of Echoes',
    rows: ['13333331', '23333332', '2.3333.2', '23333332'],
    legend: CONTENT_LEGEND,
    ballSpeed: 640,
  },
];

export const PHASE_3_WAVES: readonly WaveDef[] = [
  {
    id: 'p3w1',
    name: 'Whispering Runes',
    rows: ['23333332', '2.3333.2', '23333332', '23333332'],
    legend: CONTENT_LEGEND,
    ballSpeed: 580,
  },
  {
    id: 'p3w2',
    name: 'Deep Sanctum',
    rows: ['23333332', '23333332', '23333332', '23333332'],
    legend: CONTENT_LEGEND,
    ballSpeed: 620,
  },
  {
    id: 'p3w3',
    name: 'Arcane Heart',
    rows: ['33333333', '33333333', '23333332', '23333332'],
    legend: CONTENT_LEGEND,
    ballSpeed: 660,
  },
];
