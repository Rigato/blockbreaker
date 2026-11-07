import Phaser from 'phaser';

/**
 * M0 placeholder scene. It paints the portrait field background; gameplay
 * objects arrive in M1. The scene reports readiness so the boot flow can send
 * `game_ready` only once the menu is interactive.
 */
export class GameScene extends Phaser.Scene {
  private readonly onReady: () => void;
  private backdrop?: Phaser.GameObjects.Graphics;

  constructor(onReady: () => void) {
    super({ key: 'GameScene' });
    this.onReady = onReady;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#080b16');
    this.backdrop = this.add.graphics();
    this.drawBackdrop();

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);

    this.onReady();
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

    const width = Math.max(1, this.scale.width);
    const height = Math.max(1, this.scale.height);
    graphics.clear();

    graphics.fillGradientStyle(0x060912, 0x070b16, 0x0d1b38, 0x091226, 1);
    graphics.fillRect(0, 0, width, height);

    // Soft arcane glows, kept behind the DOM menu.
    graphics.fillStyle(0x0f6b83, 0.09);
    graphics.fillCircle(width * 0.5, height * 0.22, width * 0.55);
    graphics.fillStyle(0x3a1d63, 0.2);
    graphics.fillCircle(width * 0.5, height * 1.04, width * 0.8);

    // Faint crystal silhouette.
    const centerX = width * 0.5;
    const centerY = height * 0.44;
    const size = Math.min(width, height) * 0.17;
    graphics.fillStyle(0x7ee7ff, 0.04);
    graphics.beginPath();
    graphics.moveTo(centerX, centerY - size);
    graphics.lineTo(centerX + size * 0.58, centerY - size * 0.18);
    graphics.lineTo(centerX + size * 0.3, centerY + size);
    graphics.lineTo(centerX - size * 0.34, centerY + size * 0.82);
    graphics.lineTo(centerX - size * 0.58, centerY - size * 0.22);
    graphics.closePath();
    graphics.fillPath();

    // Dot lattice to make canvas resizing obvious during QA.
    const spacing = Math.max(26, Math.round(width / 11));
    graphics.fillStyle(0x24406f, 0.32);
    for (let y = spacing; y < height; y += spacing) {
      for (let x = spacing; x < width; x += spacing) {
        graphics.fillRect(x, y, 2, 2);
      }
    }

    graphics.setDepth(-10);
  }
}
