import type { GameCommands, HudSnapshot } from '../game/contracts';
import { en } from '../i18n/en';

export interface SettingsDialogOptions {
  root: HTMLElement;
  controller: GameCommands;
  onClose: () => void;
}

type SettingKey = 'sound' | 'music' | 'screenShake';

interface SettingSpec {
  key: SettingKey;
  label: string;
  body: string;
  accent: 'cyan' | 'violet' | 'gold';
  icon: string;
}

interface SettingRow {
  spec: SettingSpec;
  row: HTMLElement;
  button: HTMLButtonElement;
  value: HTMLElement;
  handleToggle: () => void;
}

const SOUND_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
  '<path d="M11 5 6 9H3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h3l5 4z"/>' +
  '<path d="M15.5 8.5a5 5 0 0 1 0 7"/>' +
  '<path d="M18.8 5.6a9.4 9.4 0 0 1 0 12.8"/>' +
  '</svg>';

const MUSIC_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
  '<path d="M9 18V6l11-2v12"/>' +
  '<circle cx="6" cy="18" r="3"/>' +
  '<circle cx="17" cy="16" r="3"/>' +
  '</svg>';

const SHAKE_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
  '<path d="m2 7 3-3 3 3"/>' +
  '<path d="m9 14 3-3 3 3"/>' +
  '<path d="m16 21 3-3 3 3"/>' +
  '</svg>';

const SPECS: readonly SettingSpec[] = [
  {
    key: 'sound',
    label: en.settingsSound,
    body: en.settingsSoundBody,
    accent: 'cyan',
    icon: SOUND_ICON,
  },
  {
    key: 'music',
    label: en.settingsMusic,
    body: en.settingsMusicBody,
    accent: 'violet',
    icon: MUSIC_ICON,
  },
  {
    key: 'screenShake',
    label: en.settingsShake,
    body: en.settingsShakeBody,
    accent: 'gold',
    icon: SHAKE_ICON,
  },
];

/**
 * Settings modal: sound effects, music and screen shake switches. Owns its
 * focus trap, Escape handling and focus restoration; the game state is the
 * single source of truth (`open`/`update` mirror it, toggles write through
 * the controller).
 */
export class SettingsDialog {
  private readonly controller: GameCommands;
  private readonly onClose: () => void;
  private readonly section: HTMLElement;
  private readonly panel: HTMLElement;
  private readonly rows: readonly SettingRow[];
  private readonly closeButton: HTMLButtonElement;
  private readonly unsubscribeKeydown: () => void;

  private openFlag = false;
  private soundEnabled: boolean | null = null;
  private musicEnabled: boolean | null = null;
  private screenShakeEnabled: boolean | null = null;
  private restoreFocus: HTMLElement | null = null;

  constructor(options: SettingsDialogOptions) {
    this.controller = options.controller;
    this.onClose = options.onClose;

    const section = document.createElement('section');
    this.section = section;
    section.className = 'settings';
    section.hidden = true;

    const panel = document.createElement('div');
    this.panel = panel;
    panel.className = 'settings__panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'settings-title');

    const head = document.createElement('header');
    head.className = 'settings__head';

    const title = document.createElement('h2');
    title.className = 'settings__title';
    title.id = 'settings-title';
    title.textContent = en.settingsTitle;

    const subtitle = document.createElement('p');
    subtitle.className = 'settings__subtitle';
    subtitle.textContent = en.settingsSubtitle;

    head.append(title, subtitle);

    const rowsWrap = document.createElement('div');
    rowsWrap.className = 'settings__rows';
    this.rows = SPECS.map((spec) => this.buildRow(spec));
    for (const row of this.rows) rowsWrap.append(row.row);

    const closeButton = document.createElement('button');
    this.closeButton = closeButton;
    closeButton.type = 'button';
    closeButton.id = 'settings-close';
    closeButton.className = 'settings__close';
    closeButton.textContent = en.settingsClose;
    closeButton.addEventListener('click', this.handleClose);

    panel.append(head, rowsWrap, closeButton);
    section.append(panel);
    options.root.append(section);

    this.unsubscribeKeydown = this.listenKeys();
  }

