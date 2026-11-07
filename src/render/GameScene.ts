import Phaser from 'phaser';
import { BLOCK_TOP, FIELD_WIDTH, type World } from '../sim/World';
import { BLOCK_TYPES } from '../sim/blocks';

export interface GameSceneOptions {
  world: World;
  onFrame: (deltaMs: number) => void;
  onReady: () => void;
}

/**
 * Placeholder M1 renderer. Everything is drawn with Phaser Graphics from the
 * pure world state; no gameplay logic lives here.
 */
export class GameScene extends Phaser.Scene {
  private readonly world: World;
  private readonly onFrame: (deltaMs: number) => void;
  private readonly onReady: () => void;
  private backdrop?: Phaser.GameObjects.Graphics;
  private field?: Phaser.GameObjects.Graphics;

  constructor(options: GameSceneOptions) {
    super({ key: 'GameScene' });
    this.world = options.world;
    this.onFrame = options.onFrame;
    this.onReady = options.onReady;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#080b16');
    this.backdrop = this.add.graphics().setDepth(-10);
    this.field = this.add.graphics().setDepth(0);
    this.drawBackdrop();

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
    this.onReady();
  }

  update(_time: number, delta: number): void {
    this.onFrame(delta);
    this.drawWorld();
  }

  private handleResize(): void {
    this.drawBackdrop();
  }

  private handleShutdown(): void {
    this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
  }

  private drawBackdrop(): void {
    const graphics = this.backdrop;
    if (!graphics) return;

    const width = FIELD_WIDTH;
    const height = this.world.height;
    graphics.clear();

    graphics.fillGradientStyle(0x070b16, 0x070b16, 0x0b1730, 0x091226, 1);
    graphics.fillRect(0, 0, width, height);

    // Field glow behind the block area.
    graphics.fillStyle(0x0f6b83, 0.08);
    graphics.fillCircle(width / 2, height * 0.32, width * 0.62);
    graphics.fillStyle(0x3a1d63, 0.14);
    graphics.fillCircle(width / 2, height * 1.02, width * 0.8);

    // Playfield walls.
    graphics.lineStyle(3, 0x2f6f9a, 0.9);
    graphics.lineBetween(1.5, 0, 1.5, height);
    graphics.lineBetween(width - 1.5, 0, width - 1.5, height);
    graphics.lineBetween(0, 1.5, width, 1.5);

    // Faint guide above the paddle.
    const guideY = this.world.paddle.y + this.world.paddle.height / 2 + 40;
    graphics.lineStyle(1, 0x64e7ff, 0.1);
    graphics.lineBetween(0, guideY, width, guideY);

    graphics.setDepth(-10);
  }

