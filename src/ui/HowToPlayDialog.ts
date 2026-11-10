import { en } from '../i18n/en';
import '../styles/how-to-play.css';

export interface HowToPlayDialogOptions {
  root: HTMLElement;
  onClose: () => void;
}

interface HowToPage {
  src: string;
  alt: string;
  title: string;
  body: string;
}

const PAGES: readonly HowToPage[] = [
  {
    src: './how-to-play/move-launch.png',
    alt: en.howToPage1Alt,
    title: en.howToPage1Title,
    body: en.howToPage1Body,
  },
  {
    src: './how-to-play/level-up.png',
    alt: en.howToPage2Alt,
    title: en.howToPage2Title,
    body: en.howToPage2Body,
  },
  {
    src: './how-to-play/specials.png',
    alt: en.howToPage3Alt,
    title: en.howToPage3Title,
    body: en.howToPage3Body,
  },
  {
    src: './how-to-play/boss.png',
    alt: en.howToPage4Alt,
    title: en.howToPage4Title,
    body: en.howToPage4Body,
  },
  {
    src: './how-to-play/endless.png',
    alt: en.howToPage5Alt,
    title: en.howToPage5Title,
    body: en.howToPage5Body,
  },
];

const ARROW_LEFT_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
  '<path d="M19 12H5M11 6l-6 6 6 6"/>' +
  '</svg>';

const ARROW_RIGHT_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
  '<path d="M5 12h14M13 6l6 6-6 6"/>' +
  '</svg>';

/**
 * Paginated "How to play" dialog: five screenshot pages with Prev / Next /
 * dots / counter controls. Owns its focus trap, Escape handling, arrow-key
 * paging and focus restoration, mirroring SettingsDialog/InfoDialog.
 */
export class HowToPlayDialog {
  private readonly onClose: () => void;
  private readonly section: HTMLElement;
  private readonly panel: HTMLElement;
  private readonly image: HTMLImageElement;
  private readonly pageTitle: HTMLElement;
  private readonly pageBody: HTMLElement;
  private readonly pageScroll: HTMLElement;
  private readonly counter: HTMLElement;
  private readonly dots: HTMLButtonElement[];
  private readonly prevButton: HTMLButtonElement;
  private readonly nextButton: HTMLButtonElement;
  private readonly closeButton: HTMLButtonElement;
  private readonly unsubscribeKeydown: () => void;

  private openFlag = false;
  private pageIndex = 0;
  private renderedIndex = -1;
  private restoreFocus: HTMLElement | null = null;
  private preloaded = false;

  constructor(options: HowToPlayDialogOptions) {
    this.onClose = options.onClose;

    const section = document.createElement('section');
    this.section = section;
    section.className = 'how-to-play';
    section.hidden = true;

    const panel = document.createElement('div');
    this.panel = panel;
    panel.className = 'how-to-play__panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'how-to-play-title');

    // --- Head ---------------------------------------------------------------
    const head = document.createElement('header');
    head.className = 'how-to-play__head';

    const title = document.createElement('h2');
    title.className = 'how-to-play__title';
    title.id = 'how-to-play-title';
    title.textContent = en.howToTitle;

    const subtitle = document.createElement('p');
    subtitle.className = 'how-to-play__subtitle';
    subtitle.textContent = en.howToSubtitle;

    head.append(title, subtitle);

    // --- Screenshot ---------------------------------------------------------
    const media = document.createElement('figure');
    media.className = 'how-to-play__media';

    const frame = document.createElement('div');
    frame.className = 'how-to-play__frame';

    const image = document.createElement('img');
    this.image = image;
    image.className = 'how-to-play__image';
    image.setAttribute('decoding', 'async');

    frame.append(image);
    media.append(frame);

    // --- Page text ----------------------------------------------------------
    const pageScroll = document.createElement('div');
    this.pageScroll = pageScroll;
    pageScroll.className = 'how-to-play__page';
    pageScroll.setAttribute('aria-live', 'polite');

    const pageTitle = document.createElement('h3');
    this.pageTitle = pageTitle;
    pageTitle.className = 'how-to-play__page-title';

    const pageBody = document.createElement('p');
    this.pageBody = pageBody;
    pageBody.className = 'how-to-play__page-body';

    pageScroll.append(pageTitle, pageBody);

    // --- Progress: dots + counter -------------------------------------------
    const progress = document.createElement('div');
    progress.className = 'how-to-play__progress';

    const dots = document.createElement('div');
    dots.className = 'how-to-play__dots';

    this.dots = PAGES.map((_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'how-to-play__dot';
      dot.setAttribute(
        'aria-label',
        en.howToGoToPage.replace('{{index}}', String(index + 1)),
      );
      dot.addEventListener('click', () => this.goTo(index));
      dots.append(dot);
      return dot;
    });

    const counter = document.createElement('span');
    this.counter = counter;
    counter.className = 'how-to-play__counter';

    progress.append(dots, counter);

    // --- Controls -----------------------------------------------------------
    const controls = document.createElement('div');
    controls.className = 'how-to-play__controls';

    const prevButton = document.createElement('button');
    this.prevButton = prevButton;
    prevButton.type = 'button';
    prevButton.id = 'how-to-play-prev';
    prevButton.className = 'how-to-play__nav';
    prevButton.setAttribute('aria-label', en.howToPrev);
    prevButton.innerHTML = `${ARROW_LEFT_SVG}<span class="how-to-play__nav-label">${en.howToPrev}</span>`;
    prevButton.addEventListener('click', this.handlePrev);

    const nextButton = document.createElement('button');
    this.nextButton = nextButton;
    nextButton.type = 'button';
    nextButton.id = 'how-to-play-next';
    nextButton.className = 'how-to-play__nav';
    nextButton.setAttribute('aria-label', en.howToNext);
    nextButton.innerHTML = `${ARROW_RIGHT_SVG}<span class="how-to-play__nav-label">${en.howToNext}</span>`;
    nextButton.addEventListener('click', this.handleNext);

    const closeButton = document.createElement('button');
    this.closeButton = closeButton;
    closeButton.type = 'button';
    closeButton.id = 'how-to-play-close';
    closeButton.className = 'how-to-play__close';
    closeButton.textContent = en.howToClose;
    closeButton.addEventListener('click', this.handleClose);

    controls.append(prevButton, nextButton, closeButton);

    panel.append(head, media, pageScroll, progress, controls);
    section.append(panel);
    options.root.append(section);

    this.unsubscribeKeydown = this.listenKeys();
  }

