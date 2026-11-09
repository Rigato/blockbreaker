import { describe, expect, it } from 'vitest';
import { SIM_TUNING_DEFAULTS } from '../src/game/config';
import type { LevelElement, WaveDef } from '../src/content/types';
import { World } from '../src/sim/World';

const STEP_MS = 1000 / 120;

interface ElementOptions {
  elements: readonly LevelElement[];
}

function makeWorld({ elements }: ElementOptions): World {
  const wave: WaveDef = {
    id: 'element-fixture',
    name: 'Element Fixture',
    rows: ['1.........'],
    legend: { '1': 'crystal' },
    ballSpeed: 520,
    elements,
  };
  const world = new World({
    wave,
    height: 1280,
    tuning: { ...SIM_TUNING_DEFAULTS },
    seed: 1,
  });
  world.reset();
  world.balls.length = 0;
  return world;
}

describe('phase elements', () => {
  it('walls reflect the ball and block it', () => {
    const world = makeWorld({
      elements: [{ id: 'wall', kind: 'wall', col: 6, row: 2 }],
    });
    const element = world.elements[0]!;
    world.balls.push({
      id: 999,
      x: 380,
      y: element.top + element.height / 2,
      vx: 1500,
      vy: 0,
      radius: SIM_TUNING_DEFAULTS.ballRadius,
      stuck: false,
      sticky: false,
      stickyHoldRemainingMs: 0,
      spawnGraceMs: 0,
      sinceInteractionMs: 0,
      horizontalMs: 0,
      aboveBlocksMs: 0,
    });
    const shot = world.balls[0]!;

    world.step({ paddleTargetX: null, paddleDirection: 0, launch: false }, 1000 / 30);
    expect(shot.vx).toBeLessThan(0);
    expect(shot.x).toBeLessThan(element.left);
  });

  it('keeps deflector bars at 60% of the cell diagonal', () => {
    const world = makeWorld({
      elements: [{ id: 'deflector-size', kind: 'deflector', col: 6, row: 2, angleDeg: 0 }],
    });
    const element = world.elements[0]!;
    expect(element.lengthPx).toBeCloseTo(
      Math.hypot(element.width, element.height) * 0.6,
      5,
    );
  });

  it('deflectors reflect the ball along the segment normal', () => {
    const world = makeWorld({
      elements: [{ id: 'deflector', kind: 'deflector', col: 6, row: 2, angleDeg: 0 }],
    });
    const element = world.elements[0]!;
    world.balls.push({
      id: 999,
      x: element.left + element.width / 2,
      y: element.top + element.height / 2 + 30,
      vx: 0,
      vy: -1200,
      radius: SIM_TUNING_DEFAULTS.ballRadius,
      stuck: false,
      sticky: false,
      stickyHoldRemainingMs: 0,
      spawnGraceMs: 0,
      sinceInteractionMs: 0,
      horizontalMs: 0,
      aboveBlocksMs: 0,
    });
    const ball = world.balls[0]!;

    world.step({ paddleTargetX: null, paddleDirection: 0, launch: false }, 1000 / 30);

    expect(ball.vy).toBeGreaterThan(0);
    expect(world.events.some((event) => event.type === 'element:hit')).toBe(true);
  });

  it('portals teleport the ball to the pair centre and preserve velocity', () => {
    const world = makeWorld({
      elements: [
        { id: 'portal-a', kind: 'portal', col: 2, row: 2, pairId: 'pair' },
        { id: 'portal-b', kind: 'portal', col: 7, row: 2, pairId: 'pair' },
      ],
    });
    const from = world.elements[0]!;
    const to = world.elements[1]!;
    world.balls.push({
      id: 999,
      x: from.left + from.width / 2,
      y: from.top + from.height / 2,
      vx: 120,
      vy: -40,
      radius: SIM_TUNING_DEFAULTS.ballRadius,
      stuck: false,
      sticky: false,
      stickyHoldRemainingMs: 0,
      spawnGraceMs: 0,
      sinceInteractionMs: 0,
      horizontalMs: 0,
      aboveBlocksMs: 0,
    });
    const ball = world.balls[0]!;

    world.step({ paddleTargetX: null, paddleDirection: 0, launch: false }, STEP_MS);

    expect(ball.x).toBeCloseTo(to.left + to.width / 2, 4);
    expect(ball.y).toBeCloseTo(to.top + to.height / 2, 4);
    expect(ball.vx).toBeCloseTo(120, 4);
    expect(ball.vy).toBeCloseTo(-40, 4);
    expect(world.events.some((event) => event.type === 'portal:teleport')).toBe(true);
  });

  it('gates collide only while closed', () => {
    const closedWorld = makeWorld({
      elements: [
        { id: 'gate', kind: 'gate', col: 6, row: 2, closedMs: 1000, openMs: 1000 },
      ],
    });
    const gate = closedWorld.elements[0]!;
    closedWorld.balls.push({
      id: 999,
      x: 380,
      y: gate.top + gate.height / 2,
      vx: 2000,
      vy: 0,
      radius: SIM_TUNING_DEFAULTS.ballRadius,
      stuck: false,
      sticky: false,
      stickyHoldRemainingMs: 0,
      spawnGraceMs: 0,
      sinceInteractionMs: 0,
      horizontalMs: 0,
      aboveBlocksMs: 0,
    });
    const closedBall = closedWorld.balls[0]!;
    closedWorld.step({ paddleTargetX: null, paddleDirection: 0, launch: false }, 1000 / 30);
    expect(gate.active).toBe(true);
    expect(closedBall.vx).toBeLessThan(0);

    const openWorld = makeWorld({
      elements: [
        { id: 'gate', kind: 'gate', col: 6, row: 2, closedMs: 1000, openMs: 1000 },
      ],
    });
    const openGate = openWorld.elements[0]!;
    // Keep a parked ball alive while the gate cycle advances.
    openWorld.balls.push({
      id: 998,
      x: 100,
      y: 1000,
      vx: 0,
      vy: 0,
      radius: SIM_TUNING_DEFAULTS.ballRadius,
      stuck: false,
      sticky: false,
      stickyHoldRemainingMs: 0,
      spawnGraceMs: 0,
      sinceInteractionMs: 0,
      horizontalMs: 0,
      aboveBlocksMs: 0,
    });
    // Let the cycle reach the open window before firing the shot.
    for (let step = 0; step < 132; step += 1) {
      openWorld.step({ paddleTargetX: null, paddleDirection: 0, launch: false }, STEP_MS);
    }
    expect(openGate.active).toBe(false);

    openWorld.balls.push({
      id: 999,
      x: 380,
      y: openGate.top + openGate.height / 2,
      vx: 2000,
      vy: 0,
      radius: SIM_TUNING_DEFAULTS.ballRadius,
      stuck: false,
      sticky: false,
      stickyHoldRemainingMs: 0,
      spawnGraceMs: 0,
      sinceInteractionMs: 0,
      horizontalMs: 0,
      aboveBlocksMs: 0,
    });
    const openBall = openWorld.balls.at(-1)!;
    openWorld.step({ paddleTargetX: null, paddleDirection: 0, launch: false }, 1000 / 30);

    expect(openBall.vx).toBeGreaterThan(0);
    expect(openBall.x).toBeGreaterThan(openGate.left);
  });
});
