/** Block types used by the provisional M1 test waves. */

export type BlockTypeId = 'crystal' | 'stone' | 'obsidian';

export interface BlockType {
  id: BlockTypeId;
  /** Destructible hit points. */
  hp: number;
  /** Score awarded on destruction (10 x max HP, per plan §3). */
  score: number;
  /** Render colour (placeholder art only). */
  color: number;
}

export const BLOCK_TYPES: Record<BlockTypeId, BlockType> = {
  crystal: { id: 'crystal', hp: 1, score: 10, color: 0x64e7ff },
  stone: { id: 'stone', hp: 2, score: 20, color: 0xb388ff },
  obsidian: { id: 'obsidian', hp: 3, score: 30, color: 0xff5fd2 },
};

export function isBlockTypeId(value: string): value is BlockTypeId {
  return value === 'crystal' || value === 'stone' || value === 'obsidian';
}
