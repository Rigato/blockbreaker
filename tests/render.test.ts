import { describe, expect, it } from 'vitest';
import { blend, hashId, hashUnit, steppedRect } from '../src/render/blockArt';
import { bossColor, bossHurtColor } from '../src/render/bossArt';
import { elementColor, portalColor, portalHue } from '../src/render/elementArt';
import { Effects } from '../src/render/effects';
import { BLOCK_TYPES } from '../src/sim/blocks';
import {
  predictBallPath,
  TRAJECTORY_STEPS,
  type TrajectoryPoint,
} from '../src/render/trajectory';
import {
  clampParticleRequest,
  FX_COUNTS,
  PARTICLE_BUDGET,
  PHASE_THEMES,
  relativeLuminance,
  scaleFxCount,
  themeForPhase,
  TRAIL_BUDGET,
} from '../src/render/themes';

describe('phase themes', () => {
  it('maps the six phase ids to distinct shapes and palettes', () => {
    const themes = PHASE_THEMES.map((theme) => themeForPhase(theme.id, theme.index));
    expect(themes.map((theme) => theme.id)).toEqual([
      'phase-1',
      'phase-2',
      'phase-3',
      'phase-4',
      'phase-5',
      'phase-6',
    ]);
    expect(themes.map((theme) => theme.shape)).toEqual([
      'crystal',
      'ruins',
      'arcane',
      'frost',
      'forge',
      'void',
    ]);
    expect(new Set(themes.map((theme) => theme.accent)).size).toBe(6);
    expect(new Set(themes.map((theme) => theme.skyTop)).size).toBe(6);
    expect(new Set(themes.map((theme) => theme.name)).size).toBe(6);
  });

  it('falls back to the phase index, then phase 1', () => {
    expect(themeForPhase('unknown', 1).id).toBe('phase-2');
    expect(themeForPhase('unknown', 4).id).toBe('phase-5');
    expect(themeForPhase('unknown', -4).id).toBe('phase-1');
    expect(themeForPhase('unknown', 99).id).toBe('phase-6');
    expect(themeForPhase('unknown', Number.NaN).id).toBe('phase-1');
  });

  it('keeps accents clearly brighter than the sky for grayscale/readability', () => {
    for (const theme of PHASE_THEMES) {
      const sky = relativeLuminance(theme.skyTop);
      const accent = relativeLuminance(theme.accent);
      expect(accent).toBeGreaterThan(sky + 0.15);
      expect(relativeLuminance(theme.frameBright)).toBeGreaterThan(sky);
    }
  });
});

describe('block art helpers', () => {
  it('hashes block ids deterministically and distributes samples', () => {
    expect(hashId('0:0')).toBe(hashId('0:0'));
    expect(hashId('0:0')).not.toBe(hashId('0:1'));
    const samples = new Set<string>();
    for (let index = 0; index < 64; index += 1) {
      const unit = hashUnit(hashId(`${index % 8}:${index}`), index);
      expect(unit).toBeGreaterThanOrEqual(0);
      expect(unit).toBeLessThanOrEqual(1);
      samples.add(unit.toFixed(4));
    }
    expect(samples.size).toBeGreaterThan(60);
  });

  it('blends channels and clamps out-of-range amounts', () => {
    expect(blend(0x000000, 0xffffff, 1)).toBe(0xffffff);
    expect(blend(0xffffff, 0x000000, 0)).toBe(0xffffff);
    expect(blend(0x102030, 0xffffff, 0.5)).toBe(0x889098);
    expect(blend(0x123456, 0xabcdef, -1)).toBe(0x123456);
    expect(blend(0x123456, 0xabcdef, 2)).toBe(0xabcdef);
  });

  it('builds an inset-stepped silhouette without soft corners', () => {
    const rect = steppedRect(0, 0, 80, 80);
    expect(rect.length).toBeGreaterThan(8);
    // All points stay on the integer pixel grid.
    for (const point of rect) {
      expect(Number.isInteger(point.x)).toBe(true);
      expect(Number.isInteger(point.y)).toBe(true);
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(80);
    }
    // The four extreme corners are chamfered, not rounded to a single point.
    expect(rect.some((point) => point.x === 0 && point.y > 0)).toBe(true);
    expect(rect.some((point) => point.x > 0 && point.y === 0)).toBe(true);

    const inset = steppedRect(10, 10, 40, 40, 4);
    for (const point of inset) {
      expect(point.x).toBeGreaterThanOrEqual(14);
      expect(point.x).toBeLessThanOrEqual(46);
      expect(point.y).toBeGreaterThanOrEqual(14);
      expect(point.y).toBeLessThanOrEqual(46);
    }
  });
});

