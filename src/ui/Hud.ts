import type {
  GameCommands,
  HudSnapshot,
  LaserHudState,
  PerkState,
  TutorialState,
} from '../game/contracts';
import { GAME_CONFIG } from '../game/config';
import { en } from '../i18n/en';
import { formatTime } from './format';
import '../styles/hud-compact.css';

function formatFactor(value: number): string {
  const safe = Number.isFinite(value) ? value : 1;
  return Number.isInteger(safe) ? String(safe) : safe.toFixed(1);
}

export interface HudOptions {
  root: HTMLElement;
  controller: GameCommands;
}

/**
 * DOM HUD for the run: wave, XP/level, active balls, remaining blocks, score,
 * pause, acquired perks and the contextual laser button.
 *
 * It is event-driven; the only timer is the laser cooldown countdown, which
 * runs at 4 Hz only while the laser button is cooling down.
 */
export class Hud {
  private readonly controller: GameCommands;
  private readonly section: HTMLElement;
  private readonly waveKicker: HTMLElement;
  private readonly waveText: HTMLElement;
  private readonly xpLine: HTMLElement;
  private readonly xpTrack: HTMLElement;
  private readonly xpFill: HTMLElement;
  private readonly ballDots: HTMLElement;
  private readonly respawn: HTMLElement;
  private readonly ballsGroup: HTMLElement;
  private readonly blocksGroup: HTMLElement;
  private readonly timeGroup: HTMLElement;
  private readonly scoreGroup: HTMLElement;
  private readonly blocksValue: HTMLElement;
  private readonly scoreValue: HTMLElement;
  private readonly timeValue: HTMLElement;
  private readonly hint: HTMLElement;
  private readonly pauseButton: HTMLButtonElement;
  private readonly dots: HTMLElement[] = [];

  private readonly perksButton: HTMLButtonElement;
  private readonly perksCount: HTMLElement;
  private readonly perksPopover: HTMLElement;
  private readonly perksList: HTMLElement;
  private readonly laserButton: HTMLButtonElement;
  private readonly laserRing: HTMLElement;
  private readonly laserTime: HTMLElement;
  private readonly laserNote: HTMLElement;

  private readonly bossBar: HTMLElement;
  private readonly bossName: HTMLElement;
  private readonly bossHp: HTMLElement;
  private readonly bossPhase: HTMLElement;
  private readonly bossTrack: HTMLElement;
  private readonly bossFill: HTMLElement;
  private readonly bossPips: HTMLElement;
  private readonly chips: HTMLElement;
  private readonly challengeChip: HTMLElement;
  private readonly multiplierChip: HTMLElement;
  private readonly comboChip: HTMLElement;
  private readonly waveIntro: HTMLElement;
  private readonly tutorialPanel: HTMLElement;
  private readonly tutorialStepLabel: HTMLElement;
  private readonly tutorialTitle: HTMLElement;
  private readonly tutorialBody: HTMLElement;
  private readonly tutorialSkip: HTMLButtonElement;
  private tutorialSignature = '';

  private perksSignature = '';
  private laser: LaserHudState | null = null;
  private laserBlocked: 'stuck' | 'rule' | null = null;
  private laserEndsAt = 0;
  private laserCooldownMs = 0;
  private laserTimer: ReturnType<typeof setInterval> | null = null;
  private bossSignature = '';
  private ruleKind: 'timeLimit' | 'noLaser' | null = null;
  private ruleEndsAt = 0;
  private ruleTimer: ReturnType<typeof setInterval> | null = null;
  private waveIntroText = '';
  private pulseTimer: ReturnType<typeof setTimeout> | null = null;
  private levelUpTimer: ReturnType<typeof setTimeout> | null = null;
  private levelUpPhase = false;
  private respawnSeconds = -1;
  private lastWaveId: string | null = null;
  private visible = false;