  open(snapshot: HudSnapshot): void {
    this.applySnapshot(snapshot);
    if (!this.openFlag) {
      this.restoreFocus =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    this.openFlag = true;
    this.section.hidden = false;
    window.requestAnimationFrame(() => {
      if (this.openFlag) this.rows[0]?.button.focus({ preventScroll: true });
    });
  }

  update(snapshot: HudSnapshot): void {
    if (!this.openFlag) return;
    this.applySnapshot(snapshot);
  }

  close(): void {
    if (!this.openFlag) return;
    this.openFlag = false;
    this.section.hidden = true;
    if (this.restoreFocus?.isConnected) {
      this.restoreFocus.focus({ preventScroll: true });
    }
    this.restoreFocus = null;
  }

  get isOpen(): boolean {
    return this.openFlag;
  }

  dispose(): void {
    this.unsubscribeKeydown();
    this.closeButton.removeEventListener('click', this.handleClose);
    for (const row of this.rows) {
      row.button.removeEventListener('click', row.handleToggle);
    }
    this.section.remove();
  }

  // -- Building -------------------------------------------------------------

  private buildRow(spec: SettingSpec): SettingRow {
    const row = document.createElement('div');
    row.className = 'settings__row';
    row.dataset.accent = spec.accent;

    const iconWrap = document.createElement('span');
    iconWrap.className = 'settings__row-icon';
    iconWrap.setAttribute('aria-hidden', 'true');
    iconWrap.innerHTML = spec.icon;

    const text = document.createElement('span');
    text.className = 'settings__row-text';

    const label = document.createElement('span');
    label.className = 'settings__row-label';
    label.textContent = spec.label;

    const body = document.createElement('span');
    body.className = 'settings__row-body';
    body.textContent = spec.body;

    text.append(label, body);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'settings__switch';
    button.setAttribute('role', 'switch');
    button.setAttribute('aria-label', spec.label);

    const track = document.createElement('span');
    track.className = 'settings__switch-track';
    track.setAttribute('aria-hidden', 'true');

    const thumb = document.createElement('span');
    thumb.className = 'settings__switch-thumb';
    track.append(thumb);

    const value = document.createElement('span');
    value.className = 'settings__switch-value';

    button.append(track, value);

    const handleToggle = (): void => this.handleToggle(spec.key);
    button.addEventListener('click', handleToggle);

    row.append(iconWrap, text, button);
    return { spec, row, button, value, handleToggle };
  }

  // -- State ------------------------------------------------------------------

  private applySnapshot(snapshot: HudSnapshot): void {
    this.applySetting('sound', snapshot.soundEnabled);
    this.applySetting('music', snapshot.musicEnabled);
    this.applySetting('screenShake', snapshot.screenShakeEnabled);
  }

  private applySetting(key: SettingKey, enabled: boolean): void {
    // `null` means "never rendered": the first application always paints the
    // row so a default save shows On + aria-checked from the start.
    const current = this.fieldFor(key);
    if (current !== null && current === enabled) return;
    this.setField(key, enabled);

    const row = this.rows.find((candidate) => candidate.spec.key === key);
    if (!row) return;
    row.button.classList.toggle('is-on', enabled);
    row.button.setAttribute('aria-checked', String(enabled));
    row.value.textContent = enabled ? en.settingsOn : en.settingsOff;
  }

  private readonly handleToggle = (key: SettingKey): void => {
    const enabled = !this.valueFor(key);
    this.applySetting(key, enabled);
    if (key === 'sound') this.controller.setSound(enabled);
    else if (key === 'music') this.controller.setMusic(enabled);
    else this.controller.setScreenShake(enabled);
  };

  private valueFor(key: SettingKey): boolean {
    // Missing state defaults to enabled (matches the settings migration rule:
    // absent fields are treated as true).
    return this.fieldFor(key) ?? true;
  }

  private fieldFor(key: SettingKey): boolean | null {
    if (key === 'sound') return this.soundEnabled;
    if (key === 'music') return this.musicEnabled;
    return this.screenShakeEnabled;
  }

  private setField(key: SettingKey, enabled: boolean): void {
    if (key === 'sound') this.soundEnabled = enabled;
    else if (key === 'music') this.musicEnabled = enabled;
    else this.screenShakeEnabled = enabled;
  }

  private readonly handleClose = (): void => {
    this.close();
    this.onClose();
  };

  // -- Keyboard --------------------------------------------------------------

  private listenKeys(): () => void {
    const handler = (event: KeyboardEvent): void => {
      if (!this.openFlag) return;
      this.trapTab(event);
      if (event.key === 'Escape') {
        event.stopPropagation();
        this.handleClose();
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.stopPropagation();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }

  private trapTab(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const focusable = Array.from(
      this.panel.querySelectorAll<HTMLButtonElement>('button:not(:disabled):not([hidden])'),
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  }
}
