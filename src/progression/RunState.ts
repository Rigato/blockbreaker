import type {
  PerkChoice,
  PerkOffer,
  PerkState,
  PerkSummary,
  ProgressionService,
  RunModifiers,
  XpGain,
} from '../game/contracts';
import { BASE_RUN_MODIFIERS, GAME_CONFIG } from '../game/config';
import {
  FALLBACK_PERK,
  PERK_BY_ID,
  PERK_CATALOG,
  type PerkDefinition,
} from '../content/perks';
import { createRng } from '../sim/rng';
import { xpCostForLevel } from './xp';

/** XP required to advance from `level` (1-based) to the next level. */
export function xpToNextForLevel(level: number): number {
  return xpCostForLevel(level);
}

/** Alias matching the curve named in the plan. */
export const xpToNext = xpToNextForLevel;

const OFFER_SIZE = 3;

/**
 * Pure run progression: XP curve, queued level ups, perk offers, choices and
 * derived modifiers. No Phaser, DOM or persistence is involved.
 */
export class RunState implements ProgressionService {
  private currentSeed = 0;
  private currentLevel = 1;
  private currentXp = 0;
  private currentPendingLevelUps = 0;
  private readonly levels = new Map<string, number>();
  private currentOffers: PerkOffer[] = [];
  private rng = createRng(0);
  private unlockedPerkIds: ReadonlySet<string> = new Set(
    PERK_CATALOG.map((definition) => definition.id),
  );

  get seed(): number {
    return this.currentSeed;
  }

  get level(): number {
    return this.currentLevel;
  }

  get xp(): number {
    return this.currentXp;
  }

  get xpToNext(): number {
    return xpToNextForLevel(this.currentLevel);
  }

  get pendingLevelUps(): number {
    return this.currentPendingLevelUps;
  }

  get modifiers(): RunModifiers {
    return this.deriveModifiers();
  }

  get perks(): readonly PerkState[] {
    const acquired: PerkState[] = [];
    for (const definition of PERK_CATALOG) {
      const level = this.levelOf(definition.id);
      if (level > 0) acquired.push(toPerkState(definition, level));
    }
    const fallbackLevel = this.levelOf(FALLBACK_PERK.id);
    if (fallbackLevel > 0) acquired.push(toPerkState(FALLBACK_PERK, fallbackLevel));
    return acquired;
  }

  startRun(seed: number, unlockedPerkIds?: Iterable<string>): void {
    this.currentSeed = seed;
    this.unlockedPerkIds = unlockedPerkIds === undefined
      ? new Set(PERK_CATALOG.map((definition) => definition.id))
      : new Set(unlockedPerkIds);
    this.reset();
  }

  reset(): void {
    this.currentLevel = 1;
    this.currentXp = 0;
    this.currentPendingLevelUps = 0;
    this.levels.clear();
    this.currentOffers = [];
    this.rng = createRng(this.currentSeed);
  }

  addXp(baseAmount: number): XpGain {
    const base = Number.isFinite(baseAmount) && baseAmount > 0 ? baseAmount : 0;
    const gained = base * this.modifiers.xpMultiplier;

    this.currentXp += gained;
    let levelsGained = 0;
    while (this.currentXp >= this.xpToNext) {
      this.currentXp -= this.xpToNext;
      this.currentLevel += 1;
      levelsGained += 1;
      this.currentPendingLevelUps += 1;
    }

    return {
      baseAmount: base,
      gained,
      level: this.currentLevel,
      xp: this.currentXp,
      xpToNext: this.xpToNext,
      levelsGained,
      pendingLevelUps: this.currentPendingLevelUps,
    };
  }

  takeOffers(): readonly PerkOffer[] {
    if (this.currentPendingLevelUps <= 0) return [];
    if (this.currentOffers.length > 0) return this.currentOffers;

    const eligible = PERK_CATALOG.filter(
      (definition) =>
        this.unlockedPerkIds.has(definition.id) &&
        this.levelOf(definition.id) < definition.maxLevel &&
        (definition.requires === undefined || this.levelOf(definition.requires) > 0),
    );
    const pool: PerkDefinition[] = [...eligible];
    if (eligible.length < OFFER_SIZE) pool.push(FALLBACK_PERK);

    const picked = this.pickDistinct(pool, Math.min(OFFER_SIZE, pool.length));
    this.currentOffers = picked.map((definition) => {
      const currentLevel = this.levelOf(definition.id);
      return {
        id: definition.id,
        name: definition.name,
        description: definition.description,
        maxLevel: definition.maxLevel,
        kind: definition.kind,
        currentLevel,
        nextLevel: currentLevel + 1,
      };
    });
    return this.currentOffers;
  }

