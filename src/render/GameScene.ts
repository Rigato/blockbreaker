import Phaser from 'phaser';
import { GAME_CONFIG } from '../game/config';
import type { ScenePresentation } from '../game/presentation';
import type { Block, SimEvent, World } from '../sim/World';
import { BLOCK_TOP, FIELD_WIDTH } from '../sim/World';
import { BLOCK_TYPES } from '../sim/blocks';
import { drawBlock } from './blockArt';
import { Effects } from './effects';
import {
  predictBallPath,
  TRAJECTORY_STEPS,
  type TrajectoryPoint,
} from './trajectory';
import {
  FX_COUNTS,
  hexToCss,
  PARTICLE_BUDGET,
  PHASE_THEMES,
  scaleFxCount,
  themeForPhase,
  type PhaseTheme,
} from './themes';

export interface GameSceneOptions {
  world: World;
  onFrame: (deltaMs: number) => void;
  onReady: () => void;
}

interface BlockSnapshot {
  left: number;
  top: number;
  width: number;
  height: number;
  type: Block['type'];
  hp: number;
  maxHp: number;
}

interface BallSnapshot {
  x: number;
  y: number;
  radius: number;
}

interface Mote {
  nx: number;
  ny: number;
  speed: number;
  drift: number;
  phase: number;
  size: number;
  alt: boolean;
  alpha: number;
}

const VIGNETTE_KEY = 'bb-m4-vignette';
const FRAME_DEPTH = 5;

/**
 * M4 presentation layer.
 *
 * Everything visible in the Phaser canvas is generated here: layered phase
 * backdrops, pixel-art blocks, paddle/ball glows, pooled particles, trails and
 * camera feedback. Gameplay remains pure data in `World`.
 */
export class GameScene extends Phaser.Scene implements ScenePresentation {
  private readonly world: World;
  private readonly onFrame: (deltaMs: number) => void;
  private readonly onReady: () => void;
  private readonly effects = new Effects(PARTICLE_BUDGET);

  private theme: PhaseTheme = PHASE_THEMES[0]!;
  private backdrop?: Phaser.GameObjects.Graphics;
  private motesGraphics?: Phaser.GameObjects.Graphics;
  private fieldGraphics?: Phaser.GameObjects.Graphics;
  private trajectoryGraphics?: Phaser.GameObjects.Graphics;
  private entityGraphics?: Phaser.GameObjects.Graphics;
  private effectsGraphics?: Phaser.GameObjects.Graphics;
  private overlayGraphics?: Phaser.GameObjects.Graphics;
  private frameGraphics?: Phaser.GameObjects.Graphics;
  private vignette?: Phaser.GameObjects.Image;

  private readonly pendingEvents: SimEvent[] = [];
  private readonly blockCache = new Map<string, BlockSnapshot>();
  private readonly ballCache = new Map<number, BallSnapshot>();
  private readonly seenBallIds = new Set<number>();
  private readonly motes: Mote[] = [];
  private readonly trajectoryPoints: TrajectoryPoint[] = [];

  private reducedMotion = false;
  private motionQuery?: MediaQueryList;
  private readonly motionListener = (event: MediaQueryListEvent): void => {
    this.reducedMotion = event.matches;
    this.rebuildMotes();
  };

  private blockDirty = true;
  private blockFlashActive = false;
  private lastBlockCount = -1;
  private trailTimer = 0;
  private paddlePulseMs = 0;
  private flashColor = 0xffffff;
  private flashAlpha = 0;
  private flashMaxAlpha = 0;
  private flashMs = 0;
  private flashDurationMs = 1;
  private sweepMs = 0;
  private sweepDurationMs = 560;

  constructor(options: GameSceneOptions) {
    super({ key: 'GameScene' });
    this.world = options.world;
    this.onFrame = options.onFrame;
    this.onReady = options.onReady;
  }

  // -------------------------------------------------------------------------
  // ScenePresentation
  // -------------------------------------------------------------------------

  pushEvents(events: readonly SimEvent[]): void {
    for (const event of events) this.pendingEvents.push(event);
  }

  setPhase(phaseId: string, phaseIndex: number): void {
    this.theme = themeForPhase(phaseId, phaseIndex);
    this.effects.clear();
    this.pendingEvents.length = 0;
    this.blockCache.clear();
    this.ballCache.clear();
    this.paddlePulseMs = 0;
    this.flashMs = 0;
    this.flashAlpha = 0;
    this.sweepMs = 0;
    this.trailTimer = 0;
    this.blockDirty = true;
    this.blockFlashActive = false;
    this.lastBlockCount = -1;
    if (this.backdrop) {
      this.cameras.main.setBackgroundColor(hexToCss(this.theme.skyTop));
      this.redrawBackdrop();
      this.rebuildVignette();
      this.drawFrame();
      this.rebuildMotes();
    }
  }

