/** Block types used by the sim and content pipeline. */

export type BlockTypeId =
  | 'crystal'
  | 'stone'
  | 'obsidian'
  | 'explosive'
  | 'regenerative'
  | 'moving'
  | 'multiplier'
  | 'generator'
  | 'linked'
  | 'alloy'
  | 'bastion'
  | 'entangled'
  | 'relay'
  | 'phased'
  | 'plated'
  | 'fused'
  | 'splitting';

/** Simulation behaviour attached to a block type. */
export type BlockBehavior =
  | 'none'
  | 'explosive'
  | 'regenerative'
  | 'moving'
  | 'multiplier'
  | 'generator'
  | 'linked'
  | 'entangled'
  | 'relay'
  | 'phased'
  | 'plated'
  | 'fused'
  | 'splitting';

export interface BlockType {
  id: BlockTypeId;
  /** Destructible hit points. */
  hp: number;
  /** Score awarded on destruction (10 x max HP, per plan §3). */
  score: number;
  /** Render colour (placeholder art only). */
  color: number;
  /** Simulation behaviour driven by the block type. */
  behavior: BlockBehavior;
}

export const BLOCK_TYPES: Record<BlockTypeId, BlockType> = {
  crystal: { id: 'crystal', hp: 1, score: 10, color: 0x64e7ff, behavior: 'none' },
  stone: { id: 'stone', hp: 2, score: 20, color: 0xb388ff, behavior: 'none' },
  obsidian: { id: 'obsidian', hp: 3, score: 30, color: 0xff5fd2, behavior: 'none' },
  explosive: { id: 'explosive', hp: 2, score: 25, color: 0xff8a3d, behavior: 'explosive' },
  regenerative: { id: 'regenerative', hp: 3, score: 30, color: 0x6dff9e, behavior: 'regenerative' },
  moving: { id: 'moving', hp: 2, score: 20, color: 0x7ab8ff, behavior: 'moving' },
  multiplier: { id: 'multiplier', hp: 1, score: 30, color: 0xffd84d, behavior: 'multiplier' },
  generator: { id: 'generator', hp: 3, score: 40, color: 0xc084ff, behavior: 'generator' },
  linked: { id: 'linked', hp: 2, score: 20, color: 0x5ce1e6, behavior: 'linked' },
  alloy: { id: 'alloy', hp: 4, score: 40, color: 0x7fd4ff, behavior: 'none' },
  bastion: { id: 'bastion', hp: 5, score: 50, color: 0xd7f4ff, behavior: 'none' },
  entangled: { id: 'entangled', hp: 3, score: 35, color: 0xff9de2, behavior: 'entangled' },
  relay: { id: 'relay', hp: 2, score: 25, color: 0xffb03a, behavior: 'relay' },
  phased: { id: 'phased', hp: 3, score: 35, color: 0x9d7bff, behavior: 'phased' },
  plated: { id: 'plated', hp: 4, score: 40, color: 0xc9a36a, behavior: 'plated' },
  fused: { id: 'fused', hp: 3, score: 30, color: 0xff6b5c, behavior: 'fused' },
  splitting: { id: 'splitting', hp: 2, score: 20, color: 0x8dff7a, behavior: 'splitting' },
};

export function isBlockTypeId(value: string): value is BlockTypeId {
  return value in BLOCK_TYPES;
}
