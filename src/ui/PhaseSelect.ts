import type { PhaseSelectInfo } from '../game/contracts';
import { victoryRank } from '../content/endings';
import { en } from '../i18n/en';
import { formatScore, formatTime } from './format';
import {
  WORLD1_DEPTHS,
  WORLD1_ENDLESS_POINT,
  WORLD1_FALLBACK_POINT,
  WORLD1_FAR_ART,
  WORLD1_FRONT_ART,
  WORLD1_HEIGHT,
  WORLD1_MID_ART,
  WORLD1_NAME,
  WORLD1_NEAR_ART,
  WORLD1_NODE_POINTS,
  WORLD1_TRAIL_GROUP_ID,
  WORLD1_TRAIL_SEGMENTS,
  WORLD1_WIDTH,
  type WorldNodePoint,
} from './map/world1';
import '../styles/phase-select.css';

export interface PhaseSelectOptions {
  root: HTMLElement;
  onStart: (phaseId: string) => void;
  onBack: () => void;
  /** Opens the endless lock dialog when locked, otherwise starts endless. */
  onEndless: () => void;
  isEndlessUnlocked: () => boolean;
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

const CHECK_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
  '<path d="M5 12.5 9.5 17 19 7"/>' +
  '</svg>';

const CRYSTAL_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
  'stroke-linejoin="round" aria-hidden="true" focusable="false">' +
  '<path d="M12 2.5 19.5 8.5 12 21.5 4.5 8.5Z"/>' +
  '</svg>';

/**
 * Bespoke inline theme sigils, drawn with simple strokes so they read at the
 * node size and inherit the node accent through `currentColor`.
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

const TUTORIAL_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
  '<path d="M12 3.4c2.4 3.1 4.1 5.1 4.1 7.6a4.1 4.1 0 1 1-8.2 0c0-1.7.9-3 2.1-4.1.2 1.2.8 1.6 1.1.8.2-1.5-.4-2.9-.7-4.1.7-.4 1.2-.3 1.6-.2Z"/>' +
  '</svg>';

const FALLBACK_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
  '<path d="M12 3l6 6-6 12-6-12Z"/>' +
  '<path d="m6 9 6 6 6-6"/>' +
  '</svg>';

/** Film grain plus vignette; fixed camera overlay (0x parallax). */
const FX_ART =
  "<svg class='phase-select__grain' viewBox='0 0 390 900' preserveAspectRatio='none' " +
  "aria-hidden='true' focusable='false'>" +
  "<defs><filter id='psm-grainF' x='0' y='0' width='100%' height='100%'>" +
  "<feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/>" +
  "<feColorMatrix type='saturate' values='0'/></filter></defs>" +
  "<rect width='390' height='900' filter='url(#psm-grainF)'/></svg>" +
  "<div class='phase-select__vignette'></div>";

/**
 * Campaign level select: an illustrated, scrollable trail map of the first
 * world with four parallax layers, phase medallions and a bottom sheet.
 *
 * The DOM contract (classes and attributes) is documented in
 * `docs/phase-select-map-spec.md` and shared with the e2e suite.
 */
export class PhaseSelect {
  private readonly onStart: (phaseId: string) => void;
  private readonly onBack: () => void;
  private readonly onEndless: () => void;
  private readonly isEndlessUnlocked: () => boolean;
  private readonly overlay: HTMLElement;
  private readonly panel: HTMLElement;
  private readonly scroller: HTMLElement;
  private readonly layerElements: readonly HTMLElement[];
  private readonly nodeField: HTMLElement;
  private readonly trailGroup: SVGGElement | null;
  private readonly empty: HTMLElement;
  private readonly progress: HTMLElement;
  private readonly progressLabel: HTMLElement;
  private readonly progressTrack: HTMLElement;
  private readonly backButton: HTMLButtonElement;
  private readonly worldLocked: HTMLButtonElement;
  private readonly worldPop: HTMLElement;
  private readonly sheet: HTMLElement;
  private readonly sheetName: HTMLElement;
  private readonly sheetTagline: HTMLElement;
  private readonly sheetRank: HTMLElement;
  private readonly sheetChips: HTMLElement;
  private readonly sheetPlay: HTMLButtonElement;
  private readonly motionQuery: MediaQueryList;
  private readonly unsubscribeKeydown: () => void;
  private phases: readonly PhaseSelectInfo[] = [];
  private visible = false;
  private selectedPhaseId: string | null = null;
  private previousFocus: HTMLElement | null = null;
  private scrollFrame = 0;
  private entranceTimer: number | null = null;

