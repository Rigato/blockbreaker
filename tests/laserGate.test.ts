import { describe, expect, it } from 'vitest';
import { BASE_RUN_MODIFIERS, GAME_CONFIG, SIM_TUNING_DEFAULTS } from '../src/game/config';
import type { RunModifiers } from '../src/game/contracts';
import type { WaveDef } from '../src/content/types';
import { World } from '../src/sim/World';
import { TEST_WAVES } from '../src/sim/testWaves';

const STEP_MS = 1000 / 120;

function withMods(overrides: Partial<RunModifiers>): RunModifiers {
  return { ...BASE_RUN_MODIFIERS, ...overrides };
}

function laserWorld(wave: WaveDef = TEST_WAVES[0]!): World {
  const world = new World({
    wave,
    height: 1280,
    tuning: { ...SIM_TUNING_DEFAULTS },
    seed: 1,
  });
  world.reset();
  world.applyRunModifiers(
    withMods({
      laserCooldown: GAME_CONFIG.perks.laserCooldownMs,
      laserLevel: 1,
    }),
  );
  return world;
}

describe('prism laser gate', () => {
  it('refuses to fire while the only ball is attached to the paddle', () => {
    const world = laserWorld();
    expect(world.balls[0]!.stuck).toBe(true);
    expect(world.laserReady).toBe(false);
    expect(world.laserBlockedReason).toBe('stuck');
    expect(world.fireLaser()).toBe(false);
    expect(world.laserCooldownRemainingMs).toBe(0);
  });

  it('fires after the ball is launched', () => {
    const world = laserWorld();
    world.step({ paddleTargetX: null, paddleDirection: 0, launch: true }, STEP_MS);

    expect(world.balls.every((ball) => !ball.stuck)).toBe(true);
    expect(world.laserReady).toBe(true);
    expect(world.laserBlockedReason).toBeNull();
    expect(world.fireLaser()).toBe(true);
  });

  it('refuses to fire while a sticky ball is held', () => {
    const world = laserWorld();
    const ball = world.balls[0]!;
    ball.stuck = true;
    ball.sticky = true;
    ball.stickyHoldRemainingMs = GAME_CONFIG.perks.stickyHoldMs;

    expect(world.laserBlockedReason).toBe('stuck');
    expect(world.laserReady).toBe(false);
    expect(world.fireLaser()).toBe(false);
  });

  it('allows firing when one of two balls is free after the player launches', () => {
    const world = laserWorld();
    world.step({ paddleTargetX: null, paddleDirection: 0, launch: true }, STEP_MS);
    world.spawnBall();

    expect(world.balls.filter((ball) => !ball.stuck)).toHaveLength(2);
    expect(world.laserReady).toBe(true);
    expect(world.fireLaser()).toBe(true);
  });

  it('keeps the laser blocked after a wave reset until the new ball is launched', () => {
    const world = laserWorld();
    world.step({ paddleTargetX: null, paddleDirection: 0, launch: true }, STEP_MS);
    expect(world.fireLaser()).toBe(true);

    world.applyRunModifiers(
      withMods({
        laserCooldown: GAME_CONFIG.perks.laserCooldownMs,
        laserLevel: 1,
      }),
    );
    world.loadWave(TEST_WAVES[0]!);
    world.applyRunModifiers(
      withMods({
        laserCooldown: GAME_CONFIG.perks.laserCooldownMs,
        laserLevel: 1,
      }),
    );
    world.reset();

    expect(world.balls[0]!.stuck).toBe(true);
    expect(world.laserBlockedReason).toBe('stuck');
    expect(world.fireLaser()).toBe(false);
  });

  it('reports the no-laser rule instead of stuck and blocks firing', () => {
    const wave: WaveDef = {
      id: 'rule-no-laser',
      name: 'No Laser',
      rows: ['1'],
      legend: { '1': 'crystal' },
      ballSpeed: 520,
      rules: [{ kind: 'noLaser' }],
    };
    const world = laserWorld(wave);
    world.spawnBall();

    expect(world.noLaserRule).toBe(true);
    expect(world.laserBlockedReason).toBe('rule');
    expect(world.laserReady).toBe(false);
    expect(world.fireLaser()).toBe(false);
  });
});

describe('wave rules', () => {
  it('fails the wave when the time limit expires', () => {
    const wave: WaveDef = {
      id: 'rule-time-limit',
      name: 'Time Limit',
      rows: ['1'],
      legend: { '1': 'crystal' },
      ballSpeed: 520,
      rules: [{ kind: 'timeLimit', ms: 500 }],
    };
    const world = laserWorld(wave);
    expect(world.timeLimitRemainingMs).toBe(500);

    const events = world.step({ paddleTargetX: null, paddleDirection: 0, launch: false }, 250);
    expect(world.timeLimitRemainingMs).toBe(250);
    expect(events.some((event) => event.type === 'rule:failed')).toBe(false);

    const failed = world.step(
      { paddleTargetX: null, paddleDirection: 0, launch: false },
      250,
    );
    expect(world.timeLimitRemainingMs).toBe(0);
    expect(world.outcome).toBe('defeat');
    expect(failed.some((event) => event.type === 'rule:failed')).toBe(true);
  });
});
