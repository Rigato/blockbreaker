import { CONTENT_LEGEND } from './blocks';
import type { WaveDef } from './types';

/**
 * v0.2.0 campaign waves.
 *
 * All grids are 8 columns wide on the 720-unit logical field. The content
 * validator evaluates them at the real minimum world height (1280) and applies
 * `computeFieldScale` exactly like `World`, so tall waves (up to 12 rows) are
 * allowed as long as the scaled field stays above the paddle.
 *
 * Phase 1-3 are the original M3 waves. Phase 4-6 introduce the new mechanics:
 * moving blocks, walls, deflectors, portals, gates, rotors, generators and the
 * three bosses. Boss waves are excluded from the block-density pace check
 * because their challenge comes from the boss, not from grid density.
 */

/**
 * First-run tutorial: two short waves that teach movement, the launch,
 * XP/level-ups and one special block. It is intentionally lighter than the
 * campaign opener and gates level 1 on a fresh save.
 */
export const TUTORIAL_WAVES: readonly WaveDef[] = [
  {
    id: 'tutw1',
    name: 'First Steps',
    // Eight stone bricks: the first four destroyed grant the first perk (8 XP).
    rows: ['..2222..', '22....22'],
    legend: CONTENT_LEGEND,
    ballSpeed: 520,
  },
  {
    id: 'tutw2',
    name: 'Spark Practice',
    rows: ['..2e22..', '.22..22.'],
    legend: CONTENT_LEGEND,
    ballSpeed: 560,
  },
];

export const PHASE_1_WAVES: readonly WaveDef[] = [
  {
    id: 'p1w1',
    name: 'First Light',
    rows: ['..1111..', '.122221.', '11222211', '11111111'],
    legend: CONTENT_LEGEND,
    ballSpeed: 572,
  },
  {
    id: 'p1w2',
    name: 'Glimmer Path',
    rows: ['11....11', '12211221', '12222221', '11222211'],
    legend: CONTENT_LEGEND,
    ballSpeed: 616,
  },
];

export const PHASE_2_WAVES: readonly WaveDef[] = [
  {
    id: 'p2w1',
    name: 'Broken Colonnade',
    rows: ['1.2332.1', '12333321', '12333321', '1.2332.1'],
    legend: CONTENT_LEGEND,
    ballSpeed: 616,
  },
  {
    id: 'p2w2',
    name: 'Collapsed Vault',
    rows: ['12333321', '12333321', '12333321', '12333321'],
    legend: CONTENT_LEGEND,
    ballSpeed: 660,
  },
  {
    id: 'p2w3',
    name: 'Hall of Echoes',
    rows: ['13333331', '23333332', '2.3333.2', '23333332'],
    legend: CONTENT_LEGEND,
    ballSpeed: 704,
  },
];

export const PHASE_3_WAVES: readonly WaveDef[] = [
  {
    id: 'p3w1',
    name: 'Whispering Runes',
    rows: ['23333332', '2.3333.2', '23333332', '23333332'],
    legend: CONTENT_LEGEND,
    ballSpeed: 638,
  },
  {
    id: 'p3w2',
    name: 'Deep Sanctum',
    rows: ['23333332', '23333332', '23333332', '23333332'],
    legend: CONTENT_LEGEND,
    ballSpeed: 682,
  },
  {
    id: 'p3w3',
    name: 'Arcane Heart',
    rows: ['33333333', '33333333', '23333332', '23333332'],
    legend: CONTENT_LEGEND,
    ballSpeed: 726,
  },
];