  constructor(options: PhaseSelectOptions) {
    this.onStart = options.onStart;
    this.onBack = options.onBack;
    this.onEndless = options.onEndless;
    this.isEndlessUnlocked = options.isEndlessUnlocked;

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
    back.setAttribute('aria-label', en.back);
    back.innerHTML = ARROW_SVG;
    back.addEventListener('click', this.handleBack);

    const kicker = document.createElement('span');
    kicker.className = 'phase-select__kicker';
    kicker.textContent = en.phaseSelectTitle;

    const world = document.createElement('span');
    world.className = 'phase-select__world';
    const worldIcon = document.createElement('span');
    worldIcon.className = 'phase-select__world-icon';
    worldIcon.setAttribute('aria-hidden', 'true');
    worldIcon.innerHTML = CRYSTAL_SVG;
    const worldName = document.createElement('span');
    worldName.className = 'phase-select__world-name';
    worldName.textContent = WORLD1_NAME;
    world.append(worldIcon, worldName);

    const worldLocked = document.createElement('button');
    this.worldLocked = worldLocked;
    worldLocked.type = 'button';
    worldLocked.className = 'phase-select__world-locked';
    worldLocked.textContent = 'II';
    worldLocked.setAttribute('aria-expanded', 'false');
    worldLocked.setAttribute('aria-controls', 'phase-select-world-pop');
    worldLocked.setAttribute('aria-label', en.phaseWorldSealedAria);
    worldLocked.addEventListener('click', this.handleWorldLocked);

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
    top.append(back, kicker, world, worldLocked, progress);

    const title = document.createElement('h2');
    title.className = 'phase-select__title';
    title.id = 'phase-select-title';
    title.textContent = en.phaseSelectSubtitle;

    const worldPop = document.createElement('div');
    this.worldPop = worldPop;
    worldPop.className = 'phase-select__world-pop';
    worldPop.id = 'phase-select-world-pop';
    worldPop.hidden = true;
    worldPop.textContent = en.phaseWorldSealed;

    head.append(top, title, worldPop);

    // --- Scrollable map -----------------------------------------------------
    const scroller = document.createElement('div');
    this.scroller = scroller;
    scroller.className = 'phase-select__scroller';

    const map = document.createElement('div');
    map.className = 'phase-map';

    const far = this.createLayer('far', WORLD1_DEPTHS.far, WORLD1_FAR_ART);
    const mid = this.createLayer('mid', WORLD1_DEPTHS.mid, WORLD1_MID_ART);
    const near = this.createLayer('near', WORLD1_DEPTHS.near, WORLD1_NEAR_ART);
    // Phase nodes live directly inside the near layer so their percentages map
    // one-to-one onto the 390x900 viewBox.
    this.nodeField = near;

    const front = this.createLayer('front', WORLD1_DEPTHS.front, WORLD1_FRONT_ART);
    map.append(far, mid, near, front);
    scroller.append(map);

    this.layerElements = Array.from(map.querySelectorAll<HTMLElement>('.phase-map__layer'));
    this.trailGroup = near.querySelector<SVGGElement>(`#${WORLD1_TRAIL_GROUP_ID}`);

    const empty = document.createElement('p');
    this.empty = empty;
    empty.className = 'phase-select__empty';
    empty.textContent = en.phaseSelectEmpty;
    empty.hidden = true;

    // --- Bottom sheet -------------------------------------------------------
    const sheet = document.createElement('aside');
    this.sheet = sheet;
    sheet.className = 'phase-sheet';
    sheet.hidden = true;

    const handle = document.createElement('div');
    handle.className = 'phase-sheet__handle';
    handle.setAttribute('aria-hidden', 'true');

    const main = document.createElement('div');
    main.className = 'phase-sheet__main';

    const heading = document.createElement('div');
    heading.className = 'phase-sheet__heading';

    const nameRow = document.createElement('div');
    nameRow.className = 'phase-sheet__name-row';

    const sheetName = document.createElement('div');
    this.sheetName = sheetName;
    sheetName.className = 'phase-sheet__name';

    const sheetRank = document.createElement('span');
    this.sheetRank = sheetRank;
    sheetRank.className = 'phase-sheet__rank';
    sheetRank.setAttribute('role', 'img');
    sheetRank.hidden = true;
    nameRow.append(sheetName, sheetRank);

    const sheetTagline = document.createElement('div');
    this.sheetTagline = sheetTagline;
    sheetTagline.className = 'phase-sheet__tagline';
    heading.append(nameRow, sheetTagline);

    const sheetPlay = document.createElement('button');
    this.sheetPlay = sheetPlay;
    sheetPlay.type = 'button';
    sheetPlay.className = 'phase-sheet__play';
    sheetPlay.textContent = en.play;
    sheetPlay.addEventListener('click', this.handleSheetPlay);

    main.append(heading, sheetPlay);

    const sheetChips = document.createElement('div');
    this.sheetChips = sheetChips;
    sheetChips.className = 'phase-sheet__chips';

    sheet.append(handle, main, sheetChips);

    // --- Camera overlay -----------------------------------------------------
    const fx = document.createElement('div');
    fx.className = 'phase-select__fx';
    fx.setAttribute('aria-hidden', 'true');
    fx.innerHTML = FX_ART;

    panel.append(head, scroller, empty, sheet, fx);
    overlay.append(panel);
    options.root.append(overlay);

    this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.motionQuery.addEventListener('change', this.handleMotionChange);
    scroller.addEventListener('scroll', this.handleScroll, { passive: true });
    document.addEventListener('pointerdown', this.handleDocumentPointer);
    this.unsubscribeKeydown = this.listenKeys();
  }

