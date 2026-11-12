import type { PerkKind, PerkSummary } from '../game/contracts';
import { GAME_CONFIG } from '../game/config';

/** A perk definition from the fixed catalog. Presentation text is English. */
export interface PerkDefinition extends PerkSummary {
  readonly kind: PerkKind;
  /** Perk id that must already be acquired before this one can be offered. */
  readonly requires?: string;
}

/**
 * The twenty-two perks (eleven M2 + eight v0.2.0 + three Tier 4), in a stable
 * order. Values are read from GAME_CONFIG so the progression service never
 * hardcodes tuning.
 */
export const PERK_CATALOG: readonly PerkDefinition[] = [
  {
    id: 'multiball',
    name: 'Multiball',
    description: 'Adds one extra ball immediately.',
    maxLevel: 3,
    kind: 'repeatable',
  },
  {
    id: 'wide_paddle',
    name: 'Wide Paddle',
    description: `Widens the paddle by ${percent(GAME_CONFIG.perks.widePaddleStep)} per level.`,
    maxLevel: 3,
    kind: 'repeatable',
  },
  {
    id: 'power_ball',
    name: 'Power Ball',
    description: 'Adds 1 damage per level.',
    maxLevel: 3,
    kind: 'repeatable',
  },
  {
    id: 'quick_study',
    name: 'Quick Study',
    description: `Gain ${percent(GAME_CONFIG.perks.quickStudyStep)} more XP per level.`,
    maxLevel: 2,
    kind: 'repeatable',
  },
  {
    id: 'auto_turret',
    name: 'Arcane Turret',
    description: 'Fires a projectile on a timer, faster every level.',
    maxLevel: 3,
    kind: 'repeatable',
  },
  {
    id: 'giant_ball',
    name: 'Giant Ball',
    description: `Increases ball radius by ${percent(GAME_CONFIG.perks.giantBallStep)} per level.`,
    maxLevel: 2,
    kind: 'repeatable',
  },
  {
    id: 'sticky_paddle',
    name: 'Sticky Paddle',
    description: 'Catches the ball on contact; release with a tap.',
    maxLevel: 1,
    kind: 'unique',
  },
  {
    id: 'safety_net',
    name: 'Safety Net',
    description: 'Saves the last ball once each wave.',
    maxLevel: 1,
    kind: 'unique',
  },
  {
    id: 'prism_laser',
    name: 'Prism Laser',
    description:
      'Fires a column beam that damages the first 3 blocks; upgrades add damage and reach.',
    maxLevel: 3,
    kind: 'repeatable',
  },
  {
    id: 'foresight',
    name: 'Foresight',
    description: 'Shows a short dotted prediction of each ball path.',
    maxLevel: 1,
    kind: 'unique',
  },
  {
    id: 'explosive_core',
    name: 'Explosive Core',
    description: 'Every 8 destroyed blocks trigger a small explosion.',
    maxLevel: 1,
    kind: 'unique',
  },
  {
    id: 'critical_strike',
    name: 'Critical Strike',
    description: `${percent(GAME_CONFIG.perks.critChanceStep)} chance per level to deal double damage.`,
    maxLevel: 3,
    kind: 'repeatable',
  },
  {
    id: 'laser_focus',
    name: 'Laser Focus',
    description: `Adds 1 laser target and widens the beam by ${percent(GAME_CONFIG.perks.laserWidthStep)} per level.`,
    maxLevel: 3,
    kind: 'repeatable',
    requires: 'prism_laser',
  },
  {
    id: 'overcharge',
    name: 'Overcharge',
    description: `Reduces Prism Laser cooldown by ${percent(GAME_CONFIG.perks.laserCooldownStep)} per level.`,
    maxLevel: 3,
    kind: 'repeatable',
    requires: 'prism_laser',
  },
  {
    id: 'momentum',
    name: 'Momentum',
    description: `Consecutive block hits add ${percent(GAME_CONFIG.perks.momentumDamageStep)} damage and ${percent(GAME_CONFIG.perks.momentumXpStep)} XP each; caps grow with level (max +${percent(GAME_CONFIG.perks.momentumDamageCapPerLevel * 3)} damage / +${percent(GAME_CONFIG.perks.momentumXpCapPerLevel * 3)} XP). Resets when the ball touches the paddle.`,
    maxLevel: 3,
    kind: 'repeatable',
  },
  {
    id: 'second_chance',
    name: 'Second Chance',
    description: 'Revive once per run with one ball.',
    maxLevel: 1,
    kind: 'unique',
  },
  {
    id: 'bombardier',
    name: 'Bombardier',
    description: `Every ${GAME_CONFIG.perks.bombardierEvery} destroyed blocks arms the next block hit to detonate a 3x3 explosion (${GAME_CONFIG.perks.bombardierCenterDamage} damage center, ${GAME_CONFIG.perks.bombardierRingDamage} around).`,
    maxLevel: 1,
    kind: 'unique',
  },
  {
    id: 'boss_slayer',
    name: 'Boss Slayer',
    description: `Every ${GAME_CONFIG.perks.bossSlayerEvery} destroyed blocks arms the next direct boss hit for +${GAME_CONFIG.perks.bossSlayerDamage} damage.`,
    maxLevel: 1,
    kind: 'unique',
  },
  {
    id: 'hot_streak',
    name: 'Hot Streak',
    description: `After ${GAME_CONFIG.perks.hotStreakHits} consecutive block hits, gain +1 damage per level for ${GAME_CONFIG.perks.hotStreakDurationMs / 1000} seconds; each new hit refreshes the timer.`,
    maxLevel: 2,
    kind: 'repeatable',
  },
  {
    id: 'overkill',
    name: 'Overkill',
    description: `Excess damage from a direct hit splashes up to ${GAME_CONFIG.perks.overkillMaxSplash} damage to orthogonally adjacent blocks.`,
    maxLevel: 1,
    kind: 'unique',
  },
  {
    id: 'shield_bash',
    name: 'Shield Bash',
    description: `Every ${GAME_CONFIG.perks.shieldBashEvery} paddle hits, a shockwave deals ${GAME_CONFIG.perks.shieldBashDamage} damage to the bottom ${GAME_CONFIG.perks.shieldBashRows} rows.`,
    maxLevel: 1,
    kind: 'unique',
  },
  {
    id: 'conductor',
    name: 'Conductor',
    description: `Prism Laser targets chain once to an adjacent block for ${percent(GAME_CONFIG.perks.conductorChainFactor)} of the beam's damage (minimum 1).`,
    maxLevel: 1,
    kind: 'unique',
    requires: 'prism_laser',
  },
];

/**
 * Internal repeatable XP perk used only to fill an offer when too few normal
 * perks are eligible. It is never part of getCatalog().
 */
export const FALLBACK_PERK: PerkDefinition = {
  id: 'xp_fallback',
  name: 'Arcane Insight',
  description: `Gain ${percent(GAME_CONFIG.perks.fallbackXpStep)} more XP per level.`,
  maxLevel: Number.MAX_SAFE_INTEGER,
  kind: 'repeatable',
};

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export const PERK_BY_ID: ReadonlyMap<string, PerkDefinition> = new Map([
  ...PERK_CATALOG.map((perk) => [perk.id, perk] as const),
  [FALLBACK_PERK.id, FALLBACK_PERK] as const,
]);
