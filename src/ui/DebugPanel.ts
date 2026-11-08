import type { GameCommands, HudSnapshot, PlatformService, SimTuning } from '../game/contracts';
import type { BootResult } from '../boot/bridgeBoot';
import type { BlockBreakerGame } from '../game/Game';
import { GAME_CONFIG, SIM_TUNING_LIMITS } from '../game/config';
import { gameEvents } from '../game/events';
import { en } from '../i18n/en';

export interface DebugPanelOptions {
  root: HTMLElement;
  platform: PlatformService;
  game: BlockBreakerGame;
  controller: GameCommands;
  boot: BootResult;
  onSaveReset?: () => void;
}

type NumericTuningKey = Exclude<keyof SimTuning, 'fixedStepHz'>;

interface TuningControl {
  key: NumericTuningKey;
  input: HTMLInputElement;
  display: HTMLElement;
  format: (value: number) => string;
}

function makeRow(label: string, elementId: string): { row: HTMLElement; value: HTMLElement } {
  const row = document.createElement('div');
  row.className = 'debug__row';

  const labelElement = document.createElement('span');
  labelElement.className = 'debug__label';
  labelElement.textContent = label;

  const value = document.createElement('span');
  value.className = 'debug__value';
  value.id = elementId;

  row.append(labelElement, value);
  return { row, value };
}

function makeSection(title: string): HTMLElement {
  const section = document.createElement('div');
  section.className = 'debug__section';

  const heading = document.createElement('h3');
  heading.className = 'debug__section-title';
  heading.textContent = title;

  section.append(heading);
  return section;
}

function makeButton(label: string, modifier = 'debug__action'): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = modifier;
  button.textContent = label;
  return button;
}

export class DebugPanel {
  private readonly platform: PlatformService;
  private readonly game: BlockBreakerGame;
  private readonly controller: GameCommands;
  private readonly boot: BootResult;
  private readonly onSaveReset: (() => void) | null;
  private readonly panel: HTMLElement;
  private readonly body: HTMLElement;
  private readonly compact: HTMLButtonElement;
  private readonly toggleButton: HTMLButtonElement;
  private readonly fpsValue: HTMLElement;
  private readonly canvasValue: HTMLElement;
  private readonly stageValue: HTMLElement;
  private readonly readyValue: HTMLElement;
  private readonly status: HTMLElement;
  private readonly resetButton: HTMLButtonElement;
  private readonly fixedStepSelect: HTMLSelectElement;
  private readonly tuningControls: TuningControl[] = [];
  private seedValue!: HTMLElement;
  private levelXpValue!: HTMLElement;
  private phaseValue!: HTMLElement;
  private waveValue!: HTMLElement;
  private readonly timer: ReturnType<typeof setInterval>;
  private readonly unsubscribeTuning: () => void;
  private readonly unsubscribeHud: () => void;
  private collapsed = false;

