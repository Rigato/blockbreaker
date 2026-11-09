import type { PhaseSelectInfo } from '../game/contracts';
import { en } from '../i18n/en';
import { formatScore, formatTime } from './format';

export interface PhaseSelectOptions {
  root: HTMLElement;
  onStart: (phaseId: string) => void;
  onBack: () => void;
}

/**
 * Phase selection screen. It always renders three card slots: real data when
 * the game exposes it and an inert placeholder while the M3 save/flow seam is
 * still a stub.
 */
export class PhaseSelect {
  private readonly onStart: (phaseId: string) => void;
  private readonly onBack: () => void;
  private readonly overlay: HTMLElement;
  private readonly panel: HTMLElement;
  private readonly list: HTMLElement;
  private readonly empty: HTMLElement;
  private readonly backButton: HTMLButtonElement;
  private readonly unsubscribeKeydown: () => void;
  private visible = false;
  private selectedPhaseId: string | null = null;
  private previousFocus: HTMLElement | null = null;

  constructor(options: PhaseSelectOptions) {
    this.onStart = options.onStart;
    this.onBack = options.onBack;

    const overlay = document.createElement('section');
    this.overlay = overlay;
    overlay.className = 'phase-select';
    overlay.hidden = true;

    const panel = document.createElement('div');
    this.panel = panel;
    panel.className = 'phase-select__panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'phase-select-title');

    const head = document.createElement('header');
    head.className = 'phase-select__head';

    const title = document.createElement('h2');
    title.className = 'phase-select__title';
    title.id = 'phase-select-title';
    title.textContent = en.phaseSelectTitle;

    const subtitle = document.createElement('p');
    subtitle.className = 'phase-select__subtitle';
    subtitle.textContent = en.phaseSelectSubtitle;

    head.append(title, subtitle);

    const list = document.createElement('div');
    this.list = list;
    list.className = 'phase-select__list';

    const empty = document.createElement('p');
    this.empty = empty;
    empty.className = 'phase-select__empty';
    empty.textContent = en.phaseSelectEmpty;

    const back = document.createElement('button');
    this.backButton = back;
    back.type = 'button';
    back.className = 'phase-select__back';
    back.textContent = en.back;
    back.addEventListener('click', this.handleBack);

    panel.append(head, list, empty, back);
    overlay.append(panel);
    options.root.append(overlay);

    this.unsubscribeKeydown = this.listenKeys();
  }

  get isOpen(): boolean {
    return this.visible;
  }

  get selection(): string | null {
    return this.selectedPhaseId;
  }

  open(info: readonly PhaseSelectInfo[], selectedPhaseId: string | null): void {
    this.selectedPhaseId = selectedPhaseId;
    this.render(info);
    if (this.visible) return;

    this.visible = true;
    this.previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.overlay.hidden = false;

    window.requestAnimationFrame(() => {
      if (!this.visible) return;
      const target =
        this.list.querySelector<HTMLButtonElement>('.phase-card:not(:disabled)') ?? this.backButton;
      target.focus({ preventScroll: true });
    });
  }

  close(): void {
    if (!this.visible) return;
    this.visible = false;
    this.overlay.hidden = true;

    const target = this.previousFocus;
    this.previousFocus = null;
    if (target && target.isConnected) target.focus({ preventScroll: true });
  }

  refresh(info: readonly PhaseSelectInfo[], selectedPhaseId: string | null): void {
    this.selectedPhaseId = selectedPhaseId;
    if (this.visible) this.render(info);
  }

  dispose(): void {
    this.unsubscribeKeydown();
    this.backButton.removeEventListener('click', this.handleBack);
    this.overlay.remove();
  }

  private render(info: readonly PhaseSelectInfo[]): void {
    this.list.replaceChildren(...info.map((phase, index) => this.buildCard(phase, index)));
    this.empty.hidden = info.length > 0;
  }

