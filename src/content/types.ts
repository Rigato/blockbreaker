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

/** Industrial press: a solid AABB that slams down and retracts on a cycle. */
export interface PressElement extends LevelElementBase {
  readonly kind: 'press';
  readonly rangeCells: number;
  readonly periodMs: number;
  readonly phaseMs?: number;
}

/** Conveyor belt: nudges the ball's direction without changing its speed. */
export interface BeltElement extends LevelElementBase {
  readonly kind: 'belt';
  readonly direction: 'left' | 'right';
}

/** Maglev rail: accelerates the ball along the rail up to the hard speed cap. */
export interface RailElement extends LevelElementBase {
  readonly kind: 'rail';
  readonly direction: 'left' | 'right';
}

/** Discriminated union of every phase element. */
export type LevelElement =
  | WallElement
  | ObstacleElement
  | DeflectorElement
  | PortalElement
  | MoverElement
  | RotorElement
  | GateElement
  | PressElement
  | BeltElement
  | RailElement;

/** Boss attack pattern. The first three are campaign-1 patterns. */
export type BossPattern =
  | 'sentinel'
  | 'warden'
  | 'void'
  | 'spread'
  | 'charger'
  | 'aimed'
  | 'matron'
  | 'riveter'
  | 'engine';

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
  readonly pattern: BossPattern;
}

/** Optional per-wave challenge rule. */
export type WaveRule =
  | { readonly kind: 'timeLimit'; readonly ms: number }
  | { readonly kind: 'noLaser' }
  | { readonly kind: 'noMultiball' }
  | {
      readonly kind: 'gust';
      /** Full left/right cycle in milliseconds. */
      readonly periodMs?: number;
      /** Peak lateral speed in logical units per second. */
      readonly strength?: number;
    };

/** Final content contract. */
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

/** One campaign phase. Wave count varies per phase. */
export interface PhaseDef {
  readonly id: string;
  /** Global ordinal: 0 is the tutorial, 1..6 world I, 7..12 world II, 13..18 world III. */
  readonly index: number;
  readonly name: string;
  /** Owning world id (`w1`, `w2`, `w3`). */
  readonly worldId?: string;
  /** 1-based phase position inside its world. */
  readonly localIndex?: number;
  /** Marks the optional first-run tutorial phase. */
  readonly tutorial?: boolean;
  /** Short flavour line shown on the campaign selection screen. */
  readonly tagline?: string;
  readonly waves: readonly WaveDef[];
}