  private drawWorld(): void {
    const graphics = this.field;
    if (!graphics) return;
    graphics.clear();

    const world = this.world;

    // Lane markers behind the blocks.
    graphics.fillStyle(0x10233f, 0.35);
    for (let row = 0; row < 3; row += 1) {
      const y = BLOCK_TOP + row * 100;
      graphics.fillRect(0, y, FIELD_WIDTH, 1);
    }

    for (const block of world.blocks) {
      const type = BLOCK_TYPES[block.type];
      const flash = block.flashMs > 0;
      const baseColor = flash ? 0xffffff : type.color;
      const alpha = block.type === 'obsidian' ? 0.9 : 0.82;

      graphics.fillStyle(0x03060d, 0.55);
      graphics.fillRoundedRect(block.left + 3, block.top + 4, block.width, block.height, 6);
      graphics.fillStyle(baseColor, alpha);
      graphics.fillRoundedRect(block.left, block.top, block.width, block.height, 6);

      graphics.lineStyle(2, 0x0a1220, 0.7);
      graphics.strokeRoundedRect(block.left, block.top, block.width, block.height, 6);
      if (block.type === 'stone' || block.type === 'obsidian') {
        graphics.lineStyle(1, 0xffffff, 0.28);
        graphics.strokeRoundedRect(block.left + 3, block.top + 3, block.width - 6, block.height - 6, 4);
      }

      // HP pips: one per remaining hit point.
      const pipSize = Math.max(3, Math.round(block.width * 0.055));
      const pipY = block.top + block.height - pipSize - 7;
      for (let pip = 0; pip < block.hp; pip += 1) {
        graphics.fillStyle(0x050912, 0.7);
        graphics.fillRect(block.left + 8 + pip * (pipSize + 4), pipY, pipSize, pipSize);
        graphics.fillStyle(0xffffff, 0.65);
        graphics.fillRect(block.left + 8 + pip * (pipSize + 4) + 1, pipY + 1, pipSize - 2, pipSize - 2);
      }

      // Cracks communicate damage without relying on colour.
      const damage = block.maxHp - block.hp;
      if (damage > 0) {
        graphics.lineStyle(2, 0x050912, 0.65);
        const stepX = block.width / (damage + 1);
        for (let crack = 0; crack < damage; crack += 1) {
          const x = block.left + stepX * (crack + 1);
          graphics.lineBetween(x - 6, block.top + 8, x + 7, block.top + block.height * 0.55);
          graphics.lineBetween(x + 7, block.top + block.height * 0.55, x - 4, block.top + block.height - 8);
        }
      }
    }

    // Paddle, projectiles and balls are only shown once the run has started.
    // The menu keeps the wave preview but hides the resting paddle bar behind
    // the Play button.
    if (!world.isRunning) {
      graphics.setDepth(0);
      return;
    }

    // Paddle.
    const paddle = world.paddle;
    const paddleLeft = paddle.x - paddle.width / 2;
    const paddleTop = paddle.y - paddle.height / 2;
    graphics.fillStyle(0x0a1a2c, 0.9);
    graphics.fillRoundedRect(paddleLeft - 2, paddleTop - 2, paddle.width + 4, paddle.height + 4, 8);
    graphics.fillStyle(0x64e7ff, 0.95);
    graphics.fillRoundedRect(paddleLeft, paddleTop, paddle.width, paddle.height, 7);
    graphics.fillStyle(0xb6f7ff, 0.9);
    graphics.fillRoundedRect(paddleLeft + 6, paddleTop + 3, paddle.width - 12, 4, 2);
    graphics.fillStyle(0x2f6f9a, 0.9);
    graphics.fillRect(paddle.x - 1, paddleTop + 6, 2, paddle.height - 9);

    // Prism Laser beam (vertical column above the paddle).
    const beam = world.laserBeam;
    if (beam) {
      const alpha = Math.max(0, beam.remainingMs / beam.durationMs);
      graphics.fillStyle(0xffe08a, 0.18 * alpha);
      graphics.fillRect(beam.x - beam.width / 2 - 8, 0, beam.width + 16, paddleTop);
      graphics.fillStyle(0xfff6cf, 0.85 * alpha);
      graphics.fillRect(beam.x - beam.width / 2, 0, beam.width, paddleTop);
      graphics.fillStyle(0xffffff, 0.95 * alpha);
      graphics.fillRect(beam.x - 2, 0, 4, paddleTop);
    }

    // Projectiles.
    for (const projectile of world.projectiles) {
      graphics.fillStyle(0xffd479, 0.28);
      graphics.fillCircle(projectile.x, projectile.y, projectile.radius * 2.4);
      graphics.fillStyle(0xfff2c4, 1);
      graphics.fillRoundedRect(
        projectile.x - projectile.radius / 2,
        projectile.y - projectile.radius * 2,
        projectile.radius,
        projectile.radius * 4,
        2,
      );
    }

    // Balls.
    for (const ball of world.balls) {
      graphics.fillStyle(0x64e7ff, 0.18);
      graphics.fillCircle(ball.x, ball.y, ball.radius * 1.8);
      graphics.fillStyle(0xf2fbff, 1);
      graphics.fillCircle(ball.x, ball.y, ball.radius);
      graphics.fillStyle(0x9fdcff, 0.9);
      graphics.fillCircle(ball.x - ball.radius * 0.28, ball.y - ball.radius * 0.3, ball.radius * 0.42);

      // Sticky Paddle: a warm ring plus a tether shows the ball is caught.
      if (ball.stuck && ball.sticky) {
        const pulse = 0.55 + 0.35 * Math.sin(world.timeMs / 90);
        graphics.lineStyle(2, 0xffc46b, pulse);
        graphics.strokeCircle(ball.x, ball.y, ball.radius + 5);
        graphics.lineStyle(2, 0xffc46b, 0.35);
        graphics.lineBetween(ball.x, ball.y + ball.radius, ball.x, paddle.y);
      }
    }

    // Explosive Core blasts.
    for (const fx of world.explosions) {
      const progress = 1 - fx.remainingMs / fx.durationMs;
      const alpha = Math.max(0, 1 - progress);
      graphics.fillStyle(0xffb347, 0.35 * alpha);
      graphics.fillCircle(fx.x, fx.y, fx.radius * (0.45 + progress * 0.75));
      graphics.lineStyle(3, 0xffe6a3, 0.85 * alpha);
      graphics.strokeCircle(fx.x, fx.y, fx.radius * (0.55 + progress * 0.9));
    }

    graphics.setDepth(0);
  }
}
