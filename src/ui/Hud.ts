import type { GameCommands, HudSnapshot } from '../game/contracts';
import { GAME_CONFIG } from '../game/config';
import { en } from '../i18n/en';

export interface HudOptions {
  root: HTMLElement;
  controller: GameCommands;
}

/**
 * DOM HUD for the M1 run: wave, active balls, remaining blocks, score and the
 * pause button. It is event-driven and never touches the DOM per frame.
 */
export class Hud {
  private readonly controller: GameCommands;
  private readonly section: HTMLElement;
  private readonly waveText: HTMLElement;
  private readonly ballDots: HTMLElement;
  private readonly blocksValue: HTMLElement;
  private readonly scoreValue: HTMLElement;
  private readonly hint: HTMLElement;
  private readonly pauseButton: HTMLButtonElement;
  private readonly dots: HTMLElement[] = [];

  constructor(options: HudOptions) {
    this.controller = options.controller;

    const section = document.createElement('section');
    this.section = section;
    section.className = 'hud';
    section.hidden = true;
    section.setAttribute('aria-label', en.appTitle);

    const bar = document.createElement('div');
    bar.className = 'hud__bar';

    const wave = document.createElement('div');
    wave.className = 'hud__wave';

    const waveKicker = document.createElement('span');
    waveKicker.className = 'hud__wave-kicker';
    waveKicker.textContent = en.hudWave;

    const waveText = document.createElement('span');
    this.waveText = waveText;
    waveText.className = 'hud__wave-text';

    wave.append(waveKicker, waveText);

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

    const hint = document.createElement('p');
    this.hint = hint;
    hint.className = 'hud__hint';
    hint.setAttribute('role', 'status');

    section.append(bar, hint);
    options.root.append(section);
  }

  update(snapshot: HudSnapshot): void {
    this.waveText.textContent = `${snapshot.waveIndex}/${snapshot.waveCount} · ${snapshot.waveName}`;

    const active = Math.max(0, Math.min(snapshot.ballsActive, this.dots.length));
    this.dots.forEach((dot, index) => {
      dot.classList.toggle('is-on', index < active);
    });
    this.ballDots.setAttribute('aria-label', `${en.hudBalls}: ${snapshot.ballsActive}`);

    this.blocksValue.textContent = String(Math.max(0, snapshot.blocksRemaining));
    this.scoreValue.textContent = snapshot.score.toLocaleString('en-US');
    this.hint.textContent = snapshot.ballStuck ? en.hudLaunchHint : en.hudControlsHint;
  }

  setVisible(visible: boolean): void {
    this.section.hidden = !visible;
  }

  dispose(): void {
    this.pauseButton.removeEventListener('click', this.handlePause);
    this.section.remove();
  }

  private readonly handlePause = (): void => {
    this.controller.togglePause();
  };
}
