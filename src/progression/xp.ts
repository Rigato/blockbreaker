import { GAME_CONFIG } from '../game/config';

/**
 * XP required to advance from `level` (1-based) to the next level.
 *
 * The base 20/30/40/50 curve is scaled by the G4 tuning multiplier and rounded
 * to an integer so the HUD and content validator agree on exact thresholds.
 * `firstLevelXp` overrides only level 1 and is used by the tutorial, whose
 * first bar is intentionally shorter than the campaign curve.
 */
export function xpCostForLevel(level: number, firstLevelXp?: number): number {
  const safeLevel = Math.max(1, level);
  if (safeLevel === 1 && firstLevelXp !== undefined) {
    const override = Number.isFinite(firstLevelXp) ? Math.round(firstLevelXp) : 0;
    if (override > 0) return override;
  }

  const raw =
    GAME_CONFIG.progression.baseXpToNext +
    GAME_CONFIG.progression.xpStepPerLevel * (safeLevel - 1);
  const scaled = raw * GAME_CONFIG.progression.xpCurveMultiplier;
  const factor =
    safeLevel === 1 ? GAME_CONFIG.progression.firstLevelXpFactor : 1;
  return Math.max(1, Math.round(scaled * factor));
}
