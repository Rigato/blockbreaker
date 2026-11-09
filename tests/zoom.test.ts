import { describe, expect, it } from 'vitest';
import { SIM_TUNING_DEFAULTS } from '../src/game/config';
import type { WaveDef } from '../src/content/types';
import { World } from '../src/sim/World';

function scaleFor(rows: readonly string[]): number {
  const wave: WaveDef = {
    id: 'zoom-fixture',
    name: 'Zoom Fixture',
    rows,
    legend: { '1': 'crystal' },
    ballSpeed: 520,
  };
  const world = new World({
    wave,
    height: 1280,
    tuning: { ...SIM_TUNING_DEFAULTS },
    seed: 1,
  });
  world.reset();
  return world.fieldScale;
}

describe('dynamic field zoom', () => {
  it('shrinks a tall 12-row wave below normal scale', () => {
    const rows = Array.from({ length: 12 }, () => '1.1.1.1');
    const scale = scaleFor(rows);
    expect(scale).toBeLessThan(1);
    expect(scale).toBeGreaterThanOrEqual(0.68);
  });

  it('keeps short waves at normal scale', () => {
    expect(scaleFor(['1111111', '.12221.', '1123211'])).toBe(1);
  });

  it('does not change when the world is resized', () => {
    const rows = Array.from({ length: 12 }, () => '1.1.1.1');
    const wave: WaveDef = {
      id: 'zoom-resize',
      name: 'Zoom Resize',
      rows,
      legend: { '1': 'crystal' },
      ballSpeed: 520,
    };
    const world = new World({
      wave,
      height: 1280,
      tuning: { ...SIM_TUNING_DEFAULTS },
      seed: 1,
    });
    world.reset();
    const before = world.fieldScale;
    world.resize(1440);
    expect(world.fieldScale).toBe(before);
  });
});
