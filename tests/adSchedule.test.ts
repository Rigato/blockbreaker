import { describe, expect, it } from 'vitest';
import { shouldShowWaveInterstitial } from '../src/game/adSchedule';

describe('wave interstitial schedule', () => {
  it('shows a campaign ad after every third cleared wave', () => {
    const due = [1, 2, 3, 4, 5, 6, 9, 12].filter((wave) =>
      shouldShowWaveInterstitial('campaign', wave),
    );
    expect(due).toEqual([3, 6, 9, 12]);
  });

  it('shows an endless ad after every fourth cleared wave', () => {
    const due = [1, 2, 3, 4, 5, 8, 11, 12, 16].filter((wave) =>
      shouldShowWaveInterstitial('endless', wave),
    );
    expect(due).toEqual([4, 8, 12, 16]);
  });

  it('never shows a campaign wave ad on the final wave of a phase', () => {
    expect(shouldShowWaveInterstitial('campaign', 3, true)).toBe(false);
    expect(shouldShowWaveInterstitial('campaign', 2, true)).toBe(false);
    expect(shouldShowWaveInterstitial('campaign', 3, false)).toBe(true);
    // Endless has no phase-complete state.
    expect(shouldShowWaveInterstitial('endless', 4, true)).toBe(false);
  });

  it('rejects invalid wave numbers', () => {
    for (const wave of [0, -1, 1.5, 3.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(shouldShowWaveInterstitial('campaign', wave)).toBe(false);
      expect(shouldShowWaveInterstitial('endless', wave)).toBe(false);
    }
  });
});