  get isOpen(): boolean {
    return this.visible;
  }

  get selection(): string | null {
    return this.selectedPhaseId;
  }

  open(info: readonly PhaseSelectInfo[], selectedPhaseId: string | null): void {
    this.selectedPhaseId = this.resolveSelection(info, selectedPhaseId);

    if (!this.visible) {
      this.visible = true;
      this.previousFocus =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      this.overlay.hidden = false;

      // Re-arm the entrance animation (CSS disables it under reduced motion).
      this.overlay.classList.remove('is-entering');
      void this.overlay.offsetWidth;
      this.overlay.classList.add('is-entering');
      this.armEntrance();

      this.render(info);
      this.centerSelection();

      window.requestAnimationFrame(() => {
        if (!this.visible) return;
        const target = this.selectedNode() ?? this.focusFallback();
        target.focus({ preventScroll: true });
      });
      return;
    }

    const scrollTop = this.scroller.scrollTop;
    this.render(info);
    this.scroller.scrollTop = scrollTop;
    this.applyParallax();
  }

  close(): void {
    if (!this.visible) return;
    this.visible = false;
    this.cancelEntrance();
    this.cancelScrollFrame();
    this.closePopover();
    this.overlay.classList.remove('is-entering');
    this.overlay.hidden = true;

    const target = this.previousFocus;
    this.previousFocus = null;
    if (target && target.isConnected) target.focus({ preventScroll: true });
  }

  refresh(info: readonly PhaseSelectInfo[], selectedPhaseId: string | null): void {
    // Keep the node the player tapped; fall back to the caller's selection
    // when that phase is gone or is no longer unlocked.
    const kept = info.find(
      (phase) => phase.id === this.selectedPhaseId && phase.unlocked,
    );
    this.selectedPhaseId = kept?.id ?? this.resolveSelection(info, selectedPhaseId);
    if (!this.visible) return;

    // `replaceChildren` resets the scroll position; keep the player where they were.
    const scrollTop = this.scroller.scrollTop;
    const focusedPhaseId = this.focusedPhaseId();
    const hadFocusInside = this.panel.contains(document.activeElement);

    this.render(info);
    this.scroller.scrollTop = scrollTop;
    this.applyParallax();

    const focusLost =
      !hadFocusInside || !this.panel.contains(document.activeElement);
    if (!focusLost) return;

    const target = (focusedPhaseId ? this.findNode(focusedPhaseId) : null) ??
      this.selectedNode() ??
      this.focusFallback();
    target.focus({ preventScroll: true });
  }

  dispose(): void {
    this.unsubscribeKeydown();
    this.cancelEntrance();
    this.cancelScrollFrame();
    this.motionQuery.removeEventListener('change', this.handleMotionChange);
    this.scroller.removeEventListener('scroll', this.handleScroll);
    document.removeEventListener('pointerdown', this.handleDocumentPointer);
    this.backButton.removeEventListener('click', this.handleBack);
    this.worldLocked.removeEventListener('click', this.handleWorldLocked);
    this.sheetPlay.removeEventListener('click', this.handleSheetPlay);
    this.overlay.remove();
  }