  choosePerk(perkId: string): PerkChoice {
    const offer = this.currentOffers.find((candidate) => candidate.id === perkId);
    if (!offer) {
      throw new Error(`Perk "${perkId}" is not in the current offer`);
    }

    const definition = PERK_BY_ID.get(perkId);
    if (!definition) throw new Error(`Unknown perk "${perkId}"`);

    const level = this.applyLevel(definition);
    this.currentOffers = [];
    this.currentPendingLevelUps = Math.max(0, this.currentPendingLevelUps - 1);

    return {
      perk: toPerkState(definition, level),
      modifiers: this.modifiers,
      pendingLevelUps: this.currentPendingLevelUps,
      spawnedBalls: definition.id === 'multiball' ? 1 : 0,
    };
  }

  grantPerk(perkId: string): PerkChoice {
    const definition = PERK_BY_ID.get(perkId);
    if (!definition) {
      return {
        perk: { id: perkId, name: perkId, level: 0, maxLevel: 0 },
        modifiers: this.modifiers,
        pendingLevelUps: this.currentPendingLevelUps,
        spawnedBalls: 0,
      };
    }

    const currentLevel = this.levelOf(perkId);
    if (currentLevel >= definition.maxLevel) {
      return {
        perk: toPerkState(definition, currentLevel),
        modifiers: this.modifiers,
        pendingLevelUps: this.currentPendingLevelUps,
        spawnedBalls: 0,
      };
    }

    const level = this.applyLevel(definition);
    return {
      perk: toPerkState(definition, level),
      modifiers: this.modifiers,
      pendingLevelUps: this.currentPendingLevelUps,
      spawnedBalls: definition.id === 'multiball' ? 1 : 0,
    };
  }

  getCatalog(): readonly PerkSummary[] {
    return PERK_CATALOG.map((definition) => ({
      id: definition.id,
      name: definition.name,
      description: definition.description,
      maxLevel: definition.maxLevel,
      kind: definition.kind,
    }));
  }

  private levelOf(perkId: string): number {
    return this.levels.get(perkId) ?? 0;
  }

  private applyLevel(definition: PerkDefinition): number {
    const next = Math.min(this.levelOf(definition.id) + 1, definition.maxLevel);
    this.levels.set(definition.id, next);
    return next;
  }