  open(): void {
    this.preloadPages();
    if (!this.openFlag) {
      this.restoreFocus =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    this.openFlag = true;
    this.section.hidden = false;
    this.renderPage(0);
    window.requestAnimationFrame(() => {
      if (!this.openFlag) return;
      (this.pageIndex === PAGES.length - 1 ? this.prevButton : this.nextButton).focus({
        preventScroll: true,
      });
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
    this.prevButton.removeEventListener('click', this.handlePrev);
    this.nextButton.removeEventListener('click', this.handleNext);
    this.closeButton.removeEventListener('click', this.handleClose);
    for (const dot of this.dots) {
      dot.replaceWith(dot.cloneNode(true));
    }
    this.section.remove();
  }

  // -- Paging ---------------------------------------------------------------

  private renderPage(index: number): void {
    this.pageIndex = Math.min(Math.max(index, 0), PAGES.length - 1);
    const page = PAGES[this.pageIndex];
    if (!page) return;

    // Re-trigger the finite page transition when the page actually changes.
    if (this.renderedIndex !== this.pageIndex) {
      this.section.classList.remove('is-paging');
      void this.section.offsetWidth;
      this.section.classList.add('is-paging');
      this.renderedIndex = this.pageIndex;
    }

    this.image.src = page.src;
    this.image.alt = page.alt;
    this.pageTitle.textContent = page.title;
    this.pageBody.textContent = page.body;
    this.pageScroll.scrollTop = 0;

    this.prevButton.disabled = this.pageIndex === 0;
    this.nextButton.disabled = this.pageIndex === PAGES.length - 1;

    this.counter.textContent = en.howToPage
      .replace('{{current}}', String(this.pageIndex + 1))
      .replace('{{total}}', String(PAGES.length));

    this.dots.forEach((dot, dotIndex) => {
      const active = dotIndex === this.pageIndex;
      dot.classList.toggle('is-active', active);
      if (active) dot.setAttribute('aria-current', 'page');
      else dot.removeAttribute('aria-current');
    });

    // Keep keyboard focus on an enabled nav button when the focused one was
    // disabled by reaching the first/last page.
    if (this.nextButton.disabled && document.activeElement === this.nextButton) {
      this.prevButton.focus({ preventScroll: true });
    } else if (this.prevButton.disabled && document.activeElement === this.prevButton) {
      this.nextButton.focus({ preventScroll: true });
    }
  }

  private goTo(index: number): void {
    if (!this.openFlag) return;
    this.renderPage(index);
  }

  private readonly handlePrev = (): void => {
    if (this.pageIndex > 0) this.renderPage(this.pageIndex - 1);
  };

  private readonly handleNext = (): void => {
    if (this.pageIndex < PAGES.length - 1) this.renderPage(this.pageIndex + 1);
  };

  private readonly handleClose = (): void => {
    this.close();
    this.onClose();
  };

  /** Warm the screenshot cache so page flips never flash an empty frame. */
  private preloadPages(): void {
    if (this.preloaded) return;
    this.preloaded = true;
    for (const page of PAGES) {
      const loader = new Image();
      loader.decoding = 'async';
      loader.src = page.src;
    }
  }

  // -- Keyboard --------------------------------------------------------------

  private listenKeys(): () => void {
    const handler = (event: KeyboardEvent): void => {
      if (!this.openFlag) return;
      this.trapTab(event);
      if (event.key === 'Escape') {
        event.stopPropagation();
        this.handleClose();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        event.stopPropagation();
        this.handlePrev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        event.stopPropagation();
        this.handleNext();
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
