/**
 * Phase palettes for the procedural M4 presentation.
 *
 * The renderer owns no external art. Every colour and silhouette used by
 * `GameScene` is declared here so the look of a phase can be reviewed (and
 * unit-tested) without booting Phaser.
 */

export type BackdropShape =
  | 'crystal'
  | 'ruins'
  | 'arcane'
  | 'frost'
  | 'forge'
  | 'void';

export interface PhaseTheme {
  readonly id: string;
  readonly index: number;
  readonly name: string;
  readonly shape: BackdropShape;
  /** Vertical sky gradient. */
  readonly skyTop: number;
  readonly skyMid: number;
  readonly skyBottom: number;
  /** Large ambient glows behind the playfield. */
  readonly glow: number;
  readonly glowDeep: number;
  /** Bright accents used by motes, frame corners and feedback. */
  readonly accent: number;
  readonly accentSoft: number;
  readonly mote: number;
  readonly moteAlt: number;
  /** Backdrop silhouettes, far to near. */
  readonly silhouetteFar: number;
  readonly silhouetteNear: number;
  readonly frame: number;
  readonly frameBright: number;
  /** Faint horizontal guides behind the block grid. */
  readonly lane: number;
}

export const PHASE_THEMES: readonly PhaseTheme[] = [
  {
    id: 'phase-1',
    index: 0,
    name: 'Crystal Grove',
    shape: 'crystal',
    skyTop: 0x04141d,
    skyMid: 0x073039,
    skyBottom: 0x0a2029,
    glow: 0x2fe6c8,
    glowDeep: 0x0a4a56,
    accent: 0x7ef9ff,
    accentSoft: 0x3aa6a0,
    mote: 0xa8fff0,
    moteAlt: 0xffffff,
    silhouetteFar: 0x062028,
    silhouetteNear: 0x03141a,
    frame: 0x2f8f8a,
    frameBright: 0x9dfff2,
    lane: 0x0d2f36,
  },
  {
    id: 'phase-2',
    index: 1,
    name: 'Ruined Halls',
    shape: 'ruins',
    skyTop: 0x1a0f08,
    skyMid: 0x30200f,
    skyBottom: 0x24160c,
    glow: 0xffb35c,
    glowDeep: 0x5c3515,
    accent: 0xffd27a,
    accentSoft: 0xa86a32,
    mote: 0xffa04d,
    moteAlt: 0xffe6b0,
    silhouetteFar: 0x2a1a0e,
    silhouetteNear: 0x150c06,
    frame: 0x8a5a30,
    frameBright: 0xffd9a0,
    lane: 0x3a2513,
  },
  {
    id: 'phase-3',
    index: 2,
    name: 'Arcane Depths',
    shape: 'arcane',
    skyTop: 0x0d0618,
    skyMid: 0x1c0d33,
    skyBottom: 0x120822,
    glow: 0x9a5cff,
    glowDeep: 0x3d1a66,
    accent: 0xff5fd2,
    accentSoft: 0x7a4cc0,
    mote: 0xd9a7ff,
    moteAlt: 0xff8fdc,
    silhouetteFar: 0x1c1030,
    silhouetteNear: 0x0a0514,
    frame: 0x7a4cc0,
    frameBright: 0xf3c6ff,
    lane: 0x261442,
  },
  {
    id: 'phase-4',
    index: 3,
    name: 'Frostbound Spire',
    shape: 'frost',
    skyTop: 0x04101f,
    skyMid: 0x0b2b4a,
    skyBottom: 0x071a2c,
    glow: 0x66d9ff,
    glowDeep: 0x123a5c,
    accent: 0xd6f7ff,
    accentSoft: 0x4d94c7,
    mote: 0xbfefff,
    moteAlt: 0xffffff,
    silhouetteFar: 0x0a2036,
    silhouetteNear: 0x04101c,
    frame: 0x4d94c7,
    frameBright: 0xe6ffff,
    lane: 0x12314d,
  },
  {
    id: 'phase-5',
    index: 4,
    name: 'Emberforge',
    shape: 'forge',
    skyTop: 0x1c0a04,
    skyMid: 0x3d1606,
    skyBottom: 0x260c05,
    glow: 0xff7a2e,
    glowDeep: 0x6b2410,
    accent: 0xffd08a,
    accentSoft: 0xc25a24,
    mote: 0xffa25c,
    moteAlt: 0xffe0b0,
    silhouetteFar: 0x331408,
    silhouetteNear: 0x180803,
    frame: 0xa85324,
    frameBright: 0xffd6a0,
    lane: 0x4a1e0d,
  },
  {
    id: 'phase-6',
    index: 5,
    name: 'Void Threshold',
    shape: 'void',
    skyTop: 0x0a0418,
    skyMid: 0x1b0a38,
    skyBottom: 0x0d0522,
    glow: 0xa46bff,
    glowDeep: 0x3a1a6b,
    accent: 0xe5b8ff,
    accentSoft: 0x7e4fbf,
    mote: 0xd2a8ff,
    moteAlt: 0xff9df0,
    silhouetteFar: 0x1a0d33,
    silhouetteNear: 0x080314,
    frame: 0x6b46a8,
    frameBright: 0xf1d6ff,
    lane: 0x24124a,
  },
];

/** Hard cap on simultaneous live particles (plan §M4 / performance). */
export const PARTICLE_BUDGET = 120;
/** Hard cap on ball-trail afterimages across every ball. */
export const TRAIL_BUDGET = 48;

/** Base burst sizes; the renderer still clamps everything through the budget. */
export const FX_COUNTS = {
  blockHit: 3,
  blockBreak: 9,
  paddleHit: 3,
  ballLost: 8,
  explosion: 16,
  laser: 7,
  projectileHit: 5,
  waveClear: 18,
  celebrate: 36,
} as const;

/** Resolves a phase palette, falling back to the phase index and then phase 1. */
export function themeForPhase(phaseId: string, phaseIndex: number): PhaseTheme {
  const byId = PHASE_THEMES.find((theme) => theme.id === phaseId);
  if (byId) return byId;
  const safeIndex = Number.isFinite(phaseIndex)
    ? Math.max(0, Math.min(PHASE_THEMES.length - 1, Math.floor(phaseIndex)))
    : 0;
  return PHASE_THEMES[safeIndex] ?? PHASE_THEMES[0]!;
}

/**
 * How many particles may spawn now without exceeding the global budget.
 * Invalid/negative requests yield zero; fractional requests are floored.
 */
export function clampParticleRequest(
  requested: number,
  alive: number,
  budget: number = PARTICLE_BUDGET,
): number {
  if (!Number.isFinite(requested) || requested <= 0) return 0;
  const live = Number.isFinite(alive) ? Math.max(0, Math.floor(alive)) : 0;
  const cap = Number.isFinite(budget) ? Math.max(0, Math.floor(budget)) : 0;
  return Math.max(0, Math.min(Math.floor(requested), cap - live));
}

/** Reduced-motion keeps the read of a burst but halves its volume. */
export function scaleFxCount(count: number, reducedMotion: boolean): number {
  if (!Number.isFinite(count) || count <= 0) return 0;
  const base = Math.floor(count);
  return reducedMotion ? Math.max(1, Math.floor(base / 2)) : base;
}

export function hexToCss(color: number): string {
  return `#${(color & 0xffffff).toString(16).padStart(6, '0')}`;
}

/** Relative luminance helper used to assert palette readability in tests. */
export function relativeLuminance(color: number): number {
  const channel = (value: number): number => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const r = channel((color >> 16) & 0xff);
  const g = channel((color >> 8) & 0xff);
  const b = channel(color & 0xff);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
