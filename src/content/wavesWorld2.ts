import { CONTENT_LEGEND } from './blocks';
import type { WaveDef } from './types';

/**
 * World II - Neon Lattice wave content (phases 7-12).
 *
 * Every grid is 8 columns wide with at most 12 rows. Boss cells stay empty
 * because the boss is horizontally centred (a 3- or 4-wide boss touches the
 * four middle columns) and the validator treats any touched cell as occupied.
 * None of these waves are registered in `PHASES` yet; this module is content
 * only, so it carries no runtime wiring.
 *
 * Curve inside a phase: block HP and density step up wave by wave, and boss
 * waves are excluded from the density pace check exactly like world I.
 */

export const PHASE_7_WAVES: readonly WaveDef[] = [
  {
    id: 'p7w1',
    name: 'Dockyard Drift',
    intro: 'Alloy plating lines the docks. Read the piers before you commit.',
    rows: ['..2222..', '.22aa22.', '22a22a22', '2a2..2a2', '.2a22a2.', '..2222..'],
    legend: CONTENT_LEGEND,
    ballSpeed: 640,
  },
  {
    id: 'p7w2',
    name: 'Alloy Wharf',
    intro: 'Bastion crates wedge the cargo lanes. Pick your angle.',
    rows: [
      '..2222..',
      '.2aaaa2.',
      '2ab22ba2',
      '2ab..ba2',
      '2ab22ba2',
      '.2aaaa2.',
      '..2222..',
    ],
    legend: CONTENT_LEGEND,
    ballSpeed: 668,
    elements: [
      { id: 'p7w2-wall', kind: 'wall', col: 0, row: 6 },
      { id: 'p7w2-deflector', kind: 'deflector', col: 7, row: 6, angleDeg: -45 },
    ],
  },
  {
    id: 'p7w3',
    name: 'Splashline',
    intro: 'A short maglev rail hums under the last pier. Feel the kick.',
    rows: [
      '.2b33b2.',
      '2b3bb3b2',
      '2b3..3b2',
      '2b3bb3b2',
      '.2b33b2.',
      '........',
    ],
    legend: CONTENT_LEGEND,
    ballSpeed: 696,
    elements: [{ id: 'p7w3-rail', kind: 'rail', col: 3, row: 5, direction: 'right' }],
  },
];

export const PHASE_8_WAVES: readonly WaveDef[] = [
  {
    id: 'p8w1',
    name: 'Antenna Field',
    intro: 'Entangled blocks share their damage across the yard. Break them together.',
    rows: [
      '..3nn3..',
      '.3baab3.',
      '3b3nn3b3',
      '3a3..3a3',
      '3b3nn3b3',
      '.3baab3.',
      '..3nn3..',
    ],
    legend: CONTENT_LEGEND,
    ballSpeed: 704,
  },
  {
    id: 'p8w2',
    name: 'Crossfeed',
    intro: 'Signal towers feed each other. A rotor sweeps the central channel.',
    rows: [
      '.3b33b3.',
      '33bnnb33',
      '3b3aa3b3',
      '3a....a3',
      '3b3aa3b3',
      '33bnnb33',
      '.3b33b3.',
    ],
    legend: CONTENT_LEGEND,
    ballSpeed: 724,
    elements: [
      { id: 'p8w2-rotor', kind: 'rotor', col: 4, row: 3, lengthCells: 1, periodMs: 4200 },
    ],
  },
  {
    id: 'p8w3',
    name: 'Nullframe Warden',
    intro: 'The Nullframe Warden drops into the yard. Its spread shards cut the lanes.',
    rows: [
      '33....33',
      '3......3',
      '........',
      '..3nn3..',
      '33baab33',
      '3.3223.3',
      '33baab33',
      '..3223..',
    ],
    legend: CONTENT_LEGEND,
    ballSpeed: 744,
    boss: {
      id: 'nullframe-warden',
      name: 'Nullframe Warden',
      hp: 150,
      widthCells: 3,
      heightCells: 2,
      row: 1,
      attackMs: 5000,
      moveSpeed: 170,
      pattern: 'spread',
    },
  },
];

