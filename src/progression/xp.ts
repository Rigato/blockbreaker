import { GAME_CONFIG } from '../game/config';

/**
 * XP required to advance from `level` (1-based) to the next level.
 *
 * The base 20/30/40/50 curve is scaled by the G4 tuning multiplier and rounded
 * to an integer so the HUD and content validator agree on exact thresholds.
 */
export function xpCostForLevel(level: number): number {
  const raw =
    GAME_CONFIG.progression.baseXpToNext +
    GAME_CONFIG.progression.xpStepPerLevel * (Math.max(1, level) - 1);
  const scaled = raw * GAME_CONFIG.progression.xpCurveMultiplier;
  const factor =
    level === 1 ? GAME_CONFIG.progression.firstLevelXpFactor : 1;
  return Math.max(1, Math.round(scaled * factor));
}