export const PHASE_4_WAVES: readonly WaveDef[] = [
  {
    id: 'p4w1',
    name: 'Frozen Ramparts',
    intro:
      'Moving blocks drift sideways while a wall and a deflector reshape the field.',
    rows: ['..1111..', '.1m22m1.', '11233211', '.1m22m1.', '..1111..'],
    legend: CONTENT_LEGEND,
    ballSpeed: 660,
    elements: [
      { id: 'p4w1-wall', kind: 'wall', col: 0, row: 0 },
      { id: 'p4w1-deflector', kind: 'deflector', col: 7, row: 0, angleDeg: 45 },
    ],
  },
  {
    id: 'p4w2',
    name: 'Cracking Ice',
    intro:
      'Explosive and regenerative blocks share the ice. Break them before the timer runs out.',
    rows: ['.rrrrrrr', 'rrrrrrrr', 'rrrerrrr', 'rrrerrrr', 'rrrrrrrr'],
    legend: CONTENT_LEGEND,
    ballSpeed: 682,
    elements: [{ id: 'p4w2-wall', kind: 'wall', col: 0, row: 0 }],
    rules: [{ kind: 'timeLimit', ms: 65000 }],
  },
  {
    id: 'p4w3',
    name: 'Frost Sentinel',
    intro:
      'The Frost Sentinel descends. Slip past its walls and break the crystal core.',
    rows: ['22222222', '2......2', '2......2', '22222222', '22222222', '22222222'],
    legend: CONTENT_LEGEND,
    ballSpeed: 704,
    elements: [
      { id: 'p4w3-wall', kind: 'wall', col: 1, row: 1, heightCells: 2 },
      { id: 'p4w3-deflector', kind: 'deflector', col: 6, row: 1, angleDeg: -45 },
    ],
    boss: {
      id: 'frost-sentinel',
      name: 'Frost Sentinel',
      hp: 60,
      widthCells: 3,
      heightCells: 2,
      row: 1,
      attackMs: 5000,
      moveSpeed: 90,
      pattern: 'sentinel',
    },
  },
];

export const PHASE_5_WAVES: readonly WaveDef[] = [
  {
    id: 'p5w1',
    name: 'Portal Foundry',
    intro:
      'Portals link opposite ends of the forge floor while multiplier blocks double your haul.',
    rows: [
      '..2222..',
      '.233332.',
      '23x22x32',
      '.233332.',
      '..2332..',
      '........',
    ],
    legend: CONTENT_LEGEND,
    ballSpeed: 682,
    elements: [
      { id: 'p5w1-portal-a', kind: 'portal', col: 1, row: 5, pairId: 'a' },
      { id: 'p5w1-portal-b', kind: 'portal', col: 6, row: 5, pairId: 'a' },
    ],
  },
  {
    id: 'p5w2',
    name: 'Sealed Gates',
    intro:
      'Gates open and close on a cycle while linked blocks share their damage. The Prism Laser is offline.',
    rows: [
      '33333333',
      '3l2222l3',
      '22l33l22',
      '3l2222l3',
      '33333333',
      '........',
    ],
    legend: CONTENT_LEGEND,
    ballSpeed: 704,
    elements: [
      {
        id: 'p5w2-gate',
        kind: 'gate',
        col: 3,
        row: 5,
        closedMs: 3000,
        openMs: 2000,
      },
    ],
    rules: [{ kind: 'noLaser' }],
  },
  {
    id: 'p5w3',
    name: 'Molten Machinery',
    intro:
      'A moving block and a spinning rotor guard the molten core. Beat the clock.',
    rows: [
      '33333333',
      '33333333',
      '33333333',
      '33333333',
      '33333333',
      '33....33',
    ],
    legend: CONTENT_LEGEND,
    ballSpeed: 726,
    elements: [
      {
        id: 'p5w3-mover',
        kind: 'mover',
        col: 3,
        row: 5,
        axis: 'horizontal',
        rangeCells: 1,
        periodMs: 3000,
      },
      {
        id: 'p5w3-rotor',
        kind: 'rotor',
        col: 4,
        row: 5,
        lengthCells: 1,
        periodMs: 4000,
      },
    ],
    rules: [{ kind: 'timeLimit', ms: 60000 }],
  },
  {
    id: 'p5w4',
    name: 'Ember Warden',
    intro:
      'The Ember Warden rises through the forge. Its shards corrode your paddle on contact.',
    rows: [
      '22222222',
      '2......2',
      '2......2',
      '2.2222.2',
      '22.22.22',
      '........',
    ],
    legend: CONTENT_LEGEND,
    ballSpeed: 748,
    elements: [
      {
        id: 'p5w4-gate',
        kind: 'gate',
        col: 3,
        row: 5,
        closedMs: 2500,
        openMs: 2000,
      },
    ],
    boss: {
      id: 'ember-warden',
      name: 'Ember Warden',
      hp: 80,
      widthCells: 4,
      heightCells: 2,
      row: 1,
      attackMs: 4500,
      moveSpeed: 120,
      pattern: 'warden',
    },
  },
];