  private buildCard(phase: PhaseSelectInfo, index: number): HTMLButtonElement {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'phase-card';
    card.dataset.phaseIndex = String(phase.index || index + 1);

    card.dataset.phaseId = phase.id;
    card.classList.toggle('is-locked', !phase.unlocked);
    card.classList.toggle('is-selected', phase.id === this.selectedPhaseId);
    const boss = phase.index >= 4;
    card.classList.toggle('is-boss', boss);

    if (!phase.unlocked) {
      card.disabled = true;
      card.setAttribute('aria-label', `${phase.name} · ${en.phaseLocked}`);
      card.append(
        this.buildHead(phase.index || index + 1, true, false, boss),
        this.buildName(phase.name),
        this.buildStats(phase),
      );
      return card;
    }

    card.setAttribute('aria-label', `${phase.name} · ${en.play}`);
    card.append(
      this.buildHead(phase.index || index + 1, false, true, boss),
      this.buildName(phase.name),
      this.buildStats(phase),
    );
    card.addEventListener('click', () => this.choose(phase.id));
    return card;
  }

  private buildHead(index: number, locked: boolean, playable: boolean, boss: boolean): HTMLElement {
    const head = document.createElement('span');
    head.className = 'phase-card__head';

    const identity = document.createElement('span');
    identity.className = 'phase-card__identity';

    const label = document.createElement('span');
    label.className = 'phase-card__index';
    label.textContent = `${en.phaseLabel} ${index}`;

    identity.append(label);

    if (boss) {
      const badge = document.createElement('span');
      badge.className = 'phase-card__badge';
      badge.textContent = en.phaseBoss;
      identity.append(badge);
    }

    const status = document.createElement('span');
    status.className = 'phase-card__status';

    if (locked) {
      const lock = document.createElement('span');
      lock.className = 'phase-card__lock';
      lock.setAttribute('aria-hidden', 'true');
      status.append(lock);
      status.append(document.createTextNode(en.phaseLocked));
      status.classList.add('is-locked');
    } else if (playable) {
      status.textContent = en.play;
      status.classList.add('is-play');
    } else {
      status.textContent = en.phaseSelectUnavailable;
    }

    head.append(identity, status);
    return head;
  }

  private buildName(name: string): HTMLElement {
    const title = document.createElement('span');
    title.className = 'phase-card__name';
    title.textContent = name;
    return title;
  }

  private buildStats(phase: PhaseSelectInfo): HTMLElement {
    const stats = document.createElement('span');
    stats.className = 'phase-card__stats';

    const bestTime = document.createElement('span');
    bestTime.className = 'phase-card__stat';
    bestTime.append(
      this.buildStatLabel(en.menuBestTime),
      this.buildStatValue(formatTime(phase.bestTimeMs)),
    );

    const bestScore = document.createElement('span');
    bestScore.className = 'phase-card__stat';
    bestScore.append(
      this.buildStatLabel(en.menuBestScore),
      this.buildStatValue(formatScore(phase.bestScore)),
    );

    stats.append(bestTime, bestScore);

    const meta = document.createElement('span');
    meta.className = 'phase-card__meta';
    meta.textContent = `${en.phaseAttempts} ${phase.attempts} · ${en.phaseClears} ${phase.clears}`;
    stats.append(meta);

    return stats;
  }

  private buildStatLabel(label: string): HTMLElement {
    const element = document.createElement('span');
    element.className = 'phase-card__stat-label';
    element.textContent = label;
    return element;
  }

  private buildStatValue(value: string): HTMLElement {
    const element = document.createElement('strong');
    element.className = 'phase-card__stat-value';
    element.textContent = value;
    return element;
  }

  private choose(phaseId: string): void {
    this.selectedPhaseId = phaseId;
    this.onStart(phaseId);
  }

  private listenKeys(): () => void {
    const handler = (event: KeyboardEvent): void => {
      if (!this.visible) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        this.onBack();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        this.panel.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
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
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }

  private readonly handleBack = (): void => {
    this.onBack();
  };
}
