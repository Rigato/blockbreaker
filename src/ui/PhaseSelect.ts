import type { PhaseSelectInfo } from '../game/contracts';
import { victoryRank } from '../content/endings';
import { en } from '../i18n/en';
import { formatScore, formatTime } from './format';
import { WORLD1_MAP } from './map/world1';
import { WORLD2_MAP } from './map/world2';
import { WORLD3_MAP } from './map/world3';
import type { MapDef, WorldNodePoint } from './map/types';
import '../styles/phase-select.css';

export interface PhaseSelectOptions {
  root: HTMLElement;
  onStart: (phaseId: string, startWaveIndex?: number) => void;
  onBack: () => void;
  /** Opens the endless lock dialog when locked, otherwise starts endless. */
  onEndless: () => void;
  isEndlessUnlocked: () => boolean;
  /** Shows the debug wave chooser and the world tabs for locked worlds. */
  debug?: boolean;
}

/** Only well-formed theme ids become CSS class suffixes. */
const THEME_CLASS_PATTERN = /^[a-z][a-z0-9-]*$/;

const MAPS: readonly MapDef[] = [WORLD1_MAP, WORLD2_MAP, WORLD3_MAP];

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

/** Bespoke inline theme sigils, drawn with simple strokes. */
const THEME_ICONS: Readonly<Record<string, string>> = {
  crystal:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M12 2.5 19.5 8.5 12 21.5 4.5 8.5Z"/>' +
    '<path d="M4.5 8.5h15"/><path d="M12 2.5v19"/><path d="m9.2 8.5 2.8 6.5 2.8-6.5"/>' +
    '</svg>',
  ruins:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M3 20.5h18"/><path d="M6.5 20.5V9.5H9.5v11"/><path d="M4 9.5h8"/>' +
    '<path d="M14.5 20.5V6h3.5v14.5"/><path d="M12.5 6h7"/>' +
    '<path d="M6.5 9.5a6.5 6.5 0 0 1 7.5 0"/>' +
    '</svg>',
  arcane:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<circle cx="12" cy="12" r="8"/><path d="M12 4l6.5 8-6.5 8-6.5-8Z"/>' +
    '<path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>' +
    '<path d="M6.3 6.3 4.9 4.9M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>' +
    '</svg>',
  frost:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M12 3v18"/><path d="M4.5 7.7l15 8.6"/><path d="M19.5 7.7l-15 8.6"/>' +
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
 * Campaign level select: one illustrated, scrollable world map with four
 * parallax layers. World pills swap the map; each world keeps its own trail,
 * node points and palette.
 */
export class PhaseSelect {
  private readonly onStart: (phaseId: string, startWaveIndex?: number) => void;
  private readonly onBack: () => void;
  private readonly onEndless: () => void;
  private readonly isEndlessUnlocked: () => boolean;
  private readonly debug: boolean;
  private readonly overlay: HTMLElement;
  private readonly panel: HTMLElement;
  private readonly scroller: HTMLElement;
  private readonly empty: HTMLElement;
  private readonly progress: HTMLElement;
  private readonly progressLabel: HTMLElement;
  private readonly progressTrack: HTMLElement;
  private readonly backButton: HTMLButtonElement;
  private readonly worldTabs: readonly HTMLButtonElement[];
  private readonly worldPop: HTMLElement;
  private readonly sheet: HTMLElement;
  private readonly sheetName: HTMLElement;
  private readonly sheetTagline: HTMLElement;
  private readonly sheetRank: HTMLElement;
  private readonly sheetChips: HTMLElement;
  private readonly sheetPlay: HTMLButtonElement;
  private readonly sheetWave: HTMLSelectElement;
  private readonly motionQuery: MediaQueryList;
  private readonly unsubscribeKeydown: () => void;
  private layerElements: readonly HTMLElement[] = [];
  private nodeField!: HTMLElement;
  private trailGroup: SVGGElement | null = null;
  private currentMap: MapDef = WORLD1_MAP;
  private phases: readonly PhaseSelectInfo[] = [];
  private visible = false;
  private selectedPhaseId: string | null = null;
  private selectedWaveIndex = 0;
  private currentWorldId = WORLD1_MAP.id;
  private previousFocus: HTMLElement | null = null;
  private scrollFrame = 0;
  private entranceTimer: number | null = null;

  constructor(options: PhaseSelectOptions) {
    this.onStart = options.onStart;
    this.onBack = options.onBack;
    this.onEndless = options.onEndless;
    this.isEndlessUnlocked = options.isEndlessUnlocked;
    this.debug = options.debug === true;

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

    const worldTabs = document.createElement('div');
    worldTabs.className = 'phase-select__world-tabs';
    worldTabs.setAttribute('role', 'tablist');
    worldTabs.setAttribute('aria-label', 'Worlds');
    this.worldTabs = MAPS.map((map) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'phase-select__world-tab';
      tab.dataset.worldId = map.id;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', 'false');
      tab.setAttribute('aria-controls', 'phase-select-map');
      tab.innerHTML =
        `<span class="phase-select__world-numeral">${map.numeral}</span>` +
        `<span class="phase-select__world-name">${map.name}</span>` +
        '<span class="phase-select__world-state" aria-hidden="true"></span>';
      tab.addEventListener('click', this.handleWorldTab);
      worldTabs.append(tab);
      return tab;
    });

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
    top.append(back, kicker, worldTabs, progress);

    const title = document.createElement('h2');
    title.className = 'phase-select__title';
    title.id = 'phase-select-title';
    title.textContent = en.phaseSelectSubtitle;

    const worldPop = document.createElement('div');
    this.worldPop = worldPop;
    worldPop.className = 'phase-select__world-pop';
    worldPop.id = 'phase-select-world-pop';
    worldPop.hidden = true;

    head.append(top, title, worldPop);

    // --- Scrollable map -----------------------------------------------------
    const scroller = document.createElement('div');
    this.scroller = scroller;
    scroller.className = 'phase-select__scroller';
    scroller.id = 'phase-select-map';

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

    const sheetWaveWrap = document.createElement('label');
    sheetWaveWrap.className = 'phase-sheet__wave';
    sheetWaveWrap.hidden = !this.debug;
    const waveLabel = document.createElement('span');
    waveLabel.className = 'phase-sheet__wave-label';
    waveLabel.textContent = 'Start wave';
    const sheetWave = document.createElement('select');
    this.sheetWave = sheetWave;
    sheetWave.className = 'phase-sheet__wave-select';
    sheetWave.addEventListener('change', () => {
      this.selectedWaveIndex = Math.max(0, Number(sheetWave.value) || 0);
    });
    sheetWaveWrap.append(waveLabel, sheetWave);

    const sheetPlay = document.createElement('button');
    this.sheetPlay = sheetPlay;
    sheetPlay.type = 'button';
    sheetPlay.className = 'phase-sheet__play';
    sheetPlay.textContent = en.play;
    sheetPlay.addEventListener('click', this.handleSheetPlay);

    main.append(heading, sheetWaveWrap, sheetPlay);

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

    this.mountWorld(WORLD1_MAP.id);
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
    this.phases = info;
    const selected = info.find((phase) => phase.id === selectedPhaseId);
    const current = this.findCurrent(info);
    const preferredWorld =
      selected?.worldId ??
      current?.worldId ??
      info[0]?.worldId ??
      WORLD1_MAP.id;
    const worldId = this.availableWorldId(info, preferredWorld);
    this.currentWorldId = worldId;
    this.mountWorld(worldId);
    this.selectedPhaseId = this.resolveSelection(
      info,
      selectedPhaseId,
    );

    if (!this.visible) {
      this.visible = true;
      this.previousFocus =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      this.overlay.hidden = false;

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
    this.phases = info;
    const selected = info.find(
      (phase) => phase.id === this.selectedPhaseId && phase.unlocked,
    );
    const requestedPhase = info.find((phase) => phase.id === selectedPhaseId);
    const nextWorld = this.availableWorldId(
      info,
      selected?.worldId ?? requestedPhase?.worldId ?? this.currentWorldId,
    );
    if (nextWorld !== this.currentWorldId) {
      this.currentWorldId = nextWorld;
      this.mountWorld(nextWorld);
    }
    this.selectedPhaseId =
      selected?.id ?? this.resolveSelection(info, selectedPhaseId);
    if (!this.visible) return;

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
    this.sheetPlay.removeEventListener('click', this.handleSheetPlay);
    for (const tab of this.worldTabs) tab.removeEventListener('click', this.handleWorldTab);
    this.overlay.remove();
  }

  // -- World/map -----------------------------------------------------------

  private worldInfo(worldId: string): readonly PhaseSelectInfo[] {
    return this.phases.filter((phase) => phase.worldId === worldId);
  }

  private mapFor(worldId: string): MapDef {
    return MAPS.find((map) => map.id === worldId) ?? WORLD1_MAP;
  }

  private availableWorldId(
    info: readonly PhaseSelectInfo[],
    preferred: string | undefined,
  ): string {
    const preferredPhases = info.filter((phase) => phase.worldId === preferred);
    if (preferredPhases.length > 0 && preferredPhases.some((phase) => phase.worldUnlocked)) {
      return preferred!;
    }
    const fallback = info.find((phase) => phase.worldUnlocked)?.worldId;
    return fallback ?? WORLD1_MAP.id;
  }

  private mountWorld(worldId: string): void {
    const map = this.mapFor(worldId);
    if (this.currentMap.id === map.id && this.nodeField) return;
    this.currentMap = map;

    const mapElement = document.createElement('div');
    mapElement.className = 'phase-map';
    mapElement.dataset.world = map.id;

    const far = this.createLayer('far', map.depths.far, map.farArt);
    const mid = this.createLayer('mid', map.depths.mid, map.midArt);
    const near = this.createLayer('near', map.depths.near, map.nearArt);
    this.nodeField = near;
    const front = this.createLayer('front', map.depths.front, map.frontArt);
    mapElement.append(far, mid, near, front);
    this.scroller.replaceChildren(mapElement);

    this.layerElements = Array.from(
      mapElement.querySelectorAll<HTMLElement>('.phase-map__layer'),
    );
    this.trailGroup = near.querySelector<SVGGElement>(`#${map.trailGroupId}`);
  }

  private switchWorld(worldId: string): void {
    const info = this.worldInfo(worldId);
    if (info.length === 0 || !info.some((phase) => phase.worldUnlocked)) return;
    this.currentWorldId = worldId;
    this.mountWorld(worldId);
    this.selectedPhaseId = this.resolveSelection(this.phases, null);
    this.render(this.phases);
    this.scroller.scrollTop = 0;
    this.centerSelection();
    const target = this.selectedNode() ?? this.focusFallback();
    target.focus({ preventScroll: true });
  }

  // -- Rendering ------------------------------------------------------------

  private render(info: readonly PhaseSelectInfo[]): void {
    const worldPhases = info.filter((phase) => phase.worldId === this.currentWorldId);
    const current = this.findCurrent(worldPhases);
    this.sanitizeSelection(worldPhases, current);

    this.updateWorldTabs(info);
    this.updateProgress(worldPhases, current);
    this.updateTrail(current);
    const nodes = worldPhases.map((phase) => this.buildNode(phase, current));
    if (this.currentWorldId === WORLD1_MAP.id) nodes.push(this.buildEndlessNode());
    for (const existing of this.nodeField.querySelectorAll('.phase-node')) {
      existing.remove();
    }
    this.nodeField.append(...nodes);

    this.scroller.hidden = worldPhases.length === 0;
    this.empty.hidden = worldPhases.length > 0;
    this.progress.hidden = worldPhases.length === 0;
    this.sheet.hidden = worldPhases.length === 0 || this.selectedPhaseId === null;

    const selected = worldPhases.find((phase) => phase.id === this.selectedPhaseId) ?? null;
    this.renderSheet(selected);
  }

  private updateWorldTabs(info: readonly PhaseSelectInfo[]): void {
    for (const tab of this.worldTabs) {
      const worldId = tab.dataset.worldId ?? '';
      const phases = info.filter((phase) => phase.worldId === worldId);
      const unlocked = phases.some((phase) => phase.worldUnlocked);
      const cleared =
        phases.length > 0 && phases.every((phase) => phase.clears > 0);
      const active = worldId === this.currentWorldId;
      tab.classList.toggle('is-active', active);
      tab.classList.toggle('is-locked', !unlocked);
      tab.classList.toggle('is-clear', cleared);
      tab.setAttribute('aria-selected', String(active));
      tab.setAttribute(
        'aria-label',
        `${this.mapFor(worldId).name}` +
          (cleared ? ' · cleared' : unlocked ? '' : ' · locked'),
      );
      const state = tab.querySelector<HTMLElement>('.phase-select__world-state');
      if (state) state.innerHTML = cleared ? CHECK_SVG : unlocked ? '' : LOCK_SVG;
    }
  }

  /** First unfinished unlocked phase in the world, else the last unlocked. */
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
    const inWorld = info.filter((phase) => phase.worldId === this.currentWorldId);
    const selected = inWorld.find(
      (phase) => phase.id === selectedPhaseId && phase.unlocked,
    );
    const current = this.findCurrent(inWorld);
    const fallback = current ?? inWorld.find((phase) => phase.unlocked) ?? null;
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
    const nodeCount = this.currentMap.nodePoints.length;
    const reached = current
      ? Math.max(0, Math.min(nodeCount - 1, this.nodeIndex(current)))
      : 0;
    const paths = this.currentMap.trailSegments.map((segment, index) => {
      if (index < reached) {
        return (
          `<path d='${segment}' stroke='${this.currentMap.trailColors.doneSoft}' stroke-opacity='.2' stroke-width='26' filter='url(#psm-soft)'/>` +
          `<path d='${segment}' stroke='${this.currentMap.trailColors.doneGradient}' stroke-width='16'/>` +
          `<path class='pm-flow' d='${segment}' stroke='${this.currentMap.trailColors.doneGlow}' stroke-width='2.4' stroke-dasharray='12 30' opacity='.85'/>`
        );
      }
      return `<path d='${segment}' stroke='${this.currentMap.trailColors.locked}' stroke-width='16' stroke-dasharray='7 11'/>`;
    });
    this.trailGroup.innerHTML = paths.join('');
  }

  private nodeIndex(phase: PhaseSelectInfo): number {
    if (this.currentWorldId === WORLD1_MAP.id) {
      return phase.tutorial ? 0 : phase.worldPhaseIndex;
    }
    return Math.max(0, phase.worldPhaseIndex - 1);
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
    node.dataset.worldId = phase.worldId;

    const themeId = THEME_CLASS_PATTERN.test(phase.themeId) ? phase.themeId : 'crystal';
    node.dataset.theme = themeId;
    node.classList.toggle('is-locked', !phase.unlocked);
    node.classList.toggle('is-clear', phase.clears > 0);
    node.classList.toggle('is-current', phase.id === current?.id);
    node.classList.toggle('is-selected', phase.id === this.selectedPhaseId);
    node.classList.toggle('is-boss', phase.bossName !== null);
    node.classList.toggle('is-tutorial', phase.tutorial);
    node.classList.toggle('is-world-final', phase.isWorldFinal);

    const point =
      this.currentMap.nodePoints[this.nodeIndex(phase)] ??
      this.currentMap.fallbackPoint;
    this.applyPoint(node, point);
    node.style.setProperty('--node-accent', phase.accent || this.currentMap.accent);

    const label = phase.tutorial
      ? en.phaseTutorial
      : `${en.phaseLabel} ${phase.worldPhaseIndex}`;
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
    node.setAttribute(
      'aria-label',
      `${en.endless} · ${unlocked ? en.play : en.phaseLocked}`,
    );
    const point = this.currentMap.endlessPoint ?? this.currentMap.fallbackPoint;
    this.applyPoint(node, point);
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
    const map = this.currentMap;
    node.style.setProperty('--x', `${((point.x / map.width) * 100).toFixed(2)}%`);
    node.style.setProperty('--y', `${((point.y / map.height) * 100).toFixed(2)}%`);
    node.classList.toggle('has-label-left', point.labelSide === 'left');
  }

  private currentPhaseId(): string | null {
    return this.findCurrent(this.worldInfo(this.currentWorldId))?.id ?? null;
  }

  private rankFor(phase: PhaseSelectInfo): 'S' | 'A' | 'B' | null {
    if (phase.worldPhaseIndex <= 0 || phase.clears <= 0 || phase.bestScore === null) {
      return null;
    }
    return victoryRank(phase.worldPhaseIndex, phase.bestScore);
  }

  private renderSheet(phase: PhaseSelectInfo | null): void {
    if (!phase) {
      this.sheet.hidden = true;
      return;
    }

    this.sheet.hidden = false;
    this.sheet.style.setProperty('--sheet-accent', phase.accent || this.currentMap.accent);
    this.sheetName.textContent = phase.name;

    const label = phase.tutorial
      ? en.phaseTutorial
      : `${en.phaseLabel} ${phase.worldPhaseIndex}`;
    this.sheetTagline.textContent = phase.tutorial
      ? phase.tagline || label
      : phase.tagline
        ? `${phase.worldName} · ${phase.tagline} · ${label}`
        : `${phase.worldName} · ${label}`;

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

    const chips: HTMLElement[] = phase.features.map((feature) =>
      this.buildChip(feature, false),
    );
    chips.push(
      this.buildChip(en.phaseSheetWaves.replace('{{count}}', String(phase.waves)), true),
    );
    if (phase.bossName) {
      const boss = this.buildChip(`${en.phaseBoss} · ${phase.bossName}`, true);
      boss.classList.add('is-boss');
      chips.push(boss);
    }
    chips.push(
      this.buildChip(`${en.menuBestScore} ${formatScore(phase.bestScore)}`, true),
      this.buildChip(`${en.menuBestTime} ${formatTime(phase.bestTimeMs)}`, true),
      this.buildChip(this.buildTries(phase), true),
    );
    this.sheetChips.replaceChildren(...chips);

    this.sheetPlay.setAttribute('aria-label', `${en.play} ${phase.name}`);

    if (this.debug) {
      const previous = this.selectedWaveIndex;
      this.sheetWave.replaceChildren(
        ...Array.from({ length: phase.waves }, (_, index) => {
          const option = document.createElement('option');
          option.value = String(index);
          option.textContent = `${index + 1} · ${phase.waveNames?.[index] ?? `Wave ${index + 1}`}`;
          return option;
        }),
      );
      this.selectedWaveIndex = Math.min(
        Math.max(0, previous),
        Math.max(0, phase.waves - 1),
      );
      this.sheetWave.value = String(this.selectedWaveIndex);
    }
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
    this.selectedWaveIndex = 0;
    for (const node of this.nodeField.querySelectorAll<HTMLButtonElement>('.phase-node')) {
      node.classList.toggle('is-selected', node.dataset.phaseId === phaseId);
    }
    const phase = this.worldInfo(this.currentWorldId).find(
      (candidate) => candidate.id === phaseId,
    );
    this.renderSheet(phase ?? null);
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
        if (!this.worldPop.hidden) {
          this.closePopover();
          return;
        }
        this.onBack();
        return;
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        const active = document.activeElement;
        if (!(active instanceof HTMLElement)) return;
        const tab = active.closest<HTMLButtonElement>('.phase-select__world-tab');
        if (!tab) return;
        event.preventDefault();
        const index = this.worldTabs.indexOf(tab);
        const next = event.key === 'ArrowRight'
          ? (index + 1) % this.worldTabs.length
          : (index - 1 + this.worldTabs.length) % this.worldTabs.length;
        this.worldTabs[next]?.focus({ preventScroll: true });
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        this.panel.querySelectorAll<HTMLElement>(
          'button:not(:disabled), select:not(:disabled)',
        ),
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
    if (this.worldPop.contains(target)) return;
    if (this.worldTabs.some((tab) => tab.contains(target))) return;
    this.closePopover();
  };

  private openPopover(worldId: string): void {
    const index = Math.max(0, MAPS.findIndex((map) => map.id === worldId));
    const previous = MAPS[Math.max(0, index - 1)] ?? MAPS[0]!;
    this.worldPop.textContent = en.phaseWorldSealed.replace('{{world}}', previous.name);
    this.worldPop.hidden = false;
    for (const tab of this.worldTabs) {
      tab.setAttribute(
        'aria-expanded',
        String(tab.dataset.worldId === worldId),
      );
    }
  }

  private closePopover(): void {
    this.worldPop.hidden = true;
    for (const tab of this.worldTabs) tab.setAttribute('aria-expanded', 'false');
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
    this.onBack();
  };

  private readonly handleWorldTab = (event: Event): void => {
    const tab = event.currentTarget;
    if (!(tab instanceof HTMLButtonElement)) return;
    const worldId = tab.dataset.worldId ?? '';
    const info = this.worldInfo(worldId);
    if (info.length === 0 || !info.some((phase) => phase.worldUnlocked)) {
      this.openPopover(worldId);
      return;
    }
    this.closePopover();
    this.switchWorld(worldId);
  };

  private readonly handleEndlessClick = (): void => {
    this.onEndless();
  };

  private readonly handleSheetPlay = (): void => {
    const phaseId = this.selectedPhaseId;
    if (!phaseId) return;
    this.onStart(
      phaseId,
      this.debug ? this.selectedWaveIndex : undefined,
    );
  };
}