export const PHASE_6_WAVES: readonly WaveDef[] = [
  {
    id: 'p6w1',
    name: 'Void Confluence',
    intro:
      'Every special block appears at once, linked by portals that pierce the void.',
    rows: [
      '..1111..',
      '.1m22m1.',
      '1e2xx2e1',
      '1r2gg2r1',
      '.1l22l1.',
      '..1221..',
      '........',
    ],
    legend: CONTENT_LEGEND,
    ballSpeed: 704,
    elements: [
      { id: 'p6w1-portal-a', kind: 'portal', col: 1, row: 6, pairId: 'v' },
      { id: 'p6w1-portal-b', kind: 'portal', col: 6, row: 6, pairId: 'v' },
    ],
  },
  {
    id: 'p6w2',
    name: 'Rotor Gauntlet',
    intro:
      'A rotor and twin deflectors guard the lower lane while the clock bleeds away.',
    rows: [
      '33333333',
      '33333333',
      '33333333',
      '33333333',
      '33333333',
      '33333333',
      '........',
    ],
    legend: CONTENT_LEGEND,
    ballSpeed: 726,
    elements: [
      {
        id: 'p6w2-rotor',
        kind: 'rotor',
        col: 3,
        row: 6,
        lengthCells: 1,
        periodMs: 4000,
      },
      { id: 'p6w2-deflector-a', kind: 'deflector', col: 0, row: 6, angleDeg: 45 },
      { id: 'p6w2-deflector-b', kind: 'deflector', col: 7, row: 6, angleDeg: -45 },
    ],
    rules: [{ kind: 'timeLimit', ms: 75000 }],
  },
  {
    id: 'p6w3',
    name: 'Genesis Engine',
    intro:
      'Generators breed fresh crystal while a gate and a mover hold the last corridor.',
    rows: [
      '33333333',
      '3g3333g3',
      '33333333',
      '3l3333l3',
      '33333333',
      '33g33g33',
      '33333333',
      '..3333..',
    ],
    legend: CONTENT_LEGEND,
    ballSpeed: 748,
    elements: [
      {
        id: 'p6w3-mover',
        kind: 'mover',
        col: 1,
        row: 7,
        axis: 'horizontal',
        rangeCells: 0.5,
        periodMs: 3200,
      },
      {
        id: 'p6w3-gate',
        kind: 'gate',
        col: 6,
        row: 7,
        closedMs: 2600,
        openMs: 2200,
      },
    ],
  },
  {
    id: 'p6w4',
    name: 'Dense Singularity',
    intro:
      'A dense void mass packed with unstable blocks. No laser will save you here.',
    rows: [
      '33333333',
      '33333333',
      '33e33e33',
      '33333333',
      '3r3x3x3r',
      '33333333',
      '33333333',
      '33m33m33',
      '333l33l3',
    ],
    legend: CONTENT_LEGEND,
    ballSpeed: 770,
    rules: [{ kind: 'noLaser' }],
  },
  {
    id: 'p6w5',
    name: 'Void Herald',
    intro:
      'The Void Herald opens the final threshold. Survive its shards and end the campaign.',
    rows: [
      '........',
      '........',
      '11....11',
      '1.2222.1',
      '..3333..',
      '..2..2..',
      '1.2..2.1',
      '..3333..',
      '1.2222.1',
      '11....11',
      '........',
      '........',
    ],
    legend: CONTENT_LEGEND,
    ballSpeed: 780,
    elements: [
      { id: 'p6w5-wall', kind: 'wall', col: 0, row: 5 },
      { id: 'p6w5-obstacle', kind: 'obstacle', col: 7, row: 5 },
      {
        id: 'p6w5-mover',
        kind: 'mover',
        col: 3,
        row: 2,
        axis: 'horizontal',
        rangeCells: 1,
        periodMs: 3000,
      },
      {
        id: 'p6w5-rotor',
        kind: 'rotor',
        col: 3,
        row: 6,
        lengthCells: 1,
        periodMs: 4200,
      },
      { id: 'p6w5-deflector', kind: 'deflector', col: 3, row: 10, angleDeg: -45 },
      { id: 'p6w5-portal-a', kind: 'portal', col: 1, row: 10, pairId: 'v' },
      { id: 'p6w5-portal-b', kind: 'portal', col: 6, row: 10, pairId: 'v' },
      {
        id: 'p6w5-gate',
        kind: 'gate',
        col: 4,
        row: 11,
        closedMs: 2500,
        openMs: 2000,
      },
    ],
    boss: {
      id: 'void-herald',
      name: 'Void Herald',
      hp: 100,
      widthCells: 4,
      heightCells: 2,
      row: 0,
      attackMs: 4000,
      moveSpeed: 150,
      pattern: 'void',
    },
  },
];