  constructor(options: HudOptions) {
    this.controller = options.controller;

    const section = document.createElement('section');
    this.section = section;
    section.className = 'hud';
    section.hidden = true;
    section.setAttribute('aria-label', en.appTitle);

    const top = document.createElement('div');
    top.className = 'hud__top';

    const bar = document.createElement('div');
    bar.className = 'hud__bar';

    const wave = document.createElement('div');
    wave.className = 'hud__wave';

    const waveKicker = document.createElement('span');
    this.waveKicker = waveKicker;
    waveKicker.className = 'hud__wave-kicker';
    waveKicker.textContent = en.hudWave;

    const waveText = document.createElement('span');
    this.waveText = waveText;
    waveText.className = 'hud__wave-text';

    const xpLine = document.createElement('span');
    this.xpLine = xpLine;
    xpLine.className = 'hud__xp-line';

    wave.append(waveKicker, waveText, xpLine);

    const stats = document.createElement('span');
    stats.className = 'hud__stats';

    const balls = document.createElement('span');
    balls.className = 'hud__stat hud__stat--balls';
    this.ballsGroup = balls;

    const ballsLabel = document.createElement('span');
    ballsLabel.className = 'hud__stat-label';
    ballsLabel.textContent = en.hudBalls;

    const ballDots = document.createElement('span');
    this.ballDots = ballDots;
    ballDots.className = 'hud__balls';

    for (let i = 0; i < GAME_CONFIG.ball.maxBalls; i += 1) {
      const dot = document.createElement('span');
      dot.className = 'hud__ball';
      dot.setAttribute('aria-hidden', 'true');
      ballDots.append(dot);
      this.dots.push(dot);
    }

    const respawn = document.createElement('span');
    this.respawn = respawn;
    respawn.className = 'hud__respawn';
    respawn.hidden = true;
    respawn.setAttribute('role', 'status');
    respawn.setAttribute('aria-live', 'polite');
    respawn.setAttribute('aria-atomic', 'true');

    balls.append(ballsLabel, ballDots, respawn);

    const blocks = document.createElement('span');
    blocks.className = 'hud__stat hud__stat--blocks';
    this.blocksGroup = blocks;

    const blocksLabel = document.createElement('span');
    blocksLabel.className = 'hud__stat-label';
    blocksLabel.textContent = en.hudBlocks;

    const blocksValue = document.createElement('span');
    this.blocksValue = blocksValue;
    blocksValue.className = 'hud__stat-value';

    blocks.append(blocksLabel, blocksValue);

    const time = document.createElement('span');
    time.className = 'hud__stat hud__stat--time';
    this.timeGroup = time;

    const timeLabel = document.createElement('span');
    timeLabel.className = 'hud__stat-label';
    timeLabel.textContent = en.hudTime;

    const timeValue = document.createElement('span');
    this.timeValue = timeValue;
    timeValue.className = 'hud__stat-value';

    time.append(timeLabel, timeValue);

    const score = document.createElement('span');
    score.className = 'hud__stat hud__stat--score';
    this.scoreGroup = score;

    const scoreLabel = document.createElement('span');
    scoreLabel.className = 'hud__stat-label';
    scoreLabel.textContent = en.hudScore;

    const scoreValue = document.createElement('span');
    this.scoreValue = scoreValue;
    scoreValue.className = 'hud__stat-value';

    score.append(scoreLabel, scoreValue);

    stats.append(balls, blocks, time, score);

    const bossBar = document.createElement('div');
    this.bossBar = bossBar;
    bossBar.className = 'hud__boss';
    bossBar.hidden = true;

    const bossHead = document.createElement('div');
    bossHead.className = 'hud__boss-head';

    const bossName = document.createElement('span');
    this.bossName = bossName;
    bossName.className = 'hud__boss-name';

    const bossHp = document.createElement('span');
    this.bossHp = bossHp;
    bossHp.className = 'hud__boss-hp';

    bossHead.append(bossName, bossHp);

    const bossTrack = document.createElement('div');
    this.bossTrack = bossTrack;
    bossTrack.className = 'hud__boss-track';
    bossTrack.setAttribute('role', 'progressbar');
    bossTrack.setAttribute('aria-label', en.hudBoss);
    bossTrack.setAttribute('aria-valuemin', '0');
    bossTrack.setAttribute('aria-valuemax', '1');
    bossTrack.setAttribute('aria-valuenow', '0');

    const bossFill = document.createElement('span');
    this.bossFill = bossFill;
    bossFill.className = 'hud__boss-fill';
    bossTrack.append(bossFill);

    const bossFoot = document.createElement('div');
    bossFoot.className = 'hud__boss-foot';

    const bossPhase = document.createElement('span');
    this.bossPhase = bossPhase;
    bossPhase.className = 'hud__boss-phase';

    const bossPips = document.createElement('span');
    this.bossPips = bossPips;
    bossPips.className = 'hud__boss-pips';
    bossPips.setAttribute('aria-hidden', 'true');

    bossFoot.append(bossPhase, bossPips);
    bossBar.append(bossHead, bossTrack, bossFoot);

    const chips = document.createElement('div');
    this.chips = chips;
    chips.className = 'hud__chips';
    chips.hidden = true;

    const challengeChip = document.createElement('span');
    this.challengeChip = challengeChip;
    challengeChip.className = 'hud__chip hud__chip--rule';
    challengeChip.hidden = true;
    challengeChip.setAttribute('role', 'status');

    const multiplierChip = document.createElement('span');
    this.multiplierChip = multiplierChip;
    multiplierChip.className = 'hud__chip hud__chip--multiplier';
    multiplierChip.hidden = true;

    const comboChip = document.createElement('span');
    this.comboChip = comboChip;
    comboChip.className = 'hud__chip hud__chip--combo';
    comboChip.hidden = true;

    chips.append(challengeChip, multiplierChip, comboChip);

    const pauseButton = document.createElement('button');
    this.pauseButton = pauseButton;
    pauseButton.type = 'button';
    pauseButton.className = 'hud__pause';
    pauseButton.setAttribute('aria-label', en.hudPause);
    pauseButton.addEventListener('click', this.handlePause);

    const pauseIcon = document.createElement('span');
    pauseIcon.className = 'hud__pause-icon';
    pauseIcon.setAttribute('aria-hidden', 'true');
    pauseButton.append(pauseIcon);

    bar.append(wave, stats, pauseButton);

    const xpTrack = document.createElement('div');
    this.xpTrack = xpTrack;
    xpTrack.className = 'hud__xp-track';
    xpTrack.setAttribute('role', 'progressbar');
    xpTrack.setAttribute('aria-label', en.hudXp);
    xpTrack.setAttribute('aria-valuemin', '0');
    xpTrack.setAttribute('aria-valuemax', '1');
    xpTrack.setAttribute('aria-valuenow', '0');

    const xpFill = document.createElement('span');
    this.xpFill = xpFill;
    xpFill.className = 'hud__xp-fill';
    xpTrack.append(xpFill);
    bar.append(xpTrack);

    const levelUpBadge = document.createElement('span');
    levelUpBadge.className = 'hud__levelup';
    levelUpBadge.textContent = en.hudLevelUp;
    levelUpBadge.setAttribute('aria-hidden', 'true');

    top.append(bossBar, bar, chips, levelUpBadge);

    const footer = document.createElement('div');
    footer.className = 'hud__footer';

    const perksButton = document.createElement('button');
    this.perksButton = perksButton;
    perksButton.type = 'button';
    perksButton.className = 'hud__perks';
    perksButton.hidden = true;
    perksButton.setAttribute('aria-haspopup', 'true');
    perksButton.setAttribute('aria-expanded', 'false');
    perksButton.setAttribute('aria-controls', 'hud-perks-panel');
    perksButton.addEventListener('click', this.handlePerksToggle);

    const perksLabel = document.createElement('span');
    perksLabel.className = 'hud__perks-label';
    perksLabel.textContent = en.hudPerks;

    const perksCount = document.createElement('span');
    this.perksCount = perksCount;
    perksCount.className = 'hud__perks-count';

    perksButton.append(perksLabel, perksCount);

    const hint = document.createElement('p');
    this.hint = hint;
    hint.className = 'hud__hint';
    hint.setAttribute('role', 'status');

    const laserButton = document.createElement('button');
    this.laserButton = laserButton;
    laserButton.type = 'button';
    laserButton.className = 'hud__laser';
    laserButton.hidden = true;
    laserButton.addEventListener('click', this.handleLaser);

    const laserRing = document.createElement('span');
    this.laserRing = laserRing;
    laserRing.className = 'hud__laser-ring';
    laserRing.setAttribute('aria-hidden', 'true');

    const laserCore = document.createElement('span');
    laserCore.className = 'hud__laser-core';
    laserCore.setAttribute('aria-hidden', 'true');

    const laserTime = document.createElement('span');
    this.laserTime = laserTime;
    laserTime.className = 'hud__laser-time';

    const laserNote = document.createElement('span');
    this.laserNote = laserNote;
    laserNote.className = 'hud__laser-note';
    laserNote.hidden = true;
    laserNote.setAttribute('aria-hidden', 'true');

    laserButton.append(laserRing, laserCore, laserTime, laserNote);

    footer.append(perksButton, hint, laserButton);

    const waveIntro = document.createElement('p');
    this.waveIntro = waveIntro;
    waveIntro.className = 'hud__wave-intro';
    waveIntro.hidden = true;
    waveIntro.setAttribute('role', 'status');
    waveIntro.setAttribute('aria-live', 'polite');
    waveIntro.setAttribute('aria-atomic', 'true');

    const tutorialPanel = document.createElement('aside');
    this.tutorialPanel = tutorialPanel;
    tutorialPanel.className = 'hud__tutorial';
    tutorialPanel.hidden = true;
    tutorialPanel.setAttribute('role', 'status');
    tutorialPanel.setAttribute('aria-live', 'polite');

    const tutorialStepLabel = document.createElement('span');
    this.tutorialStepLabel = tutorialStepLabel;
    tutorialStepLabel.className = 'hud__tutorial-step';

    const tutorialTitle = document.createElement('strong');
    this.tutorialTitle = tutorialTitle;
    tutorialTitle.className = 'hud__tutorial-title';

    const tutorialBody = document.createElement('p');
    this.tutorialBody = tutorialBody;
    tutorialBody.className = 'hud__tutorial-body';

    const tutorialSkip = document.createElement('button');
    this.tutorialSkip = tutorialSkip;
    tutorialSkip.type = 'button';
    tutorialSkip.id = 'tutorial-skip';
    tutorialSkip.className = 'hud__tutorial-skip';
    tutorialSkip.textContent = en.tutorialSkip;
    tutorialSkip.addEventListener('click', this.handleSkipTutorial);

    tutorialPanel.append(tutorialStepLabel, tutorialTitle, tutorialBody, tutorialSkip);

    const perksPopover = document.createElement('div');
    this.perksPopover = perksPopover;
    perksPopover.id = 'hud-perks-panel';
    perksPopover.className = 'hud__perk-popover';
    perksPopover.hidden = true;
    perksPopover.setAttribute('role', 'dialog');
    perksPopover.setAttribute('aria-label', en.overlayPerks);

    const perksTitle = document.createElement('h3');
    perksTitle.className = 'hud__perk-popover-title';
    perksTitle.textContent = en.overlayPerks;

    const perksList = document.createElement('ul');
    this.perksList = perksList;
    perksList.className = 'hud__perk-list';

    perksPopover.append(perksTitle, perksList);

    section.append(top, tutorialPanel, footer, perksPopover, waveIntro);
    options.root.append(section);

    document.addEventListener('keydown', this.handleKeydown);
  }

