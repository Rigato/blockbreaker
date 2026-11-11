import { describe, expect, it } from 'vitest';
import { FIELD_WIDTH } from '../src/sim/World';
import {
  applyTouchDelta,
  TOUCH_EDGE_MAX_GAIN,
  TOUCH_EDGE_ZONE_RATIO,
  touchEdgeGain,
  touchTravelGain,
} from '../src/input/touchAssist';

const CENTRE = FIELD_WIDTH / 2;
const ZONE = FIELD_WIDTH * TOUCH_EDGE_ZONE_RATIO;

describe('touch edge assist', () => {
  it('keeps 1:1 sensitivity in the centre of the field', () => {
    expect(touchEdgeGain(CENTRE)).toBe(1);
    expect(applyTouchDelta(CENTRE, 20)).toBe(CENTRE + 20);
  });

  it('only amplifies inside the outer edge zone', () => {
    expect(touchEdgeGain(ZONE)).toBe(1);
    expect(touchEdgeGain(ZONE - 1)).toBeGreaterThan(1);
    expect(touchEdgeGain(FIELD_WIDTH - ZONE)).toBe(1);
    expect(touchEdgeGain(FIELD_WIDTH - ZONE + 1)).toBeGreaterThan(1);
  });

  it('ramps up to the maximum gain at the wall', () => {
    expect(touchEdgeGain(0)).toBeCloseTo(TOUCH_EDGE_MAX_GAIN, 5);
    expect(touchEdgeGain(FIELD_WIDTH)).toBeCloseTo(TOUCH_EDGE_MAX_GAIN, 5);
  });

  it('moves the paddle farther than the finger near an edge', () => {
    const start = ZONE / 2;
    const moved = applyTouchDelta(start, -10);
    expect(moved).toBeLessThan(start - 10);
  });

  it('clamps to the playable field', () => {
    expect(applyTouchDelta(FIELD_WIDTH - 1, 100)).toBe(FIELD_WIDTH);
    expect(applyTouchDelta(1, -100)).toBe(0);
  });

  it('adds gain for long swipes so one finger can cross the field', () => {
    expect(touchTravelGain(0)).toBe(1);
    expect(touchTravelGain(100)).toBeGreaterThan(1);
    expect(touchTravelGain(300)).toBeCloseTo(TOUCH_EDGE_MAX_GAIN, 5);

    const fromLeft = 50;
    const oneLongSwipe = applyTouchDelta(fromLeft, 360, FIELD_WIDTH, 360);
    expect(oneLongSwipe).toBe(FIELD_WIDTH);
  });
});
