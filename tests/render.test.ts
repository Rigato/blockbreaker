import { describe, expect, it } from 'vitest';
import { Effects } from '../src/render/effects';
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
  it('maps the three phase ids to distinct shapes and palettes', () => {
    const themes = [
      themeForPhase('phase-1', 0),
      themeForPhase('phase-2', 1),
      themeForPhase('phase-3', 2),
    ];
    expect(themes.map((theme) => theme.id)).toEqual(['phase-1', 'phase-2', 'phase-3']);
    expect(themes.map((theme) => theme.shape)).toEqual(['crystal', 'ruins', 'arcane']);
    expect(new Set(themes.map((theme) => theme.accent)).size).toBe(3);
    expect(new Set(themes.map((theme) => theme.skyTop)).size).toBe(3);
  });

  it('falls back to the phase index, then phase 1', () => {
    expect(themeForPhase('unknown', 1).id).toBe('phase-2');
    expect(themeForPhase('unknown', -4).id).toBe('phase-1');
    expect(themeForPhase('unknown', 99).id).toBe('phase-3');
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