  update(snapshot: HudSnapshot): void {
    if (snapshot.phase === 'levelup') {
      if (!this.levelUpPhase) {
        this.levelUpPhase = true;
        this.playLevelUp();
      }
    } else if (this.levelUpPhase) {
      this.levelUpPhase = false;
      this.stopLevelUp();
    }

    if (snapshot.endless) {
      this.waveKicker.textContent = `${en.endless} · ${snapshot.waveName}`;
      this.waveText.textContent = `${en.endless} · ${en.hudWave} ${snapshot.waveIndex}`;
      this.waveText.dataset.compact = `${en.endless} · ${en.hudWave} ${snapshot.waveIndex}`;
      this.waveText.dataset.compactShort = `${en.endless} · ${snapshot.waveIndex}`;
    } else if (snapshot.isTutorial) {
      this.waveKicker.textContent = `${en.phaseTutorial} · ${snapshot.waveName}`;
      this.waveText.textContent = `${en.phaseTutorial} · ${en.hudWave} ${snapshot.waveIndex}/${snapshot.waveCount}`;
      this.waveText.dataset.compact = `${en.hudWave} ${snapshot.waveIndex}/${snapshot.waveCount} · ${snapshot.waveName}`;
      this.waveText.dataset.compactShort = `${snapshot.waveIndex}/${snapshot.waveCount} · ${snapshot.waveName}`;
    } else {
      this.waveKicker.textContent = `${en.phaseLabel} ${snapshot.phaseIndex}/${Math.max(
        1,
        snapshot.phaseCount,
      )} · ${snapshot.waveName}`;
      this.waveText.textContent = `${snapshot.phaseName} · ${en.hudWave} ${snapshot.waveIndex}/${snapshot.waveCount}`;
      // Compact line: wave count first so ellipsis never clips the count.
      this.waveText.dataset.compact = `${en.hudWave} ${snapshot.waveIndex}/${snapshot.waveCount} · ${snapshot.waveName}`;
      this.waveText.dataset.compactShort = `${snapshot.waveIndex}/${snapshot.waveCount} · ${snapshot.waveName}`;
    }
    // The compact layout swaps in `data-compact` via CSS; keep the accessible
    // name on the full original text regardless of the visual presentation.
    this.waveText.setAttribute('aria-label', this.waveText.textContent);
    this.waveText.title = this.waveText.textContent;

    if (this.lastWaveId !== null && snapshot.waveId !== this.lastWaveId) this.pulseWave();
    this.lastWaveId = snapshot.waveId;

    const active = Math.max(0, Math.min(snapshot.ballsActive, this.dots.length));
    this.dots.forEach((dot, index) => {
      dot.classList.toggle('is-on', index < active);
    });
    this.ballDots.setAttribute('aria-label', `${en.hudBalls}: ${snapshot.ballsActive}`);
    this.updateRespawn(snapshot.ballRespawnMs);

    this.blocksValue.textContent = String(Math.max(0, snapshot.blocksRemaining));
    this.scoreValue.textContent = snapshot.score.toLocaleString('en-US');
    this.timeValue.textContent = formatTime(snapshot.elapsedMs);

    // Compact stat groups drop the text labels visually (they become icons);
    // keep each value labeled for screen readers and as a hover tooltip.
    this.blocksValue.setAttribute('aria-label', `${en.hudBlocks}: ${this.blocksValue.textContent}`);
    this.scoreValue.setAttribute('aria-label', `${en.hudScore}: ${this.scoreValue.textContent}`);
    this.timeValue.setAttribute('aria-label', `${en.hudTime}: ${this.timeValue.textContent}`);
    this.ballsGroup.title = `${en.hudBalls}: ${snapshot.ballsActive}`;
    this.blocksGroup.title = `${en.hudBlocks}: ${this.blocksValue.textContent}`;
    this.timeGroup.title = `${en.hudTime}: ${this.timeValue.textContent}`;
    this.scoreGroup.title = `${en.hudScore}: ${this.scoreValue.textContent}`;
    this.hint.hidden = snapshot.tutorial != null;
    this.hint.textContent =
      snapshot.phase === 'cleared'
        ? en.hudWaveTransition
        : snapshot.ballStuck
          ? en.hudLaunchHint
          : snapshot.laser
            ? en.hudLaserHint
            : en.hudControlsHint;

    const xpToNext = Math.max(1, snapshot.xpToNext);
    const ratio = Math.max(0, Math.min(1, snapshot.xp / xpToNext));
    this.xpLine.textContent = `${en.hudLevel} ${snapshot.level} · ${snapshot.xp}/${snapshot.xpToNext} ${en.hudXp}`;
    this.xpLine.dataset.compactShort = `${en.hudLevel} ${snapshot.level}`;
    this.xpLine.title = this.xpLine.textContent;
    this.xpFill.style.width = `${(ratio * 100).toFixed(1)}%`;
    this.xpTrack.setAttribute('aria-valuemax', String(snapshot.xpToNext));
    this.xpTrack.setAttribute('aria-valuenow', String(Math.max(0, snapshot.xp)));
    this.xpTrack.setAttribute('aria-valuetext', `${en.hudLevel} ${snapshot.level}, ${snapshot.xp}/${snapshot.xpToNext} ${en.hudXp}`);

    this.updatePerks(snapshot.perks);
    this.updateBoss(snapshot.boss ?? null);
    this.updateRule(snapshot.rule ?? null);
    this.updateMultiplier(snapshot.multiplier ?? null);
    this.updateCombo(snapshot.combo ?? null);
    this.updateWaveIntro(snapshot.waveIntro ?? null);
    this.updateLaser(snapshot.laser);
    this.updateTutorial(snapshot.tutorial ?? null);
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    this.section.hidden = !visible;
    if (!visible) {
      this.closePerks();
      this.stopLaserTimer();
      this.stopRuleTimer();
    } else {
      if (this.laser) this.syncLaserClock();
      if (this.ruleKind === 'timeLimit') {
        this.syncRuleClock();
        this.startRuleTimer();
      }
    }
  }