  private deriveModifiers(): RunModifiers {
    const modifiers: RunModifiers = { ...BASE_RUN_MODIFIERS };
    const {
      widePaddleStep,
      giantBallStep,
      quickStudyStep,
      fallbackXpStep,
      turretBaseMs,
      turretStepMs,
      turretMinMs,
      laserCooldownMs,
      safetyCharges,
      explosiveEvery,
      critChanceStep,
      critMultiplier,
      laserWidthStep,
      laserCooldownStep,
      momentumDamageStep,
      momentumDamageCapPerLevel,
      momentumXpStep,
      momentumXpCapPerLevel,
      reviveCharges,
      bombardierEvery,
      bossSlayerEvery,
      hotStreakHits,
      hotStreakDamageStep,
      hotStreakDurationMs,
      overkillMaxSplash,
      shieldBashEvery,
      shieldBashDamage,
      shieldBashRows,
      conductorChainFactor,
    } = GAME_CONFIG.perks;

    const widePaddle = this.levelOf('wide_paddle');
    const giantBall = this.levelOf('giant_ball');
    const powerBall = this.levelOf('power_ball');
    const quickStudy = this.levelOf('quick_study');
    const fallback = this.levelOf(FALLBACK_PERK.id);
    const turret = this.levelOf('auto_turret');
    const laserLevel = this.levelOf('prism_laser');
    const multiballLevel = this.levelOf('multiball');
    const critLevel = this.levelOf('critical_strike');
    const laserFocusLevel = this.levelOf('laser_focus');
    const overchargeLevel = this.levelOf('overcharge');
    const momentumLevel = this.levelOf('momentum');
    const hotStreakLevel = this.levelOf('hot_streak');
    const overkillLevel = this.levelOf('overkill');
    const shieldBashLevel = this.levelOf('shield_bash');
    const conductorLevel = this.levelOf('conductor');
    const laserCooldownMultiplier = Math.max(
      0.6,
      1 - laserCooldownStep * overchargeLevel,
    );

    modifiers.paddleWidthMultiplier = 1 + widePaddleStep * widePaddle;
    modifiers.ballRadiusMultiplier = 1 + giantBallStep * giantBall;
    modifiers.ballDamage = 1 + powerBall;
    modifiers.xpMultiplier =
      1 + quickStudyStep * quickStudy + fallbackXpStep * fallback;
    modifiers.maxBalls = BASE_RUN_MODIFIERS.maxBalls;
    modifiers.turretInterval =
      turret > 0
        ? Math.max(turretMinMs, turretBaseMs - turretStepMs * (turret - 1))
        : null;
    modifiers.stickyPaddle = this.levelOf('sticky_paddle') > 0;
    modifiers.laserCooldown =
      laserLevel > 0 ? laserCooldownMs * laserCooldownMultiplier : null;
    modifiers.laserLevel = laserLevel;
    modifiers.safetyNetCharges =
      this.levelOf('safety_net') > 0 ? safetyCharges : 0;
    modifiers.explosiveEvery =
      this.levelOf('explosive_core') > 0 ? explosiveEvery : null;
    modifiers.multiballLevel = multiballLevel;
    modifiers.trajectoryGuide = this.levelOf('foresight') > 0;
    modifiers.critChance = critChanceStep * critLevel;
    modifiers.critMultiplier = critMultiplier;
    modifiers.laserTargetBonus = laserFocusLevel;
    modifiers.laserWidthMultiplier = 1 + laserWidthStep * laserFocusLevel;
    modifiers.laserCooldownMultiplier = laserCooldownMultiplier;
    modifiers.momentumDamageStep = momentumLevel > 0 ? momentumDamageStep : 0;
    modifiers.momentumDamageCap = momentumDamageCapPerLevel * momentumLevel;
    modifiers.momentumXpStep = momentumLevel > 0 ? momentumXpStep : 0;
    modifiers.momentumXpCap = momentumXpCapPerLevel * momentumLevel;
    modifiers.reviveCharges = this.levelOf('second_chance') > 0 ? reviveCharges : 0;
    modifiers.bombardierEvery =
      this.levelOf('bombardier') > 0 ? bombardierEvery : null;
    modifiers.bossSlayerEvery =
      this.levelOf('boss_slayer') > 0 ? bossSlayerEvery : null;
    modifiers.hotStreakHits = hotStreakLevel > 0 ? hotStreakHits : 0;
    modifiers.hotStreakDamage = hotStreakDamageStep * hotStreakLevel;
    modifiers.hotStreakDurationMs = hotStreakLevel > 0 ? hotStreakDurationMs : 0;
    modifiers.overkillMaxSplash =
      overkillLevel > 0 ? overkillMaxSplash : 0;
    modifiers.shieldBashEvery =
      shieldBashLevel > 0 ? shieldBashEvery : null;
    modifiers.shieldBashDamage = shieldBashLevel > 0 ? shieldBashDamage : 0;
    modifiers.shieldBashRows = shieldBashLevel > 0 ? shieldBashRows : 0;
    modifiers.conductorChainFactor =
      conductorLevel > 0 ? conductorChainFactor : 0;
    modifiers.ballSpeedMultiplier = 1;
    modifiers.scoreMultiplier = 1;

    return modifiers;
  }

  private pickDistinct(
    pool: readonly PerkDefinition[],
    count: number,
  ): PerkDefinition[] {
    const remaining = [...pool];
    const picked: PerkDefinition[] = [];
    while (picked.length < count && remaining.length > 0) {
      const index = Math.floor(this.rng() * remaining.length);
      const [definition] = remaining.splice(index, 1);
      if (definition) picked.push(definition);
    }
    return picked;
  }
}

function toPerkState(definition: PerkDefinition, level: number): PerkState {
  return {
    id: definition.id,
    name: definition.name,
    level,
    maxLevel: definition.maxLevel,
  };
}