describe('block type catalog', () => {
  it('has nine distinct types with distinct colours and behaviours', () => {
    const types = Object.values(BLOCK_TYPES);
    expect(types).toHaveLength(9);
    expect(new Set(types.map((type) => type.id)).size).toBe(9);
    expect(new Set(types.map((type) => type.color)).size).toBe(9);
    expect(new Set(types.map((type) => type.behavior)).size).toBe(7);
    for (const type of types) {
      expect(type.hp).toBeGreaterThan(0);
      expect(type.score).toBeGreaterThan(0);
    }
    expect(BLOCK_TYPES.explosive.behavior).toBe('explosive');
    expect(BLOCK_TYPES.regenerative.behavior).toBe('regenerative');
    expect(BLOCK_TYPES.moving.behavior).toBe('moving');
    expect(BLOCK_TYPES.multiplier.behavior).toBe('multiplier');
    expect(BLOCK_TYPES.generator.behavior).toBe('generator');
    expect(BLOCK_TYPES.linked.behavior).toBe('linked');
  });
});

describe('element art helpers', () => {
  it('derives stable portal hues and pair colours without Phaser', () => {
    expect(portalHue('portal-a')).toBe(portalHue('portal-a'));
    expect(portalHue('portal-a')).not.toBe(portalHue('portal-b'));
    for (const pair of ['a', 'b', 'c', 'd', 'e']) {
      const hue = portalHue(pair);
      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThanOrEqual(1);
    }
    expect(portalColor('portal-a', 0xffffff)).toBe(portalColor('portal-a', 0xffffff));
    const colors = new Set(['a', 'b', 'c', 'd', 'e'].map((pair) => portalColor(pair, 0xffffff)));
    expect(colors.size).toBeGreaterThan(2);
  });

  it('gives every element kind its own readable base colour', () => {
    const kinds = ['wall', 'obstacle', 'deflector', 'portal', 'mover', 'rotor', 'gate'] as const;
    const colors = kinds.map((kind) => elementColor(kind, 0xffffff));
    for (const color of colors) {
      expect(color).toBeGreaterThanOrEqual(0);
      expect(color).toBeLessThanOrEqual(0xffffff);
    }
    expect(new Set(colors).size).toBe(kinds.length);
    expect(elementColor('gate', 0xffffff)).toBe(elementColor('gate', 0xffffff));
  });
});

describe('boss art helpers', () => {
  it('assigns distinct signature colours to the three patterns', () => {
    const colors = [bossColor('sentinel'), bossColor('warden'), bossColor('void')];
    expect(new Set(colors).size).toBe(3);
    expect(bossHurtColor('void', 0)).toBe(bossColor('void'));
    expect(bossHurtColor('void', 1)).toBe(0xffffff);
    expect(bossHurtColor('sentinel', 2)).toBe(0xffffff);
  });
});

describe('particle budget', () => {
  it('is frozen at the M4 performance targets', () => {
    expect(PARTICLE_BUDGET).toBe(120);
    expect(TRAIL_BUDGET).toBe(48);
  });

  it('clamps requests to the remaining budget', () => {
    expect(clampParticleRequest(10, 0)).toBe(10);
    expect(clampParticleRequest(10, 115)).toBe(5);
    expect(clampParticleRequest(10, 120)).toBe(0);
    expect(clampParticleRequest(10, 140)).toBe(0);
  });

  it('rejects invalid or empty requests and floors fractions', () => {
    expect(clampParticleRequest(0, 0)).toBe(0);
    expect(clampParticleRequest(-4, 0)).toBe(0);
    expect(clampParticleRequest(Number.NaN, 0)).toBe(0);
    expect(clampParticleRequest(5.9, 0)).toBe(5);
    expect(clampParticleRequest(5, Number.NaN)).toBe(5);
  });

  it('keeps burst sizes inside the documented ranges', () => {
    expect(FX_COUNTS.blockHit).toBeGreaterThanOrEqual(2);
    expect(FX_COUNTS.blockHit).toBeLessThanOrEqual(3);
    expect(FX_COUNTS.blockBreak).toBeGreaterThanOrEqual(6);
    expect(FX_COUNTS.blockBreak).toBeLessThanOrEqual(10);
    expect(FX_COUNTS.explosion).toBeLessThanOrEqual(PARTICLE_BUDGET);
    expect(scaleFxCount(9, false)).toBe(9);
    expect(scaleFxCount(9, true)).toBe(4);
    expect(scaleFxCount(1, true)).toBe(1);
  });
});

