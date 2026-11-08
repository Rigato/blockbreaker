import type Phaser from 'phaser';
import {
  clampParticleRequest,
  PARTICLE_BUDGET,
  TRAIL_BUDGET,
} from './themes';

type ParticleShape = 'square' | 'dot';

interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
  gravity: number;
  drag: number;
  shape: ParticleShape;
}

interface TrailNode {
  active: boolean;
  x: number;
  y: number;
  radius: number;
  color: number;
  life: number;
  maxLife: number;
}

interface Ring {
  active: boolean;
  x: number;
  y: number;
  radius: number;
  color: number;
  life: number;
  maxLife: number;
  width: number;
}

export interface BurstOptions {
  /** Base speed in logical units per second. */
  speed?: number;
  /** Emission angle in radians; defaults to a full circle. */
  angle?: number;
  /** Half-width of the emission cone in radians. */
  spread?: number;
  gravity?: number;
  size?: number;
  life?: number;
  drag?: number;
  shape?: ParticleShape;
  altColor?: number;
  /** Uniform random offset applied to the spawn point. */
  jitter?: number;
}

const FULL_CIRCLE = Math.PI * 2;

/**
 * Fixed-capacity particle / afterimage / shock-ring pool.
 *
 * All storage is allocated once in the constructor. The hot path only reuses
 * entries, so a long run cannot grow the object graph.
 */
export class Effects {
  private readonly particles: Particle[] = [];
  private readonly trails: TrailNode[] = [];
  private readonly rings: Ring[] = [];
  private particleCursor = 0;
  private trailCursor = 0;
  private ringCursor = 0;
  private liveParticles = 0;
  private liveTrails = 0;
  private liveRings = 0;