  /** Optional celebration hook for level-up/victory, wired by the integrator. */
  celebrate(): void {
    const theme = this.theme;
    const bursts = this.reducedMotion ? 1 : 3;
    for (let index = 0; index < bursts; index += 1) {
      const x = FIELD_WIDTH * (0.18 + Math.random() * 0.64);
      const y = this.world.height * (0.18 + Math.random() * 0.5);
      this.effects.emitBurst(
        x,
        y,
        scaleFxCount(FX_COUNTS.celebrate, this.reducedMotion) / bursts,
        theme.accent,
        {
          speed: 260,
          life: 900,
          size: 4,
          gravity: 90,
          drag: 0.9,
          altColor: theme.moteAlt,
          shape: 'square',
        },
      );
    }
    this.triggerFlash(theme.accent, 0.14, 280);
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  create(): void {
    this.reducedMotion = this.detectReducedMotion();
    this.cameras.main.setBackgroundColor(hexToCss(this.theme.skyTop));

    this.backdrop = this.add.graphics().setDepth(-50);
    this.motesGraphics = this.add.graphics().setDepth(-40);
    this.fieldGraphics = this.add.graphics().setDepth(0);
    // Same layer as the entities but added first, so the dotted guide sits
    // behind the balls while staying above the backdrop.
    this.trajectoryGraphics = this.add.graphics().setDepth(1);
    this.entityGraphics = this.add.graphics().setDepth(1);
    this.effectsGraphics = this.add.graphics().setDepth(2);
    this.overlayGraphics = this.add.graphics().setDepth(4);
    this.frameGraphics = this.add.graphics().setDepth(FRAME_DEPTH);

    this.redrawBackdrop();
    this.rebuildVignette();
    this.drawFrame();
    this.rebuildMotes();

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.motionQuery.addEventListener('change', this.motionListener);
    }

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
    this.onReady();
  }

  update(time: number, delta: number): void {
    this.onFrame(delta);
    const dt = Math.max(0, Math.min(50, delta));

    this.syncCaches();
    this.processEvents();
    this.updateTimers(dt);
    this.updateTrails(dt);
    this.effects.update(dt);

    this.drawMotes(time, dt);
    this.drawWorld(time);
    this.drawEffects();
    this.drawOverlay();
  }

  private handleResize(): void {
    this.blockDirty = true;
    this.redrawBackdrop();
    this.rebuildVignette();
    this.drawFrame();
    this.rebuildMotes();
  }

  private handleShutdown(): void {
    this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.motionQuery?.removeEventListener('change', this.motionListener);
    this.motionQuery = undefined;
    if (this.textures.exists(VIGNETTE_KEY)) this.textures.remove(VIGNETTE_KEY);
  }

