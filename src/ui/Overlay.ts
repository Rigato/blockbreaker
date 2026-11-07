import type { GameCommands, HudSnapshot, PerkState } from '../game/contracts';
import { en } from '../i18n/en';

export interface OverlayOptions {
  root: HTMLElement;
  controller: GameCommands;
}

type OverlayKind = 'paused' | 'cleared' | 'complete' | 'defeat';

interface OverlayParts {
  root: HTMLElement;
  primary: HTMLButtonElement;
  primaryLabel: HTMLElement;
  secondary: HTMLButtonElement | null;
  secondaryLabel: HTMLElement | null;
  title: HTMLElement;
  body: HTMLElement;
  scoreValue: HTMLElement | null;
  levelValue: HTMLElement | null;
  waveValue: HTMLElement | null;
  perksList: HTMLElement | null;
}

interface OverlayButton {
  label: string;
  handler: () => void;
}

function buildOverlay(
  kind: OverlayKind,
  titleText: string,
  bodyText: string,
  primary: OverlayButton,
  secondary: OverlayButton | null = null,
  withSummary = false,
): OverlayParts {
  const root = document.createElement('section');
  root.className = 'overlay';
  root.dataset.kind = kind;
  root.hidden = true;

  const panel = document.createElement('div');
  panel.className = 'overlay__panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');

  const title = document.createElement('h2');
  title.className = 'overlay__title';
  title.id = `overlay-${kind}-title`;
  title.textContent = titleText;
  panel.setAttribute('aria-labelledby', title.id);

  const body = document.createElement('p');
  body.className = 'overlay__body';
  body.textContent = bodyText;

  panel.append(title, body);

  let scoreValue: HTMLElement | null = null;
  let levelValue: HTMLElement | null = null;
  let waveValue: HTMLElement | null = null;
  let perksList: HTMLElement | null = null;

  if (withSummary) {
    const summary = document.createElement('dl');
    summary.className = 'overlay__summary';

    const row = (label: string): HTMLElement => {
      const term = document.createElement('dt');
      term.className = 'overlay__summary-label';
      term.textContent = label;

      const value = document.createElement('dd');
      value.className = 'overlay__summary-value';
      summary.append(term, value);
      return value;
    };

    scoreValue = row(en.overlayScore);
    levelValue = row(en.overlayLevel);
    waveValue = row(en.overlayWave);
    panel.append(summary);

    const perksTitle = document.createElement('h3');
    perksTitle.className = 'overlay__perks-title';
    perksTitle.textContent = en.overlayPerks;

    perksList = document.createElement('ul');
    perksList.className = 'overlay__perks-list';

    panel.append(perksTitle, perksList);
  }

  const actions = document.createElement('div');
  actions.className = 'overlay__actions';

  const primaryButton = document.createElement('button');
  primaryButton.type = 'button';
  primaryButton.className = 'overlay__button overlay__button--primary';

  const primaryLabel = document.createElement('span');
  primaryLabel.textContent = primary.label;
  primaryButton.append(primaryLabel);
  primaryButton.addEventListener('click', () => {
    primary.handler();
    primaryButton.blur();
  });
  actions.append(primaryButton);

  let secondaryButton: HTMLButtonElement | null = null;
  let secondaryLabel: HTMLElement | null = null;
  if (secondary) {
    secondaryButton = document.createElement('button');
    secondaryButton.type = 'button';
    secondaryButton.className = 'overlay__button overlay__button--secondary';

    secondaryLabel = document.createElement('span');
    secondaryLabel.textContent = secondary.label;
    secondaryButton.append(secondaryLabel);
    secondaryButton.addEventListener('click', () => {
      secondary.handler();
      secondaryButton?.blur();
    });
    actions.append(secondaryButton);
  }

  panel.append(actions);
  root.append(panel);

  return {
    root,
    primary: primaryButton,
    primaryLabel,
    secondary: secondaryButton,
    secondaryLabel,
    title,
    body,
    scoreValue,
    levelValue,
    waveValue,
    perksList,
  };
}

