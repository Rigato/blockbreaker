import type {
  GameCommands,
  HudSnapshot,
  PerkState,
  PhaseResult,
} from '../game/contracts';
import { en } from '../i18n/en';
import { formatScore, formatTime } from './format';

export interface OverlayOptions {
  root: HTMLElement;
  controller: GameCommands;
}

interface SummaryRow {
  value: HTMLElement;
}

function buildSummaryRow(summary: HTMLElement, label: string): SummaryRow {
  const term = document.createElement('dt');
  term.className = 'overlay__summary-label';
  term.textContent = label;

  const value = document.createElement('dd');
  value.className = 'overlay__summary-value';

  summary.append(term, value);
  return { value };
}

function buildPanel(titleId: string, className: string): {
  section: HTMLElement;
  panel: HTMLElement;
} {
  const section = document.createElement('section');
  section.className = `overlay ${className}`;
  section.hidden = true;

  const panel = document.createElement('div');
  panel.className = 'overlay__panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', titleId);

  section.append(panel);
  return { section, panel };
}

function buildAction(label: string, modifier: string, handler: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `overlay__button ${modifier}`;

  const text = document.createElement('span');
  text.textContent = label;

  button.append(text);
  button.addEventListener('click', () => {
    handler();
    button.blur();
  });
  return button;
}

/**
 * Pause dialog plus the phase results screen.
 *
 * Wave clears deliberately have no dialog: the game advances automatically
 * after a short transition and the HUD stays visible. Results only open for
 * `run-complete` / `defeat`, driven by `HudSnapshot.result`.
 */
export class HudOverlay {
  private readonly controller: GameCommands;
  private readonly pauseSection: HTMLElement;
  private readonly resumeButton: HTMLButtonElement;
  private readonly restartButton: HTMLButtonElement;
  private readonly soundButton: HTMLButtonElement;
  private readonly soundValue: HTMLElement;

  private readonly resultsSection: HTMLElement;
  private readonly resultsPanel: HTMLElement;
  private readonly resultsKicker: HTMLElement;
  private readonly resultsTitle: HTMLElement;
  private readonly resultsPhase: HTMLElement;
  private readonly resultsScore: HTMLElement;
  private readonly resultsTime: HTMLElement;
  private readonly resultsBestScore: HTMLElement;
  private readonly resultsBestTime: HTMLElement;
  private readonly resultsLevel: HTMLElement;
  private readonly resultsPerks: HTMLElement;
  private readonly retryButton: HTMLButtonElement;
  private readonly nextButton: HTMLButtonElement;
  private readonly menuButton: HTMLButtonElement;

  private pauseVisible = false;
  private resultsVisible = false;
  private lastResultPhase: string | null = null;
  private perksSignature = '__unset__';
  private soundEnabled = true;
  private readonly unsubscribeKeydown: () => void;

