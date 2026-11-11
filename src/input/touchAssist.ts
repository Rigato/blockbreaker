import { FIELD_WIDTH } from '../sim/World';

/**
 * Touch-only edge assist.
 *
 * Relative drag is 1:1 in the middle of the field, but near the side walls the
 * delta is amplified gradually. This lets the paddle reach the playable edge
 * before the finger reaches the physical screen edge (where many mobile
 * browsers reserve back/swipe gestures), without making the centre sensitive
 * or raising the paddle's simulation speed cap.
 */
export const TOUCH_EDGE_ZONE_RATIO = 0.22;
export const TOUCH_EDGE_MAX_GAIN = 2.2;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Gain applied to a touch delta at a given paddle target. */
export function touchEdgeGain(
  target: number,
  fieldWidth: number = FIELD_WIDTH,
): number {
  if (!Number.isFinite(target) || !Number.isFinite(fieldWidth) || fieldWidth <= 0) {
    return 1;
  }
  const x = clamp(target, 0, fieldWidth);
  const zone = fieldWidth * TOUCH_EDGE_ZONE_RATIO;
  if (zone <= 0) return 1;

  const distanceToEdge = Math.min(x, fieldWidth - x);
  if (distanceToEdge >= zone) return 1;

  // Quadratic ramp: 1x at the zone boundary, up to MAX_GAIN at the wall.
  const proximity = 1 - distanceToEdge / zone;
  return 1 + (TOUCH_EDGE_MAX_GAIN - 1) * proximity * proximity;
}

/** Applies a relative touch delta with edge assist and clamps to the field. */
export function applyTouchDelta(
  target: number,
  delta: number,
  fieldWidth: number = FIELD_WIDTH,
): number {
  if (!Number.isFinite(target) || !Number.isFinite(delta)) return target;
  const base = clamp(target, 0, fieldWidth);
  const gain = touchEdgeGain(base, fieldWidth);
  return clamp(base + delta * gain, 0, fieldWidth);
}
