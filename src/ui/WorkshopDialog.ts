import type {
  GameCommands,
  MetaPurchaseError,
  MetaState,
  MetaUnlockView,
} from '../game/contracts';
import { gameEvents } from '../game/events';
import { en } from '../i18n/en';
import '../styles/workshop.css';

export interface WorkshopDialogOptions {
  root: HTMLElement;
  controller: GameCommands;
  onClose: () => void;
}

type CardState = 'owned' | 'affordable' | 'locked';

/**
 * Workshop modal: perk unlocks grouped by tier, paid with persisted Sparks.
 * Owns its focus trap, Escape handling and focus restoration; the game state is
 * the single source of truth (`getMetaState` on open, `meta:changed` while
 * open, `purchasePerkUnlock` on buy).
 */
export class WorkshopDialog {
  private readonly controller: GameCommands;
  private readonly onClose: () => void;
  private readonly section: HTMLElement;
  private readonly panel: HTMLElement;
  private readonly list: HTMLElement;
  private readonly sparks: HTMLElement;
  private readonly status: HTMLElement;
  private readonly closeButton: HTMLButtonElement;
  private readonly unsubscribeMeta: () => void;
  private readonly unsubscribeKeydown: () => void;

  private openFlag = false;
  private meta: MetaState = { sparks: 0, unlocks: [] };
  private restoreFocus: HTMLElement | null = null;

  constructor(options: WorkshopDialogOptions) {
    this.controller = options.controller;
    this.onClose = options.onClose;

    const section = document.createElement('section');
    this.section = section;
    section.className = 'workshop';
    section.hidden = true;

    const panel = document.createElement('div');
    this.panel = panel;
    panel.className = 'workshop__panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'workshop-title');

    // --- Head ---------------------------------------------------------------
    const head = document.createElement('header');
    head.className = 'workshop__head';

    const heading = document.createElement('div');
    heading.className = 'workshop__heading';

    const title = document.createElement('h2');
    title.className = 'workshop__title';
    title.id = 'workshop-title';
    title.textContent = en.workshopTitle;

    const sparks = document.createElement('span');
    this.sparks = sparks;
    sparks.id = 'workshop-sparks';
    sparks.className = 'workshop__sparks';
    sparks.textContent = en.workshopSparks.replace('{{sparks}}', '0');

    heading.append(title, sparks);

    const subtitle = document.createElement('p');
    subtitle.className = 'workshop__subtitle';
    subtitle.textContent = en.workshopSubtitle;

    head.append(heading, subtitle);

    // --- Status and cards ---------------------------------------------------
    const status = document.createElement('p');
    this.status = status;
    status.id = 'workshop-status';
    status.className = 'workshop__status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');

    const list = document.createElement('div');
    this.list = list;
    list.className = 'workshop__list';
    list.addEventListener('click', this.handleListClick);

    // --- Close --------------------------------------------------------------
    const closeButton = document.createElement('button');
    this.closeButton = closeButton;
    closeButton.type = 'button';
    closeButton.id = 'workshop-close';
    closeButton.className = 'workshop__close';
    closeButton.textContent = en.workshopClose;
    closeButton.addEventListener('click', this.handleClose);

    panel.append(head, status, list, closeButton);
    section.append(panel);
    options.root.append(section);