  // -- Rendering ------------------------------------------------------------

  private render(info: readonly PhaseSelectInfo[]): void {
    const total = info.length;
    const current = this.findCurrent(info);
    this.phases = info;
    this.sanitizeSelection(info, current);

    this.updateProgress(info, current);
    this.updateTrail(current);
    const nodes = info.map((phase) => this.buildNode(phase, current));
    if (total > 0) nodes.push(this.buildEndlessNode());
    for (const existing of this.nodeField.querySelectorAll('.phase-node')) existing.remove();
    this.nodeField.append(...nodes);

    this.scroller.hidden = total === 0;
    this.empty.hidden = total > 0;
    this.progress.hidden = total === 0;
    this.sheet.hidden = total === 0 || this.selectedPhaseId === null;

    const selected = info.find((phase) => phase.id === this.selectedPhaseId) ?? null;
    this.renderSheet(selected);
  }

  /** First unfinished unlocked phase, else the last unlocked phase. */
  private findCurrent(info: readonly PhaseSelectInfo[]): PhaseSelectInfo | null {
    return (
      info.find((phase) => phase.unlocked && phase.clears === 0) ??
      [...info].reverse().find((phase) => phase.unlocked) ??
      null
    );
  }

  private resolveSelection(
    info: readonly PhaseSelectInfo[],
    selectedPhaseId: string | null,
  ): string | null {
    const selected = info.find(
      (phase) => phase.id === selectedPhaseId && phase.unlocked,
    );
    const current = this.findCurrent(info);
    const fallback = current ?? info.find((phase) => phase.unlocked) ?? null;
    return (selected ?? fallback)?.id ?? null;
  }

  private sanitizeSelection(
    info: readonly PhaseSelectInfo[],
    current: PhaseSelectInfo | null,
  ): void {
    const selected = info.find((phase) => phase.id === this.selectedPhaseId);
    if (selected && selected.unlocked) return;
    this.selectedPhaseId = current?.id ?? info.find((phase) => phase.unlocked)?.id ?? null;
  }

  private updateProgress(
    info: readonly PhaseSelectInfo[],
    current: PhaseSelectInfo | null,
  ): void {
    const cleared = info.filter((phase) => phase.clears > 0).length;
    this.progressLabel.textContent = en.phaseProgressShort
      .replace('{{cleared}}', String(cleared))
      .replace('{{total}}', String(info.length));
    this.progress.setAttribute(
      'aria-label',
      en.phaseProgress
        .replace('{{cleared}}', String(cleared))
        .replace('{{total}}', String(info.length)),
    );

    const segments = info.map((phase) => {
      const segment = document.createElement('span');
      segment.className = 'phase-select__seg';
      segment.classList.toggle('is-clear', phase.clears > 0);
      segment.classList.toggle('is-current', phase.id === current?.id && phase.clears === 0);
      return segment;
    });
    this.progressTrack.replaceChildren(...segments);
  }

  private updateTrail(current: PhaseSelectInfo | null): void {
    if (!this.trailGroup) return;
    const reachedIndex = current?.index ?? 0;
    const paths = WORLD1_TRAIL_SEGMENTS.map((segment, index) => {
      if (index < reachedIndex) {
        return (
          `<path d='${segment}' stroke='#FFC96B' stroke-opacity='.2' stroke-width='26' filter='url(#psm-soft)'/>` +
          `<path d='${segment}' stroke='url(#psm-trailGold)' stroke-width='16'/>` +
          `<path class='pm-flow' d='${segment}' stroke='#FFF6DE' stroke-width='2.4' stroke-dasharray='12 30' opacity='.85'/>`
        );
      }
      return `<path d='${segment}' stroke='#2A3A48' stroke-width='16' stroke-dasharray='7 11'/>`;
    });
    this.trailGroup.innerHTML = paths.join('');
  }

