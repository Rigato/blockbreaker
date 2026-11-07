import type { GameCommands, PlatformService, SimTuning } from '../game/contracts';
import type { BootResult } from '../boot/bridgeBoot';
import type { BlockBreakerGame } from '../game/Game';
import { GAME_CONFIG, SIM_TUNING_LIMITS } from '../game/config';
import { gameEvents } from '../game/events';
import { en } from '../i18n/en';
import { resetSave } from '../platform/saveReset';

export interface DebugPanelOptions {
  root: HTMLElement;
  platform: PlatformService;
  game: BlockBreakerGame;
  controller: GameCommands;
  boot: BootResult;
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
  private readonly timer: ReturnType<typeof setInterval>;
  private readonly unsubscribeTuning: () => void;
  private collapsed = false;

  constructor(options: DebugPanelOptions) {
    this.platform = options.platform;
    this.game = options.game;
    this.controller = options.controller;
    this.boot = options.boot;

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
    body.append(this.buildWaveSection());
    body.append(this.buildActionSection());

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

  private buildWaveSection(): HTMLElement {
    const section = makeSection(en.debugTestWave);

    const select = document.createElement('select');
    select.id = 'debug-wave';
    select.className = 'debug__select';
    section.append(select);

    const load = makeButton(en.debugLoadWave, 'debug__button debug__button--accent');
    load.addEventListener('click', () => {
      const waveId = select.value;
      if (!waveId) return;
      this.controller.setTestWave(waveId);
      this.controller.startRun();
    });
    section.append(load);

    const waves = this.controller.getTestWaves();
    for (const wave of waves) {
      const option = document.createElement('option');
      option.value = wave.id;
      option.textContent = wave.name;
      select.append(option);
    }
    if (waves.length === 0) {
      select.disabled = true;
      load.disabled = true;
    }

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

    section.append(restart, addBall, projectile);
    return section;
  }

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
      await resetSave(this.platform.storage);
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