export const PHASE_9_WAVES: readonly WaveDef[] = [
  {
    id: 'p9w1',
    name: 'First Rail',
    intro: 'A maglev rail accelerates the ball. Moving blocks ride the same line.',
    rows: [
      '.3bbbb3.',
      '3b3mm3b3',
      '3b3..3b3',
      '3b3mm3b3',
      '3b3..3b3',
      '.3bbbb3.',
    ],
    legend: CONTENT_LEGEND,
    ballSpeed: 752,
    elements: [
      { id: 'p9w1-rail', kind: 'rail', col: 3, row: 2, direction: 'right' },
      { id: 'p9w1-wall', kind: 'wall', col: 0, row: 5 },
      { id: 'p9w1-deflector', kind: 'deflector', col: 7, row: 5, angleDeg: -45 },
    ],
  },
  {
    id: 'p9w2',
    name: 'Cargo Shuttle',
    intro: 'Opposing rails and a shuttle mover split the spine into two lanes.',
    rows: [
      '.3bbbb3.',
      '3b3mm3b3',
      '3b3..3b3',
      '3bbmmbb3',
      '3b3..3b3',
      '.3bbbb3.',
    ],
    legend: CONTENT_LEGEND,
    ballSpeed: 768,
    elements: [
      { id: 'p9w2-rail', kind: 'rail', col: 4, row: 2, direction: 'left' },
      {
        id: 'p9w2-mover',
        kind: 'mover',
        col: 3,
        row: 4,
        axis: 'horizontal',
        rangeCells: 1,
        periodMs: 3200,
      },
      { id: 'p9w2-deflector', kind: 'deflector', col: 0, row: 5, angleDeg: 45 },
    ],
  },
  {
    id: 'p9w3',
    name: 'Spine Transit',
    intro: 'The spine runs at full tilt. Ride the rail, then bank off the corner wall.',
    rows: [
      '.3bbbb3.',
      '3bbaabb3',
      '3b3..3b3',
      '3bbaabb3',
      '..3bb3..',
      '.3bbbb3.',
    ],
    legend: CONTENT_LEGEND,
    ballSpeed: 784,
    elements: [
      { id: 'p9w3-rail', kind: 'rail', col: 3, row: 2, direction: 'right' },
      { id: 'p9w3-wall', kind: 'wall', col: 0, row: 4 },
      { id: 'p9w3-deflector', kind: 'deflector', col: 7, row: 4, angleDeg: -45 },
    ],
  },
];