  constructor(options: DebugPanelOptions) {
    this.platform = options.platform;
    this.game = options.game;
    this.controller = options.controller;
    this.boot = options.boot;
    this.onSaveReset = options.onSaveReset ?? null;

    const panel = document.createElement('section');
    this.panel = panel;
    panel.id = 'debug-panel';
    panel.className = 'debug';
    panel.setAttribute('aria-label', en.debugTitle);

    const head = document.createElement('div');
    head.className = 'debug__head';

    const heading = document.createElement('h2');
    heading.className = 'debug__title';
    heading.textContent = en.debugTitle;

    const toggleButton = document.createElement('button');
    this.toggleButton = toggleButton;
    toggleButton.type = 'button';
    toggleButton.className = 'debug__toggle';
    toggleButton.setAttribute('aria-expanded', 'true');
    toggleButton.setAttribute('aria-controls', 'debug-body');
    toggleButton.textContent = en.debugCollapse;
    toggleButton.addEventListener('click', this.handleToggle);

    head.append(heading, toggleButton);

    const compact = document.createElement('button');
    this.compact = compact;
    compact.type = 'button';
    compact.className = 'debug__compact';
    compact.id = 'debug-compact';
    compact.setAttribute('aria-controls', 'debug-body');
    compact.setAttribute('aria-expanded', 'false');
    compact.hidden = true;
    compact.addEventListener('click', this.handleCompactExpand);

    const body = document.createElement('div');
    this.body = body;
    body.id = 'debug-body';
    body.className = 'debug__body';

    const rows = document.createElement('div');
    rows.className = 'debug__rows';
    body.append(rows);

    const fpsRow = makeRow(en.debugFps, 'debug-fps');
    this.fpsValue = fpsRow.value;
    rows.append(fpsRow.row);

    const platformRow = makeRow(en.debugPlatform, 'debug-platform');
    platformRow.value.textContent = `${this.platform.id} · ${this.platform.diagnostics.source}`;
    rows.append(platformRow.row);

    const storageRow = makeRow(en.debugStorage, 'debug-storage');
    storageRow.value.textContent = this.platform.diagnostics.storageKind;
    rows.append(storageRow.row);

    const bridgeRow = makeRow(en.debugBridgeInit, 'debug-bridge');
    bridgeRow.value.textContent = this.bridgeInitLabel();
    rows.append(bridgeRow.row);

    const languageRow = makeRow(en.debugLanguage, 'debug-language');
    languageRow.value.textContent = this.platform.language;
    rows.append(languageRow.row);

    const canvasRow = makeRow(en.debugCanvas, 'debug-canvas');
    rows.append(canvasRow.row);
    this.canvasValue = canvasRow.value;

    const stageRow = makeRow(en.debugStage, 'debug-stage');
    rows.append(stageRow.row);
    this.stageValue = stageRow.value;

    const dprRow = makeRow(en.debugDpr, 'debug-dpr');
    dprRow.value.textContent = `${window.devicePixelRatio || 1} / ${this.game.canvasMetrics.resolution.toFixed(2)}`;
    rows.append(dprRow.row);

    const readyRow = makeRow(en.debugGameReady, 'debug-ready');
    readyRow.value.textContent = en.debugPending;
    this.readyValue = readyRow.value;
    rows.append(readyRow.row);

    body.append(this.buildTuningSection());
    body.append(this.buildPhaseSection());
    body.append(this.buildActionSection());
    body.append(this.buildProgressionSection());

    this.resetButton = makeButton(en.debugResetSave, 'debug__reset');
    this.resetButton.addEventListener('click', this.handleReset);
    body.append(this.resetButton);

    this.status = document.createElement('p');
    this.status.className = 'debug__status';
    this.status.setAttribute('role', 'status');
    body.append(this.status);

    panel.append(head, compact, body);
    options.root.append(panel);

    this.fixedStepSelect = this.buildFixedStepSelect();

    this.applyTuning(this.controller.getTuning());
    this.refreshCanvas();
    this.refreshFps();

    this.unsubscribeTuning = gameEvents.on('tuning:changed', this.handleTuningChanged);
    this.unsubscribeHud = gameEvents.on('hud:changed', this.handleHudChanged);
    this.applyProgression(this.controller.getHudState());

    this.timer = setInterval(() => {
      this.refreshFps();
      this.refreshCanvas();
    }, GAME_CONFIG.debug.sampleMs);
  }

  setGameReady(label: string): void {
    this.readyValue.textContent = label;
  }

  /** Collapses the full body, leaving the compact FPS/platform strip. */
  collapse(): void {
    this.setCollapsed(true);
  }

  dispose(): void {
    clearInterval(this.timer);
    this.unsubscribeTuning();
    this.unsubscribeHud();
    this.toggleButton.removeEventListener('click', this.handleToggle);
    this.compact.removeEventListener('click', this.handleCompactExpand);
    this.resetButton.removeEventListener('click', this.handleReset);
    this.panel.remove();
  }

