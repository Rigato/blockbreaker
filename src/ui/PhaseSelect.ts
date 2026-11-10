import type { PhaseSelectInfo } from '../game/contracts';
import { en } from '../i18n/en';
import { formatScore, formatTime } from './format';
import '../styles/phase-select.css';

export interface PhaseSelectOptions {
  root: HTMLElement;
  onStart: (phaseId: string) => void;
  onBack: () => void;
}

/** Only well-formed theme ids become CSS class suffixes. */
const THEME_CLASS_PATTERN = /^[a-z][a-z0-9-]*$/;

const ARROW_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
  '<path d="M19 12H5M11 6l-6 6 6 6"/>' +
  '</svg>';

const LOCK_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
  '<rect width="16" height="10" x="4" y="10" rx="2"/>' +
  '<path d="M8 10V7a4 4 0 0 1 8 0v3"/>' +
  '</svg>';

/**
 * Bespoke inline theme sigils. One per campaign theme; drawn with simple
 * strokes so they read at 40-58 px and inherit the card accent via
 * `currentColor`.
 */
const THEME_ICONS: Readonly<Record<string, string>> = {
  crystal:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M12 2.5 19.5 8.5 12 21.5 4.5 8.5Z"/>' +
    '<path d="M4.5 8.5h15"/>' +
    '<path d="M12 2.5v19"/>' +
    '<path d="m9.2 8.5 2.8 6.5 2.8-6.5"/>' +
    '</svg>',
  ruins:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M3 20.5h18"/>' +
    '<path d="M6.5 20.5V9.5H9.5v11"/>' +
    '<path d="M4 9.5h8"/>' +
    '<path d="M14.5 20.5V6h3.5v14.5"/>' +
    '<path d="M12.5 6h7"/>' +
    '<path d="M6.5 9.5a6.5 6.5 0 0 1 7.5 0"/>' +
    '</svg>',
  arcane:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<circle cx="12" cy="12" r="8"/>' +
    '<path d="M12 4l6.5 8-6.5 8-6.5-8Z"/>' +
    '<path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>' +
    '<path d="M6.3 6.3 4.9 4.9M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>' +
    '</svg>',
  frost:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M12 3v18"/>' +
    '<path d="M4.5 7.7l15 8.6"/>' +
    '<path d="M19.5 7.7l-15 8.6"/>' +
    '<path d="M9.6 3.5 12 5.9l2.4-2.4M9.6 20.5 12 18.1l2.4 2.4"/>' +
    '</svg>',
  forge:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M12 2.5c1.1 2.5 4.2 4 4.2 7.8a4.2 4.2 0 0 1-8.4 0c0-1.6.6-2.7 1.2-3.6.3 1.3 1.4 1.5 1.6.3-.4-1.7-.7-3.3-.5-4.8.4-1 1.2-1.5 1.9-1.8Z"/>' +
    '<path d="M10.6 12.4c.5 1.4 1.7 2.2 2.8 1.4"/>' +
    '</svg>',
  void:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<circle cx="12" cy="12" r="8.2"/>' +
    '<circle cx="13.8" cy="10.8" r="4.8" fill="currentColor" stroke="none" opacity=".9"/>' +
    '<path d="M18.5 6l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6Z" fill="currentColor" stroke="none"/>' +
    '</svg>',
};

const FALLBACK_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
  '<path d="M12 3l6 6-6 12-6-12Z"/>' +
  '<path d="m6 9 6 6 6-6"/>' +
  '</svg>';

/**
 * Campaign level select. A full-screen chapter grid inside the portrait
 * shell: branded header with progress, then six large collectible phase
 * cards with per-theme sigils, accents, feature chips and stats.
 */
export class PhaseSelect {
  private readonly onStart: (phaseId: string) => void;
  private readonly onBack: () => void;
  private readonly overlay: HTMLElement;
  private readonly panel: HTMLElement;
  private readonly list: HTMLElement;
  private readonly empty: HTMLElement;
  private readonly progress: HTMLElement;
  private readonly progressLabel: HTMLElement;
  private readonly progressTrack: HTMLElement;
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

    // --- Header -------------------------------------------------------------
    const head = document.createElement('header');
    head.className = 'phase-select__head';

    const top = document.createElement('div');
    top.className = 'phase-select__top';

    const back = document.createElement('button');
    this.backButton = back;
    back.type = 'button';
    back.className = 'phase-select__back';
    const backIcon = document.createElement('span');
    backIcon.className = 'phase-select__back-icon';
    backIcon.setAttribute('aria-hidden', 'true');
    backIcon.innerHTML = ARROW_SVG;
    back.append(backIcon, document.createTextNode(en.back));
    back.addEventListener('click', this.handleBack);

    const kicker = document.createElement('span');
    kicker.className = 'phase-select__kicker';
    kicker.textContent = en.phaseSelectTitle;

    top.append(back, kicker);

