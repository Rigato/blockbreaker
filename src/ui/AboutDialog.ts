import { en } from '../i18n/en';
import '../styles/about.css';

export interface AboutDialogOptions {
  root: HTMLElement;
  onClose: () => void;
}

/**
 * Studio "About us" modal: Bad Decision Games logo, a short English bio and a
 * Close button. Owns its focus trap, Escape handling and focus restoration.
 */
export class AboutDialog {
  private readonly onClose: () => void;
  private readonly section: HTMLElement;
  private readonly panel: HTMLElement;
  private readonly closeButton: HTMLButtonElement;
  private readonly unsubscribeKeydown: () => void;

  private openFlag = false;
  private restoreFocus: HTMLElement | null = null;

  constructor(options: AboutDialogOptions) {
    this.onClose = options.onClose;

    const section = document.createElement('section');
    this.section = section;
    section.className = 'about';
    section.hidden = true;

    const panel = document.createElement('div');
    this.panel = panel;
    panel.className = 'about__panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'about-title');

    // --- Head ---------------------------------------------------------------
    const title = document.createElement('h2');
    title.className = 'about__title';
    title.id = 'about-title';
    title.textContent = en.aboutTitle;

    // --- Logo ---------------------------------------------------------------
    const logo = document.createElement('figure');
    logo.className = 'about__logo';

    // WebP with a PNG fallback for older Safari/portal WebViews.
    const picture = document.createElement('picture');

    const source = document.createElement('source');
    source.srcset = './bad-decision-games/logo.webp';
    source.type = 'image/webp';

    const image = document.createElement('img');
    image.className = 'about__logo-image';
    image.src = './bad-decision-games/logo.png';
    image.alt = en.aboutLogoAlt;
    image.setAttribute('decoding', 'async');

    picture.append(source, image);

    // The logo artwork already contains the studio name; no extra caption.
    logo.append(picture);

    // --- Body ---------------------------------------------------------------
    const body = document.createElement('div');
    body.className = 'about__body';
    body.id = 'about-body';

    for (const paragraph of en.aboutBody.split('\n\n')) {
      const text = document.createElement('p');
      text.className = 'about__body-text';
      text.textContent = paragraph;
      body.append(text);
    }

    // --- Close ---------------------------------------------------------------
    const closeButton = document.createElement('button');
    this.closeButton = closeButton;
    closeButton.type = 'button';
    closeButton.id = 'about-close';
    closeButton.className = 'about__close';
    closeButton.textContent = en.aboutClose;
    closeButton.addEventListener('click', this.handleClose);

    panel.append(title, logo, body, closeButton);
    section.append(panel);
    options.root.append(section);

    this.unsubscribeKeydown = this.listenKeys();
  }

  open(): void {
    if (!this.openFlag) {
      this.restoreFocus =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    this.openFlag = true;
    this.section.hidden = false;
    window.requestAnimationFrame(() => {
      if (this.openFlag) this.closeButton.focus({ preventScroll: true });
    });
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
    this.section.remove();
  }

  private readonly handleClose = (): void => {
    this.close();
    this.onClose();
  };

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