export const PHASE_10_WAVES: readonly WaveDef[] = [
  {
    id: 'p10w1',
    name: 'Relay Lattice',
    intro: 'Relay blocks keep the gate and rotor powered. Cut the relays to slow the grid.',
    rows: [
      '.3bbbb3.',
      '3byy33b3',
      '3b3..3b3',
      '3bb33bb3',
      '3b3..3b3',
      '3byy33b3',
      '.3bbbb3.',
    ],
    legend: CONTENT_LEGEND,
    ballSpeed: 800,
    elements: [
      { id: 'p10w1-gate', kind: 'gate', col: 3, row: 2, closedMs: 2800, openMs: 2200 },
      { id: 'p10w1-rotor', kind: 'rotor', col: 4, row: 4, lengthCells: 1, periodMs: 3600 },
    ],
  },
  {
    id: 'p10w2',
    name: 'Switchyard',
    intro: 'A mover shoves the ball into the gate cycle. Time the crossing.',
    rows: [
      '.3bbbb3.',
      '3byy33b3',
      '3b3..3b3',
      '3bb33bb3',
      '3b3..3b3',
      '3bb33bb3',
      '.3bbbb3.',
    ],
    legend: CONTENT_LEGEND,
    ballSpeed: 816,
    elements: [
      {
        id: 'p10w2-mover',
        kind: 'mover',
        col: 3,
        row: 2,
        axis: 'horizontal',
        rangeCells: 1,
        periodMs: 3400,
      },
      { id: 'p10w2-gate', kind: 'gate', col: 4, row: 4, closedMs: 2400, openMs: 1800 },
    ],
  },
  {
    id: 'p10w3',
    name: 'Grid Lock',
    intro: 'A tight relay ring and a vertical press of machinery leave one seam.',
    rows: [
      '.3bbbb3.',
      '3bb33bb3',
      '3b3..3b3',
      '3bb33bb3',
      '.3bbbb3.',
    ],
    legend: CONTENT_LEGEND,
    ballSpeed: 832,
    elements: [
      { id: 'p10w3-gate', kind: 'gate', col: 3, row: 2, closedMs: 2200, openMs: 1600 },
      {
        id: 'p10w3-mover',
        kind: 'mover',
        col: 4,
        row: 2,
        axis: 'vertical',
        rangeCells: 1,
        periodMs: 3200,
      },
    ],
  },
  {
    id: 'p10w4',
    name: 'Maglev Dreadnought',
    intro: 'The Maglev Dreadnought charges the yard. Side gates offer the only cover.',
    rows: [
      '33....33',
      '3......3',
      '........',
      '..3yy3..',
      '33baab33',
      '3.3223.3',
      '33baab33',
      '..3223..',
    ],
    legend: CONTENT_LEGEND,
    ballSpeed: 848,
    elements: [
      { id: 'p10w4-gate-a', kind: 'gate', col: 0, row: 2, closedMs: 2600, openMs: 2000 },
      { id: 'p10w4-gate-b', kind: 'gate', col: 7, row: 2, closedMs: 2600, openMs: 2000 },
    ],
    boss: {
      id: 'maglev-dreadnought',
      name: 'Maglev Dreadnought',
      hp: 190,
      widthCells: 4,
      heightCells: 2,
      row: 1,
      attackMs: 4200,
      moveSpeed: 210,
      pattern: 'charger',
    },
  },
];

export const PHASE_11_WAVES: readonly WaveDef[] = [
  {
    id: 'p11w1',
    name: 'Light Weave',
    intro: 'Phased hardlight flickers in and out of reach. Strike while it is solid.',
    rows: ['.3bbbb3.', '3b3pp3b3', '3b3pp3b3', '3b3pp3b3', '.3bbbb3.'],
    legend: CONTENT_LEGEND,
    ballSpeed: 808,
    elements: [
      { id: 'p11w1-wall', kind: 'wall', col: 0, row: 4 },
      { id: 'p11w1-deflector', kind: 'deflector', col: 7, row: 4, angleDeg: 45 },
    ],
  },
  {
    id: 'p11w2',
    name: 'Phase Loom',
    intro: 'The loom braids phased strands between two hardlight walls.',
    rows: ['3bbbbbb3', '3b3pp3b3', '3bp..pb3', '3b3pp3b3', '3bbbbbb3'],
    legend: CONTENT_LEGEND,
    ballSpeed: 824,
    elements: [
      { id: 'p11w2-wall', kind: 'wall', col: 3, row: 2 },
      { id: 'p11w2-deflector', kind: 'deflector', col: 4, row: 2, angleDeg: 45 },
    ],
  },
  {
    id: 'p11w3',
    name: 'Prism Warp',
    intro: 'Twin deflectors split the weave. Phased plating guards the core.',
    rows: [
      '3bbbbbb3',
      '3b3pp3b3',
      '3bp..pb3',
      '3b3pp3b3',
      '3bbppbb3',
      '3bbbbbb3',
    ],
    legend: CONTENT_LEGEND,
    ballSpeed: 840,
    elements: [
      { id: 'p11w3-deflector-a', kind: 'deflector', col: 3, row: 2, angleDeg: 45 },
      { id: 'p11w3-deflector-b', kind: 'deflector', col: 4, row: 2, angleDeg: -45 },
    ],
  },
  {
    id: 'p11w4',
    name: 'Hardlight Bloom',
    intro: 'The weave blooms into a sealed lattice. One seam, one wall, one chance.',
    rows: [
      '33bbbb33',
      '3bbbbbb3',
      '3bp..pb3',
      '3bbbbbb3',
      '33bbbb33',
      '3bbbbbb3',
    ],
    legend: CONTENT_LEGEND,
    ballSpeed: 856,
    elements: [
      { id: 'p11w4-deflector', kind: 'deflector', col: 3, row: 2, angleDeg: -45 },
      { id: 'p11w4-wall', kind: 'wall', col: 4, row: 2 },
    ],
  },
];

