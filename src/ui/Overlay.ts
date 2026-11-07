import type { GameCommands, HudPhase, HudSnapshot } from '../game/contracts';
import { en } from '../i18n/en';

export interface OverlayOptions {
  root: HTMLElement;
  controller: GameCommands;
}

type OverlayKind = 'paused' | 'cleared' | 'defeat';

interface OverlayParts {
  root: HTMLElement;
  primary: HTMLButtonElement;
  secondary: HTMLButtonElement | null;
  scoreRow: HTMLElement | null;
  scoreValue: HTMLElement | null;
}

function buildOverlay(
  kind: OverlayKind,
  title: string,
  body: string,
  primaryLabel: string,
  primaryHandler: () => void,
  secondaryLabel: string | null = null,
  secondaryHandler: (() => void) | null = null,
  withScore = false,
): OverlayParts {
  const root = document.createElement('section');
  root.className = 'overlay';
  root.dataset.kind = kind;
  root.hidden = true;

  const panel = document.createElement('div');
  panel.className = 'overlay__panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');

  const heading = document.createElement('h2');
  heading.className = 'overlay__title';
  heading.id = `overlay-${kind}-title`;
  heading.textContent = title;
  panel.setAttribute('aria-labelledby', heading.id);

  const bodyElement = document.createElement('p');
  bodyElement.className = 'overlay__body';
  bodyElement.textContent = body;

  const actions = document.createElement('div');
  actions.className = 'overlay__actions';

  const primary = document.createElement('button');
  primary.type = 'button';
  primary.className = 'overlay__button overlay__button--primary';
  primary.textContent = primaryLabel;
  primary.addEventListener('click', () => {
    primaryHandler();
    primary.blur();
  });
  actions.append(primary);

  let secondary: HTMLButtonElement | null = null;
  if (secondaryLabel && secondaryHandler) {
    secondary = document.createElement('button');
    secondary.type = 'button';
    secondary.className = 'overlay__button overlay__button--secondary';
    secondary.textContent = secondaryLabel;
    secondary.addEventListener('click', () => {
      secondaryHandler();
      secondary?.blur();
    });
    actions.append(secondary);
  }

  let scoreRow: HTMLElement | null = null;
  let scoreValue: HTMLElement | null = null;
  if (withScore) {
    scoreRow = document.createElement('p');
    scoreRow.className = 'overlay__score';

    const scoreLabel = document.createElement('span');
    scoreLabel.className = 'overlay__score-label';
    scoreLabel.textContent = en.overlayScore;

    scoreValue = document.createElement('span');
    scoreValue.className = 'overlay__score-value';

    scoreRow.append(scoreLabel, scoreValue);
  }

  panel.append(heading, bodyElement);
  if (scoreRow && scoreValue) panel.append(scoreRow);
  panel.append(actions);
  root.append(panel);

  return { root, primary, secondary, scoreRow, scoreValue };
}

/** Pause, wave-cleared and defeat dialogs. Only one is visible at a time. */
export class HudOverlay {
  private readonly controller: GameCommands;
  private readonly paused: OverlayParts;
  private readonly cleared: OverlayParts;
  private readonly defeat: OverlayParts;
  private current: OverlayKind | null = null;

  constructor(options: OverlayOptions) {
    this.controller = options.controller;

    this.paused = buildOverlay(
      'paused',
      en.pauseTitle,
      en.pauseBody,
      en.resume,
      () => this.controller.resume(),
      en.restart,
      () => this.controller.restartWave(),
    );

    this.cleared = buildOverlay(
      'cleared',
      en.clearedTitle,
      en.clearedBody,
      en.playAgain,
      () => this.controller.restartWave(),
      null,
      null,
      true,
    );

    this.defeat = buildOverlay(
      'defeat',
      en.defeatTitle,
      en.defeatBody,
      en.retry,
      () => this.controller.restartWave(),
      null,
      null,
      true,
    );

    options.root.append(this.paused.root, this.cleared.root, this.defeat.root);
  }

  update(snapshot: HudSnapshot): void {
    const kind = this.kindFor(snapshot.phase);
    this.show(kind);
    this.setScore(this.cleared, snapshot.score);
    this.setScore(this.defeat, snapshot.score);
  }

  dispose(): void {
    this.paused.root.remove();
    this.cleared.root.remove();
    this.defeat.root.remove();
    this.current = null;
  }

  private kindFor(phase: HudPhase): OverlayKind | null {
    if (phase === 'paused') return 'paused';
    if (phase === 'cleared') return 'cleared';
    if (phase === 'defeat') return 'defeat';
    return null;
  }

  private show(kind: OverlayKind | null): void {
    const changed = kind !== this.current;
    this.paused.root.hidden = kind !== 'paused';
    this.cleared.root.hidden = kind !== 'cleared';
    this.defeat.root.hidden = kind !== 'defeat';
    this.current = kind;

    if (changed && kind !== null) {
      const parts = this.partsFor(kind);
      window.requestAnimationFrame(() => {
        if (!parts.root.hidden) parts.primary.focus({ preventScroll: true });
      });
    }
  }

  private partsFor(kind: OverlayKind): OverlayParts {
    if (kind === 'paused') return this.paused;
    if (kind === 'cleared') return this.cleared;
    return this.defeat;
  }

  private setScore(parts: OverlayParts, score: number): void {
    if (parts.scoreValue) parts.scoreValue.textContent = score.toLocaleString('en-US');
  }
}
