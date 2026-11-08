import { gameEvents } from '../game/events';
import { en } from '../i18n/en';

/** Local safety net; the Game owns the authoritative 15 s interstitial timeout. */
const SAFETY_TIMEOUT_MS = 16_000;

export interface AdOverlayOptions {
  /** Focus fallback when the element focused before the ad no longer exists. */
  fallbackFocus?: () => HTMLElement | null;
}

/**
 * Full-screen blocking transition shown while a results interstitial is being
 * requested.
 *
 * The Game emits `ad:state`; the overlay never talks to the ads service. It
 * only appears when `requested` arrives, so platforms without interstitial
 * support (mock/itch/unsupported) never see it.
 */
export class AdOverlay {
  private readonly section: HTMLElement;
  private readonly fallbackFocus: () => HTMLElement | null;
  private readonly unsubscribe: () => void;
  private visible = false;
  private previousFocus: HTMLElement | null = null;
  private safetyTimeout = 0;

  constructor(options: AdOverlayOptions = {}) {
    this.fallbackFocus = options.fallbackFocus ?? (() => null);

    const section = document.createElement('section');
    this.section = section;
    section.className = 'ad-overlay';
    section.hidden = true;
    section.tabIndex = -1;
    section.setAttribute('role', 'status');
    section.setAttribute('aria-live', 'polite');
    section.setAttribute('aria-label', en.adLoading);

    const panel = document.createElement('div');
    panel.className = 'ad-overlay__panel';

    const spinner = document.createElement('span');
    spinner.className = 'ad-overlay__spinner';
    spinner.setAttribute('aria-hidden', 'true');

    const kicker = document.createElement('p');
    kicker.className = 'ad-overlay__kicker';
    kicker.textContent = en.adKicker;

    const title = document.createElement('p');
    title.className = 'ad-overlay__title';
    title.textContent = en.adLoading;

    panel.append(spinner, kicker, title);
    section.append(panel);

    // Appended to <body> so the scrim covers the whole viewport, including the
    // orientation guard and any results dialog.
    document.body.append(section);

    // Capture phase so gameplay/DOM shortcuts (P, Space, Enter, Tab, Esc)
    // never reach the controls behind the scrim.
    document.addEventListener('keydown', this.handleKeydown, true);
    this.unsubscribe = gameEvents.on('ad:state', ({ state }) => {
      if (state === 'requested') this.show();
      else this.hide();
    });
  }

  dispose(): void {
    this.unsubscribe();
    document.removeEventListener('keydown', this.handleKeydown, true);
    if (this.safetyTimeout !== 0) {
      window.clearTimeout(this.safetyTimeout);
      this.safetyTimeout = 0;
    }
    this.section.remove();
    this.visible = false;
    this.previousFocus = null;
  }

  private show(): void {
    if (this.visible) return;
    this.visible = true;

    const active = document.activeElement;
    this.previousFocus = active instanceof HTMLElement && active !== document.body ? active : null;

    this.section.hidden = false;
    this.section.setAttribute('aria-busy', 'true');
    this.section.focus({ preventScroll: true });

    if (this.safetyTimeout !== 0) window.clearTimeout(this.safetyTimeout);
    this.safetyTimeout = window.setTimeout(() => {
      this.safetyTimeout = 0;
      this.hide();
    }, SAFETY_TIMEOUT_MS);
  }

  private hide(): void {
    if (!this.visible) return;
    this.visible = false;

    if (this.safetyTimeout !== 0) {
      window.clearTimeout(this.safetyTimeout);
      this.safetyTimeout = 0;
    }

    this.section.hidden = true;
    this.section.removeAttribute('aria-busy');
    this.restoreFocus();
  }

  private restoreFocus(): void {
    const previous = this.previousFocus;
    this.previousFocus = null;

    window.requestAnimationFrame(() => {
      if (this.visible) return;

      if (previous && previous.isConnected && previous.offsetParent !== null) {
        previous.focus({ preventScroll: true });
        return;
      }

      const fallback = this.fallbackFocus();
      if (fallback && fallback.isConnected && fallback.offsetParent !== null) {
        fallback.focus({ preventScroll: true });
      }
    });
  }

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    if (!this.visible) return;

    switch (event.key) {
      case 'Tab':
      case 'Enter':
      case 'Escape':
      case ' ':
      case 'Spacebar':
        event.preventDefault();
        break;
      default:
        break;
    }
    event.stopImmediatePropagation();
  };
}
