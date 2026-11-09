import type { BlockTypeId } from '../sim/blocks';

/** Shared positional fields for every level element. */
interface LevelElementBase {
  readonly id: string;
  readonly col: number;
  readonly row: number;
  readonly widthCells?: number;
  readonly heightCells?: number;
}

/** Immovable, indestructible wall. */
export interface WallElement extends LevelElementBase {
  readonly kind: 'wall';
}

/** Immovable, indestructible obstacle (different art, same collision). */
export interface ObstacleElement extends LevelElementBase {
  readonly kind: 'obstacle';
}

/** Diagonal segment that reflects the ball along its normal. */
export interface DeflectorElement extends LevelElementBase {
  readonly kind: 'deflector';
  readonly angleDeg: number;
}

/** Portal pair; teleports the ball while preserving velocity. */
export interface PortalElement extends LevelElementBase {
  readonly kind: 'portal';
  readonly pairId: string;
}

/** AABB that oscillates along one axis. */
export interface MoverElement extends LevelElementBase {
  readonly kind: 'mover';
  readonly axis: 'horizontal' | 'vertical';
  readonly rangeCells: number;
  readonly periodMs: number;
  readonly phaseMs?: number;
}

/** Rotating segment(s) around the element centre. */
export interface RotorElement extends LevelElementBase {
  readonly kind: 'rotor';
  readonly lengthCells: number;
  readonly periodMs: number;
  readonly phaseMs?: number;
}

/** Wall that opens and closes on a cycle; collides only while closed. */
export interface GateElement extends LevelElementBase {
  readonly kind: 'gate';
  readonly closedMs: number;
  readonly openMs: number;
  readonly phaseMs?: number;
}

/** Discriminated union of every phase element. */
export type LevelElement =
  | WallElement
  | ObstacleElement
  | DeflectorElement
  | PortalElement
  | MoverElement
  | RotorElement
  | GateElement;

/** Boss entity definition for the final wave of a phase. */
export interface BossDef {
  readonly id: string;
  readonly name: string;
  readonly hp: number;
  readonly widthCells: number;
  readonly heightCells: number;
  readonly row: number;
  readonly attackMs: number;
  readonly moveSpeed: number;
  readonly pattern: 'sentinel' | 'warden' | 'void';
}

/** Optional per-wave challenge rule. */
export type WaveRule =
  | { readonly kind: 'timeLimit'; readonly ms: number }
  | { readonly kind: 'noLaser' };

/** Final M3 content contract. */
export interface WaveDef {
  readonly id: string;
  readonly name: string;
  /** Every row has the same length; characters map through `legend`. */
  readonly rows: readonly string[];
  readonly legend: Readonly<Record<string, BlockTypeId>>;
  /** Base ball speed in logical units per second. */
  readonly ballSpeed: number;
  /** Walls, obstacles and interactive field elements. */
  readonly elements?: readonly LevelElement[];
  /** Boss present on this wave. */
  readonly boss?: BossDef;
  /** Challenge rules applied while the wave is active. */
  readonly rules?: readonly WaveRule[];
  /** Short flavour text shown before the wave starts. */
  readonly intro?: string;
}

/** One campaign phase. Wave count varies per phase in v0.2.0. */
export interface PhaseDef {
  readonly id: string;
  readonly index: number;
  readonly name: string;
  readonly waves: readonly WaveDef[];
}
