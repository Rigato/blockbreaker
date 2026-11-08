import type { AdsService, InterstitialResult } from '../game/contracts';

export type MockAdMode = 'show' | 'fail';

/**
 * Debug-only interstitial used by `?debug=1&adMock=show|fail`.
 *
 * It never contacts a portal: it only lets QA exercise the results ad overlay,
 * the audio mute and the closed/failed continuation on the normal web build.
 */
export function createMockAds(mode: MockAdMode): AdsService {
  return {
    isInterstitialSupported: true,
    async showInterstitial(placement: string): Promise<InterstitialResult> {
      console.info(`[ads:mock] ${mode} (${placement})`);
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, mode === 'show' ? 1400 : 1500);
      });
      return mode === 'show' ? 'shown' : 'failed';
    },
  };
}
