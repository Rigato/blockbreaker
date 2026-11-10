/**
 * Natural ad breakpoints. Campaign gets an interstitial after every third
 * cleared wave (per phase), Endless after every fourth wave. The platform still
 * enforces its own minimum delay between interstitials.
 */
export function shouldShowWaveInterstitial(
  mode: 'campaign' | 'endless',
  clearedWaveNumber: number,
): boolean {
  if (!Number.isInteger(clearedWaveNumber) || clearedWaveNumber < 1) return false;
  return mode === 'endless'
    ? clearedWaveNumber % 4 === 0
    : clearedWaveNumber % 3 === 0;
}
