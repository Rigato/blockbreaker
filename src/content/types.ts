import type { BlockTypeId } from '../sim/blocks';

/**
 * Final M3 content contract.
 *
 * This is intentionally structural with `src/sim/testWaves.WaveDef` so the
 * game can hand a content wave straight to `World.loadWave` without adapters.
 */
export interface WaveDef {
  readonly id: string;
  readonly name: string;
  /** Every row has the same length; characters map through `legend`. */
  readonly rows: readonly string[];
  readonly legend: Readonly<Record<string, BlockTypeId>>;
  /** Base ball speed in logical units per second. */
  readonly ballSpeed: number;
}

/** One of the three MVP phases. Always contains exactly three waves. */
export interface PhaseDef {
  readonly id: string;
  readonly index: 1 | 2 | 3;
  readonly name: string;
  readonly waves: readonly WaveDef[];
}
