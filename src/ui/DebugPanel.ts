import type { PlatformService } from '../game/contracts';
import type { BootResult } from '../boot/bridgeBoot';
import type { BlockBreakerGame } from '../game/Game';
import { GAME_CONFIG } from '../game/config';
import { en } from '../i18n/en';
import { resetSave } from '../platform/saveReset';

export interface DebugPanelOptions {
  root: HTMLElement;
  platform: PlatformService;
  game: BlockBreakerGame;
  boot: BootResult;
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

export class DebugPanel {
  private readonly platform: PlatformService;
  private readonly game: BlockBreakerGame;
  private readonly boot: BootResult;
  private readonly panel: HTMLElement;
  private readonly fpsValue: HTMLElement;
  private readonly canvasValue: HTMLElement;
  private readonly stageValue: HTMLElement;
  private readonly readyValue: HTMLElement;
  private readonly status: HTMLElement;
  private readonly resetButton: HTMLButtonElement;
  private readonly timer: ReturnType<typeof setInterval>;

  constructor(options: DebugPanelOptions) {
    this.platform = options.platform;
    this.game = options.game;
    this.boot = options.boot;

    const panel = document.createElement('section');
    this.panel = panel;
    panel.id = 'debug-panel';
    panel.className = 'debug';
    panel.setAttribute('aria-label', en.debugTitle);

    const heading = document.createElement('h2');
    heading.className = 'debug__title';
    heading.textContent = en.debugTitle;
    panel.append(heading);

    const rows = document.createElement('div');
    rows.className = 'debug__rows';
    panel.append(rows);

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

    this.resetButton = document.createElement('button');
    this.resetButton.type = 'button';
    this.resetButton.className = 'debug__reset';
    this.resetButton.textContent = en.debugResetSave;
    this.resetButton.addEventListener('click', this.handleReset);
    panel.append(this.resetButton);

    this.status = document.createElement('p');
    this.status.className = 'debug__status';
    this.status.setAttribute('role', 'status');
    panel.append(this.status);

    options.root.append(panel);
    this.refreshCanvas();
    this.refreshFps();
    this.timer = setInterval(() => {
      this.refreshFps();
      this.refreshCanvas();
    }, GAME_CONFIG.debug.sampleMs);
  }

  setGameReady(label: string): void {
    this.readyValue.textContent = label;
  }

  dispose(): void {
    clearInterval(this.timer);
    this.resetButton.removeEventListener('click', this.handleReset);
    this.panel.remove();
  }

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
    this.fpsValue.textContent = String(Math.round(this.game.fps));
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
