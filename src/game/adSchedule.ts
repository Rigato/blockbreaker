/**
 * Natural ad breakpoints. Campaign gets an interstitial after every third
 * cleared wave (per phase), Endless after every fourth wave. The platform still
 * enforces its own minimum delay between interstitials.
 */
export function shouldShowWaveInterstitial(
  mode: 'campaign' | 'endless',
  clearedWaveNumber: number,
  phaseComplete = false,
): boolean {
  if (!Number.isInteger(clearedWaveNumber) || clearedWaveNumber < 1) return false;
  // Campaign finale: the results transition owns the break, not a wave ad.
  if (phaseComplete) return false;
  return mode === 'endless'
    ? clearedWaveNumber % 4 === 0
    : clearedWaveNumber % 3 === 0;
}