  constructor(options: OverlayOptions) {
    const controller = options.controller;
    this.controller = controller;

    const pause = buildPanel('overlay-pause-title', 'overlay--pause');
    this.pauseSection = pause.section;

    const pauseTitle = document.createElement('h2');
    pauseTitle.className = 'overlay__title';
    pauseTitle.id = 'overlay-pause-title';
    pauseTitle.textContent = en.pauseTitle;

    const pauseBody = document.createElement('p');
    pauseBody.className = 'overlay__body';
    pauseBody.textContent = en.pauseBody;

    const pauseActions = document.createElement('div');
    pauseActions.className = 'overlay__actions';

    this.resumeButton = buildAction(en.resume, 'overlay__button--primary', () => controller.resume());
    this.restartButton = buildAction(en.restartWave, 'overlay__button--secondary', () =>
      controller.restartWave(),
    );

    const sound = document.createElement('div');
    sound.className = 'overlay__setting';

    const soundLabel = document.createElement('span');
    soundLabel.className = 'overlay__setting-label';
    soundLabel.textContent = en.menuSound;

    const soundButton = document.createElement('button');
    this.soundButton = soundButton;
    soundButton.type = 'button';
    soundButton.className = 'overlay__switch';
    soundButton.setAttribute('role', 'switch');
    soundButton.setAttribute('aria-label', en.menuSound);
    soundButton.addEventListener('click', this.handleSound);

    const soundTrack = document.createElement('span');
    soundTrack.className = 'overlay__switch-track';
    soundTrack.setAttribute('aria-hidden', 'true');

    const soundThumb = document.createElement('span');
    soundThumb.className = 'overlay__switch-thumb';
    soundTrack.append(soundThumb);

    const soundValue = document.createElement('span');
    this.soundValue = soundValue;
    soundValue.className = 'overlay__switch-value';

    soundButton.append(soundTrack, soundValue);
    sound.append(soundLabel, soundButton);

    const pauseMenuButton = buildAction(en.overlayMenu, 'overlay__button--ghost', () =>
      controller.returnToMenu(),
    );

    pauseActions.append(
      this.resumeButton,
      this.restartButton,
      sound,
      pauseMenuButton,
    );
    pause.panel.append(pauseTitle, pauseBody, pauseActions);
    this.applySound(true);

    const results = buildPanel('overlay-results-title', 'overlay--results');
    this.resultsSection = results.section;
    this.resultsPanel = results.panel;

    this.resultsKicker = document.createElement('p');
    this.resultsKicker.className = 'overlay__kicker';
    this.resultsKicker.id = 'overlay-results-kicker';

    this.resultsTitle = document.createElement('h2');
    this.resultsTitle.className = 'overlay__title';
    this.resultsTitle.id = 'overlay-results-title';

    this.resultsPhase = document.createElement('p');
    this.resultsPhase.className = 'overlay__phase';

    const summary = document.createElement('dl');
    summary.className = 'overlay__summary';

    this.resultsScore = buildSummaryRow(summary, en.overlayScore).value;
    this.resultsTime = buildSummaryRow(summary, en.overlayTime).value;
    this.resultsBestScore = buildSummaryRow(summary, en.overlayBestScore).value;
    this.resultsBestTime = buildSummaryRow(summary, en.overlayBestTime).value;
    this.resultsLevel = buildSummaryRow(summary, en.overlayLevel).value;

    const perksTitle = document.createElement('h3');
    perksTitle.className = 'overlay__perks-title';
    perksTitle.textContent = en.overlayPerks;

    this.resultsPerks = document.createElement('ul');
    this.resultsPerks.className = 'overlay__perks-list';

    const resultsActions = document.createElement('div');
    resultsActions.className = 'overlay__actions';

    this.retryButton = buildAction(en.retry, 'overlay__button--primary', () =>
      controller.restartPhase(),
    );
    this.nextButton = buildAction(en.overlayNextPhase, 'overlay__button--secondary', () =>
      controller.nextPhase(),
    );
    this.menuButton = buildAction(en.overlayMenu, 'overlay__button--ghost', () =>
      controller.returnToMenu(),
    );
    resultsActions.append(this.retryButton, this.nextButton, this.menuButton);

    this.resultsPanel.append(
      this.resultsKicker,
      this.resultsTitle,
      this.resultsPhase,
      summary,
      perksTitle,
      this.resultsPerks,
      resultsActions,
    );

    options.root.append(this.pauseSection, this.resultsSection);

    this.unsubscribeKeydown = this.listenKeys();
  }

  update(snapshot: HudSnapshot): void {
    this.applySound(snapshot.soundEnabled);

    const pause = snapshot.phase === 'paused';
    if (pause) this.showPause();
    else this.hidePause();

    const result = this.resultFor(snapshot);
    if (result) {
      this.renderResult(result);
      this.showResults(result);
    } else {
      this.hideResults();
    }
  }

  /** Primary action of the results dialog, used to restore focus after an ad. */
  resultsFocusTarget(): HTMLElement | null {
    if (!this.resultsVisible || this.resultsSection.hidden) return null;
    return this.retryButton.hidden ? this.nextButton : this.retryButton;
  }

  dispose(): void {
    this.unsubscribeKeydown();
    this.pauseSection.remove();
    this.resultsSection.remove();
  }

  private resultFor(snapshot: HudSnapshot): PhaseResult | null {
    if (snapshot.phase !== 'run-complete' && snapshot.phase !== 'defeat') return null;
    if (snapshot.result) return snapshot.result;

    // Defensive fallback for an integration that has not populated `result`
    // yet. The real M3 flow always supplies it.
    const victory = snapshot.phase === 'run-complete';
    return {
      phaseId: snapshot.phaseId,
      phaseName: snapshot.phaseName,
      phaseIndex: snapshot.phaseIndex,
      phaseCount: snapshot.phaseCount,
      victory,
      score: snapshot.score,
      timeMs: snapshot.elapsedMs,
      level: snapshot.level,
      perks: snapshot.perks,
      bestScore: snapshot.bestScore,
      bestTimeMs: snapshot.bestTimeMs,
      nextPhaseId:
        victory && snapshot.phaseIndex < snapshot.phaseCount ? snapshot.phaseId : null,
    };
  }