export const PHASE_12_WAVES: readonly WaveDef[] = [
  {
    id: 'p12w1',
    name: 'Outer Core',
    intro: 'Every mechanic returns at once. Relays, phases and hardlight share one grid.',
    rows: ['3bbbbbb3', '3byy33b3', '3bp..pb3', '3bnppnb3', '3bbbbbb3'],
    legend: CONTENT_LEGEND,
    ballSpeed: 864,
    elements: [
      { id: 'p12w1-gate', kind: 'gate', col: 3, row: 2, closedMs: 2600, openMs: 1900 },
      { id: 'p12w1-rotor', kind: 'rotor', col: 4, row: 2, lengthCells: 1, periodMs: 4200 },
    ],
  },
  {
    id: 'p12w2',
    name: 'Coolant Loop',
    intro: 'The coolant loop runs hot. Keep the ball moving before the clock closes.',
    rows: ['3bbbbbb3', '3bbnnbb3', '3bp..pb3', '3bbnnbb3', '3bbbbbb3'],
    legend: CONTENT_LEGEND,
    ballSpeed: 872,
    elements: [
      {
        id: 'p12w2-mover',
        kind: 'mover',
        col: 3,
        row: 2,
        axis: 'horizontal',
        rangeCells: 1,
        periodMs: 3000,
      },
      { id: 'p12w2-deflector', kind: 'deflector', col: 4, row: 2, angleDeg: -45 },
    ],
    rules: [{ kind: 'timeLimit', ms: 90000 }],
  },
  {
    id: 'p12w3',
    name: 'Deep Lattice',
    intro: 'The lattice burns out the laser grid. Break it with the ball alone.',
    rows: [
      '3bbbbbb3',
      '3bbbbbb3',
      '3bp..pb3',
      '3bbnnbb3',
      '3bbppbb3',
      '3bbbbbb3',
    ],
    legend: CONTENT_LEGEND,
    ballSpeed: 880,
    elements: [
      { id: 'p12w3-gate', kind: 'gate', col: 3, row: 2, closedMs: 2400, openMs: 1800 },
      { id: 'p12w3-rail', kind: 'rail', col: 4, row: 2, direction: 'right' },
    ],
    rules: [{ kind: 'noLaser' }],
  },
  {
    id: 'p12w4',
    name: 'Core Breach',
    intro: 'The core seals itself. A wall and a deflector guard the last seam.',
    rows: [
      '33bbbb33',
      '3bbbbbb3',
      '3bp..pb3',
      '3bbbbbb3',
      '3bbbbbb3',
      '3bbbbbb3',
    ],
    legend: CONTENT_LEGEND,
    ballSpeed: 888,
    elements: [
      { id: 'p12w4-wall', kind: 'wall', col: 3, row: 2 },
      { id: 'p12w4-deflector', kind: 'deflector', col: 4, row: 2, angleDeg: 45 },
    ],
    rules: [{ kind: 'timeLimit', ms: 75000 }],
  },
  {
    id: 'p12w5',
    name: 'Lattice Hierophant',
    intro: 'Only the Hierophant remains. Aim true and end the Lattice.',
    // The 2-row-tall boss sits at row 1, so the duel arena keeps three rows.
    rows: ['........', '........', '........'],
    legend: CONTENT_LEGEND,
    ballSpeed: 896,
    boss: {
      id: 'lattice-hierophant',
      name: 'Lattice Hierophant',
      hp: 240,
      widthCells: 4,
      heightCells: 2,
      row: 1,
      attackMs: 3600,
      moveSpeed: 190,
      pattern: 'aimed',
    },
  },
];