  private buildTuningSection(): HTMLElement {
    const section = makeSection(en.debugTuning);

    const controls: Array<{ key: NumericTuningKey; label: string; format: (v: number) => string }> = [
      { key: 'ballSpeedScale', label: en.debugBallSpeed, format: (v) => `${v.toFixed(2)}×` },
      { key: 'paddleWidth', label: en.debugPaddleWidth, format: (v) => `${v} px` },
      { key: 'paddleMaxSpeed', label: en.debugPaddleSpeed, format: (v) => `${v} px/s` },
      { key: 'ballRadius', label: en.debugBallRadius, format: (v) => `${v} px` },
      { key: 'paddleMaxAngleDeg', label: en.debugMaxAngle, format: (v) => `${v}°` },
    ];

    for (const config of controls) {
      const limits = SIM_TUNING_LIMITS[config.key];
      const control = document.createElement('label');
      control.className = 'debug__control';
      control.htmlFor = `tune-${config.key}`;

      const head = document.createElement('span');
      head.className = 'debug__control-head';

      const label = document.createElement('span');
      label.className = 'debug__label';
      label.textContent = config.label;

      const display = document.createElement('span');
      display.className = 'debug__value';

      head.append(label, display);

      const input = document.createElement('input');
      input.type = 'range';
      input.id = `tune-${config.key}`;
      input.className = 'debug__range';
      input.min = String(limits.min);
      input.max = String(limits.max);
      input.step = String(limits.step);
      input.addEventListener('input', () => {
        const value = Number(input.value);
        const patch: Partial<SimTuning> = {};
        patch[config.key] = value;
        this.controller.setTuning(patch);
      });

      control.append(head, input);
      section.append(control);
      this.tuningControls.push({
        key: config.key,
        input,
        display,
        format: config.format,
      });
    }

    const stepControl = document.createElement('label');
    stepControl.className = 'debug__control';
    stepControl.htmlFor = 'tune-fixed-step';

    const stepHead = document.createElement('span');
    stepHead.className = 'debug__control-head';

    const stepLabel = document.createElement('span');
    stepLabel.className = 'debug__label';
    stepLabel.textContent = en.debugFixedStep;

    const stepValue = document.createElement('span');
    stepValue.className = 'debug__value';
    stepValue.id = 'tune-fixed-step-value';

    stepHead.append(stepLabel, stepValue);
    stepControl.append(stepHead);

    const stepSelect = document.createElement('select');
    stepSelect.className = 'debug__select';
    stepSelect.id = 'tune-fixed-step';
    stepControl.append(stepSelect);
    section.append(stepControl);

    const resetTuning = makeButton(en.debugResetTuning, 'debug__button');
    resetTuning.addEventListener('click', () => this.controller.resetTuning());
    section.append(resetTuning);

    return section;
  }

  private buildPhaseSection(): HTMLElement {
    const section = makeSection(en.debugTestWave);

    const phaseRow = makeRow(en.phaseLabel, 'debug-phase');
    this.phaseValue = phaseRow.value;
    section.append(phaseRow.row);

    const waveRow = makeRow(en.overlayWave, 'debug-wave-info');
    this.waveValue = waveRow.value;
    section.append(waveRow.row);

    return section;
  }

  private buildActionSection(): HTMLElement {
    const section = makeSection(en.debugActions);

    const restart = makeButton(en.debugRestartWave, 'debug__button');
    restart.addEventListener('click', () => this.controller.restartWave());

    const addBall = makeButton(en.debugAddBall, 'debug__button');
    addBall.addEventListener('click', () => this.controller.spawnBall());

    const projectile = makeButton(en.debugFireProjectile, 'debug__button');
    projectile.addEventListener('click', () => this.controller.fireTestProjectile());

    const defeat = makeButton(en.debugForceDefeat, 'debug__button');
    defeat.addEventListener('click', () => this.controller.debugDefeat());

    section.append(restart, addBall, projectile, defeat);
    return section;
  }

  private buildProgressionSection(): HTMLElement {
    const section = makeSection(en.debugProgression);

    const seedRow = makeRow(en.debugSeed, 'debug-seed');
    this.seedValue = seedRow.value;
    section.append(seedRow.row);

    const levelRow = makeRow(en.debugLevelXp, 'debug-level-xp');
    this.levelXpValue = levelRow.value;
    section.append(levelRow.row);

    const xpActions = document.createElement('div');
    xpActions.className = 'debug__button-row';

    const addXp20 = makeButton(`${en.debugAddXp} +20`, 'debug__button');
    addXp20.addEventListener('click', () => this.controller.debugAddXp(20));

    const addXp100 = makeButton(`${en.debugAddXp} +100`, 'debug__button');
    addXp100.addEventListener('click', () => this.controller.debugAddXp(100));

    xpActions.append(addXp20, addXp100);
    section.append(xpActions);

    const perkLabel = document.createElement('span');
    perkLabel.className = 'debug__label';
    perkLabel.textContent = en.debugForcePerk;
    section.append(perkLabel);

    const perkSelect = document.createElement('select');
    perkSelect.id = 'debug-perk';
    perkSelect.className = 'debug__select';

    const catalog = this.controller.getPerkCatalog();
    if (catalog.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = en.debugNoPerkCatalog;
      perkSelect.append(option);
      perkSelect.disabled = true;
    } else {
      for (const perk of catalog) {
        const option = document.createElement('option');
        option.value = perk.id;
        option.textContent = `${perk.name} (${perk.kind} · ${en.debugMaxShort} ${perk.maxLevel})`;
        perkSelect.append(option);
      }
    }
    section.append(perkSelect);

    const grant = makeButton(en.debugGrantPerk, 'debug__button');
    grant.disabled = catalog.length === 0;
    grant.addEventListener('click', () => {
      const perkId = perkSelect.value;
      if (!perkId) return;
      this.controller.debugGrantPerk(perkId);
    });
    section.append(grant);

    return section;
  }