/**
 * Pause, wave-cleared, run-complete and defeat dialogs. Only one is visible at
 * a time. The menu is never reopened from here: clears and defeats always offer
 * progress or a full-run restart.
 *
 * Pause restart intentionally restarts the current wave (`restartWave`); the
 * full-run reset lives on the results dialogs as "Restart run"/"Play again".
 */
export class HudOverlay {
  private readonly paused: OverlayParts;
  private readonly cleared: OverlayParts;
  private readonly complete: OverlayParts;
  private readonly defeat: OverlayParts;
  private current: OverlayKind | null = null;
  private perksSignature = '__unset__';

  constructor(options: OverlayOptions) {
    const controller = options.controller;

    this.paused = buildOverlay(
      'paused',
      en.pauseTitle,
      en.pauseBody,
      { label: en.resume, handler: () => controller.resume() },
      { label: en.restartWave, handler: () => controller.restartWave() },
    );

    this.cleared = buildOverlay(
      'cleared',
      en.clearedTitle,
      en.clearedBody,
      { label: en.nextWave, handler: () => controller.nextWave() },
      { label: en.restartRun, handler: () => controller.restartRun() },
      true,
    );

    this.complete = buildOverlay(
      'complete',
      en.runCompleteTitle,
      en.runCompleteBody,
      { label: en.playAgain, handler: () => controller.restartRun() },
      null,
      true,
    );

    this.defeat = buildOverlay(
      'defeat',
      en.defeatTitle,
      en.defeatBody,
      { label: en.retry, handler: () => controller.restartRun() },
      null,
      true,
    );

    options.root.append(
      this.paused.root,
      this.cleared.root,
      this.complete.root,
      this.defeat.root,
    );
  }

  update(snapshot: HudSnapshot): void {
    const kind = this.kindFor(snapshot);
    this.updateResults(snapshot);
    this.show(kind);
  }

  dispose(): void {
    this.paused.root.remove();
    this.cleared.root.remove();
    this.complete.root.remove();
    this.defeat.root.remove();
    this.current = null;
  }

  private kindFor(snapshot: HudSnapshot): OverlayKind | null {
    switch (snapshot.phase) {
      case 'paused':
        return 'paused';
      case 'cleared':
        // The last wave of the run reads as a completed run, not a wave clear.
        return snapshot.waveIndex < snapshot.waveCount ? 'cleared' : 'complete';
      case 'run-complete':
        return 'complete';
      case 'defeat':
        return 'defeat';
      default:
        return null;
    }
  }

  private updateResults(snapshot: HudSnapshot): void {
    for (const parts of [this.cleared, this.complete, this.defeat]) {
      if (parts.scoreValue) parts.scoreValue.textContent = snapshot.score.toLocaleString('en-US');
      if (parts.levelValue) parts.levelValue.textContent = String(snapshot.level);
      if (parts.waveValue) {
        parts.waveValue.textContent = `${Math.max(1, snapshot.waveIndex)}/${snapshot.waveCount}`;
      }
    }

    this.updatePerks(snapshot.perks);
  }

  private updatePerks(perks: readonly PerkState[]): void {
    const signature = perks.map((perk) => `${perk.id}:${perk.level}`).join('|');
    if (signature === this.perksSignature) return;
    this.perksSignature = signature;

    const items = perks.length
      ? perks.map((perk) => {
          const item = document.createElement('li');
          item.className = 'overlay__perk';
          item.textContent = perk.maxLevel > 1 ? `${perk.name} · ${en.hudPerkLevel} ${perk.level}` : perk.name;
          return item;
        })
      : [
          (() => {
            const item = document.createElement('li');
            item.className = 'overlay__perk overlay__perk--empty';
            item.textContent = en.overlayNoPerks;
            return item;
          })(),
        ];

    for (const parts of [this.cleared, this.complete, this.defeat]) {
      parts.perksList?.replaceChildren(...items.map((item) => item.cloneNode(true)));
    }
  }

  private show(kind: OverlayKind | null): void {
    const changed = kind !== this.current;
    this.paused.root.hidden = kind !== 'paused';
    this.cleared.root.hidden = kind !== 'cleared';
    this.complete.root.hidden = kind !== 'complete';
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
    if (kind === 'complete') return this.complete;
    return this.defeat;
  }
}
