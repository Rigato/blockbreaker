/**
 * Pure Foresight trajectory prediction.
 *
 * The helper only knows about the ball and the field bounds: it mirrors the
 * ball's velocity off the side walls and the ceiling for a short horizon. It
 * deliberately ignores blocks, the paddle and anti-stall rules, so the guide
 * stays a cheap hint instead of an authoritative simulation.
 */
export interface TrajectoryPoint {
  x: number;
  y: number;
}

export interface TrajectoryBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

/** Dotted guide length: inside the 5-9 point presentation budget. */
export const TRAJECTORY_STEPS = 7;

/**
 * Returns `steps` sample points ahead of the ball, spaced evenly over
 * `lookAheadMs`. Pass `out` to reuse an array between frames; its objects are
 * recycled too. Points below the field are clipped (prediction stops), and
 * positions are kept inside the field bounds after every reflection.
 */
export function predictBallPath(
  ball: TrajectoryBall,
  fieldWidth: number,
  fieldHeight: number,
  lookAheadMs: number,
  steps: number = TRAJECTORY_STEPS,
  out: TrajectoryPoint[] = [],
): TrajectoryPoint[] {
  const count = Math.max(0, Math.floor(steps));
  const horizonSeconds = Math.max(0, lookAheadMs) / 1000;
  if (count === 0 || horizonSeconds <= 0 || fieldWidth <= 0 || fieldHeight <= 0) {
    out.length = 0;
    return out;
  }

  const radius = Math.max(0, ball.radius);
  const minX = Math.min(radius, fieldWidth / 2);
  const maxX = Math.max(minX, fieldWidth - radius);
  const minY = Math.min(radius, fieldHeight / 2);
  const maxY = fieldHeight;

  let x = ball.x;
  let y = ball.y;
  let vx = ball.vx;
  let vy = ball.vy;
  const dt = horizonSeconds / count;

  let written = 0;
  for (let index = 0; index < count; index += 1) {
    x += vx * dt;
    y += vy * dt;

    // Side-wall reflections. The guard avoids an infinite loop when the field
    // is narrower than the ball.
    let bounces = 0;
    while (x < minX && bounces < 2) {
      x = minX + (minX - x);
      vx = -vx;
      bounces += 1;
    }
    bounces = 0;
    while (x > maxX && bounces < 2) {
      x = maxX - (x - maxX);
      vx = -vx;
      bounces += 1;
    }

    // Ceiling reflection.
    bounces = 0;
    while (y < minY && bounces < 2) {
      y = minY + (minY - y);
      vy = -vy;
      bounces += 1;
    }

    // The ball is heading off the bottom of the field: nothing to preview.
    if (y > maxY) break;

    x = Math.max(minX, Math.min(maxX, x));
    let point = out[written];
    if (!point) {
      point = { x, y };
      out.push(point);
    } else {
      point.x = x;
      point.y = y;
    }
    written += 1;
  }

  out.length = written;
  return out;
}
