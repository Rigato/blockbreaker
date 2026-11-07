/**
 * Frozen M0 tuning defaults.
 *
 * These are the starting values from the implementation plan (§3). Gameplay
 * code must read them from here rather than hardcoding numbers. Values are
 * adjusted only at a gate, with the change recorded.
 */
export const GAME_CONFIG = {
  logicalWidth: 720,
  worldHeight: {
    min: 1280,
    max: 1440,
  },
  fixedStepHz: 120,
  maxStepsPerFrame: 5,

  paddle: {
    width: 120,
    height: 18,
    maxSpeed: 2600,
  },

  ball: {
    radius: 9,
    baseSpeed: 520,
    speedPerWave: 40,
    maxSpeed: 700,
    maxBalls: 8,
  },

  stage: {
    /** Desktop shell never grows wider than this. */
    maxWidthPx: 540,
    /** 9:16 — shortest accepted portrait aspect. */
    minAspect: 9 / 16,
    /** 1:2 — tallest accepted portrait aspect. */
    maxAspect: 1 / 2,
  },

  boot: {
    bridgeInitTimeoutMs: 10_000,
    storageTimeoutMs: 3_000,
  },

  storage: {
    saveKey: 'bb.save',
    settingsKey: 'bb.settings',
  },

  debug: {
    sampleMs: 500,
  },
} as const;

export const FIXED_STEP_SECONDS = 1 / GAME_CONFIG.fixedStepHz;