    this.unsubscribeMeta = gameEvents.on('meta:changed', this.handleMetaChanged);
    this.unsubscribeKeydown = this.listenKeys();
  }

  open(): void {
    if (!this.openFlag) {
      this.restoreFocus =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    this.openFlag = true;
    this.meta = this.controller.getMetaState();
    this.setStatus('', '');
    this.section.hidden = false;
    this.render();
    this.list.scrollTop = 0;
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
    this.unsubscribeMeta();
    this.unsubscribeKeydown();
    this.list.removeEventListener('click', this.handleListClick);
    this.closeButton.removeEventListener('click', this.handleClose);
    this.section.remove();
  }

  // -- Rendering ------------------------------------------------------------

  private render(): void {
    this.sparks.textContent = en.workshopSparks.replace(
      '{{sparks}}',
      String(this.meta.sparks),
    );

    const tiers = [...new Set(this.meta.unlocks.map((unlock) => unlock.tier))].sort(
      (a, b) => a - b,
    );
    const fragment = document.createDocumentFragment();

    for (const tier of tiers) {
      const group = document.createElement('section');
      group.className = 'workshop__tier';

      const heading = document.createElement('h3');
      heading.className = 'workshop__tier-title';
      heading.textContent = en.workshopTier.replace('{{tier}}', String(tier));

      const cards = document.createElement('ul');
      cards.className = 'workshop__cards';

      for (const unlock of this.meta.unlocks) {
        if (unlock.tier !== tier) continue;
        cards.append(this.buildCard(unlock));
      }

      group.append(heading, cards);
      fragment.append(group);
    }

    this.list.replaceChildren(fragment);
  }

  private buildCard(unlock: MetaUnlockView): HTMLElement {
    const card = document.createElement('li');
    card.className = 'workshop__card';
    card.dataset.perkId = unlock.id;
    card.dataset.tier = String(unlock.tier);

    const state: CardState = unlock.unlocked
      ? 'owned'
      : unlock.available && unlock.affordable
        ? 'affordable'
        : 'locked';
    card.dataset.state = state;

    const head = document.createElement('div');
    head.className = 'workshop__card-head';

    const name = document.createElement('span');
    name.className = 'workshop__card-name';
    name.textContent = unlock.name;

    const stateLabel = document.createElement('span');
    stateLabel.className = 'workshop__card-state';
    stateLabel.textContent = en.workshopOwned;
    stateLabel.hidden = !unlock.unlocked;

    head.append(name, stateLabel);

    const description = document.createElement('p');
    description.className = 'workshop__card-desc';
    description.textContent = unlock.description;

    const foot = document.createElement('div');
    foot.className = 'workshop__card-foot';

    const meta = document.createElement('span');
    meta.className = 'workshop__card-meta';

    const cost = document.createElement('span');
    cost.className = 'workshop__card-cost';
    cost.textContent = en.workshopCost.replace('{{cost}}', String(unlock.cost));
    meta.append(cost);

    if (!unlock.unlocked && !unlock.affordable) {
      const missing = Math.max(0, unlock.cost - this.meta.sparks);
      const need = document.createElement('span');
      need.className = 'workshop__card-need';
      need.textContent = en.workshopNeedMore.replace('{{amount}}', String(missing));
      meta.append(need);
    }

    const buy = document.createElement('button');
    buy.type = 'button';
    buy.className = 'workshop__buy';
    buy.dataset.perkId = unlock.id;
    buy.disabled = unlock.unlocked || !unlock.available;
    buy.textContent = unlock.unlocked ? en.workshopOwned : en.workshopBuy;
    buy.setAttribute(
      'aria-label',
      unlock.unlocked
        ? `${unlock.name} · ${en.workshopOwned}`
        : `${en.workshopBuy} ${unlock.name}`,
    );

    foot.append(meta, buy);
    card.append(head, description, foot);
    return card;
  }

  // -- Buying ---------------------------------------------------------------

  private applyMeta(meta: MetaState): void {
    const scrollTop = this.list.scrollTop;
    this.meta = meta;
    this.render();
    this.list.scrollTop = scrollTop;
  }

  private buy(id: string): void {
    const result = this.controller.purchasePerkUnlock(id);
    if (!result.ok) {
      this.setStatus(this.errorMessage(result.error), 'error');
      return;
    }

    this.applyMeta(result.meta);
    const unlocked = result.meta.unlocks.find((unlock) => unlock.id === id);
    this.setStatus(
      en.workshopStatusBought.replace('{{name}}', unlocked?.name ?? id),
      'success',
    );

    const card = this.cardFor(id);
    const buyButton = card?.querySelector<HTMLButtonElement>('.workshop__buy');
    if (buyButton && !buyButton.disabled) {
      buyButton.focus({ preventScroll: true });
    } else {
      this.closeButton.focus({ preventScroll: true });
    }
  }

  private cardFor(id: string): HTMLElement | null {
    return (
      [...this.list.querySelectorAll<HTMLElement>('.workshop__card')].find(
        (card) => card.dataset.perkId === id,
      ) ?? null
    );
  }

  private errorMessage(error: MetaPurchaseError | undefined): string {
    switch (error) {
      case 'owned':
        return en.workshopStatusOwned;
      case 'insufficient':
        return en.workshopStatusInsufficient;
      case 'unknown':
      default:
        return en.workshopStatusUnknown;
    }
  }

  private setStatus(text: string, tone: '' | 'success' | 'error'): void {
    this.status.textContent = text;
    if (tone === '') delete this.status.dataset.tone;
    else this.status.dataset.tone = tone;
  }

  // -- Events ---------------------------------------------------------------

  private readonly handleListClick = (event: MouseEvent): void => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>('.workshop__buy');
    if (!button || button.disabled) return;
    const id = button.dataset.perkId;
    if (id) this.buy(id);
  };

  private readonly handleMetaChanged = (meta: MetaState): void => {
    if (!this.openFlag) return;
    this.applyMeta(meta);
  };

  private readonly handleClose = (): void => {
    this.close();
    this.onClose();
  };

  // -- Keyboard -------------------------------------------------------------

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
