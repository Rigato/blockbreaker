import type { RunModifiers, SimTuning } from '../game/contracts';

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
    width: 100,
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

  progression: {
    baseXpToNext: 20,
    xpStepPerLevel: 10,
  },

  perks: {
    widePaddleStep: 0.12,
    giantBallStep: 0.15,
    quickStudyStep: 0.2,
    turretBaseMs: 3200,
    turretStepMs: 400,
    turretMinMs: 1200,
    laserCooldownMs: 8000,
    laserDamage: 1,
    stickyHoldMs: 2500,
    safetyCharges: 1,
    explosiveEvery: 8,
    fallbackXpStep: 0.1,
  },

  debug: {
    sampleMs: 500,
  },
} as const;

export const FIXED_STEP_SECONDS = 1 / GAME_CONFIG.fixedStepHz;

/** Neutral modifiers used before any perk is acquired. */
export const BASE_RUN_MODIFIERS: RunModifiers = {
  paddleWidthMultiplier: 1,
  ballRadiusMultiplier: 1,
  ballDamage: 1,
  xpMultiplier: 1,
  maxBalls: GAME_CONFIG.ball.maxBalls,
  turretInterval: null,
  stickyPaddle: false,
  laserCooldown: null,
  safetyNetCharges: 0,
  explosiveEvery: null,
};

/** M1 default feel values; the debug panel starts from these. */
export const SIM_TUNING_DEFAULTS: SimTuning = {
  ballSpeedScale: 1,
  paddleWidth: GAME_CONFIG.paddle.width,
  paddleMaxSpeed: GAME_CONFIG.paddle.maxSpeed,
  ballRadius: GAME_CONFIG.ball.radius,
  paddleMaxAngleDeg: 60,
  fixedStepHz: GAME_CONFIG.fixedStepHz,
};

/** Bounds used by the debug sliders. */
export const SIM_TUNING_LIMITS = {
  ballSpeedScale: { min: 0.5, max: 2, step: 0.05 },
  paddleWidth: { min: 80, max: 240, step: 2 },
  paddleMaxSpeed: { min: 800, max: 4000, step: 50 },
  ballRadius: { min: 5, max: 16, step: 0.5 },
  paddleMaxAngleDeg: { min: 30, max: 75, step: 1 },
  fixedStepHz: { min: 60, max: 240, step: 60 },
} as const;