  private buildNode(
    phase: PhaseSelectInfo,
    current: PhaseSelectInfo | null,
  ): HTMLButtonElement {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'phase-node';
    node.dataset.phaseId = phase.id;
    node.dataset.phaseIndex = String(phase.index);

    const themeId = THEME_CLASS_PATTERN.test(phase.themeId) ? phase.themeId : 'crystal';
    node.dataset.theme = themeId;
    node.classList.toggle('is-locked', !phase.unlocked);
    node.classList.toggle('is-clear', phase.clears > 0);
    node.classList.toggle('is-current', phase.id === current?.id);
    node.classList.toggle('is-selected', phase.id === this.selectedPhaseId);
    node.classList.toggle('is-boss', phase.bossName !== null);
    node.classList.toggle('is-tutorial', phase.tutorial);

    this.applyPoint(node, WORLD1_NODE_POINTS[phase.index] ?? WORLD1_FALLBACK_POINT);
    node.style.setProperty('--node-accent', phase.accent || '#7ef9ff');

    const label = phase.tutorial ? en.phaseTutorial : `${en.phaseLabel} ${phase.index}`;
    node.setAttribute(
      'aria-label',
      `${phase.name} · ${label} · ${phase.unlocked ? en.play : en.phaseLocked}`,
    );

    node.append(
      this.buildSigil(themeId, !phase.unlocked, phase.tutorial),
      this.buildNodeLabel(phase),
    );

    const rank = this.rankFor(phase);
    if (rank) {
      node.append(this.buildRankBadge(rank));
    } else if (phase.clears > 0) {
      const check = document.createElement('span');
      check.className = 'phase-node__check';
      check.setAttribute('aria-hidden', 'true');
      check.innerHTML = CHECK_SVG;
      node.append(check);
    }

    if (phase.unlocked) {
      node.addEventListener('click', () => this.select(phase.id));
    } else {
      node.disabled = true;
    }

    return node;
  }

  private buildEndlessNode(): HTMLButtonElement {
    const unlocked = this.isEndlessUnlocked();
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'phase-node phase-node--endless';
    node.classList.toggle('is-locked', !unlocked);
    // Locked endless stays clickable: it opens the existing lock dialog.
    node.setAttribute(
      'aria-label',
      `${en.endless} · ${unlocked ? en.play : en.phaseLocked}`,
    );
    this.applyPoint(node, WORLD1_ENDLESS_POINT);
    node.style.setProperty('--node-accent', '#a46bff');

    const sigil = document.createElement('span');
    sigil.className = 'phase-node__sigil';
    sigil.setAttribute('aria-hidden', 'true');

    const halo = document.createElement('span');
    halo.className = 'phase-node__halo';

    const frame = document.createElement('span');
    frame.className = 'phase-node__frame';

    const infinity = document.createElement('span');
    infinity.className = 'phase-node__infinity';
    infinity.textContent = '∞';
    frame.append(infinity);

    sigil.append(halo, frame);

    const label = document.createElement('span');
    label.className = 'phase-node__label';
    const name = document.createElement('span');
    name.className = 'phase-node__name';
    name.textContent = en.endless;
    label.append(name);

    node.append(sigil, label);
    node.addEventListener('click', this.handleEndlessClick);
    return node;
  }

  private buildSigil(themeId: string, locked: boolean, tutorial: boolean): HTMLElement {
    const sigil = document.createElement('span');
    sigil.className = 'phase-node__sigil';
    sigil.setAttribute('aria-hidden', 'true');

    const halo = document.createElement('span');
    halo.className = 'phase-node__halo';

    const frame = document.createElement('span');
    frame.className = 'phase-node__frame';

    const glyph = document.createElement('span');
    glyph.className = 'phase-node__glyph';
    glyph.classList.toggle('is-lock', locked);
    glyph.innerHTML = locked
      ? LOCK_SVG
      : tutorial
        ? TUTORIAL_ICON
        : THEME_ICONS[themeId] ?? FALLBACK_ICON;

    frame.append(glyph);
    sigil.append(halo, frame);
    return sigil;
  }

  private buildNodeLabel(phase: PhaseSelectInfo): HTMLElement {
    const label = document.createElement('span');
    label.className = 'phase-node__label';

    const name = document.createElement('span');
    name.className = 'phase-node__name';
    name.textContent = phase.name;
    label.append(name);

    if (phase.id === this.currentPhaseId() && phase.clears === 0) {
      const now = document.createElement('span');
      now.className = 'phase-node__now';
      now.textContent = en.phaseNow;
      label.append(now);
    }
    return label;
  }

  private buildRankBadge(rank: 'S' | 'A' | 'B'): HTMLElement {
    const badge = document.createElement('span');
    badge.className = 'phase-node__rank';
    badge.dataset.rank = rank;
    badge.textContent = rank;
    badge.setAttribute('aria-hidden', 'true');
    return badge;
  }

