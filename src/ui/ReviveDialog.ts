import type { GameCommands, HudSnapshot } from '../game/contracts';
import { revive } from '../i18n/revive';
import '../styles/revive.css';

export interface ReviveDialogOptions {
  root: HTMLElement;
  controller: GameCommands;
}

/**
 * One-per-run rewarded ad offer shown when the run would otherwise end.
 *
 * The dialog only renders state; accepting/declining writes through the
 * controller. While the rewarded ad itself is open, AdOverlay covers this
 * modal.
 */
export class ReviveDialog {
  private readonly controller: GameCommands;
  private readonly section: HTMLElement;
  private readonly panel: HTMLElement;
  private readonly watchButton: HTMLButtonElement;
  private readonly declineButton: HTMLButtonElement;
  private readonly unsubscribeKeydown: () => void;
  private visible = false;
  private previousFocus: HTMLElement | null = null;

  constructor(options: ReviveDialogOptions) {
    this.controller = options.controller;

    const section = document.createElement('section');
    this.section = section;
    section.className = 'revive';
    section.hidden = true;

    const panel = document.createElement('div');
    this.panel = panel;
    panel.className = 'revive__panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'revive-title');
    panel.setAttribute('aria-describedby', 'revive-body');

    const ornament = document.createElement('span');
    ornament.className = 'revive__ornament';
    ornament.setAttribute('aria-hidden', 'true');

    const kicker = document.createElement('p');
    kicker.className = 'revive__kicker';
    kicker.textContent = revive.kicker;

    const title = document.createElement('h2');
    title.className = 'revive__title';
    title.id = 'revive-title';
    title.textContent = revive.title;

    const body = document.createElement('p');
    body.className = 'revive__body';
    body.id = 'revive-body';
    body.textContent = revive.body;

    const note = document.createElement('p');
    note.className = 'revive__note';
    note.textContent = revive.note;

    const actions = document.createElement('div');
    actions.className = 'revive__actions';

    const watch = document.createElement('button');
    this.watchButton = watch;
    watch.type = 'button';
    watch.id = 'revive-watch';
    watch.className = 'revive__watch';
    watch.textContent = revive.watch;
    watch.addEventListener('click', this.handleWatch);

    const decline = document.createElement('button');
    this.declineButton = decline;
    decline.type = 'button';
    decline.id = 'revive-decline';
    decline.className = 'revive__decline';
    decline.textContent = revive.decline;
    decline.addEventListener('click', this.handleDecline);

    actions.append(watch, decline);
    panel.append(ornament, kicker, title, body, note, actions);
    section.append(panel);
    options.root.append(section);

    this.unsubscribeKeydown = this.listenKeys();
  }

  update(snapshot: HudSnapshot): void {
    const shouldShow = snapshot.phase === 'revive-offer';
    if (shouldShow) this.show();
    else this.hide();
  }

  dispose(): void {
    this.unsubscribeKeydown();
    this.watchButton.removeEventListener('click', this.handleWatch);
    this.declineButton.removeEventListener('click', this.handleDecline);
    this.section.remove();
  }

  private show(): void {
    if (this.visible) return;
    this.visible = true;
    this.previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.section.hidden = false;
    window.requestAnimationFrame(() => {
      if (this.visible) this.watchButton.focus({ preventScroll: true });
    });
  }

  private hide(): void {
    if (!this.visible) return;
    this.visible = false;
    this.section.hidden = true;
    const target = this.previousFocus;
    this.previousFocus = null;
    if (target?.isConnected) target.focus({ preventScroll: true });
  }

  private readonly handleWatch = (): void => {
    this.controller.acceptAdRevive();
  };

  private readonly handleDecline = (): void => {
    this.controller.declineAdRevive();
  };

  private listenKeys(): () => void {
    const handler = (event: KeyboardEvent): void => {
      if (!this.visible) return;
      this.trapTab(event);
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        this.controller.declineAdRevive();
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
