import { describe, expect, it } from 'vitest';
import { computeStageSize } from '../src/ui/layout';

interface Case {
  name: string;
  availableWidth: number;
  availableHeight: number;
}

const CASES: Case[] = [
  { name: '320x568', availableWidth: 320, availableHeight: 568 },
  { name: '390x844', availableWidth: 390, availableHeight: 844 },
  { name: '430x932', availableWidth: 430, availableHeight: 932 },
  { name: 'desktop', availableWidth: 1440, availableHeight: 900 },
  { name: 'netbook', availableWidth: 1024, availableHeight: 768 },
];

describe('computeStageSize', () => {
  it.each(CASES)('fits $name without overflow', ({ availableWidth, availableHeight }) => {
    const size = computeStageSize(availableWidth, availableHeight);
    expect(size.width).toBeGreaterThan(0);
    expect(size.height).toBeGreaterThan(0);
    expect(size.width).toBeLessThanOrEqual(availableWidth);
    expect(size.height).toBeLessThanOrEqual(availableHeight);
  });

  it('fills the portrait phone widths', () => {
    expect(computeStageSize(320, 568)).toEqual({ width: 320, height: 568 });
    expect(computeStageSize(390, 844)).toEqual({ width: 390, height: 780 });
    expect(computeStageSize(430, 932)).toEqual({ width: 430, height: 860 });
  });

  it('keeps a framed portrait stage on desktop', () => {
    expect(computeStageSize(1440, 900)).toEqual({ width: 506, height: 900 });
    expect(computeStageSize(1024, 768)).toEqual({ width: 432, height: 768 });
  });

  it.each(CASES)('stays between 9:16 and 1:2 for $name', ({ availableWidth, availableHeight }) => {
    const size = computeStageSize(availableWidth, availableHeight);
    const aspect = size.width / size.height;
    expect(aspect).toBeGreaterThanOrEqual(0.499);
    expect(aspect).toBeLessThanOrEqual(0.565);
  });

  it('returns a safe 1x1 stage for invalid input', () => {
    expect(computeStageSize(0, 0)).toEqual({ width: 1, height: 1 });
    expect(computeStageSize(Number.NaN, 100)).toEqual({ width: 1, height: 1 });
  });
});