describe('foresight trajectory', () => {
  const width = 720;
  const height = 1280;
  const radius = 8;
  const lookAheadMs = 400;

  function ball(overrides: Partial<Parameters<typeof predictBallPath>[0]>): Parameters<typeof predictBallPath>[0] {
    return { x: width / 2, y: height / 2, vx: 0, vy: -800, radius, ...overrides };
  }

  it('returns the requested number of points ahead of the ball', () => {
    const points = predictBallPath(ball({}), width, height, lookAheadMs, TRAJECTORY_STEPS);
    expect(points).toHaveLength(TRAJECTORY_STEPS);
    expect(points[0]!.y).toBeLessThan(height / 2);
    expect(points.at(-1)!.y).toBeLessThan(points[0]!.y);
  });

  it('reflects off the side walls and stays inside the field', () => {
    const points = predictBallPath(
      ball({ x: width - radius - 2, vx: 900, vy: 0 }),
      width,
      height,
      lookAheadMs,
    );
    for (const point of points) {
      expect(point.x).toBeGreaterThanOrEqual(radius);
      expect(point.x).toBeLessThanOrEqual(width - radius);
    }
    // The ball was moving right; after the bounce the later samples move left.
    expect(points.some((point) => point.x < width - radius - 2)).toBe(true);
  });

  it('reflects off the ceiling', () => {
    const points = predictBallPath(
      ball({ y: radius + 4, vx: 0, vy: -900 }),
      width,
      height,
      lookAheadMs,
    );
    for (const point of points) expect(point.y).toBeGreaterThanOrEqual(radius);
    expect(points.some((point) => point.y > radius + 4)).toBe(true);
  });

  it('clips samples that fall below the field', () => {
    const points = predictBallPath(
      ball({ y: height - 60, vx: 0, vy: 900 }),
      width,
      height,
      lookAheadMs,
    );
    expect(points.length).toBeLessThan(TRAJECTORY_STEPS);
    expect(points.length).toBeGreaterThan(0);
    for (const point of points) expect(point.y).toBeLessThanOrEqual(height);
  });

  it('reuses the caller array and returns nothing for a zero horizon', () => {
    const out: TrajectoryPoint[] = [];
    const first = predictBallPath(ball({}), width, height, lookAheadMs, TRAJECTORY_STEPS, out);
    const second = predictBallPath(ball({}), width, height, lookAheadMs, TRAJECTORY_STEPS, out);
    expect(second).toBe(out);
    expect(second[0]).toBe(first[0]);

    expect(predictBallPath(ball({}), width, height, 0)).toHaveLength(0);
  });
});

describe('Effects pool', () => {
  it('never exceeds the global particle budget and reuses dead slots', () => {
    const effects = new Effects();
    expect(effects.emitBurst(0, 0, 500, 0xffffff)).toBe(PARTICLE_BUDGET);
    expect(effects.particleCount).toBe(PARTICLE_BUDGET);
    expect(effects.emitBurst(0, 0, 10, 0xffffff)).toBe(0);
    expect(effects.particleCount).toBe(PARTICLE_BUDGET);

    effects.update(2000);
    expect(effects.particleCount).toBe(0);
    expect(effects.emitBurst(0, 0, 20, 0xffffff)).toBe(20);
  });

  it('caps trails at 48 afterimages and clears rings', () => {
    const effects = new Effects();
    for (let index = 0; index < 80; index += 1) {
      expect(effects.emitTrail(index, index, 6, 0x64e7ff)).toBe(index < TRAIL_BUDGET);
    }
    expect(effects.trailCount).toBe(TRAIL_BUDGET);

    expect(effects.emitRing(0, 0, 10, 0xffffff)).toBe(true);
    expect(effects.ringCount).toBe(1);
    effects.clear();
    expect(effects.particleCount).toBe(0);
    expect(effects.trailCount).toBe(0);
    expect(effects.ringCount).toBe(0);
  });
});