  private applyPoint(node: HTMLElement, point: WorldNodePoint): void {
    node.style.setProperty('--x', `${((point.x / WORLD1_WIDTH) * 100).toFixed(2)}%`);
    node.style.setProperty('--y', `${((point.y / WORLD1_HEIGHT) * 100).toFixed(2)}%`);
    node.classList.toggle('has-label-left', point.labelSide === 'left');
  }

  private currentPhaseId(): string | null {
    return this.findCurrent(this.phases)?.id ?? null;
  }

  private rankFor(phase: PhaseSelectInfo): 'S' | 'A' | 'B' | null {
    if (phase.index <= 0 || phase.clears <= 0 || phase.bestScore === null) return null;
    return victoryRank(phase.index, phase.bestScore);
  }

  private renderSheet(phase: PhaseSelectInfo | null): void {
    if (!phase) {
      this.sheet.hidden = true;
      return;
    }

    this.sheet.hidden = false;
    this.sheet.style.setProperty('--sheet-accent', phase.accent || '#7ef9ff');
    this.sheetName.textContent = phase.name;

    const label = phase.tutorial ? en.phaseTutorial : `${en.phaseLabel} ${phase.index}`;
    this.sheetTagline.textContent = phase.tutorial
      ? phase.tagline || label
      : phase.tagline
        ? `${phase.tagline} · ${label}`
        : label;

    const rank = this.rankFor(phase);
    this.sheetRank.hidden = rank === null;
    if (rank) {
      this.sheetRank.dataset.rank = rank;
      this.sheetRank.textContent = rank;
      this.sheetRank.setAttribute(
        'aria-label',
        en.phaseSheetRank.replace('{{rank}}', rank),
      );
    } else {
      this.sheetRank.removeAttribute('aria-label');
      this.sheetRank.textContent = '';
    }

    const chips: HTMLElement[] = phase.features.map((feature) => this.buildChip(feature, false));
    chips.push(
      this.buildChip(en.phaseSheetWaves.replace('{{count}}', String(phase.waves)), true),
    );
    if (phase.bossName) {
      const boss = this.buildChip(`${en.phaseBoss} · ${phase.bossName}`, true);
      boss.classList.add('is-boss');
      chips.push(boss);
    }
    chips.push(
      this.buildChip(
        `${en.menuBestScore} ${formatScore(phase.bestScore)}`,
        true,
      ),
      this.buildChip(`${en.menuBestTime} ${formatTime(phase.bestTimeMs)}`, true),
      this.buildChip(this.buildTries(phase), true),
    );
    this.sheetChips.replaceChildren(...chips);

    this.sheetPlay.setAttribute('aria-label', `${en.play} ${phase.name}`);
  }

  private buildChip(text: string, meta: boolean): HTMLElement {
    const chip = document.createElement('span');
    chip.className = 'phase-sheet__chip';
    chip.classList.toggle('is-meta', meta);
    chip.textContent = text;
    return chip;
  }

  private buildTries(phase: PhaseSelectInfo): string {
    const attempts =
      phase.attempts === 1
        ? en.phaseSheetAttempt.replace('{{count}}', '1')
        : en.phaseSheetAttempts.replace('{{count}}', String(phase.attempts));

    let clears: string = en.phaseSheetClearNone;
    if (phase.clears === 1) clears = en.phaseSheetClear.replace('{{count}}', '1');
    else if (phase.clears > 1) {
      clears = en.phaseSheetClears.replace('{{count}}', String(phase.clears));
    }
    return `${attempts} · ${clears}`;
  }

  private createLayer(kind: string, depth: number, art: string): HTMLElement {
    const layer = document.createElement('div');
    layer.className = `phase-map__layer phase-map__layer--${kind}`;
    layer.dataset.depth = String(depth);
    layer.innerHTML = art;
    return layer;
  }

  // -- Interaction -----------------------------------------------------------

  private select(phaseId: string): void {
    this.selectedPhaseId = phaseId;
    for (const node of this.nodeField.querySelectorAll<HTMLButtonElement>('.phase-node')) {
      node.classList.toggle('is-selected', node.dataset.phaseId === phaseId);
    }
    this.renderSheet(this.phases.find((phase) => phase.id === phaseId) ?? null);
  }