  private applyProgression(snapshot: HudSnapshot): void {
    this.seedValue.textContent = String(snapshot.seed);
    this.levelXpValue.textContent = `${snapshot.level} · ${snapshot.xp}/${snapshot.xpToNext}`;
    this.phaseValue.textContent = `${snapshot.phaseName} (${snapshot.phaseIndex}/${Math.max(
      1,
      snapshot.phaseCount,
    )})`;
    this.waveValue.textContent = `${snapshot.waveIndex}/${snapshot.waveCount} · ${snapshot.waveName}`;
  }

  private readonly handleHudChanged = (snapshot: HudSnapshot): void => {
    this.applyProgression(snapshot);
  };

  private buildFixedStepSelect(): HTMLSelectElement {
    const select = this.panel.querySelector<HTMLSelectElement>('#tune-fixed-step') as HTMLSelectElement;
    const limits = SIM_TUNING_LIMITS.fixedStepHz;
    for (let hz = limits.min; hz <= limits.max; hz += limits.step) {
      const option = document.createElement('option');
      option.value = String(hz);
      option.textContent = `${hz} Hz`;
      select.append(option);
    }
    select.addEventListener('change', () => {
      this.controller.setTuning({ fixedStepHz: Number(select.value) });
    });
    return select;
  }

  private applyTuning(tuning: SimTuning): void {
    for (const control of this.tuningControls) {
      const value = tuning[control.key];
      control.input.value = String(value);
      control.display.textContent = control.format(value);
    }

    const stepValue = this.panel.querySelector<HTMLElement>('#tune-fixed-step-value');
    if (stepValue) stepValue.textContent = `${tuning.fixedStepHz} Hz`;
    this.fixedStepSelect.value = String(tuning.fixedStepHz);
  }

  private setCollapsed(collapsed: boolean): void {
    this.collapsed = collapsed;
    this.panel.classList.toggle('debug--collapsed', collapsed);
    this.body.hidden = collapsed;
    this.compact.hidden = !collapsed;
    this.toggleButton.setAttribute('aria-expanded', String(!collapsed));
    this.compact.setAttribute('aria-expanded', String(!collapsed));
    this.toggleButton.textContent = collapsed ? en.debugExpand : en.debugCollapse;
  }

  private readonly handleToggle = (): void => {
    this.setCollapsed(!this.collapsed);
  };

  private readonly handleCompactExpand = (): void => {
    this.setCollapsed(false);
  };

  private readonly handleTuningChanged = (tuning: SimTuning): void => {
    this.applyTuning(tuning);
  };

  private readonly handleReset = async (): Promise<void> => {
    this.resetButton.disabled = true;
    this.status.textContent = '';
    try {
      await this.controller.resetSave();
      this.onSaveReset?.();
      this.status.textContent = en.debugResetDone;
    } catch (error) {
      console.warn('[debug] save reset failed', error);
      this.status.textContent = en.debugResetFailed;
    } finally {
      this.resetButton.disabled = false;
    }
  };

  private refreshFps(): void {
    const fps = Math.round(this.game.fps);
    this.fpsValue.textContent = String(fps);
    this.compact.textContent = `${en.debugFps} ${fps} · ${this.platform.id} · ${en.debugExpand}`;
  }

  private refreshCanvas(): void {
    const metrics = this.game.canvasMetrics;
    const stage = this.game.stageSize;
    this.canvasValue.textContent = `${metrics.cssWidth}×${metrics.cssHeight} css / ${metrics.width}×${metrics.height} px`;
    this.stageValue.textContent = `${Math.round(stage.width)}×${Math.round(stage.height)}`;
  }

  private bridgeInitLabel(): string {
    const duration = this.platform.diagnostics.initDurationMs;
    if (duration !== null) return `${duration} ms`;

    if (this.boot.bridgeFailed) return en.debugTimeout;
    return en.debugNoBridge;
  }
}