  dispose(): void {
    this.stopLaserTimer();
    this.stopRuleTimer();
    if (this.pulseTimer !== null) clearTimeout(this.pulseTimer);
    this.stopLevelUp();
    this.levelUpPhase = false;
    document.removeEventListener('keydown', this.handleKeydown);
    this.pauseButton.removeEventListener('click', this.handlePause);
    this.perksButton.removeEventListener('click', this.handlePerksToggle);
    this.laserButton.removeEventListener('click', this.handleLaser);
    this.tutorialSkip.removeEventListener('click', this.handleSkipTutorial);
    this.section.remove();
  }

  private pulseWave(): void {
    if (!this.visible) return;
    if (this.pulseTimer !== null) clearTimeout(this.pulseTimer);
    this.section.classList.remove('is-wave-pulse');
    void this.section.offsetWidth;
    this.section.classList.add('is-wave-pulse');
    this.pulseTimer = setTimeout(() => {
      this.pulseTimer = null;
      this.section.classList.remove('is-wave-pulse');
    }, 700);
  }

  /** Short, immediate XP-bar flash that fires when the level-up phase begins. */
  private playLevelUp(): void {
    if (this.levelUpTimer !== null) clearTimeout(this.levelUpTimer);
    this.section.classList.remove('is-levelup');
    void this.section.offsetWidth;
    this.section.classList.add('is-levelup');
    this.levelUpTimer = setTimeout(() => {
      this.levelUpTimer = null;
      this.section.classList.remove('is-levelup');
    }, 650);
  }

