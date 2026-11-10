import type Phaser from 'phaser';
import { FIELD_WIDTH } from '../sim/World';
import { PHASE_THEMES } from './themes';

interface MenuBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: number;
  phase: number;
  trail: { x: number; y: number }[];
}

interface MenuSpark {
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
}

const MENU_PALETTE = [0x7ef9ff, 0xb388ff, 0xff5fd2, 0xffd479, 0x9dfff2] as const;
const TRAIL_LENGTH = 9;

/**
 * Decorative attract-mode background for the title screen.
 *
 * It deliberately draws no blocks from the campaign: a handful of glowing
 * balls bounce across a dark field with short trails, plus a few drifting
 * sparks. Presentation only; gameplay never touches this state.
 */
export class MenuBackdrop {
  private readonly balls: MenuBall[] = [];
  private readonly sparks: MenuSpark[] = [];
  private width: number = FIELD_WIDTH;
  private height = 1280;
  private reducedMotion = false;
  private lastTime = 0;
  private sparkTimer = 0;

  reset(width: number, height: number, reducedMotion: boolean): void {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.reducedMotion = reducedMotion;
    this.balls.length = 0;
    this.sparks.length = 0;
    this.lastTime = 0;
    this.sparkTimer = 0;

    const count = reducedMotion ? 3 : 5;
    for (let index = 0; index < count; index += 1) {
      const radius = 9 + (index % 3) * 2;
      this.balls.push({
        x: this.width * (0.16 + index * 0.17),
        y: this.height * (0.18 + ((index * 0.21) % 0.56)),
        vx: (index % 2 === 0 ? 1 : -1) * (36 + index * 7),
        vy: (index % 3 === 0 ? 1 : -1) * (28 + index * 5),
        radius,
        color: MENU_PALETTE[index % MENU_PALETTE.length]!,
        phase: index * 1.7,
        trail: [],
      });
    }
  }

  update(timeMs: number, deltaMs: number): void {
    const dt = Math.min(50, Math.max(0, deltaMs)) / 1000;
    if (dt <= 0) return;
    this.lastTime = timeMs;

    const top = this.height * 0.1;
    const bottom = this.height * 0.8;
    const left = this.width * 0.06;
    const right = this.width * 0.94;

    for (const ball of this.balls) {
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      if (ball.x - ball.radius < left) {
        ball.x = left + ball.radius;
        ball.vx = Math.abs(ball.vx);
      } else if (ball.x + ball.radius > right) {
        ball.x = right - ball.radius;
        ball.vx = -Math.abs(ball.vx);
      }
      if (ball.y - ball.radius < top) {
        ball.y = top + ball.radius;
        ball.vy = Math.abs(ball.vy);
      } else if (ball.y + ball.radius > bottom) {
        ball.y = bottom - ball.radius;
        ball.vy = -Math.abs(ball.vy);
      }

      if (this.reducedMotion) continue;
      ball.trail.unshift({ x: ball.x, y: ball.y });
      if (ball.trail.length > TRAIL_LENGTH) ball.trail.pop();
    }

    if (this.reducedMotion) {
      this.sparks.length = 0;
      return;
    }

    this.sparkTimer += deltaMs;
    const interval = 220;
    while (this.sparkTimer >= interval) {
      this.sparkTimer -= interval;
      if (this.sparks.length >= 12) continue;
      this.sparks.push({
        x: this.width * (0.08 + Math.random() * 0.84),
        y: this.height * (0.86 + Math.random() * 0.1),
        vy: -(8 + Math.random() * 16),
        life: 0,
        maxLife: 1600 + Math.random() * 1400,
        size: 1 + Math.floor(Math.random() * 2),
        color: MENU_PALETTE[Math.floor(Math.random() * MENU_PALETTE.length)]!,
      });
    }

    for (let index = this.sparks.length - 1; index >= 0; index -= 1) {
      const spark = this.sparks[index]!;
      spark.life += deltaMs;
      spark.y += (spark.vy * deltaMs) / 1000;
      if (spark.life >= spark.maxLife) this.sparks.splice(index, 1);
    }
  }

  draw(graphics: Phaser.GameObjects.Graphics): void {
    graphics.clear();

    // Faint diagonal light shafts keep the field from feeling empty.
    graphics.fillStyle(0x7ef9ff, 0.018);
    graphics.fillTriangle(
      this.width * 0.1,
      0,
      this.width * 0.36,
      0,
      this.width * 0.02,
      this.height,
    );
    graphics.fillStyle(0xb388ff, 0.016);
    graphics.fillTriangle(
      this.width * 0.72,
      0,
      this.width * 0.9,
      0,
      this.width * 0.98,
      this.height,
    );

    // Floor glow, echoing the playfield without drawing a paddle.
    for (let index = 0; index < 4; index += 1) {
      graphics.fillStyle(0x2fe6c8, 0.012 + index * 0.005);
      graphics.fillEllipse(
        this.width / 2,
        this.height * 0.84,
        this.width * (0.8 - index * 0.14),
        42 - index * 6,
      );
    }

    for (const spark of this.sparks) {
      const fade = 1 - spark.life / spark.maxLife;
      graphics.fillStyle(spark.color, 0.18 * fade);
      graphics.fillRect(Math.round(spark.x), Math.round(spark.y), spark.size, spark.size);
    }

    for (const ball of this.balls) {
      const pulse = 0.5 + Math.sin(this.lastTime * 0.002 + ball.phase) * 0.5;

      if (!this.reducedMotion) {
        for (let index = ball.trail.length - 1; index >= 0; index -= 1) {
          const point = ball.trail[index]!;
          const fade = 1 - index / ball.trail.length;
          graphics.fillStyle(ball.color, 0.06 + fade * 0.12);
          graphics.fillCircle(point.x, point.y, Math.max(1, ball.radius * fade * 0.7));
        }
      }

      graphics.fillStyle(ball.color, 0.05 + pulse * 0.03);
      graphics.fillCircle(ball.x, ball.y, ball.radius * 3.4);
      graphics.fillStyle(ball.color, 0.12);
      graphics.fillCircle(ball.x, ball.y, ball.radius * 2);
      graphics.fillStyle(ball.color, 0.85);
      graphics.fillCircle(ball.x, ball.y, ball.radius * 0.74);
      graphics.fillStyle(0xffffff, 0.9);
      graphics.fillCircle(ball.x - ball.radius * 0.22, ball.y - ball.radius * 0.24, Math.max(1.4, ball.radius * 0.22));

      const ringRadius = ball.radius * (1.15 + pulse * 0.18);
      graphics.lineStyle(1, ball.color, 0.18 + pulse * 0.12);
      graphics.strokeCircle(ball.x, ball.y, ringRadius);
    }

    // A single large, slow-breathing diamond sigil behind the title area.
    const accent = PHASE_THEMES[0]!;
    const cx = this.width / 2;
    const cy = this.height * 0.33;
    const breath = 1 + Math.sin(this.lastTime * 0.0006) * 0.04;
    const spanX = 128 * breath;
    const spanY = 168 * breath;
    graphics.lineStyle(1, accent.accent, 0.07);
    graphics.strokePoints(
      [
        { x: cx, y: cy - spanY },
        { x: cx + spanX, y: cy },
        { x: cx, y: cy + spanY },
        { x: cx - spanX, y: cy },
      ],
      true,
    );
    graphics.lineStyle(1, accent.glow, 0.05);
    graphics.strokeCircle(cx, cy, 92 * breath);
  }
}
