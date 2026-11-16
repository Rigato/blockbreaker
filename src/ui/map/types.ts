/** Geometry and approved layer art for one world's campaign trail map. */
export interface WorldNodePoint {
  /** Horizontal centre inside the 390-wide viewBox. */
  readonly x: number;
  /** Vertical centre inside the 900-tall viewBox. */
  readonly y: number;
  /** Which side of the node carries its name plate. */
  readonly labelSide: 'left' | 'right';
}

export interface MapDef {
  readonly id: string;
  readonly numeral: string;
  readonly name: string;
  readonly accent: string;
  readonly width: number;
  readonly height: number;
  /** The front layer is taller so bokeh covers the 1.15x scroll edge. */
  readonly frontHeight: number;
  readonly depths: {
    readonly far: number;
    readonly mid: number;
    readonly near: number;
    readonly front: number;
  };
  /** One point per phase of the world, in local phase order. */
  readonly nodePoints: readonly WorldNodePoint[];
  readonly fallbackPoint: WorldNodePoint;
  /** Optional Endless ring (world I only). */
  readonly endlessPoint?: WorldNodePoint;
  /** Decorative arrival portal at the bottom of worlds II/III. */
  readonly arrivalPoint?: WorldNodePoint;
  readonly trailPath: string;
  readonly trailSegments: readonly string[];
  readonly trailGroupId: string;
  readonly farArt: string;
  readonly midArt: string;
  readonly nearArt: string;
  readonly frontArt: string;
  /** Trail overlay colours for completed / locked stretches. */
  readonly trailColors: {
    readonly doneSoft: string;
    readonly doneGradient: string;
    readonly doneGlow: string;
    readonly locked: string;
  };
}
