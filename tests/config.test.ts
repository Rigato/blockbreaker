import { describe, expect, it } from 'vitest';
import { GAME_CONFIG, FIXED_STEP_SECONDS } from '../src/game/config';

describe('M0 frozen config', () => {
  it('uses the plan logical width and world height range', () => {
    expect(GAME_CONFIG.logicalWidth).toBe(720);
    expect(GAME_CONFIG.worldHeight.min).toBe(1280);
    expect(GAME_CONFIG.worldHeight.max).toBe(1440);
    expect(GAME_CONFIG.worldHeight.max / GAME_CONFIG.logicalWidth).toBe(2);
  });

  it('uses a 120 Hz fixed step and a 10 s Bridge timeout', () => {
    expect(GAME_CONFIG.fixedStepHz).toBe(120);
    expect(FIXED_STEP_SECONDS).toBeCloseTo(1 / 120);
    expect(GAME_CONFIG.boot.bridgeInitTimeoutMs).toBe(10_000);
    expect(GAME_CONFIG.boot.storageTimeoutMs).toBe(3_000);
  });

  it('owns the save keys used by the debug reset', () => {
    expect(GAME_CONFIG.storage.saveKey).toBe('bb.save');
    expect(GAME_CONFIG.storage.settingsKey).toBe('bb.settings');
  });
});
