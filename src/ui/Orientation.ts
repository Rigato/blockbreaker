import type { GameCommands } from '../game/contracts';
import { gameEvents } from '../game/events';
import { en } from '../i18n/en';

export interface OrientationOptions {
  controller: GameCommands;
}

type MediaCleanup = () => void;

function listenMedia(query: MediaQueryList, handler: () => void): MediaCleanup {
  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }

  // Safari < 14 fallback. The listener survives until dispose.
  query.addListener(handler);
  return () => query.removeListener(handler);
}

/**
 * Mobile portrait guard.
 *
 * Touch devices in landscape get a full-screen "rotate to portrait" notice.
 * If a run is in progress it is paused automatically and resumed only when the
 * orientation becomes playable again. Desktop/notebooks (fine pointer or a
 * hover-capable device) never see the overlay, even when they have a
 * touchscreen.
 */
export class Orientation {
  private readonly controller: GameCommands;
  private readonly overlay: HTMLElement;
  private readonly coarsePointer = window.matchMedia('(pointer: coarse)');
  private readonly noHover = window.matchMedia('(hover: none)');
  private readonly anyFinePointer = window.matchMedia('(any-pointer: fine)');
  private readonly landscape = window.matchMedia('(orientation: landscape)');
  private readonly cleanup: MediaCleanup[] = [];
  private readonly unsubscribeHud: () => void;
  private visible = false;
  private autoPaused = false;

  constructor(options: OrientationOptions) {
    this.controller = options.controller;

    const section = document.createElement('section');
    this.overlay = section;
    section.className = 'orientation';
    section.hidden = true;
    section.setAttribute('role', 'dialog');
    section.setAttribute('aria-modal', 'true');
    section.setAttribute('aria-labelledby', 'orientation-title');
    section.setAttribute('aria-describedby', 'orientation-body');

    const panel = document.createElement('div');
    panel.className = 'orientation__panel';

    const device = document.createElement('div');
    device.className = 'orientation__device';
    device.setAttribute('aria-hidden', 'true');

    const screen = document.createElement('span');
    screen.className = 'orientation__device-screen';

    const arrow = document.createElement('span');
    arrow.className = 'orientation__arrow';

    device.append(screen, arrow);

    const kicker = document.createElement('p');
    kicker.className = 'orientation__kicker';
    kicker.textContent = en.rotateKicker;

    const title = document.createElement('h2');
    title.className = 'orientation__title';
    title.id = 'orientation-title';
    title.textContent = en.rotateTitle;

    const body = document.createElement('p');
    body.className = 'orientation__body';
    body.id = 'orientation-body';
    body.textContent = en.rotateBody;

    panel.append(device, kicker, title, body);
    section.append(panel);

    // Appended to <body> so the notice covers the whole viewport and cannot be
    // clipped by the portrait shell.
    document.body.append(section);

    const onViewportChange = (): void => this.sync();
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('orientationchange', onViewportChange);
    this.cleanup.push(() => window.removeEventListener('resize', onViewportChange));
    this.cleanup.push(() => window.removeEventListener('orientationchange', onViewportChange));
    this.cleanup.push(listenMedia(this.coarsePointer, onViewportChange));
    this.cleanup.push(listenMedia(this.noHover, onViewportChange));
    this.cleanup.push(listenMedia(this.anyFinePointer, onViewportChange));
    this.cleanup.push(listenMedia(this.landscape, onViewportChange));

    // Keep the run frozen while the notice covers the screen, even if a
    // keyboard shortcut (P/Esc) asks the game to resume behind it. Once the
    // notice is gone, only an automatic pause is resumed.
    this.unsubscribeHud = gameEvents.on('hud:changed', ({ phase }) => {
      if (this.visible) {
        if (phase === 'playing') {
          this.autoPaused = true;
          this.controller.pause();
        } else if (phase !== 'paused') {
          this.autoPaused = false;
        }
        return;
      }

      if (this.autoPaused && phase !== 'paused') this.autoPaused = false;
    });

    this.sync();
  }

  dispose(): void {
    this.unsubscribeHud();
    for (const remove of this.cleanup) remove();
    this.cleanup.length = 0;
    this.overlay.remove();
  }

  private isTouchDevice(): boolean {
    // `pointer: coarse` covers phones and tablets. `maxTouchPoints` alone would
    // also match touchscreen notebooks, so require no fine pointer to be
    // available (a notebook trackpad/mouse always provides one) and no hover.
    if (this.anyFinePointer.matches) return false;
    return this.coarsePointer.matches || (navigator.maxTouchPoints > 0 && this.noHover.matches);
  }

  private sync(): void {
    const shouldShow = this.isTouchDevice() && this.landscape.matches;
    if (shouldShow) this.show();
    else this.hide();
  }

  private show(): void {
    if (this.visible) return;
    this.visible = true;
    this.overlay.hidden = false;
    document.documentElement.dataset.orientation = 'landscape';

    if (this.controller.getHudState().phase === 'playing') {
      this.autoPaused = true;
      this.controller.pause();
    }
  }

  private hide(): void {
    if (!this.visible) return;
    this.visible = false;
    this.overlay.hidden = true;
    delete document.documentElement.dataset.orientation;

    if (this.autoPaused) {
      this.autoPaused = false;
      if (this.controller.getHudState().phase === 'paused') this.controller.resume();
    }
  }
}
