/**
 * Swept circle vs AABB collision. Pure math, no Phaser and no DOM.
 *
 * The circle moves along `p + v * t` for `t` in [0, 1]. The AABB is expanded
 * by the circle radius (Minkowski sum) and the ray is intersected with it. The
 * reported normal points from the surface towards the circle.
 */

export interface Aabb {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface SweepHit {
  /** Fraction of the movement where contact happens, in [0, 1]. */
  t: number;
  /** Unit surface normal pointing towards the circle. */
  nx: number;
  ny: number;
  /** Extra push needed to leave the surface (0.01 for regular contacts). */
  depth: number;
}

const EPS = 1e-9;

export function aabbFromRect(x: number, y: number, width: number, height: number): Aabb {
  return { left: x, top: y, right: x + width, bottom: y + height };
}

export function circleOverlapsAabb(
  cx: number,
  cy: number,
  radius: number,
  box: Aabb,
): boolean {
  const closestX = Math.max(box.left, Math.min(cx, box.right));
  const closestY = Math.max(box.top, Math.min(cy, box.bottom));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy <= radius * radius;
}

/**
 * Sweeps a circle against one AABB.
 *
 * `vx`/`vy` are units per second and `dtSeconds` is the step duration, so the
 * caller never has to pre-multiply. Returns null when there is no impact in
 * the interval.
 */
export function sweptCircleAabb(
  cx: number,
  cy: number,
  radius: number,
  vx: number,
  vy: number,
  dtSeconds: number,
  box: Aabb,
): SweepHit | null {
  const left = box.left - radius;
  const top = box.top - radius;
  const right = box.right + radius;
  const bottom = box.bottom + radius;

  const dx = vx * dtSeconds;
  const dy = vy * dtSeconds;
  if (dx === 0 && dy === 0) return null;

  // Already inside the expanded box: depenetrate through the nearest face.
  if (cx > left && cx < right && cy > top && cy < bottom) {
    const dl = cx - left;
    const dr = right - cx;
    const dt = cy - top;
    const db = bottom - cy;
    const nearest = Math.min(dl, dr, dt, db);
    if (nearest === dl) return { t: 0, nx: -1, ny: 0, depth: dl + 0.01 };
    if (nearest === dr) return { t: 0, nx: 1, ny: 0, depth: dr + 0.01 };
    if (nearest === dt) return { t: 0, nx: 0, ny: -1, depth: dt + 0.01 };
    return { t: 0, nx: 0, ny: 1, depth: db + 0.01 };
  }

  let tmin = -Infinity;
  let tmax = Infinity;
  let tEnterX: number | null = null;
  let tEnterY: number | null = null;
  let signX = 0;
  let signY = 0;

  if (Math.abs(dx) < EPS) {
    if (cx < left || cx > right) return null;
  } else {
    let t1 = (left - cx) / dx;
    let t2 = (right - cx) / dx;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    if (t1 > tmin) {
      tmin = t1;
      tEnterX = t1;
      signX = dx > 0 ? -1 : 1;
    } else if (Math.abs(t1 - tmin) < 1e-9) {
      tEnterX = t1;
      signX = dx > 0 ? -1 : 1;
    }
    if (t2 < tmax) tmax = t2;
  }

  if (Math.abs(dy) < EPS) {
    if (cy < top || cy > bottom) return null;
  } else {
    let t1 = (top - cy) / dy;
    let t2 = (bottom - cy) / dy;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    if (t1 > tmin) {
      tmin = t1;
      tEnterY = t1;
      signY = dy > 0 ? -1 : 1;
    } else if (Math.abs(t1 - tmin) < 1e-9) {
      tEnterY = t1;
      signY = dy > 0 ? -1 : 1;
    }
    if (t2 < tmax) tmax = t2;
  }

  if (tmin < 0 || tmin > 1 || tmin > tmax) return null;

  const hitX = tEnterX !== null && Math.abs(tEnterX - tmin) < 1e-7;
  const hitY = tEnterY !== null && Math.abs(tEnterY - tmin) < 1e-7;

  let nx = 0;
  let ny = 0;
  if (hitX && hitY) {
    const inv = Math.SQRT1_2;
    nx = signX * inv;
    ny = signY * inv;
  } else if (hitX) {
    nx = signX;
  } else if (hitY) {
    ny = signY;
  } else {
    return null;
  }

  return { t: tmin, nx, ny, depth: 0.01 };
}

/** Closest point on the segment (x1,y1)-(x2,y2) to (px,py). */
export function closestPointOnSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): { x: number; y: number; t: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared < EPS) return { x: x1, y: y1, t: 0 };
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
  return { x: x1 + dx * t, y: y1 + dy * t, t };
}

export interface SegmentHit {
  /** Unit normal pointing from the segment towards the circle. */
  nx: number;
  ny: number;
  /** Penetration depth; move the circle along the normal by this amount. */
  depth: number;
}

/**
 * Circle vs segment (capsule) overlap. Returns the depenetration normal and
 * depth, or null when the circle does not touch the segment.
 */
export function circleSegmentHit(
  cx: number,
  cy: number,
  radius: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): SegmentHit | null {
  const point = closestPointOnSegment(cx, cy, x1, y1, x2, y2);
  let dx = cx - point.x;
  let dy = cy - point.y;
  let distance = Math.hypot(dx, dy);
  if (distance > radius) return null;

  if (distance < EPS) {
    // Circle centre sits exactly on the line: use the segment's perpendicular.
    const sx = x2 - x1;
    const sy = y2 - y1;
    const length = Math.hypot(sx, sy) || 1;
    dx = -sy / length;
    dy = sx / length;
    distance = 0;
  } else {
    dx /= distance;
    dy /= distance;
  }

  return { nx: dx, ny: dy, depth: radius - distance };
}

/** Reflects a velocity around a (unit) normal. Mutates and returns the vector. */
export function reflectVelocity(
  velocity: { vx: number; vy: number },
  nx: number,
  ny: number,
): { vx: number; vy: number } {
  const dot = velocity.vx * nx + velocity.vy * ny;
  if (dot < 0) {
    velocity.vx -= 2 * dot * nx;
    velocity.vy -= 2 * dot * ny;
  }
  return velocity;
}

/** Rotates a vector by `degrees` (positive is clockwise in screen space). */
export function rotateVelocity(
  velocity: { vx: number; vy: number },
  degrees: number,
): { vx: number; vy: number } {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const vx = velocity.vx * cos - velocity.vy * sin;
  const vy = velocity.vx * sin + velocity.vy * cos;
  velocity.vx = vx;
  velocity.vy = vy;
  return velocity;
}
