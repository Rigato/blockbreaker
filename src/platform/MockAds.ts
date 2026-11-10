import type { AdsService, InterstitialResult, RewardedResult } from '../game/contracts';

export type MockAdMode = 'show' | 'fail' | 'rewarded' | 'rewarded-fail';

const isRewardedMode = (mode: MockAdMode): boolean =>
  mode === 'rewarded' || mode === 'rewarded-fail';

/**
 * Debug-only ad simulator used by `?debug=1&adMock=...`.
 *
 * It never contacts a portal: it only lets QA exercise the results ad overlay,
 * the wave interstitial, the audio mute and the rewarded revive offer on the
 * normal web build.
 */
export function createMockAds(mode: MockAdMode): AdsService {
  return {
    isInterstitialSupported: true,
    isRewardedSupported: isRewardedMode(mode),
    async showInterstitial(placement: string): Promise<InterstitialResult> {
      console.info(`[ads:mock] interstitial ${mode} (${placement})`);
      await new Promise<void>((resolve) => {
        setTimeout(resolve, mode === 'fail' ? 1500 : 1400);
      });
      return mode === 'fail' ? 'failed' : 'shown';
    },
    async showRewarded(placement: string): Promise<RewardedResult> {
      if (!isRewardedMode(mode)) return 'skipped';
      console.info(`[ads:mock] rewarded ${mode} (${placement})`);
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 1200);
      });
      return mode === 'rewarded' ? 'rewarded' : 'failed';
    },
  };
}
