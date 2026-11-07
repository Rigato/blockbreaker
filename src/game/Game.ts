import Phaser from 'phaser';
import { GAME_CONFIG } from './config';
import { GameScene } from '../render/GameScene';

export interface CanvasMetrics {
  readonly cssWidth: number;
  readonly cssHeight: number;
  readonly width: number;
  readonly height: number;
  /** Effective backing-store ratio (canvas pixels per CSS pixel). */
  readonly resolution: number;
}

/**
 * Owns the Phaser instance for the M0 shell. It intentionally contains no game
 * rules; the simulation and scene wiring arrive in M1.
 */
export class BlockBreakerGame {
  readonly phaser: Phaser.Game;
  readonly ready: Promise<void>;

  constructor(parent: HTMLElement) {
    let resolveReady: () => void = () => {
      // Replaced synchronously below.
    };
    this.ready = new Promise<void>((resolve) => {
      resolveReady = resolve;
    });

    const width = Math.max(1, Math.round(parent.clientWidth || GAME_CONFIG.logicalWidth));
    const height = Math.max(
      1,
      Math.round(parent.clientHeight || GAME_CONFIG.worldHeight.min),
    );
    const scene = new GameScene(() => resolveReady());

    this.phaser = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width,
      height,
      backgroundColor: '#080b16',
      banner: false,
      pixelArt: true,
      roundPixels: true,
      antialias: false,
      disableContextMenu: true,
      transparent: false,
      audio: { noAudio: true },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.NO_CENTER,
        width,
        height,
        expandParent: false,
      },
      render: {
        powerPreference: 'high-performance',
      },
      fps: {
        target: 60,
        forceSetTimeOut: false,
      },
      scene: [scene],
    });
  }

  get fps(): number {
    return this.phaser.loop.actualFps;
  }

  get canvasMetrics(): CanvasMetrics {
    const canvas = this.phaser.canvas;
    const cssWidth = canvas?.clientWidth ?? 0;
    const width = canvas?.width ?? 0;
    return {
      cssWidth,
      cssHeight: canvas?.clientHeight ?? 0,
      width,
      height: canvas?.height ?? 0,
      resolution: cssWidth > 0 ? width / cssWidth : 1,
    };
  }

  get stageSize(): { width: number; height: number } {
    return {
      width: this.phaser.scale.width,
      height: this.phaser.scale.height,
    };
  }

  resize(width: number, height: number): void {
    if (width < 1 || height < 1) return;
    this.phaser.scale.resize(width, height);
  }

  destroy(): void {
    this.phaser.destroy(true);
  }
}