    const title = document.createElement('h2');
    title.className = 'phase-select__title';
    title.id = 'phase-select-title';
    title.textContent = en.phaseSelectSubtitle;

    const progress = document.createElement('div');
    this.progress = progress;
    progress.className = 'phase-select__progress';

    const progressLabel = document.createElement('span');
    this.progressLabel = progressLabel;
    progressLabel.className = 'phase-select__progress-label';

    const progressTrack = document.createElement('div');
    this.progressTrack = progressTrack;
    progressTrack.className = 'phase-select__track';
    progressTrack.setAttribute('aria-hidden', 'true');

    progress.append(progressLabel, progressTrack);
    head.append(top, title, progress);

    // --- Scrollable chapter list --------------------------------------------
    const list = document.createElement('div');
    this.list = list;
    list.className = 'phase-select__list';

    const empty = document.createElement('p');
    this.empty = empty;
    empty.className = 'phase-select__empty';
    empty.textContent = en.phaseSelectEmpty;

    panel.append(head, list, empty);
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
    this.previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.overlay.hidden = false;

    // Re-arm the entrance animation (CSS disables it under reduced motion).
    this.overlay.classList.remove('is-entering');
    void this.overlay.offsetWidth;
    this.overlay.classList.add('is-entering');

    window.requestAnimationFrame(() => {
      if (!this.visible) return;
      const target =
        this.list.querySelector<HTMLButtonElement>('.phase-card:not(:disabled)') ??
        this.backButton;
      target.focus({ preventScroll: true });
    });
  }

  close(): void {
    if (!this.visible) return;
    this.visible = false;
    this.overlay.classList.remove('is-entering');
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

  // -- Rendering ------------------------------------------------------------

  private render(info: readonly PhaseSelectInfo[]): void {
    const total = info.length;
    const current = this.findCurrent(info);

    const hadFocusInside =
      document.activeElement instanceof HTMLElement && this.list.contains(document.activeElement);

    this.list.replaceChildren(...info.map((phase, index) => this.buildCard(phase, index, total, current)));
    this.list.hidden = total === 0;
    this.empty.hidden = total > 0;
    this.progress.hidden = total === 0;
    this.updateProgress(info, current);

    // Rebuilding the cards detached the focused card; hand focus to the next
    // playable one without disturbing the scroll position.
    if (hadFocusInside && document.activeElement === document.body) {
      const target =
        this.list.querySelector<HTMLButtonElement>('.phase-card:not(:disabled)') ??
        this.backButton;
      target.focus({ preventScroll: true });
    }
  }

  /** First unfinished unlocked phase, else the last unlocked phase. */
  private findCurrent(info: readonly PhaseSelectInfo[]): PhaseSelectInfo | null {
    return (
      info.find((phase) => phase.unlocked && phase.clears === 0) ??
      [...info].reverse().find((phase) => phase.unlocked) ??
      null
    );
  }

  private updateProgress(info: readonly PhaseSelectInfo[], current: PhaseSelectInfo | null): void {
    const cleared = info.filter((phase) => phase.clears > 0).length;
    this.progressLabel.textContent = en.phaseProgress
      .replace('{{cleared}}', String(cleared))
      .replace('{{total}}', String(info.length));

    const segments = info.map((phase) => {
      const segment = document.createElement('span');
      segment.className = 'phase-select__seg';
      segment.classList.toggle('is-clear', phase.clears > 0);
      segment.classList.toggle('is-current', phase.id === current?.id && phase.clears === 0);
      return segment;
    });
    this.progressTrack.replaceChildren(...segments);
  }

  private buildCard(
    phase: PhaseSelectInfo,
    index: number,
    total: number,
    current: PhaseSelectInfo | null,
  ): HTMLButtonElement {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'phase-card';
    card.dataset.phaseId = phase.id;

    const phaseIndex = phase.index || index + 1;
    card.dataset.phaseIndex = String(phaseIndex);

    const themeId = THEME_CLASS_PATTERN.test(phase.themeId) ? phase.themeId : 'crystal';
    card.dataset.theme = themeId;
    card.classList.add(`phase-card--${themeId}`);
    card.classList.toggle('is-locked', !phase.unlocked);
    card.classList.toggle('is-selected', phase.id === this.selectedPhaseId);
    card.classList.toggle('is-current', phase.id === current?.id);
    card.classList.toggle('is-boss', phase.unlocked && phase.bossName !== null);

    card.style.setProperty('--phase-accent', phase.accent || '#7ef9ff');
    card.style.setProperty('--card-i', String(index));

    const texture = document.createElement('span');
    texture.className = 'phase-card__texture';
    texture.setAttribute('aria-hidden', 'true');

    const body = document.createElement('span');
    body.className = 'phase-card__body';
    body.append(
      this.buildHead(phaseIndex, total),
      this.buildName(phase.name),
      this.buildTagline(phase.tagline),
    );

    if (!phase.unlocked) {
      card.disabled = true;
      card.setAttribute(
        'aria-label',
        `${phase.name} · ${en.phaseLabel} ${phaseIndex} · ${en.phaseLocked}`,
      );
      body.append(this.buildLockNote());
    } else {
      card.setAttribute(
        'aria-label',
        `${phase.name} · ${en.phaseLabel} ${phaseIndex} · ${en.play}`,
      );
      body.append(this.buildFeatures(phase));
      if (phase.bossName) body.append(this.buildBoss(phase.bossName));
      body.append(this.buildFooter(phase));
      card.addEventListener('click', () => this.choose(phase.id));
    }

    card.append(texture, this.buildIcon(themeId, !phase.unlocked), body);
    return card;
  }

  private buildIcon(themeId: string, locked: boolean): HTMLElement {
    const icon = document.createElement('span');
    icon.className = 'phase-card__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = THEME_ICONS[themeId] ?? FALLBACK_ICON;

    if (locked) {
      const badge = document.createElement('span');
      badge.className = 'phase-card__lockbadge';
      badge.setAttribute('aria-hidden', 'true');
      badge.innerHTML = LOCK_SVG;
      icon.append(badge);
    }
    return icon;
  }

  private buildHead(index: number, total: number): HTMLElement {
    const head = document.createElement('span');
    head.className = 'phase-card__head';

    const label = document.createElement('span');
    label.className = 'phase-card__index';
    label.textContent = `${en.phaseLabel} ${index}`;

    const difficulty = document.createElement('span');
    difficulty.className = 'phase-card__difficulty';
    difficulty.setAttribute('role', 'img');
    difficulty.setAttribute('aria-label', `Difficulty ${index} of ${total}`);
    for (let pip = 0; pip < total; pip += 1) {
      const cell = document.createElement('span');
      cell.className = 'phase-card__pip';
      cell.classList.toggle('is-on', pip < index);
      difficulty.append(cell);
    }

    head.append(label, difficulty);
    return head;
  }

  private buildName(name: string): HTMLElement {
    const title = document.createElement('span');
    title.className = 'phase-card__name';
    title.textContent = name;
    return title;
  }

  private buildTagline(tagline: string): HTMLElement {
    const line = document.createElement('span');
    line.className = 'phase-card__tagline';
    line.textContent = tagline;
    return line;
  }

  private buildFeatures(phase: PhaseSelectInfo): HTMLElement {
    const row = document.createElement('span');
    row.className = 'phase-card__features';
    for (const feature of phase.features) row.append(this.buildChip(feature, false));
    row.append(this.buildChip(en.phaseWaves.replace('{{count}}', String(phase.waves)), true));
    return row;
  }

  private buildChip(text: string, meta: boolean): HTMLElement {
    const chip = document.createElement('span');
    chip.className = 'phase-card__chip';
    chip.classList.toggle('is-meta', meta);
    chip.textContent = text;
    return chip;
  }

  private buildBoss(bossName: string): HTMLElement {
    const boss = document.createElement('span');
    boss.className = 'phase-card__boss';
    boss.textContent = `${en.phaseBoss} · ${bossName}`;
    return boss;
  }

  private buildFooter(phase: PhaseSelectInfo): HTMLElement {
    const footer = document.createElement('span');
    footer.className = 'phase-card__footer';

    const stats = document.createElement('span');
    stats.className = 'phase-card__stats';
    stats.append(
      this.buildStat(en.menuBestScore, formatScore(phase.bestScore), 'score'),
      this.buildStat(en.menuBestTime, formatTime(phase.bestTimeMs), 'time'),
    );

    const meta = document.createElement('span');
    meta.className = 'phase-card__meta';
    meta.textContent = `${phase.attempts} ${en.phaseAttempts} · ${phase.clears} ${en.phaseClears}`;

    const cta = document.createElement('span');
    cta.className = 'phase-card__cta';
    cta.setAttribute('aria-hidden', 'true');
    cta.textContent = en.play;

    footer.append(stats, cta, meta);
    return footer;
  }

  private buildStat(label: string, value: string, kind: 'score' | 'time'): HTMLElement {
    const stat = document.createElement('span');
    stat.className = `phase-card__stat phase-card__stat--${kind}`;

    const statLabel = document.createElement('span');
    statLabel.className = 'phase-card__stat-label';
    statLabel.textContent = label;

    const statValue = document.createElement('strong');
    statValue.className = 'phase-card__stat-value';
    statValue.textContent = value;

    stat.append(statLabel, statValue);
    return stat;
  }

  private buildLockNote(): HTMLElement {
    const note = document.createElement('span');
    note.className = 'phase-card__locked-note';
    note.innerHTML = LOCK_SVG;
    note.append(document.createTextNode(en.phaseUnlockHint));
    return note;
  }

  // -- Interaction -----------------------------------------------------------

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
