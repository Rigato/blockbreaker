import type Phaser from 'phaser';
import type { Boss, BossShard } from '../sim/World';
import { blend } from './blockArt';

/**
 * Procedural boss silhouettes.
 *
 * Each pattern owns a clearly different outline and elemental palette:
 * a jagged ice citadel (sentinel), a plated furnace (warden) and a ringed
 * void mass (void). Bosses are large landmarks, so the art relies on broad
 * shapes plus a bright core rather than fine detail.
 */

export interface BossDrawOptions {
  /** Phase accent, used for rim light and aura. */
  accent?: number;
  /** World time in ms for cheap pulsing; no randomness. */
  timeMs?: number;
  reducedMotion?: boolean;
}

export interface BossShardDrawOptions {
  /** Boss pattern, so shards match their source. */
  pattern?: Boss['pattern'];
  accent?: number;
  timeMs?: number;
}

/** Signature colour for a boss pattern. */
export function bossColor(pattern: Boss['pattern']): number {
  switch (pattern) {
    case 'sentinel':
      return 0x7fd8ff;
    case 'warden':
      return 0xff8a3d;
    case 'void':
      return 0xb388ff;
  }
}

/** Damage-tinted body colour used by the hurt blink. */
export function bossHurtColor(pattern: Boss['pattern'], amount: number): number {
  const base = bossColor(pattern);
  return blend(base, 0xffffff, Math.max(0, Math.min(1, amount)));
}

function aura(
  graphics: Phaser.GameObjects.Graphics,
  boss: Boss,
  color: number,
  timeMs: number,
  reducedMotion: boolean,
): void {
  const centreX = boss.x;
  const centreY = boss.y + boss.height / 2;
  const radius = Math.max(boss.width, boss.height) * 0.72;
  const pulse = reducedMotion ? 0.5 : 0.5 + Math.sin(timeMs / 420) * 0.5;
  const phaseBoost = 0.5 + boss.phase * 0.17;

  graphics.fillStyle(color, 0.05 * phaseBoost);
  graphics.fillCircle(centreX, centreY, radius * (1.02 + pulse * 0.05));
  graphics.fillStyle(color, 0.08 * phaseBoost);
  graphics.fillCircle(centreX, centreY, radius * 0.78);
  graphics.fillStyle(color, 0.1 * phaseBoost);
  graphics.fillCircle(centreX, centreY, radius * 0.52);

  // Rising embers / motes so the boss reads as alive without particles.
  graphics.fillStyle(blend(color, 0xffffff, 0.55), 0.35);
  for (let index = 0; index < 5; index += 1) {
    const t = (timeMs / 1400 + index / 5) % 1;
    const x = boss.x + (index - 2) * boss.width * 0.16;
    const y = boss.y + boss.height * (1.05 - t * 0.9);
    graphics.fillRect(Math.round(x), Math.round(y), 2, 2);
  }
}

