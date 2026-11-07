import type { GameCommands, HudSnapshot, PerkOffer } from '../game/contracts';
import { gameEvents } from '../game/events';
import { en } from '../i18n/en';

export interface LevelUpOverlayOptions {
  root: HTMLElement;
  controller: GameCommands;
}

/**
 * Modal level-up chooser.
 *
 * Offers come from the simulation through `levelup:offered`; the UI never
 * invents cards. A queued level up (two levels in one frame) simply replaces
 * the card set while the overlay stays open. Closing is driven by the game:
 * either `levelup:closed` or a HUD snapshot whose phase leaves `levelup`.
 */
export class LevelUpOverlay {
  private readonly controller: GameCommands;
  private readonly overlay: HTMLElement;
  private readonly panel: HTMLElement;
  private readonly levelValue: HTMLElement;
  private readonly cards: HTMLElement;
  private offers: readonly PerkOffer[] = [];
  private readonly unsubscribeOffered: () => void;
  private readonly unsubscribeClosed: () => void;
  private visible = false;
  private chosenId: string | null = null;
  private previousFocus: HTMLElement | null = null;

  constructor(options: LevelUpOverlayOptions) {
    this.controller = options.controller;

    const overlay = document.createElement('section');
    this.overlay = overlay;
    overlay.className = 'levelup';
    overlay.hidden = true;

    const panel = document.createElement('div');
    this.panel = panel;
    panel.className = 'levelup__panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'levelup-title');
    panel.setAttribute('aria-describedby', 'levelup-paused');

    const head = document.createElement('div');
    head.className = 'levelup__head';

    const title = document.createElement('h2');
    title.className = 'levelup__title';
    title.id = 'levelup-title';
    title.textContent = en.levelUpTitle;

    const level = document.createElement('span');
    level.className = 'levelup__level';
    this.levelValue = level;

    head.append(title, level);

    const subtitle = document.createElement('p');
    subtitle.className = 'levelup__subtitle';
    subtitle.textContent = en.levelUpSubtitle;

    const paused = document.createElement('p');
    paused.className = 'levelup__paused';
    paused.id = 'levelup-paused';
    paused.setAttribute('role', 'status');

    const pausedIcon = document.createElement('span');
    pausedIcon.className = 'levelup__paused-icon';
    pausedIcon.setAttribute('aria-hidden', 'true');

    const pausedText = document.createElement('span');
    pausedText.textContent = en.levelUpPaused;

    paused.append(pausedIcon, pausedText);

    const cards = document.createElement('div');
    this.cards = cards;
    cards.className = 'levelup__cards';

    const hint = document.createElement('p');
    hint.className = 'levelup__hint';
    hint.textContent = en.levelUpKeys;

    panel.append(head, subtitle, paused, cards, hint);
    overlay.append(panel);
    options.root.append(overlay);

    this.unsubscribeOffered = gameEvents.on('levelup:offered', ({ offers, level: offeredLevel }) => {
      this.present(offers, offeredLevel);
    });
    this.unsubscribeClosed = gameEvents.on('levelup:closed', () => {
      this.hide();
    });

    document.addEventListener('keydown', this.handleKeydown);
  }

  /** Keeps the modal in sync with the authoritative phase. */
  update(snapshot: HudSnapshot): void {
    if (this.visible && snapshot.phase !== 'levelup') this.hide();
  }

  dispose(): void {
    this.unsubscribeOffered();
    this.unsubscribeClosed();
    document.removeEventListener('keydown', this.handleKeydown);
    this.overlay.remove();
  }

  private present(offers: readonly PerkOffer[], level: number): void {
    this.offers = offers;
    this.chosenId = null;
    this.levelValue.textContent = `${en.levelUpLevel} ${level}`;

    this.cards.replaceChildren();
    offers.forEach((offer, index) => {
      this.cards.append(this.buildCard(offer, index));
    });

    if (offers.length === 0) {
      // Nothing to choose from: never fabricate an offer. Keep the flow closed.
      this.hide();
      return;
    }

    this.show();
  }

