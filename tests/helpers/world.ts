import type { Ball, Block } from '../../src/sim/World';
import { World } from '../../src/sim/World';
import type { BlockTypeId } from '../../src/sim/blocks';
import { SIM_TUNING_DEFAULTS } from '../../src/game/config';
import { TEST_WAVES } from '../../src/sim/testWaves';

let nextBallId = 1000;

/** World with no default balls/blocks; running so outcome checks stay active. */
export function createWorld(seed = 1): World {
  const world = new World({
    wave: TEST_WAVES[0]!,
    height: 1280,
    tuning: { ...SIM_TUNING_DEFAULTS },
    seed,
  });
  world.reset();
  world.balls.length = 0;
  world.blocks.length = 0;
  return world;
}

/** A block placed far from the action so the wave is never "cleared". */
export function keeperBlock(): Block {
  return {
    id: 'keeper',
    type: 'crystal',
    hp: 1,
    maxHp: 1,
    row: 99,
    col: 0,
    left: 40,
    top: 520,
    width: 60,
    height: 40,
    flashMs: 0,
  };
}

export function addBlock(
  world: World,
  options: Partial<Block> & { left: number; top: number; width: number; height: number },
): Block {
  const type: BlockTypeId = options.type ?? 'crystal';
  const maxHp = options.maxHp ?? (type === 'obsidian' ? 3 : type === 'stone' ? 2 : 1);
  const block: Block = {
    id: options.id ?? `custom-${world.blocks.length}`,
    type,
    hp: options.hp ?? maxHp,
    maxHp,
    row: options.row ?? 50,
    col: options.col ?? 0,
    left: options.left,
    top: options.top,
    width: options.width,
    height: options.height,
    flashMs: 0,
  };
  world.blocks.push(block);
  return block;
}

export function addBall(world: World, options: Partial<Ball> & { x: number; y: number }): Ball {
  const ball: Ball = {
    id: nextBallId++,
    x: options.x,
    y: options.y,
    vx: options.vx ?? 0,
    vy: options.vy ?? 0,
    radius: options.radius ?? SIM_TUNING_DEFAULTS.ballRadius,
    stuck: options.stuck ?? false,
    spawnGraceMs: options.spawnGraceMs ?? 0,
    sinceInteractionMs: options.sinceInteractionMs ?? 0,
    horizontalMs: options.horizontalMs ?? 0,
    aboveBlocksMs: options.aboveBlocksMs ?? 0,
  };
  world.balls.push(ball);
  return ball;
}

export const NO_INPUT = {
  paddleTargetX: null,
  paddleDirection: 0,
  launch: false,
} as const;