  private detectReducedMotion(): boolean {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // -------------------------------------------------------------------------
  // Caches and event feedback
  // -------------------------------------------------------------------------

  private syncCaches(): void {
    this.seenBallIds.clear();

    if (this.world.blocks.length !== this.lastBlockCount) {
      this.blockDirty = true;
      this.lastBlockCount = this.world.blocks.length;
    }
    let anyFlash = false;
    for (const block of this.world.blocks) {
      let snapshot = this.blockCache.get(block.id);
      if (!snapshot) {
        snapshot = {
          left: block.left,
          top: block.top,
          width: block.width,
          height: block.height,
          type: block.type,
          hp: block.hp,
          maxHp: block.maxHp,
        };
        this.blockCache.set(block.id, snapshot);
        this.blockDirty = true;
      } else {
        if (
          snapshot.left !== block.left ||
          snapshot.top !== block.top ||
          snapshot.width !== block.width ||
          snapshot.height !== block.height ||
          snapshot.type !== block.type ||
          snapshot.hp !== block.hp ||
          snapshot.maxHp !== block.maxHp
        ) {
          this.blockDirty = true;
        }
        snapshot.left = block.left;
        snapshot.top = block.top;
        snapshot.width = block.width;
        snapshot.height = block.height;
        snapshot.type = block.type;
        snapshot.hp = block.hp;
        snapshot.maxHp = block.maxHp;
      }
      if (block.flashMs > 0) anyFlash = true;
    }
    // Flash alpha decays every frame; redraw once more when the last flash ends.
    if (anyFlash) this.blockDirty = true;
    else if (this.blockFlashActive) this.blockDirty = true;
    this.blockFlashActive = anyFlash;

    for (const ball of this.world.balls) {
      this.seenBallIds.add(ball.id);
      let snapshot = this.ballCache.get(ball.id);
      if (!snapshot) {
        snapshot = { x: ball.x, y: ball.y, radius: ball.radius };
        this.ballCache.set(ball.id, snapshot);
      } else {
        snapshot.x = ball.x;
        snapshot.y = ball.y;
        snapshot.radius = ball.radius;
      }
    }
  }

  private processEvents(): void {
    const events = this.pendingEvents;
    if (events.length > 0) {
      for (const event of events) this.applyEvent(event);
      events.length = 0;
    }
    // Keep the ball cache bounded: only live balls are needed after events run.
    for (const id of this.ballCache.keys()) {
      if (!this.seenBallIds.has(id)) this.ballCache.delete(id);
    }
  }

  private applyEvent(event: SimEvent): void {
    const theme = this.theme;
    switch (event.type) {
      case 'block:hit': {
        const block = this.blockCache.get(event.blockId);
        if (!block) return;
        const color = BLOCK_TYPES[block.type].color;
        this.effects.emitBurst(
          block.left + block.width / 2,
          block.top + block.height * 0.38,
          scaleFxCount(FX_COUNTS.blockHit, this.reducedMotion),
          color,
          {
            speed: 130,
            life: 340,
            size: 2.5,
            gravity: 170,
            altColor: 0xffffff,
            jitter: block.width * 0.22,
          },
        );
        return;
      }
      case 'block:destroyed': {
        const block = this.blockCache.get(event.blockId);
        if (!block) {
          this.shake(1.2, 90);
          return;
        }
        const color = BLOCK_TYPES[block.type].color;
        this.effects.emitBurst(
          block.left + block.width / 2,
          block.top + block.height / 2,
          scaleFxCount(FX_COUNTS.blockBreak, this.reducedMotion),
          color,
          {
            speed: 220,
            life: 640,
            size: 3.4,
            gravity: 260,
            drag: 1.1,
            altColor: 0xffffff,
            jitter: block.width * 0.3,
          },
        );
        this.effects.emitRing(
          block.left + block.width / 2,
          block.top + block.height / 2,
          block.width * 0.45,
          color,
          260,
          2,
        );
        this.shake(1.6, 100);
        return;
      }
      case 'paddle:hit': {
        this.paddlePulseMs = 170;
        const paddle = this.world.paddle;
        this.effects.emitBurst(
          paddle.x,
          paddle.y - paddle.height / 2,
          scaleFxCount(FX_COUNTS.paddleHit, this.reducedMotion),
          theme.accent,
          {
            speed: 150,
            angle: -Math.PI / 2,
            spread: Math.PI * 0.55,
            life: 330,
            size: 2.5,
            altColor: 0xffffff,
          },
        );
        return;
      }
      case 'ball:launched': {
        const ball = this.ballCache.get(event.ballId);
        if (!ball) return;
        this.effects.emitBurst(
          ball.x,
          ball.y,
          scaleFxCount(5, this.reducedMotion),
          theme.accent,
          { speed: 120, life: 300, size: 2.2, altColor: 0xffffff },
        );
        return;
      }
      case 'ball:lost': {
        const ball = this.ballCache.get(event.ballId);
        const x = ball?.x ?? this.world.paddle.x;
        const y = ball?.y ?? this.world.height;
        this.effects.emitBurst(
          x,
          y,
          scaleFxCount(FX_COUNTS.ballLost, this.reducedMotion),
          0xff6b6b,
          {
            speed: 180,
            angle: -Math.PI / 2,
            spread: Math.PI * 0.5,
            life: 520,
            size: 3,
            gravity: 120,
            altColor: 0x3a0b14,
          },
        );
        this.triggerFlash(0xff2f4f, 0.16, 240);
        this.shake(3, 180);
        return;
      }
      case 'laser:fired': {
        const muzzleX = event.x;
        const muzzleY = this.world.paddle.y - this.world.paddle.height / 2;
        this.effects.emitBurst(
          muzzleX,
          muzzleY,
          scaleFxCount(FX_COUNTS.laser, this.reducedMotion),
          this.theme.accent,
          {
            speed: 240,
            angle: -Math.PI / 2,
            spread: 0.5,
            life: 280,
            size: 2.6,
            altColor: 0xffffff,
            jitter: event.width * 0.4,
          },
        );
        this.triggerFlash(theme.accent, 0.08, 120);
        return;
      }
      case 'projectile:fired':
        return;
      case 'projectile:hit': {
        const block = this.blockCache.get(event.blockId);
        if (!block) return;
        this.effects.emitBurst(
          block.left + block.width / 2,
          block.top + block.height / 2,
          scaleFxCount(FX_COUNTS.projectileHit, this.reducedMotion),
          0xffd479,
          {
            speed: 160,
            life: 360,
            size: 2.6,
            gravity: 120,
            altColor: 0xfff2c4,
          },
        );
        return;
      }
      case 'explosion': {
        this.effects.emitBurst(
          event.x,
          event.y,
          scaleFxCount(FX_COUNTS.explosion, this.reducedMotion),
          0xffb347,
          {
            speed: 320,
            life: 760,
            size: 4,
            gravity: 120,
            drag: 1.6,
            altColor: 0xffe6a3,
            jitter: event.radius * 0.3,
          },
        );
        this.effects.emitRing(event.x, event.y, event.radius * 0.6, 0xffe6a3, 430, 4);
        this.triggerFlash(0xffb347, 0.1, 180);
        this.shake(5, 260);
        return;
      }
      case 'safety-net': {
        const ball = this.ballCache.get(event.ballId);
        const x = ball?.x ?? this.world.paddle.x;
        const y = ball?.y ?? this.world.paddle.y;
        this.effects.emitBurst(
          x,
          y,
          scaleFxCount(14, this.reducedMotion),
          0xffe08a,
          {
            speed: 200,
            life: 620,
            size: 3.2,
            gravity: -40,
            altColor: 0xffffff,
          },
        );
        this.effects.emitRing(x, y, 18, 0xffe08a, 480, 3);
        this.triggerFlash(0xffe08a, 0.12, 220);
        return;
      }
      case 'wave:cleared': {
        this.sweepMs = this.sweepDurationMs;
        this.effects.emitBurst(
          FIELD_WIDTH / 2,
          this.world.height * 0.42,
          scaleFxCount(FX_COUNTS.waveClear, this.reducedMotion),
          theme.accent,
          {
            speed: 210,
            life: 800,
            size: 3,
            gravity: 40,
            drag: 1,
            altColor: theme.moteAlt,
            jitter: FIELD_WIDTH * 0.3,
          },
        );
        this.triggerFlash(theme.accent, 0.09, 320);
        return;
      }
      case 'run:defeat': {
        this.triggerFlash(0x7a0f1e, 0.2, 420);
        this.shake(4, 300);
        this.effects.emitBurst(
          FIELD_WIDTH / 2,
          this.world.height * 0.72,
          scaleFxCount(18, this.reducedMotion),
          0xff4d5e,
          {
            speed: 170,
            life: 900,
            size: 3.4,
            gravity: 160,
            altColor: 0x2a0710,
            jitter: FIELD_WIDTH * 0.25,
          },
        );
        return;
      }
      case 'anti-stall':
        return;
    }
  }

  private triggerFlash(color: number, alpha: number, durationMs: number): void {
    this.flashColor = color;
    this.flashAlpha = alpha;
    this.flashMaxAlpha = alpha;
    this.flashMs = durationMs;
    this.flashDurationMs = Math.max(1, durationMs);
  }

  private shake(pixels: number, durationMs: number): void {
    if (this.reducedMotion) return;
    const camera = this.cameras.main;
    const width = Math.max(1, camera.width || FIELD_WIDTH);
    camera.shake(durationMs, pixels / width, true);
  }

  private updateTimers(dt: number): void {
    if (this.paddlePulseMs > 0) this.paddlePulseMs = Math.max(0, this.paddlePulseMs - dt);
    if (this.flashMs > 0) this.flashMs = Math.max(0, this.flashMs - dt);
    if (this.sweepMs > 0) this.sweepMs = Math.max(0, this.sweepMs - dt);
  }

  private updateTrails(dt: number): void {
    if (!this.world.isRunning || this.world.balls.length === 0) return;
    const interval = this.reducedMotion ? 90 : 32;
    const life = this.reducedMotion ? 110 : 180;
    this.trailTimer += dt;
    if (this.trailTimer < interval) return;
    this.trailTimer %= interval;
    for (const ball of this.world.balls) {
      this.effects.emitTrail(ball.x, ball.y, ball.radius * 0.85, this.theme.accent, life);
    }
  }

  // -------------------------------------------------------------------------
  // Backdrop
  // -------------------------------------------------------------------------

  private redrawBackdrop(): void {
    const graphics = this.backdrop;
    if (!graphics) return;
    const width = FIELD_WIDTH;
    const height = this.world.height;
    const theme = this.theme;

    graphics.clear();

    const split = Math.round(height * 0.58);
    graphics.fillGradientStyle(theme.skyTop, theme.skyTop, theme.skyMid, theme.skyMid, 1);
    graphics.fillRect(0, 0, width, split);
    graphics.fillGradientStyle(theme.skyMid, theme.skyMid, theme.skyBottom, theme.skyBottom, 1);
    graphics.fillRect(0, split - 1, width, height - split + 1);

    this.drawAmbientGlows(graphics, width, height);
    this.drawSilhouettes(graphics, width, height);

    // Faint lane guides behind the grid.
    graphics.lineStyle(1, theme.lane, 0.5);
    for (let row = 0; row < 3; row += 1) {
      const y = BLOCK_TOP + row * 100 + 100;
      if (y < height - 120) graphics.lineBetween(8, y, width - 8, y);
    }

    // Subtle side rails to anchor the field.
    graphics.fillStyle(theme.frame, 0.08);
    graphics.fillRect(0, 0, 10, height);
    graphics.fillRect(width - 10, 0, 10, height);
  }

  private drawAmbientGlows(
    graphics: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
  ): void {
    const theme = this.theme;
    const layers = 5;
    for (let index = 0; index < layers; index += 1) {
      const ratio = 1 - index * 0.16;
      graphics.fillStyle(theme.glow, 0.018 + index * 0.005);
      graphics.fillCircle(width / 2, height * 0.32, width * 0.68 * ratio);
    }
    graphics.fillStyle(theme.glowDeep, 0.32);
    graphics.fillCircle(width / 2, height * 0.96, width * 0.72);
    graphics.fillStyle(theme.glow, 0.05);
    graphics.fillCircle(width / 2, height * 0.98, width * 0.42);
  }

  private drawSilhouettes(
    graphics: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
  ): void {
    const theme = this.theme;
    if (theme.shape === 'crystal') {
      this.drawCrystalSilhouettes(graphics, width, height);
    } else if (theme.shape === 'ruins') {
      this.drawRuinsSilhouettes(graphics, width, height);
    } else {
      this.drawArcaneSilhouettes(graphics, width, height);
    }
  }

  private drawCrystalSilhouettes(
    graphics: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
  ): void {
    const theme = this.theme;
    const horizon = height * 0.66;

    // Far crystal ridge.
    graphics.fillStyle(theme.silhouetteFar, 0.9);
    let x = -40;
    const peaks = [0.3, 0.5, 0.36, 0.58, 0.4, 0.52, 0.32];
    for (const peak of peaks) {
      const peakX = x + width * 0.09;
      const peakY = horizon - height * peak * 0.32;
      graphics.fillTriangle(x, horizon, peakX, peakY, peakX + width * 0.13, horizon);
      x += width * 0.15;
    }
    graphics.fillRect(0, horizon, width, height - horizon);

    // Side spires.
    graphics.fillStyle(theme.silhouetteNear, 1);
    graphics.fillTriangle(-30, height, width * 0.16, height * 0.34, width * 0.25, height);
    graphics.fillTriangle(width * 0.02, height, width * 0.1, height * 0.48, width * 0.16, height);
    graphics.fillTriangle(width + 30, height, width * 0.86, height * 0.3, width * 0.76, height);
    graphics.fillTriangle(width * 0.96, height, width * 0.9, height * 0.45, width * 0.84, height);

    // Glowing crystal veins on the near spires.
    graphics.lineStyle(2, theme.accent, 0.16);
    graphics.lineBetween(width * 0.16, height * 0.36, width * 0.21, height * 0.78);
    graphics.lineBetween(width * 0.86, height * 0.32, width * 0.83, height * 0.82);

    // Moss clumps at the bottom corners.
    graphics.fillStyle(theme.silhouetteNear, 1);
    for (let index = 0; index < 8; index += 1) {
      const clumpX = index % 2 === 0 ? index * width * 0.05 : width - index * width * 0.05;
      graphics.fillCircle(clumpX, height - 6, 10 + (index % 3) * 5);
    }
  }

  private drawRuinsSilhouettes(
    graphics: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
  ): void {
    const theme = this.theme;
    // Distant broken wall and arches.
    graphics.fillStyle(theme.silhouetteFar, 0.85);
    graphics.fillRect(width * 0.04, height * 0.4, width * 0.18, height * 0.6);
    graphics.fillRect(width * 0.78, height * 0.36, width * 0.18, height * 0.64);
    graphics.fillTriangle(width * 0.04, height * 0.4, width * 0.13, height * 0.3, width * 0.22, height * 0.4);
    graphics.fillTriangle(width * 0.78, height * 0.36, width * 0.87, height * 0.27, width * 0.96, height * 0.36);

    // Arched openings punched out of the far wall.
    graphics.fillStyle(theme.skyTop, 0.7);
    for (let index = 0; index < 3; index += 1) {
      const archX = width * 0.08 + index * width * 0.05;
      graphics.fillRect(archX, height * 0.58, width * 0.028, height * 0.2);
      graphics.fillCircle(archX + width * 0.014, height * 0.58, width * 0.014);
    }
    for (let index = 0; index < 3; index += 1) {
      const archX = width * 0.81 + index * width * 0.05;
      graphics.fillRect(archX, height * 0.56, width * 0.028, height * 0.22);
      graphics.fillCircle(archX + width * 0.014, height * 0.56, width * 0.014);
    }

    // Foreground columns.
    graphics.fillStyle(theme.silhouetteNear, 1);
    const drawColumn = (baseX: number, baseY: number, columnWidth: number, columnHeight: number): void => {
      graphics.fillRect(baseX, baseY - columnHeight, columnWidth, columnHeight);
      graphics.fillRect(baseX - columnWidth * 0.2, baseY - columnHeight, columnWidth * 1.4, columnWidth * 0.5);
      graphics.fillRect(baseX - columnWidth * 0.15, baseY - columnWidth * 0.5, columnWidth * 1.3, columnWidth * 0.5);
      // Broken top notch.
      graphics.fillStyle(theme.skyTop, 0.5);
      graphics.fillTriangle(baseX, baseY - columnHeight, baseX + columnWidth * 0.7, baseY - columnHeight, baseX, baseY - columnHeight * 0.88);
      graphics.fillStyle(theme.silhouetteNear, 1);
    };
    drawColumn(-14, height, 54, height * 0.74);
    drawColumn(width - 42, height, 58, height * 0.68);
    drawColumn(width * 0.12, height, 34, height * 0.3);

    // Rubble along the floor.
    graphics.fillTriangle(0, height, width * 0.3, height, width * 0.2, height - 26);
    graphics.fillTriangle(width, height, width * 0.66, height, width * 0.78, height - 22);
    graphics.fillStyle(theme.silhouetteFar, 1);
    for (let index = 0; index < 7; index += 1) {
      const rubbleX = width * 0.05 + index * width * 0.14;
      graphics.fillRect(rubbleX, height - 10 - (index % 3) * 4, 16 + (index % 4) * 6, 8);
    }
  }

  private drawArcaneSilhouettes(
    graphics: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
  ): void {
    const theme = this.theme;
    const centreX = width / 2;
    const centreY = height * 0.46;

    // Giant background sigils.
    graphics.lineStyle(2, theme.silhouetteFar, 0.9);
    for (let index = 0; index < 4; index += 1) {
      graphics.strokeCircle(centreX, centreY, width * (0.3 + index * 0.11));
    }
    graphics.lineStyle(1, theme.accent, 0.07);
    for (let index = 0; index < 12; index += 1) {
      const angle = (index / 12) * Math.PI * 2;
      graphics.lineBetween(
        centreX + Math.cos(angle) * width * 0.3,
        centreY + Math.sin(angle) * width * 0.3,
        centreX + Math.cos(angle) * width * 0.7,
        centreY + Math.sin(angle) * width * 0.7,
      );
    }

    // Obelisks framing the field.
    graphics.fillStyle(theme.silhouetteNear, 1);
    graphics.fillTriangle(-20, height, width * 0.14, height * 0.26, width * 0.23, height);
    graphics.fillTriangle(width + 20, height, width * 0.86, height * 0.22, width * 0.77, height);
    graphics.fillRect(width * 0.08, height * 0.52, width * 0.06, height * 0.48);
    graphics.fillRect(width * 0.86, height * 0.48, width * 0.06, height * 0.52);

    // Floating shards.
    graphics.fillStyle(theme.silhouetteFar, 1);
    for (let index = 0; index < 5; index += 1) {
      const shardX = width * (0.18 + index * 0.16);
      const shardY = height * (0.2 + ((index * 37) % 60) / 100);
      const size = 10 + (index % 3) * 8;
      graphics.fillTriangle(shardX, shardY - size, shardX + size * 0.6, shardY + size * 0.4, shardX - size * 0.6, shardY + size * 0.4);
    }

    // Rune ticks along the floor.
    graphics.lineStyle(2, theme.accent, 0.12);
    for (let index = 0; index < 9; index += 1) {
      const runeX = width * (0.08 + index * 0.11);
      graphics.lineBetween(runeX - 6, height - 8, runeX + 6, height - 20);
      graphics.lineBetween(runeX + 6, height - 20, runeX - 2, height - 30);
    }
  }

  private rebuildMotes(): void {
    const count = this.reducedMotion ? 14 : 28;
    this.motes.length = 0;
    for (let index = 0; index < count; index += 1) {
      this.motes.push({
        nx: Math.random(),
        ny: Math.random(),
        speed: 0.004 + Math.random() * 0.012,
        drift: Math.random() * Math.PI * 2,
        phase: Math.random() * Math.PI * 2,
        size: Math.random() < 0.72 ? 2 : 3,
        alt: Math.random() < 0.3,
        alpha: 0.2 + Math.random() * 0.5,
      });
    }
  }

  private drawMotes(time: number, dt: number): void {
    const graphics = this.motesGraphics;
    if (!graphics) return;
    graphics.clear();
    const width = FIELD_WIDTH;
    const height = this.world.height;
    const theme = this.theme;
    const parallax = this.reducedMotion
      ? 0
      : (this.world.paddle.x / width - 0.5) * 14;

    for (const mote of this.motes) {
      if (!this.reducedMotion) {
        mote.ny -= mote.speed * (dt / 16.67);
        if (mote.ny < -0.02) mote.ny += 1.04;
      }
      const sway = this.reducedMotion ? 0 : Math.sin(time * 0.0006 + mote.drift) * 8;
      const x = mote.nx * width + parallax + sway;
      const y = mote.ny * height;
      const color = mote.alt ? theme.moteAlt : theme.mote;
      graphics.fillStyle(color, mote.alpha);
      if (mote.size >= 3) {
        graphics.fillRect(x - 1, y, 3, 1);
        graphics.fillRect(x, y - 1, 1, 3);
      } else {
        graphics.fillRect(x, y, mote.size, mote.size);
      }
    }
  }

  private rebuildVignette(): void {
    const width = FIELD_WIDTH;
    const height = this.world.height;
    this.vignette?.destroy();
    this.vignette = undefined;
    if (this.textures.exists(VIGNETTE_KEY)) this.textures.remove(VIGNETTE_KEY);

    try {
      const texture = this.textures.createCanvas(VIGNETTE_KEY, width, height);
      if (!texture) return;
      const context = texture.getContext();
      const gradient = context.createRadialGradient(
        width / 2,
        height * 0.44,
        Math.min(width, height) * 0.18,
        width / 2,
        height * 0.5,
        Math.max(width, height) * 0.64,
      );
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(0.62, 'rgba(2,3,8,0.10)');
      gradient.addColorStop(0.86, 'rgba(2,3,8,0.34)');
      gradient.addColorStop(1, 'rgba(2,3,8,0.62)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
      texture.refresh();
      this.vignette = this.add.image(0, 0, VIGNETTE_KEY).setOrigin(0, 0).setDepth(-32);
    } catch (error) {
      console.warn('[render] could not build vignette texture', error);
    }
  }

  private drawFrame(): void {
    const graphics = this.frameGraphics;
    if (!graphics) return;
    const width = FIELD_WIDTH;
    const height = this.world.height;
    const theme = this.theme;
    graphics.clear();

    graphics.lineStyle(2, theme.frame, 0.9);
    graphics.lineBetween(1, 0, 1, height);
    graphics.lineBetween(width - 1, 0, width - 1, height);
    graphics.lineBetween(0, 1, width, 1);

    graphics.lineStyle(1, theme.frameBright, 0.16);
    graphics.lineBetween(7, 0, 7, height);
    graphics.lineBetween(width - 7, 0, width - 7, height);
    graphics.lineBetween(0, 6, width, 6);

    // Corner brackets.
    const corner = 34;
    graphics.lineStyle(3, theme.frameBright, 0.45);
    graphics.lineBetween(3, 3, corner, 3);
    graphics.lineBetween(3, 3, 3, corner);
    graphics.lineBetween(width - 3, 3, width - corner, 3);
    graphics.lineBetween(width - 3, 3, width - 3, corner);
    graphics.lineBetween(3, height - 3, corner, height - 3);
    graphics.lineBetween(3, height - 3, 3, height - corner);
    graphics.lineBetween(width - 3, height - 3, width - corner, height - 3);
    graphics.lineBetween(width - 3, height - 3, width - 3, height - corner);

    // Top field sigil.
    graphics.fillStyle(theme.frameBright, 0.28);
    graphics.fillTriangle(width / 2, 10, width / 2 + 7, 19, width / 2 - 7, 19);

    // Faint launch guide above the paddle.
    const guideY = this.world.paddle.y + this.world.paddle.height / 2 + 40;
    graphics.lineStyle(1, theme.accent, 0.1);
    graphics.lineBetween(12, guideY, width - 12, guideY);
  }

  // -------------------------------------------------------------------------
  // World drawing
  // -------------------------------------------------------------------------

  private drawWorld(time: number): void {
    this.drawBlocks();
    this.drawTrajectory();
    this.drawEntities(time);
  }

  /** Foresight: a short, fading dotted preview ahead of every live ball. */
  private drawTrajectory(): void {
    const graphics = this.trajectoryGraphics;
    if (!graphics) return;
    graphics.clear();
    const world = this.world;
    if (!world.isRunning) return;

    const modifiers = world.modifiers;
    if (!modifiers.trajectoryGuide) return;

    const lookAheadMs = GAME_CONFIG.perks.foresightLookAheadMs;
    const color = this.theme.accent;
    for (const ball of world.balls) {
      if (ball.stuck) continue;
      const points = predictBallPath(
        ball,
        FIELD_WIDTH,
        world.height,
        lookAheadMs,
        TRAJECTORY_STEPS,
        this.trajectoryPoints,
      );
      const last = Math.max(1, points.length - 1);
      for (let index = 0; index < points.length; index += 1) {
        const point = points[index]!;
        const t = index / last;
        graphics.fillStyle(color, 0.35 - t * 0.3);
        graphics.fillCircle(point.x, point.y, 2.1 - t * 0.9);
      }
    }
  }

  private drawBlocks(): void {
    const graphics = this.fieldGraphics;
    if (!graphics || !this.blockDirty) return;
    graphics.clear();
    for (const block of this.world.blocks) {
      drawBlock(graphics, block);
    }
    this.blockDirty = false;
  }

  private drawEntities(time: number): void {
    const graphics = this.entityGraphics;
    if (!graphics) return;
    graphics.clear();
    const world = this.world;
    if (!world.isRunning) return;

    const paddle = world.paddle;
    const paddleLeft = paddle.x - paddle.width / 2;
    const paddleTop = paddle.y - paddle.height / 2;
    const pulse = this.paddlePulseMs / 170;

    // Pulse halo.
    if (pulse > 0) {
      graphics.fillStyle(this.theme.accent, 0.08 + pulse * 0.14);
      graphics.fillRoundedRect(
        paddleLeft - 5 - pulse * 4,
        paddleTop - 5 - pulse * 3,
        paddle.width + 10 + pulse * 8,
        paddle.height + 10 + pulse * 6,
        10,
      );
    }

    // Paddle shadow / metal body / crystal core.
    graphics.fillStyle(0x02040a, 0.6);
    graphics.fillRoundedRect(paddleLeft + 2, paddleTop + 4, paddle.width, paddle.height, 8);
    graphics.fillStyle(0x0a1a2c, 0.98);
    graphics.fillRoundedRect(paddleLeft - 3, paddleTop - 2, paddle.width + 6, paddle.height + 4, 9);
    graphics.fillStyle(this.theme.frame, 0.95);
    graphics.fillRoundedRect(paddleLeft, paddleTop, paddle.width, paddle.height, 7);
    graphics.fillStyle(this.theme.accentSoft, 0.9);
    graphics.fillRoundedRect(paddleLeft + 4, paddleTop + 2, paddle.width - 8, 5, 3);
    graphics.fillStyle(0xffffff, 0.5 + pulse * 0.4);
    graphics.fillRect(paddleLeft + 8, paddleTop + 3, paddle.width - 16, 2);
    graphics.fillStyle(0x2f6f9a, 0.9);
    graphics.fillRect(paddle.x - 1, paddleTop + 6, 2, paddle.height - 9);
    // Crystal caps and centre gem.
    graphics.fillStyle(this.theme.accent, 0.95);
    graphics.fillTriangle(paddleLeft + 5, paddleTop + 5, paddleLeft + 13, paddleTop + 5, paddleLeft + 9, paddleTop + paddle.height - 4);
    graphics.fillTriangle(paddleLeft + paddle.width - 5, paddleTop + 5, paddleLeft + paddle.width - 13, paddleTop + 5, paddleLeft + paddle.width - 9, paddleTop + paddle.height - 4);
    graphics.fillStyle(0xffffff, 0.9);
    graphics.fillTriangle(paddle.x, paddleTop + 3, paddle.x + 5, paddle.y, paddle.x - 5, paddle.y);

    // Prism Laser beam.
    const beam = world.laserBeam;
    if (beam) {
      const alpha = Math.max(0, beam.remainingMs / beam.durationMs);
      const flicker = 0.85 + Math.sin(time * 0.05) * 0.15;
      graphics.fillStyle(0xffe08a, 0.14 * alpha * flicker);
      graphics.fillRect(beam.x - beam.width / 2 - 9, 0, beam.width + 18, paddleTop);
      graphics.fillStyle(0xfff2c4, 0.75 * alpha * flicker);
      graphics.fillRect(beam.x - beam.width / 2, 0, beam.width, paddleTop);
      graphics.fillStyle(0xffffff, 0.95 * alpha);
      graphics.fillRect(beam.x - 2, 0, 4, paddleTop);
      // Muzzle flare at the paddle.
      graphics.fillStyle(0xffffff, 0.55 * alpha);
      graphics.fillCircle(beam.x, paddleTop, 9 + 4 * flicker);
    }

    // Projectiles with a short trail.
    for (const projectile of world.projectiles) {
      const trail = 0.028;
      graphics.lineStyle(3, 0xffd479, 0.35);
      graphics.lineBetween(
        projectile.x - projectile.vx * trail,
        projectile.y - projectile.vy * trail,
        projectile.x,
        projectile.y,
      );
      graphics.fillStyle(0xffd479, 0.24);
      graphics.fillCircle(projectile.x, projectile.y, projectile.radius * 2.2);
      graphics.fillStyle(0xfff2c4, 1);
      graphics.fillRoundedRect(
        projectile.x - projectile.radius / 2,
        projectile.y - projectile.radius * 1.8,
        Math.max(2, projectile.radius),
        projectile.radius * 3.6,
        2,
      );
    }

    // Explosive Core blasts (world-owned transient state).
    for (const fx of world.explosions) {
      const progress = 1 - fx.remainingMs / fx.durationMs;
      const alpha = Math.max(0, 1 - progress);
      graphics.fillStyle(0xffb347, 0.28 * alpha);
      graphics.fillCircle(fx.x, fx.y, fx.radius * (0.45 + progress * 0.75));
      graphics.lineStyle(3, 0xffe6a3, 0.8 * alpha);
      graphics.strokeCircle(fx.x, fx.y, fx.radius * (0.55 + progress * 0.9));
    }

    // Balls.
    for (const ball of world.balls) {
      const blink = ball.spawnGraceMs > 0 && Math.floor(time / 60) % 2 === 0;
      graphics.fillStyle(this.theme.accent, 0.16);
      graphics.fillCircle(ball.x, ball.y, ball.radius * 2.1);
      graphics.fillStyle(this.theme.accent, 0.32);
      graphics.fillCircle(ball.x, ball.y, ball.radius * 1.35);
      graphics.fillStyle(0xffffff, blink ? 0.6 : 1);
      graphics.fillCircle(ball.x, ball.y, ball.radius);
      graphics.fillStyle(0x9fdcff, 0.95);
      graphics.fillCircle(ball.x - ball.radius * 0.28, ball.y - ball.radius * 0.3, ball.radius * 0.42);

      if (ball.stuck && ball.sticky) {
        const stickyPulse = 0.55 + 0.35 * Math.sin(world.timeMs / 90);
        graphics.lineStyle(2, 0xffc46b, stickyPulse);
        graphics.strokeCircle(ball.x, ball.y, ball.radius + 5);
        graphics.lineStyle(2, 0xffc46b, 0.35);
        graphics.lineBetween(ball.x, ball.y + ball.radius, ball.x, paddle.y);
      }
    }
  }

  private drawOverlay(): void {
    const graphics = this.overlayGraphics;
    if (!graphics) return;
    graphics.clear();

    // Impact / loss / defeat flashes.
    if (this.flashMs > 0 && this.flashMaxAlpha > 0) {
      const ratio = this.flashMs / this.flashDurationMs;
      graphics.fillStyle(this.flashColor, this.flashAlpha * ratio);
      graphics.fillRect(0, 0, FIELD_WIDTH, this.world.height);
    }

    // Wave-clear sweep: a short horizontal band travelling down the field.
    if (this.sweepMs > 0) {
      const progress = 1 - this.sweepMs / this.sweepDurationMs;
      const y = progress * this.world.height;
      const theme = this.theme;
      graphics.fillStyle(theme.accent, 0.06);
      graphics.fillRect(0, y - 34, FIELD_WIDTH, 68);
      graphics.fillStyle(theme.accent, 0.25);
      graphics.fillRect(0, y - 2, FIELD_WIDTH, 4);
      graphics.fillStyle(theme.moteAlt, 0.7);
      graphics.fillRect(0, y, FIELD_WIDTH, 1.5);
      graphics.fillStyle(theme.accent, 0.5);
      graphics.fillRect(0, y - 1, 10, 3);
      graphics.fillRect(FIELD_WIDTH - 10, y - 1, 10, 3);
    }
  }

  private drawEffects(): void {
    const graphics = this.effectsGraphics;
    if (!graphics) return;
    graphics.clear();
    this.effects.draw(graphics);
  }
}
