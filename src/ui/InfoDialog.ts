export interface InfoDialogOptions {
  root: HTMLElement;
  onClose: () => void;
}

export interface InfoDialogContent {
  title: string;
  body: string;
  confirmLabel: string;
}

/**
 * Small centered modal for short confirmations (e.g. the locked Endless
 * message). Owns its focus trap, Escape handling and focus restoration.
 */
export class InfoDialog {
  private readonly onClose: () => void;
  private readonly section: HTMLElement;
  private readonly panel: HTMLElement;
  private readonly title: HTMLElement;
  private readonly body: HTMLElement;
  private readonly confirmButton: HTMLButtonElement;
  private readonly unsubscribeKeydown: () => void;

  private openFlag = false;
  private restoreFocus: HTMLElement | null = null;

  constructor(options: InfoDialogOptions) {
    this.onClose = options.onClose;

    const section = document.createElement('section');
    this.section = section;
    section.className = 'info';
    section.hidden = true;

    const panel = document.createElement('div');
    this.panel = panel;
    panel.className = 'info__panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'info-title');
    panel.setAttribute('aria-describedby', 'info-body');

    const ornament = document.createElement('span');
    ornament.className = 'info__ornament';
    ornament.setAttribute('aria-hidden', 'true');

    const title = document.createElement('h2');
    this.title = title;
    title.className = 'info__title';
    title.id = 'info-title';

    const body = document.createElement('p');
    this.body = body;
    body.className = 'info__body';
    body.id = 'info-body';

    const confirmButton = document.createElement('button');
    this.confirmButton = confirmButton;
    confirmButton.type = 'button';
    confirmButton.id = 'info-confirm';
    confirmButton.className = 'info__confirm';
    confirmButton.addEventListener('click', this.handleConfirm);

    panel.append(ornament, title, body, confirmButton);
    section.append(panel);
    options.root.append(section);

    this.unsubscribeKeydown = this.listenKeys();
  }

  open(content: InfoDialogContent): void {
    this.title.textContent = content.title;
    this.body.textContent = content.body;
    this.confirmButton.textContent = content.confirmLabel;

    if (!this.openFlag) {
      this.restoreFocus =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    this.openFlag = true;
    this.section.hidden = false;
    window.requestAnimationFrame(() => {
      if (this.openFlag) this.confirmButton.focus({ preventScroll: true });
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
    this.confirmButton.removeEventListener('click', this.handleConfirm);
    this.section.remove();
  }

  private readonly handleConfirm = (): void => {
    this.close();
    this.onClose();
  };

  private listenKeys(): () => void {
    const handler = (event: KeyboardEvent): void => {
      if (!this.openFlag) return;
      this.trapTab(event);
      if (event.key === 'Escape') {
        event.stopPropagation();
        this.handleConfirm();
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
