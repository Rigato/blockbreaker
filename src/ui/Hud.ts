import type { GameCommands, HudSnapshot, LaserHudState, PerkState } from '../game/contracts';
import { GAME_CONFIG } from '../game/config';
import { en } from '../i18n/en';

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
  private readonly blocksValue: HTMLElement;
  private readonly scoreValue: HTMLElement;
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

  private perksSignature = '';
  private laser: LaserHudState | null = null;
  private laserEndsAt = 0;
  private laserCooldownMs = 0;
  private laserTimer: ReturnType<typeof setInterval> | null = null;
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
    balls.className = 'hud__stat';

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

    balls.append(ballsLabel, ballDots);

    const blocks = document.createElement('span');
    blocks.className = 'hud__stat';

    const blocksLabel = document.createElement('span');
    blocksLabel.className = 'hud__stat-label';
    blocksLabel.textContent = en.hudBlocks;

    const blocksValue = document.createElement('span');
    this.blocksValue = blocksValue;
    blocksValue.className = 'hud__stat-value';

    blocks.append(blocksLabel, blocksValue);

    const score = document.createElement('span');
    score.className = 'hud__stat hud__stat--score';

    const scoreLabel = document.createElement('span');
    scoreLabel.className = 'hud__stat-label';
    scoreLabel.textContent = en.hudScore;

    const scoreValue = document.createElement('span');
    this.scoreValue = scoreValue;
    scoreValue.className = 'hud__stat-value';

    score.append(scoreLabel, scoreValue);

    stats.append(balls, blocks, score);

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

    top.append(bar);

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

    laserButton.append(laserRing, laserCore, laserTime);

    footer.append(perksButton, hint, laserButton);

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

    section.append(top, footer, perksPopover);
    options.root.append(section);

    document.addEventListener('keydown', this.handleKeydown);
  }

  update(snapshot: HudSnapshot): void {
    this.waveKicker.textContent = `${en.phaseLabel} ${snapshot.phaseIndex}/${Math.max(
      1,
      snapshot.phaseCount,
    )} · ${snapshot.waveName}`;
    this.waveText.textContent = `${snapshot.phaseName} · ${en.hudWave} ${snapshot.waveIndex}/${snapshot.waveCount}`;
    const active = Math.max(0, Math.min(snapshot.ballsActive, this.dots.length));
    this.dots.forEach((dot, index) => {
      dot.classList.toggle('is-on', index < active);
    });
    this.ballDots.setAttribute('aria-label', `${en.hudBalls}: ${snapshot.ballsActive}`);

    this.blocksValue.textContent = String(Math.max(0, snapshot.blocksRemaining));
    this.scoreValue.textContent = snapshot.score.toLocaleString('en-US');
    this.hint.textContent =
      snapshot.phase === 'cleared'
        ? en.hudWaveTransition
        : snapshot.ballStuck
          ? en.hudLaunchHint
          : en.hudControlsHint;

    const xpToNext = Math.max(1, snapshot.xpToNext);
    const ratio = Math.max(0, Math.min(1, snapshot.xp / xpToNext));
    this.xpLine.textContent = `${en.hudLevel} ${snapshot.level} · ${snapshot.xp}/${snapshot.xpToNext} ${en.hudXp}`;
    this.xpFill.style.width = `${(ratio * 100).toFixed(1)}%`;
    this.xpTrack.setAttribute('aria-valuemax', String(snapshot.xpToNext));
    this.xpTrack.setAttribute('aria-valuenow', String(Math.max(0, snapshot.xp)));
    this.xpTrack.setAttribute('aria-valuetext', `${en.hudLevel} ${snapshot.level}, ${snapshot.xp}/${snapshot.xpToNext} ${en.hudXp}`);

    this.updatePerks(snapshot.perks);
    this.updateLaser(snapshot.laser);
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    this.section.hidden = !visible;
    if (!visible) {
      this.closePerks();
      this.stopLaserTimer();
    } else if (this.laser) {
      this.syncLaserClock();
    }
  }

  dispose(): void {
    this.stopLaserTimer();
    document.removeEventListener('keydown', this.handleKeydown);
    this.pauseButton.removeEventListener('click', this.handlePause);
    this.perksButton.removeEventListener('click', this.handlePerksToggle);
    this.laserButton.removeEventListener('click', this.handleLaser);
    this.section.remove();
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

  private updateLaser(laser: LaserHudState | null): void {
    this.laser = laser;
    const acquired = Boolean(laser && laser.acquired);
    this.laserButton.hidden = !acquired;

    if (!laser || !acquired) {
      this.stopLaserTimer();
      return;
    }

    this.laserButton.hidden = false;
    this.laserCooldownMs = Math.max(1, laser.cooldownMs);
    this.laserEndsAt = performance.now() + Math.max(0, laser.remainingMs);
    this.laserButton.setAttribute('aria-label', en.hudLaser);
    this.syncLaserClock();
  }

  private syncLaserClock(): void {
    if (!this.laser || !this.laser.acquired || !this.visible) {
      this.stopLaserTimer();
      return;
    }

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

  private readonly handleLaser = (): void => {
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