  private stopLevelUp(): void {
    if (this.levelUpTimer !== null) {
      clearTimeout(this.levelUpTimer);
      this.levelUpTimer = null;
    }
    this.section.classList.remove('is-levelup');
  }

  private updateRespawn(ballRespawnMs: number | null): void {
    const remaining = ballRespawnMs === null ? 0 : Math.max(0, Math.round(ballRespawnMs));
    if (remaining <= 0) {
      this.respawn.hidden = true;
      this.respawnSeconds = -1;
      this.respawn.textContent = '';
      return;
    }

    const seconds = Math.max(1, Math.ceil(remaining / 1000));
    this.respawn.hidden = false;
    if (seconds === this.respawnSeconds) return;
    this.respawnSeconds = seconds;
    this.respawn.textContent = `${en.hudExtraBall} ${seconds}s`;
  }

  private updatePerks(perks: readonly PerkState[]): void {
    const signature = perks.map((perk) => `${perk.id}:${perk.level}`).join('|');
    const hasPerks = perks.length > 0;

    this.perksButton.hidden = !hasPerks;
    if (!hasPerks) this.closePerks();

    if (signature === this.perksSignature) return;
    this.perksSignature = signature;

    this.perksCount.textContent = String(perks.length);
    this.perksButton.setAttribute('aria-label', `${en.hudPerks}: ${perks.length}`);

    this.perksList.replaceChildren(
      ...perks.map((perk) => {
        const item = document.createElement('li');
        item.className = 'hud__perk-item';

        const name = document.createElement('span');
        name.className = 'hud__perk-name';
        name.textContent = perk.name;

        const level = document.createElement('span');
        level.className = 'hud__perk-level';
        level.textContent = `${en.hudPerkLevel} ${perk.level}/${perk.maxLevel}`;

        item.append(name, level);
        return item;
      }),
    );
  }

