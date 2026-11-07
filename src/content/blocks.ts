import { BLOCK_TYPES, type BlockTypeId } from '../sim/blocks';

/**
 * Shared ASCII legend for every wave. The single-character keys are stable
 * content tokens; the values are the frozen sim block ids.
 */
export const CONTENT_LEGEND = {
  '1': 'crystal',
  '2': 'stone',
  '3': 'obsidian',
} as const satisfies Record<string, BlockTypeId>;

export type ContentLegendChar = keyof typeof CONTENT_LEGEND;

/** Destructible HP for a legend character, or 0 for empty/unknown cells. */
export function hpForLegendChar(char: string): number {
  const type = CONTENT_LEGEND[char as ContentLegendChar];
  return type ? BLOCK_TYPES[type].hp : 0;
}

/** Block type for a legend character, or `null` for empty/unknown cells. */
export function typeForLegendChar(char: string): BlockTypeId | null {
  return CONTENT_LEGEND[char as ContentLegendChar] ?? null;
}