  private buildCard(offer: PerkOffer, index: number): HTMLButtonElement {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'levelup__card';
    card.dataset.perkId = offer.id;
    card.dataset.index = String(index + 1);

    const top = document.createElement('span');
    top.className = 'levelup__card-top';

    const key = document.createElement('span');
    key.className = 'levelup__key';
    key.setAttribute('aria-hidden', 'true');
    key.textContent = String(index + 1);

    const name = document.createElement('span');
    name.className = 'levelup__card-name';
    name.textContent = offer.name;
    name.id = `levelup-card-${index}-name`;

    top.append(key, name);

    const description = document.createElement('span');
    description.className = 'levelup__card-desc';
    description.textContent = offer.description;

    const meta = document.createElement('span');
    meta.className = 'levelup__card-meta';

    const levels = document.createElement('span');
    levels.className = 'levelup__card-levels';
    levels.textContent = `${en.levelUpCurrent} ${offer.currentLevel} → ${offer.nextLevel}`;

    const badge = document.createElement('span');
    badge.className = 'levelup__badge';
    if (offer.kind === 'unique') {
      badge.textContent = en.levelUpUnique;
      badge.dataset.kind = 'unique';
    } else if (offer.nextLevel >= offer.maxLevel) {
      badge.textContent = en.levelUpMaxed;
      badge.dataset.kind = 'maxed';
    } else {
      badge.textContent = `${en.levelUpMax} ${offer.maxLevel}`;
      badge.dataset.kind = 'repeatable';
    }

    meta.append(levels, badge);
    card.append(top, description, meta);
    card.setAttribute('aria-labelledby', name.id);

    card.addEventListener('click', () => this.choose(offer.id));
    return card;
  }

  private choose(perkId: string): void {
    if (!this.visible || this.chosenId !== null) return;
    if (!this.offers.some((offer) => offer.id === perkId)) return;

    this.chosenId = perkId;
    this.overlay.dataset.chosen = perkId;
    for (const card of Array.from(this.cards.querySelectorAll<HTMLButtonElement>('.levelup__card'))) {
      card.disabled = true;
      card.classList.toggle('is-chosen', card.dataset.perkId === perkId);
    }

    this.controller.choosePerk(perkId);
  }

  private show(): void {
    if (this.visible) return;
    this.visible = true;
    this.previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.overlay.hidden = false;
    document.documentElement.dataset.levelup = '1';

    window.requestAnimationFrame(() => {
      if (!this.visible) return;
      const first = this.cards.querySelector<HTMLButtonElement>('.levelup__card');
      first?.focus({ preventScroll: true });
    });
  }

  private hide(): void {
    if (!this.visible) return;
    this.visible = false;
    this.overlay.hidden = true;
    delete this.overlay.dataset.chosen;
    this.cards.replaceChildren();
    this.chosenId = null;
    delete document.documentElement.dataset.levelup;

    const target = this.previousFocus;
    this.previousFocus = null;
    if (target && target.isConnected) target.focus({ preventScroll: true });
  }

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    if (!this.visible) return;

    if (event.key === 'Tab') {
      const focusable = Array.from(
        this.panel.querySelectorAll<HTMLElement>('.levelup__card:not(:disabled)'),
      );
      if (focusable.length === 0) return;

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
      return;
    }

    if (event.key === '1' || event.key === '2' || event.key === '3') {
      const index = Number(event.key) - 1;
      const offer = this.offers[index];
      if (!offer) return;
      event.preventDefault();
      event.stopPropagation();
      this.choose(offer.id);
      return;
    }

    // The modal owns the keyboard while it is open: no reroll, no accidental
    // launch/pause from gameplay bindings.
    if (event.key === 'Escape' || event.key === ' ' || event.key === 'Enter') {
      event.stopPropagation();
    }
  };
}
