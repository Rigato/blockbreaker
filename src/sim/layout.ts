/**
 * Layout scale for blocks, elements and bosses.
 *
 * This is a layout scale, not a camera zoom: paddle and ball keep their normal
 * size and input mapping is unaffected. Tall waves shrink the field so it fits
 * between the HUD and the paddle.
 */

export const LOGICAL_WIDTH = 720;

export const FIELD_TOP = 160;
export const FIELD_REFERENCE_HEIGHT = 1280;
export const PADDLE_BOTTOM_OFFSET = 120;
export const PADDLE_HEIGHT = 18;
export const FIELD_BOTTOM_MARGIN = 40;
export const MIN_FIELD_SCALE = 0.68;

/** Vertical space available to the field at the reference height. */
export function availableFieldHeight(): number {
  return (
    FIELD_REFERENCE_HEIGHT -
    PADDLE_BOTTOM_OFFSET -
    PADDLE_HEIGHT / 2 -
    FIELD_TOP -
    FIELD_BOTTOM_MARGIN
  );
}

/**
 * Scale needed to fit `rows + extraRows` rows inside the available height.
 * Returns a value clamped to [MIN_FIELD_SCALE, 1].
 */
export function computeFieldScale(rows: number, columns: number, extraRows = 0): number {
  const cellHeight = LOGICAL_WIDTH / Math.max(1, columns);
  const rawHeight = Math.max(1, rows + extraRows) * cellHeight;
  const scale = availableFieldHeight() / rawHeight;
  return Math.min(1, Math.max(MIN_FIELD_SCALE, scale));
}