  private updateBoss(boss: HudSnapshot['boss'] | null): void {
    if (!boss) {
      this.bossBar.hidden = true;
      this.bossSignature = '';
      return;
    }

    this.bossBar.hidden = false;
    const maxHp = Math.max(1, Math.round(boss.maxHp));
    const hp = Math.max(0, Math.min(maxHp, Math.round(boss.hp)));
    const ratio = Math.max(0, Math.min(1, hp / maxHp));

    this.bossName.textContent = boss.name;
    this.bossHp.textContent = `${en.hudBossHp} ${hp}/${maxHp}`;
    this.bossFill.style.width = `${(ratio * 100).toFixed(1)}%`;
    this.bossTrack.setAttribute('aria-valuemax', String(maxHp));
    this.bossTrack.setAttribute('aria-valuenow', String(hp));
    this.bossTrack.setAttribute(
      'aria-valuetext',
      `${boss.name} · ${en.hudBossHp} ${hp}/${maxHp}`,
    );

    const phases = Math.max(1, Math.min(9, Math.round(boss.phase)));
    this.bossPhase.textContent = `${en.hudBossPhase} ${phases}`;
    this.bossPips.setAttribute('aria-label', `${en.hudBossPhase} ${phases}`);

    const signature = `${boss.name}|${phases}`;
    if (signature === this.bossSignature) return;
    this.bossSignature = signature;

    this.bossPips.replaceChildren(
      ...Array.from({ length: phases }, (_, index) => {
        const pip = document.createElement('span');
        pip.className = 'hud__boss-pip is-on';
        if (index === phases - 1) pip.classList.add('is-current');
        return pip;
      }),
    );
  }

  private updateRule(rule: HudSnapshot['rule'] | null): void {
    this.stopRuleTimer();
    this.ruleKind = rule?.kind ?? null;

    if (!rule) {
      this.challengeChip.hidden = true;
      this.challengeChip.classList.remove('is-urgent');
      this.challengeChip.textContent = '';
      this.syncChipsVisibility();
      return;
    }

    this.challengeChip.hidden = false;
    this.challengeChip.classList.toggle('is-no-laser', rule.kind === 'noLaser');
    this.challengeChip.classList.remove('is-urgent');

    if (rule.kind === 'noLaser') {
      this.challengeChip.textContent = en.hudChallengeNoLaser;
      this.challengeChip.setAttribute('aria-label', en.hudChallengeNoLaser);
      this.ruleKind = 'noLaser';
      this.syncChipsVisibility();
      return;
    }

    this.ruleKind = 'timeLimit';
    this.ruleEndsAt =
      performance.now() + Math.max(0, rule.remainingMs ?? 0);
    this.syncRuleClock();
    this.startRuleTimer();
    this.syncChipsVisibility();
  }