  constructor(
    private readonly particleBudget: number = PARTICLE_BUDGET,
    private readonly trailBudget: number = TRAIL_BUDGET,
  ) {
    for (let i = 0; i < this.particleBudget; i += 1) {
      this.particles.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        size: 3,
        color: 0xffffff,
        gravity: 0,
        drag: 0,
        shape: 'square',
      });
    }
    for (let i = 0; i < this.trailBudget; i += 1) {
      this.trails.push({
        active: false,
        x: 0,
        y: 0,
        radius: 6,
        color: 0xffffff,
        life: 0,
        maxLife: 1,
      });
    }
    for (let i = 0; i < 8; i += 1) {
      this.rings.push({
        active: false,
        x: 0,
        y: 0,
        radius: 0,
        color: 0xffffff,
        life: 0,
        maxLife: 1,
        width: 3,
      });
    }
  }

  get particleCount(): number {
    return this.liveParticles;
  }

  get trailCount(): number {
    return this.liveTrails;
  }

  get ringCount(): number {
    return this.liveRings;
  }

  get budget(): number {
    return this.particleBudget;
  }

  /** Emits a random-direction burst, honouring the global particle budget. */
  emitBurst(x: number, y: number, requested: number, color: number, options: BurstOptions = {}): number {
    const allowed = clampParticleRequest(requested, this.liveParticles, this.particleBudget);
    if (allowed === 0) return 0;

    const speed = options.speed ?? 160;
    const angle = options.angle ?? 0;
    const spread = options.spread ?? Math.PI;
    const fullCircle = options.angle === undefined;
    for (let i = 0; i < allowed; i += 1) {
      const particle = this.takeParticle();
      if (!particle) break;
      const direction = fullCircle
        ? Math.random() * FULL_CIRCLE
        : angle + (Math.random() * 2 - 1) * spread;
      const velocity = speed * (0.45 + Math.random() * 0.85);
      const jitter = options.jitter ?? 4;
      particle.active = true;
      particle.x = x + (Math.random() * 2 - 1) * jitter;
      particle.y = y + (Math.random() * 2 - 1) * jitter;
      particle.vx = Math.cos(direction) * velocity;
      particle.vy = Math.sin(direction) * velocity;
      particle.maxLife = (options.life ?? 520) * (0.7 + Math.random() * 0.6);
      particle.life = particle.maxLife;
      particle.size = Math.max(1, (options.size ?? 3) * (0.7 + Math.random() * 0.7));
      particle.color = options.altColor !== undefined && Math.random() < 0.35
        ? options.altColor
        : color;
      particle.gravity = options.gravity ?? 0;
      particle.drag = options.drag ?? 1.4;
      particle.shape = options.shape ?? 'square';
      this.liveParticles += 1;
    }
    return allowed;
  }

  /** Adds one short-lived afterimage; returns false when the trail pool is full. */
  emitTrail(x: number, y: number, radius: number, color: number, life = 240): boolean {
    const node = this.takeTrail();
    if (!node) return false;
    node.active = true;
    node.x = x;
    node.y = y;
    node.radius = radius;
    node.color = color;
    node.maxLife = life;
    node.life = life;
    this.liveTrails += 1;
    return true;
  }

  emitRing(
    x: number,
    y: number,
    radius: number,
    color: number,
    life = 420,
    width = 3,
  ): boolean {
    const ring = this.takeRing();
    if (!ring) return false;
    ring.active = true;
    ring.x = x;
    ring.y = y;
    ring.radius = radius;
    ring.color = color;
    ring.maxLife = life;
    ring.life = life;
    ring.width = width;
    this.liveRings += 1;
    return true;
  }

  update(dtMs: number): void {
    const dt = Math.max(0, Math.min(50, dtMs)) / 1000;
    if (dt === 0) return;

    for (const particle of this.particles) {
      if (!particle.active) continue;
      particle.life -= dtMs;
      if (particle.life <= 0) {
        particle.active = false;
        this.liveParticles -= 1;
        continue;
      }
      const damping = Math.max(0, 1 - particle.drag * dt);
      particle.vx *= damping;
      particle.vy = particle.vy * damping + particle.gravity * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
    }

    for (const trail of this.trails) {
      if (!trail.active) continue;
      trail.life -= dtMs;
      if (trail.life <= 0) {
        trail.active = false;
        this.liveTrails -= 1;
      }
    }

    for (const ring of this.rings) {
      if (!ring.active) continue;
      ring.life -= dtMs;
      if (ring.life <= 0) {
        ring.active = false;
        this.liveRings -= 1;
      }
    }
  }

  draw(graphics: Phaser.GameObjects.Graphics): void {
    for (const trail of this.trails) {
      if (!trail.active) continue;
      const ratio = Math.max(0, trail.life / trail.maxLife);
      graphics.fillStyle(trail.color, 0.4 * ratio);
      graphics.fillCircle(trail.x, trail.y, trail.radius * (0.45 + ratio * 0.55));
    }

    for (const particle of this.particles) {
      if (!particle.active) continue;
      const ratio = Math.max(0, particle.life / particle.maxLife);
      const alpha = Math.min(1, ratio * 1.8);
      graphics.fillStyle(particle.color, alpha);
      const half = particle.size / 2;
      if (particle.shape === 'dot') {
        graphics.fillCircle(particle.x, particle.y, half);
      } else {
        graphics.fillRect(particle.x - half, particle.y - half, particle.size, particle.size);
      }
    }

    for (const ring of this.rings) {
      if (!ring.active) continue;
      const ratio = Math.max(0, ring.life / ring.maxLife);
      const progress = 1 - ratio;
      graphics.lineStyle(ring.width, ring.color, ratio * 0.85);
      graphics.strokeCircle(ring.x, ring.y, Math.max(1, ring.radius * (0.4 + progress * 0.8)));
    }
  }

  clear(): void {
    for (const particle of this.particles) particle.active = false;
    for (const trail of this.trails) trail.active = false;
    for (const ring of this.rings) ring.active = false;
    this.liveParticles = 0;
    this.liveTrails = 0;
    this.liveRings = 0;
  }

  private takeParticle(): Particle | null {
    if (this.particleCursor >= this.particles.length) this.particleCursor = 0;
    for (let i = 0; i < this.particles.length; i += 1) {
      const index = (this.particleCursor + i) % this.particles.length;
      const particle = this.particles[index];
      if (particle && !particle.active) {
        this.particleCursor = (index + 1) % this.particles.length;
        return particle;
      }
    }
    return null;
  }

  private takeTrail(): TrailNode | null {
    if (this.trailCursor >= this.trails.length) this.trailCursor = 0;
    for (let i = 0; i < this.trails.length; i += 1) {
      const index = (this.trailCursor + i) % this.trails.length;
      const node = this.trails[index];
      if (node && !node.active) {
        this.trailCursor = (index + 1) % this.trails.length;
        return node;
      }
    }
    return null;
  }

  private takeRing(): Ring | null {
    if (this.ringCursor >= this.rings.length) this.ringCursor = 0;
    for (let i = 0; i < this.rings.length; i += 1) {
      const index = (this.ringCursor + i) % this.rings.length;
      const ring = this.rings[index];
      if (ring && !ring.active) {
        this.ringCursor = (index + 1) % this.rings.length;
        return ring;
      }
    }
    return null;
  }
}