export function drawBoss(
  graphics: Phaser.GameObjects.Graphics,
  boss: Boss,
  options: BossDrawOptions = {},
): void {
  if (boss.hp <= 0) return;
  const accent = options.accent ?? 0xffffff;
  const timeMs = options.timeMs ?? 0;
  const reducedMotion = options.reducedMotion ?? false;
  const color = bossColor(boss.pattern);

  const hurt = boss.hurtMs > 0;
  const hurtRatio = hurt ? Math.min(1, boss.hurtMs / 120) : 0;
  const blinkOn = !hurt || Math.floor(timeMs / 50) % 2 === 0;

  aura(graphics, boss, blend(color, accent, 0.2), timeMs, reducedMotion);

  if (boss.pattern === 'sentinel') {
    drawSentinel(graphics, boss, color, accent, timeMs);
  } else if (boss.pattern === 'warden') {
    drawWarden(graphics, boss, color, accent, timeMs);
  } else {
    drawVoid(graphics, boss, color, accent, timeMs, reducedMotion);
  }

  // Hurt feedback: the whole body blinks toward white.
  if (hurt && blinkOn) {
    const flashX = boss.x;
    const flashY = boss.y + boss.height * 0.55;
    graphics.fillStyle(0xffffff, 0.12 + hurtRatio * 0.26);
    graphics.fillEllipse(flashX, flashY, boss.width * 0.86, boss.height * 0.78);
    graphics.lineStyle(2, 0xffffff, 0.45 + hurtRatio * 0.3);
    graphics.strokeEllipse(flashX, flashY, boss.width * 0.86, boss.height * 0.78);
  }

  // Phase fissures: more damage = more visible cracks.
  if (boss.phase >= 2) {
    graphics.lineStyle(1, 0x02030a, 0.7);
    const cracks = boss.phase === 2 ? 2 : 4;
    for (let index = 0; index < cracks; index += 1) {
      const startX = boss.x - boss.width * 0.32 + index * boss.width * 0.2;
      const startY = boss.y + boss.height * 0.28 + (index % 2) * boss.height * 0.18;
      graphics.lineBetween(
        Math.round(startX),
        Math.round(startY),
        Math.round(startX + boss.width * 0.09),
        Math.round(startY + boss.height * 0.14),
      );
      graphics.lineBetween(
        Math.round(startX + boss.width * 0.09),
        Math.round(startY + boss.height * 0.14),
        Math.round(startX + boss.width * 0.04),
        Math.round(startY + boss.height * 0.26),
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Sentinel — frost citadel with crystal crests and a single blue eye.
// ---------------------------------------------------------------------------

function drawSentinel(
  graphics: Phaser.GameObjects.Graphics,
  boss: Boss,
  color: number,
  accent: number,
  timeMs: number,
): void {
  const left = boss.x - boss.width / 2;
  const top = boss.y;
  const width = boss.width;
  const height = boss.height;
  const centreX = boss.x;
  const bottom = top + height;
  const dark = blend(color, 0x020a14, 0.66);
  const light = blend(color, 0xffffff, 0.5);

  // Frozen plinth.
  graphics.fillStyle(0x020a14, 0.95);
  graphics.fillRect(left + width * 0.04, bottom - height * 0.16, width * 0.92, height * 0.16);
  graphics.fillStyle(dark, 1);
  graphics.fillRect(left + width * 0.06, bottom - height * 0.19, width * 0.88, height * 0.16);
  graphics.fillStyle(light, 0.25);
  graphics.fillRect(left + width * 0.06, bottom - height * 0.19, width * 0.88, 2);

  // Main keep: stepped ice body.
  graphics.fillStyle(0x020a14, 0.98);
  graphics.fillTriangle(left + width * 0.1, bottom - height * 0.15, centreX, top + height * 0.06, left + width * 0.9, bottom - height * 0.15);
  graphics.fillRect(left + width * 0.16, top + height * 0.34, width * 0.68, height * 0.5);
  graphics.fillStyle(blend(color, 0x0a2a44, 0.55), 1);
  graphics.fillTriangle(left + width * 0.13, bottom - height * 0.17, centreX, top + height * 0.1, left + width * 0.87, bottom - height * 0.17);
  graphics.fillRect(left + width * 0.19, top + height * 0.36, width * 0.62, height * 0.45);

  // Flank spires.
  graphics.fillStyle(dark, 1);
  graphics.fillTriangle(left + width * 0.02, bottom - height * 0.1, left + width * 0.14, top + height * 0.2, left + width * 0.27, bottom - height * 0.1);
  graphics.fillTriangle(left + width * 0.73, bottom - height * 0.1, left + width * 0.86, top + height * 0.16, left + width * 0.98, bottom - height * 0.1);
  graphics.fillStyle(light, 0.28);
  graphics.fillTriangle(left + width * 0.08, bottom - height * 0.12, left + width * 0.14, top + height * 0.26, left + width * 0.17, bottom - height * 0.12);
  graphics.fillTriangle(left + width * 0.8, bottom - height * 0.12, left + width * 0.86, top + height * 0.22, left + width * 0.89, bottom - height * 0.12);

  // Crystal crests on the crown.
  const crestPulse = 0.75 + Math.sin(timeMs / 360) * 0.25;
  graphics.fillStyle(blend(light, 0xffffff, 0.2), 0.55 + crestPulse * 0.3);
  for (let index = 0; index < 4; index += 1) {
    const cx = left + width * (0.28 + index * 0.15);
    const spike = height * (0.12 + (index % 2) * 0.06);
    graphics.fillTriangle(cx - width * 0.045, top + height * 0.34, cx, top + height * 0.3 - spike, cx + width * 0.045, top + height * 0.34);
    graphics.fillStyle(blend(color, 0xffffff, 0.25), 0.8);
  }

  // Frost rim along the keep edges.
  graphics.lineStyle(2, blend(accent, 0xffffff, 0.35), 0.5);
  graphics.lineBetween(left + width * 0.16, top + height * 0.4, centreX, top + height * 0.12);
  graphics.lineBetween(centreX, top + height * 0.12, left + width * 0.84, top + height * 0.4);
  graphics.lineStyle(1, light, 0.3);
  graphics.lineBetween(left + width * 0.24, top + height * 0.62, left + width * 0.76, top + height * 0.62);

  // The eye: icy socket and a bright slit pupil.
  const eyeY = top + height * 0.5;
  const eyeRadius = Math.min(width, height) * 0.14;
  const eyePulse = 0.75 + Math.sin(timeMs / 300) * 0.25;
  graphics.fillStyle(0x031422, 1);
  graphics.fillEllipse(centreX, eyeY, eyeRadius * 2.1, eyeRadius * 1.35);
  graphics.fillStyle(blend(color, 0xffffff, 0.55), 0.75 * eyePulse);
  graphics.fillEllipse(centreX, eyeY, eyeRadius * 1.5, eyeRadius);
  graphics.fillStyle(0xe8ffff, 0.95);
  graphics.fillEllipse(centreX, eyeY, eyeRadius * 0.55, eyeRadius * 0.78);
  graphics.fillStyle(0x031422, 1);
  graphics.fillRect(Math.round(centreX) - Math.max(1, Math.round(eyeRadius * 0.12)), Math.round(eyeY - eyeRadius * 0.6), Math.max(2, Math.round(eyeRadius * 0.24)), Math.max(2, Math.round(eyeRadius * 1.2)));
  graphics.fillStyle(0xffffff, 0.9);
  graphics.fillRect(Math.round(centreX - eyeRadius * 0.4), Math.round(eyeY - eyeRadius * 0.45), 2, 2);

  // Icicles under the plinth.
  graphics.fillStyle(blend(color, 0xffffff, 0.35), 0.5);
  for (let index = 0; index < 5; index += 1) {
    const ix = left + width * (0.16 + index * 0.17);
    const length = height * (0.04 + (index % 3) * 0.025);
    graphics.fillTriangle(ix - 3, bottom - height * 0.03, ix, bottom - height * 0.03 + length, ix + 3, bottom - height * 0.03);
  }
}

// ---------------------------------------------------------------------------
// Warden — riveted forge hull with a furnace core.
// ---------------------------------------------------------------------------

function drawWarden(
  graphics: Phaser.GameObjects.Graphics,
  boss: Boss,
  color: number,
  accent: number,
  timeMs: number,
): void {
  const left = boss.x - boss.width / 2;
  const top = boss.y;
  const width = boss.width;
  const height = boss.height;
  const centreX = boss.x;
  const bottom = top + height;
  const metal = blend(color, 0x2a140a, 0.6);
  const steel = blend(0x8a93a6, color, 0.25);
  const dark = blend(color, 0x08040a, 0.72);

  // Broad plated hull.
  graphics.fillStyle(0x050308, 1);
  graphics.fillRect(left + width * 0.02, top + height * 0.12, width * 0.96, height * 0.8);
  graphics.fillStyle(metal, 1);
  graphics.fillRect(left + width * 0.06, top + height * 0.16, width * 0.88, height * 0.72);

  // Shoulder plates and chimney stacks.
  graphics.fillStyle(steel, 1);
  graphics.fillRect(left + width * 0.02, top + height * 0.18, width * 0.18, height * 0.24);
  graphics.fillRect(left + width * 0.8, top + height * 0.18, width * 0.18, height * 0.24);
  graphics.fillStyle(dark, 1);
  graphics.fillRect(left + width * 0.06, top + height * 0.06, width * 0.1, height * 0.16);
  graphics.fillRect(left + width * 0.84, top + height * 0.06, width * 0.1, height * 0.16);
  graphics.fillStyle(blend(color, 0xffffff, 0.3), 0.5);
  graphics.fillRect(left + width * 0.06, top + height * 0.06, width * 0.1, 2);
  graphics.fillRect(left + width * 0.84, top + height * 0.06, width * 0.1, 2);
  // Ember plumes from the stacks.
  graphics.fillStyle(blend(color, 0xffffff, 0.25), 0.25);
  const plume = (timeMs / 500) % 1;
  graphics.fillCircle(left + width * 0.11, top + height * (0.05 - plume * 0.04), width * 0.05 * (1 - plume));
  graphics.fillCircle(left + width * 0.89, top + height * (0.05 - ((plume + 0.4) % 1) * 0.04), width * 0.05 * (1 - ((plume + 0.4) % 1)));

  // Horizontal armour seams and rivets.
  graphics.fillStyle(0x120a06, 0.75);
  for (let row = 1; row <= 3; row += 1) {
    const y = top + height * (0.16 + row * 0.18);
    graphics.fillRect(left + width * 0.06, Math.round(y), width * 0.88, 2);
  }
  graphics.fillStyle(blend(steel, 0xffffff, 0.35), 0.6);
  for (let index = 0; index < 6; index += 1) {
    const rx = left + width * (0.1 + index * 0.16);
    graphics.fillRect(Math.round(rx), Math.round(top + height * 0.2), 2, 2);
    graphics.fillRect(Math.round(rx), Math.round(top + height * 0.74), 2, 2);
  }

  // Furnace mouth and glowing core.
  const coreX = centreX;
  const coreY = top + height * 0.53;
  const coreRadius = Math.min(width, height) * 0.19;
  const pulse = 0.7 + Math.sin(timeMs / 240) * 0.3;
  graphics.fillStyle(0x120402, 1);
  graphics.fillCircle(coreX, coreY, coreRadius * 1.45);
  graphics.lineStyle(3, steel, 0.95);
  graphics.strokeCircle(coreX, coreY, coreRadius * 1.4);
  graphics.fillStyle(blend(color, 0xffe6a3, 0.35), 0.6 * pulse);
  graphics.fillCircle(coreX, coreY, coreRadius);
  graphics.fillStyle(blend(0xffe6a3, 0xffffff, 0.3), 0.9);
  graphics.fillCircle(coreX, coreY, coreRadius * 0.55);
  graphics.fillStyle(0xffffff, 0.95);
  graphics.fillCircle(coreX, coreY, coreRadius * 0.22);

  // Grate bars over the furnace.
  graphics.fillStyle(0x1a0a04, 0.9);
  for (let index = -2; index <= 2; index += 1) {
    const gx = coreX + index * coreRadius * 0.45;
    graphics.fillRect(Math.round(gx) - 1, Math.round(coreY - coreRadius), 2, Math.round(coreRadius * 2));
  }

  // Heavy fists / corner blocks.
  graphics.fillStyle(steel, 1);
  graphics.fillRect(left + width * 0.06, bottom - height * 0.18, width * 0.16, height * 0.12);
  graphics.fillRect(left + width * 0.78, bottom - height * 0.18, width * 0.16, height * 0.12);
  graphics.fillStyle(dark, 0.8);
  graphics.fillRect(left + width * 0.06, bottom - height * 0.08, width * 0.16, height * 0.04);
  graphics.fillRect(left + width * 0.78, bottom - height * 0.08, width * 0.16, height * 0.04);

  // Ember rim light along the top edge.
  graphics.lineStyle(2, blend(accent, color, 0.45), 0.65);
  graphics.lineBetween(left + width * 0.06, top + height * 0.16, left + width * 0.94, top + height * 0.16);
}

// ---------------------------------------------------------------------------
// Void — ringed darkness with arcs, tendrils and a violet singularity.
// ---------------------------------------------------------------------------

function drawVoid(
  graphics: Phaser.GameObjects.Graphics,
  boss: Boss,
  color: number,
  accent: number,
  timeMs: number,
  reducedMotion: boolean,
): void {
  const top = boss.y;
  const width = boss.width;
  const height = boss.height;
  const centreX = boss.x;
  const centreY = top + height * 0.5;
  const radius = Math.min(width, height) * 0.34;
  const dark = blend(color, 0x05020c, 0.8);
  const light = blend(color, 0xffffff, 0.45);
  const spin = reducedMotion ? 0 : timeMs / 1400;

  // Outer darkness.
  graphics.fillStyle(0x030108, 0.92);
  graphics.fillEllipse(centreX, centreY, width * 1.02, height * 0.92);

  // Broken outer rings, drawn as arcs of small segments.
  for (let ring = 0; ring < 3; ring += 1) {
    const ringRadius = radius * (1.2 + ring * 0.24);
    const segments = 18 + ring * 6;
    const ringColor = ring === 0
      ? blend(light, accent, 0.2)
      : blend(color, 0xffffff, 0.2 - ring * 0.05);
    graphics.lineStyle(ring === 0 ? 2 : 1, ringColor, 0.4 - ring * 0.08);
    for (let index = 0; index < segments; index += 1) {
      const angle = (index / segments) * Math.PI * 2 + spin * (ring % 2 === 0 ? 1 : -1);
      const gap = (index % 5 === 0) ? 0.4 : 0;
      const start = angle + gap;
      const end = angle + (Math.PI * 2) / segments - gap * 0.5;
      graphics.lineBetween(
        centreX + Math.cos(start) * ringRadius * 0.85,
        centreY + Math.sin(start) * ringRadius * 0.6,
        centreX + Math.cos(end) * ringRadius * 0.85,
        centreY + Math.sin(end) * ringRadius * 0.6,
      );
    }
  }

  // Tendrils reaching out of the mass.
  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2 + spin * 0.5;
    const inner = radius * 0.7;
    const reach = radius * (1.25 + (index % 3) * 0.2);
    graphics.lineStyle(2, dark, 0.9);
    graphics.lineBetween(
      centreX + Math.cos(angle) * inner,
      centreY + Math.sin(angle) * inner * 0.8,
      centreX + Math.cos(angle + 0.12) * reach,
      centreY + Math.sin(angle + 0.12) * reach * 0.8,
    );
    graphics.fillStyle(light, 0.5);
    graphics.fillRect(
      Math.round(centreX + Math.cos(angle + 0.12) * reach),
      Math.round(centreY + Math.sin(angle + 0.12) * reach * 0.8),
      2,
      2,
    );
  }

  // Event horizon: dark disc with a bright rim.
  graphics.fillStyle(0x020106, 1);
  graphics.fillCircle(centreX, centreY, radius);
  graphics.lineStyle(3, blend(color, 0xffffff, 0.35), 0.7);
  graphics.strokeCircle(centreX, centreY, radius + 1);
  graphics.lineStyle(1, 0xffffff, 0.3);
  graphics.strokeCircle(centreX, centreY, radius * 0.72);

  // Singularity core.
  const pulse = 0.7 + Math.sin(timeMs / 280) * 0.3;
  graphics.fillStyle(color, 0.35 * pulse);
  graphics.fillCircle(centreX, centreY, radius * 0.62);
  graphics.fillStyle(light, 0.7 * pulse);
  graphics.fillCircle(centreX, centreY, radius * 0.34);
  graphics.fillStyle(0xffffff, 0.95);
  graphics.fillRect(Math.round(centreX) - 2, Math.round(centreY) - 2, 4, 4);

  // Floating shards orbiting the mass.
  graphics.fillStyle(blend(color, 0xffffff, 0.35), 0.65);
  for (let index = 0; index < 5; index += 1) {
    const angle = (index / 5) * Math.PI * 2 - spin * 0.8;
    const orbit = radius * 1.55;
    const x = centreX + Math.cos(angle) * orbit;
    const y = centreY + Math.sin(angle) * orbit * 0.72;
    const size = 3 + (index % 3);
    graphics.fillTriangle(x, y - size, x + size * 0.7, y + size * 0.5, x - size * 0.7, y + size * 0.5);
  }
}

export function drawBossShard(
  graphics: Phaser.GameObjects.Graphics,
  shard: BossShard,
  options: BossShardDrawOptions = {},
): void {
  const pattern = options.pattern ?? 'void';
  const color = bossColor(pattern);
  const accent = options.accent ?? 0xffffff;
  const radius = Math.max(3, shard.radius);
  const bright = blend(color, 0xffffff, 0.55);

  // Motion tail.
  graphics.lineStyle(Math.max(1, radius * 0.5), color, 0.25);
  graphics.lineBetween(
    shard.x - shard.vx * 0.035,
    shard.y - shard.vy * 0.035,
    shard.x,
    shard.y,
  );

  // Halo and faceted diamond.
  graphics.fillStyle(color, 0.18);
  graphics.fillCircle(shard.x, shard.y, radius * 2.2);
  graphics.fillStyle(blend(color, 0x05010a, 0.4), 0.95);
  graphics.fillTriangle(shard.x, shard.y - radius * 1.5, shard.x + radius, shard.y, shard.x, shard.y + radius * 1.5);
  graphics.fillTriangle(shard.x, shard.y - radius * 1.5, shard.x - radius, shard.y, shard.x, shard.y + radius * 1.5);
  graphics.fillStyle(bright, 0.85);
  graphics.fillTriangle(shard.x, shard.y - radius * 1.2, shard.x + radius * 0.55, shard.y, shard.x, shard.y + radius * 1.2);
  graphics.fillStyle(0xffffff, 0.95);
  graphics.fillRect(Math.round(shard.x) - 1, Math.round(shard.y) - 1, 2, 2);
  graphics.lineStyle(1, accent, 0.4);
  graphics.strokeCircle(shard.x, shard.y, radius * 1.35);
}