  private centerSelection(): void {
    const node = this.selectedNode() ?? this.focusFallback();
    if (!(node instanceof HTMLElement) || !this.nodeField.contains(node)) return;
    this.centerOn(node);
  }

  private centerOn(node: HTMLElement): void {
    const scrollerRect = this.scroller.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    const delta =
      nodeRect.top + nodeRect.height / 2 - (scrollerRect.top + scrollerRect.height / 2);
    const max = Math.max(0, this.scroller.scrollHeight - this.scroller.clientHeight);
    this.scroller.scrollTop = Math.min(max, Math.max(0, this.scroller.scrollTop + delta));
    this.applyParallax();
  }

  private applyParallax(): void {
    if (this.motionQuery.matches) {
      for (const layer of this.layerElements) layer.style.transform = '';
      return;
    }

    const scrollTop = this.scroller.scrollTop;
    for (const layer of this.layerElements) {
      const depth = Number(layer.dataset.depth);
      if (!Number.isFinite(depth) || depth === 1) {
        layer.style.transform = '';
        continue;
      }
      layer.style.transform = `translateY(${(scrollTop * (1 - depth)).toFixed(2)}px)`;
    }
  }

  private handleScroll = (): void => {
    if (this.scrollFrame !== 0) return;
    this.scrollFrame = window.requestAnimationFrame(() => {
      this.scrollFrame = 0;
      this.applyParallax();
    });
  };

  private handleMotionChange = (): void => {
    this.applyParallax();
  };

  private selectedNode(): HTMLButtonElement | null {
    return this.nodeField.querySelector<HTMLButtonElement>(
      '.phase-node.is-selected:not(:disabled)',
    );
  }

  private findNode(phaseId: string): HTMLButtonElement | null {
    const nodes = this.nodeField.querySelectorAll<HTMLButtonElement>('.phase-node');
    for (const node of nodes) {
      if (node.dataset.phaseId === phaseId) return node;
    }
    return null;
  }

  private focusedPhaseId(): string | null {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || !this.panel.contains(active)) return null;
    return active.closest<HTMLElement>('.phase-node')?.dataset.phaseId ?? null;
  }

  private focusFallback(): HTMLElement {
    return (
      this.nodeField.querySelector<HTMLButtonElement>('.phase-node.is-current:not(:disabled)') ??
      this.nodeField.querySelector<HTMLButtonElement>('.phase-node:not(:disabled)') ??
      this.backButton
    );
  }

  private listenKeys(): () => void {
    const handler = (event: KeyboardEvent): void => {
      if (!this.visible) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        // The sealed-world popover closes before the screen itself.
        if (!this.worldPop.hidden) {
          this.closePopover();
          return;
        }
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

  private handleDocumentPointer = (event: PointerEvent): void => {
    if (!this.visible || this.worldPop.hidden) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (this.worldPop.contains(target) || this.worldLocked.contains(target)) return;
    this.closePopover();
  };

  private openPopover(): void {
    this.worldPop.hidden = false;
    this.worldLocked.setAttribute('aria-expanded', 'true');
  }

  private closePopover(): void {
    this.worldPop.hidden = true;
    this.worldLocked.setAttribute('aria-expanded', 'false');
  }

  private armEntrance(): void {
    this.cancelEntrance();
    this.entranceTimer = window.setTimeout(() => {
      this.entranceTimer = null;
      this.overlay.classList.remove('is-entering');
    }, 360);
  }

  private cancelEntrance(): void {
    if (this.entranceTimer === null) return;
    window.clearTimeout(this.entranceTimer);
    this.entranceTimer = null;
  }

  private cancelScrollFrame(): void {
    if (this.scrollFrame === 0) return;
    window.cancelAnimationFrame(this.scrollFrame);
    this.scrollFrame = 0;
  }

  private readonly handleBack = (): void => {
    // Back leaves the campaign map directly (the sheet is never a separate
    // layer to dismiss); e2e accepts a single back press from any state.
    this.onBack();
  };

  private readonly handleWorldLocked = (): void => {
    if (this.worldPop.hidden) this.openPopover();
    else this.closePopover();
  };

  private readonly handleEndlessClick = (): void => {
    this.onEndless();
  };

  private readonly handleSheetPlay = (): void => {
    const phaseId = this.selectedPhaseId;
    if (!phaseId) return;
    this.onStart(phaseId);
  };
}