  private renderResult(result: PhaseResult): void {
    this.resultsKicker.textContent = result.victory ? en.resultVictory : en.resultDefeat;
    this.resultsKicker.dataset.kind = result.victory ? 'victory' : 'defeat';
    this.resultsTitle.textContent = result.phaseName;
    this.resultsPhase.textContent = `${en.phaseLabel} ${result.phaseIndex} ${en.phaseOf} ${Math.max(
      1,
      result.phaseCount,
    )}`;

    this.resultsScore.textContent = formatScore(result.score);
    this.resultsTime.textContent = formatTime(result.timeMs);
    this.resultsBestScore.textContent = formatScore(result.bestScore);
    this.resultsBestTime.textContent = formatTime(result.bestTimeMs);
    this.resultsLevel.textContent = String(result.level);

    const showNext = result.victory && result.nextPhaseId !== null;
    this.nextButton.hidden = !showNext;

    this.renderPerks(result.perks);

    this.resultsPanel.setAttribute(
      'aria-label',
      `${result.victory ? en.resultVictory : en.resultDefeat} · ${result.phaseName}`,
    );
  }

  private renderPerks(perks: readonly PerkState[]): void {
    const signature = perks.map((perk) => `${perk.id}:${perk.level}`).join('|');
    if (signature === this.perksSignature) return;
    this.perksSignature = signature;

    const items = perks.length
      ? perks.map((perk) => {
          const item = document.createElement('li');
          item.className = 'overlay__perk';
          item.textContent =
            perk.maxLevel > 1 ? `${perk.name} · ${en.hudPerkLevel} ${perk.level}` : perk.name;
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

    this.resultsPerks.replaceChildren(...items);
  }

  private showPause(): void {
    if (this.pauseVisible) return;
    this.pauseVisible = true;
    this.pauseSection.hidden = false;
    this.focusFirst(this.pauseSection, this.resumeButton);
  }

  private applySound(enabled: boolean): void {
    this.soundEnabled = enabled;
    this.soundButton.classList.toggle('is-on', enabled);
    this.soundButton.setAttribute('aria-checked', String(enabled));
    this.soundValue.textContent = enabled ? en.soundOn : en.soundOff;
  }

  private readonly handleSound = (): void => {
    const next = !this.soundEnabled;
    this.applySound(next);
    this.controller.setSound(next);
  };

  private hidePause(): void {
    if (!this.pauseVisible) return;
    this.pauseVisible = false;
    this.pauseSection.hidden = true;
  }

  private showResults(result: PhaseResult): void {
    const changed = this.lastResultPhase !== result.phaseId;
    this.lastResultPhase = result.phaseId;
    if (this.resultsVisible) return;

    this.resultsVisible = true;
    this.resultsSection.hidden = false;
    this.focusFirst(this.resultsSection, this.retryButton);

    if (changed) this.resultsSection.dataset.phaseId = result.phaseId;
  }

  private hideResults(): void {
    if (!this.resultsVisible) return;
    this.resultsVisible = false;
    this.resultsSection.hidden = true;
    this.lastResultPhase = null;
  }

  private focusFirst(section: HTMLElement, button: HTMLButtonElement): void {
    window.requestAnimationFrame(() => {
      if (section.hidden) return;
      button.focus({ preventScroll: true });
    });
  }

  private listenKeys(): () => void {
    const handler = (event: KeyboardEvent): void => {
      if (this.resultsVisible) {
        this.trapTab(event, this.resultsSection);
        if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
          // Modal owns gameplay keys while it is open.
          event.stopPropagation();
        }
        return;
      }

      if (!this.pauseVisible) return;
      this.trapTab(event, this.pauseSection);
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
        event.stopPropagation();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }

  private trapTab(event: KeyboardEvent, section: HTMLElement): void {
    if (event.key !== 'Tab') return;
    const focusable = Array.from(
      section.querySelectorAll<HTMLButtonElement>('button:not(:disabled):not([hidden])'),
    );
    if (focusable.length === 0) return;

    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  }
}