  private syncRuleClock(): void {
    if (!this.ruleKind || this.ruleKind !== 'timeLimit') return;

    const remaining = Math.max(0, this.ruleEndsAt - performance.now());
    const seconds = Math.ceil(remaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const padded = String(seconds % 60).padStart(2, '0');
    this.challengeChip.textContent = `${en.hudChallengeTime} ${minutes}:${padded}`;
    this.challengeChip.setAttribute(
      'aria-label',
      `${en.hudChallengeTime} ${minutes}:${padded}`,
    );
    this.challengeChip.classList.toggle('is-urgent', remaining <= 10_000);

    if (remaining <= 0) {
      this.stopRuleTimer();
      return;
    }

    if (this.visible) this.startRuleTimer();
  }

  private startRuleTimer(): void {
    if (this.ruleTimer !== null || !this.visible) return;
    this.ruleTimer = setInterval(() => this.syncRuleClock(), 250);
  }

  private stopRuleTimer(): void {
    if (this.ruleTimer !== null) {
      clearInterval(this.ruleTimer);
      this.ruleTimer = null;
    }
  }

  private updateMultiplier(multiplier: HudSnapshot['multiplier'] | null): void {
    if (!multiplier) {
      this.multiplierChip.hidden = true;
      this.multiplierChip.textContent = '';
      this.syncChipsVisibility();
      return;
    }

    const xp = formatFactor(multiplier.xpFactor);
    const score = formatFactor(multiplier.scoreFactor);
    const seconds = Math.max(0, multiplier.remainingMs) / 1000;
    const text = `×${xp} ${en.hudMultiplierXp} · ×${score} ${en.hudMultiplierScore} · ${seconds.toFixed(1)}s`;
    this.multiplierChip.hidden = false;
    this.multiplierChip.textContent = text;
    this.multiplierChip.setAttribute('aria-label', text);
    this.syncChipsVisibility();
  }

  private updateCombo(combo: HudSnapshot['combo'] | null): void {
    if (!combo || combo.count <= 0) {
      this.comboChip.hidden = true;
      this.comboChip.textContent = '';
      this.syncChipsVisibility();
      return;
    }

    const text = `${en.hudCombo} ×${Math.max(1, combo.multiplier).toFixed(2)}`;
    this.comboChip.hidden = false;
    this.comboChip.textContent = text;
    this.comboChip.setAttribute('aria-label', text);
    this.syncChipsVisibility();
  }

  private syncChipsVisibility(): void {
    this.chips.hidden =
      this.challengeChip.hidden && this.multiplierChip.hidden && this.comboChip.hidden;
  }

  private updateWaveIntro(intro: string | null): void {
    const value = intro?.trim() ?? '';
    if (!value) {
      this.waveIntro.hidden = true;
      this.waveIntroText = '';
      this.waveIntro.classList.remove('is-visible');
      return;
    }

    if (value === this.waveIntroText) return;
    this.waveIntroText = value;
    this.waveIntro.textContent = value;
    this.waveIntro.hidden = false;
    this.waveIntro.classList.remove('is-visible');
    void this.waveIntro.offsetWidth;
    this.waveIntro.classList.add('is-visible');
  }

  private updateTutorial(tutorial: TutorialState | null): void {
    if (!tutorial) {
      this.tutorialPanel.hidden = true;
      this.tutorialSignature = '';
      return;
    }

    const signature = `${tutorial.step}:${tutorial.stepIndex}:${tutorial.canSkip}`;
    this.tutorialPanel.hidden = false;
    if (signature === this.tutorialSignature) return;
    this.tutorialSignature = signature;

    const copy =
      tutorial.step === 'move'
        ? { title: en.tutorialMoveTitle, body: en.tutorialMoveBody }
        : tutorial.step === 'levelup'
          ? { title: en.tutorialLevelTitle, body: en.tutorialLevelBody }
          : tutorial.step === 'specials'
            ? { title: en.tutorialSpecialsTitle, body: en.tutorialSpecialsBody }
            : tutorial.step === 'bosses'
              ? { title: en.tutorialBossesTitle, body: en.tutorialBossesBody }
              : { title: en.tutorialEndlessTitle, body: en.tutorialEndlessBody };

    this.tutorialStepLabel.textContent = en.tutorialStep
      .replace('{{current}}', String(tutorial.stepIndex))
      .replace('{{total}}', String(tutorial.stepCount));
    this.tutorialTitle.textContent = copy.title;
    this.tutorialBody.textContent = copy.body;
    this.tutorialSkip.hidden = !tutorial.canSkip;
    this.tutorialPanel.classList.remove('is-new');
    void this.tutorialPanel.offsetWidth;
    this.tutorialPanel.classList.add('is-new');
  }

  private updateLaser(laser: LaserHudState | null): void {
    this.laser = laser;
    this.laserBlocked = laser?.blocked ?? null;
    const acquired = Boolean(laser && laser.acquired);
    this.laserButton.hidden = !acquired;

    if (!laser || !acquired) {
      this.stopLaserTimer();
      this.resetLaserBlockedUi();
      return;
    }

    this.laserButton.hidden = false;
    this.laserCooldownMs = Math.max(1, laser.cooldownMs);
    this.laserEndsAt = performance.now() + Math.max(0, laser.remainingMs);
    this.laserButton.setAttribute('aria-label', en.hudLaser);
    this.syncLaserClock();
  }

  private resetLaserBlockedUi(): void {
    this.laserButton.disabled = false;
    this.laserButton.classList.remove('is-blocked');
    this.laserNote.hidden = true;
    this.laserNote.textContent = '';
  }

  private syncLaserClock(): void {
    if (!this.laser || !this.laser.acquired || !this.visible) {
      this.stopLaserTimer();
      return;
    }

    if (this.laserBlocked) {
      const reason =
        this.laserBlocked === 'stuck' ? en.hudLaserStuck : en.hudLaserRuleBlocked;
      this.stopLaserTimer();
      this.laserButton.classList.remove('is-ready', 'is-cooling');
      this.laserButton.classList.add('is-blocked');
      this.laserButton.disabled = true;
      this.laserButton.setAttribute('aria-disabled', 'true');
      this.laserButton.setAttribute('aria-label', `${en.hudLaser} · ${reason}`);
      this.laserRing.style.setProperty('--laser-sweep', '0deg');
      this.laserTime.textContent = '—';
      this.laserNote.hidden = false;
      this.laserNote.textContent = reason;
      return;
    }

    this.resetLaserBlockedUi();
    this.laserButton.setAttribute('aria-disabled', 'false');

    const now = performance.now();
    const remaining = Math.max(0, this.laserEndsAt - now);
    const ready = remaining <= 0 || this.laser.ready;

    this.laserButton.classList.toggle('is-ready', ready);
    this.laserButton.classList.toggle('is-cooling', !ready);
    this.laserButton.setAttribute(
      'aria-label',
      ready ? `${en.hudLaser} · ${en.hudLaserReady}` : `${en.hudLaser} · ${en.hudLaserCooldown}`,
    );
    this.laserButton.setAttribute('aria-disabled', String(!ready));

    const ratio = ready
      ? 1
      : Math.max(0, Math.min(1, remaining / this.laserCooldownMs));
    this.laserRing.style.setProperty('--laser-sweep', `${(ratio * 360).toFixed(1)}deg`);
    this.laserTime.textContent = ready ? en.hudLaserReady : `${Math.ceil(remaining / 1000)}s`;

    if (ready) {
      this.stopLaserTimer();
    } else if (this.laserTimer === null) {
      this.laserTimer = setInterval(() => this.syncLaserClock(), 250);
    }
  }

  private stopLaserTimer(): void {
    if (this.laserTimer !== null) {
      clearInterval(this.laserTimer);
      this.laserTimer = null;
    }
  }

  private closePerks(): void {
    this.perksPopover.hidden = true;
    this.perksButton.setAttribute('aria-expanded', 'false');
  }

  private readonly handlePause = (): void => {
    this.controller.togglePause();
  };

  private readonly handlePerksToggle = (): void => {
    const open = this.perksPopover.hidden;
    this.perksPopover.hidden = !open;
    this.perksButton.setAttribute('aria-expanded', String(open));
  };

  private readonly handleSkipTutorial = (): void => {
    this.tutorialSkip.blur();
    this.controller.skipTutorial();
  };

  private readonly handleLaser = (): void => {
    if (this.laserBlocked) return;
    if (this.laserButton.classList.contains('is-cooling')) return;
    this.controller.fireLaser();
  };

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && !this.perksPopover.hidden) {
      this.closePerks();
      this.perksButton.focus({ preventScroll: true });
    }
  };
}
