import type { PlatformService } from '../game/contracts';
import type { BootResult } from '../boot/bridgeBoot';
import type { BlockBreakerGame } from '../game/Game';
import { en } from '../i18n/en';
import { DebugPanel } from './DebugPanel';

export interface UIRootOptions {
  root: HTMLElement;
  platform: PlatformService;
  game: BlockBreakerGame;
  boot: BootResult;
  debug: boolean;
}

export interface UIRootHandle {
  /** Resolves after the menu has been painted and is interactive. */
  ready(): Promise<void>;
  setGameReady(label: string): void;
  dispose(): void;
}

function nextPaint(): Promise<void> {
  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = (): void => {
      if (settled) return;
      settled = true;
      resolve();
    };

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(finish);
    });
    window.setTimeout(finish, 250);
  });
}

export function mountUI(options: UIRootOptions): UIRootHandle {
  const menu = document.createElement('section');
  menu.className = 'menu';
  menu.setAttribute('aria-label', en.appTitle);

  const top = document.createElement('header');
  top.className = 'menu__top';

  const kicker = document.createElement('span');
  kicker.className = 'menu__kicker';
  kicker.textContent = en.menuKicker;

  const sigil = document.createElement('span');
  sigil.className = 'menu__sigil';
  sigil.setAttribute('aria-hidden', 'true');

  top.append(kicker, sigil);

  const hero = document.createElement('div');
  hero.className = 'menu__hero';

  const title = document.createElement('h1');
  title.className = 'menu__title';
  title.textContent = en.appTitle;

  const subtitle = document.createElement('p');
  subtitle.className = 'menu__subtitle';
  subtitle.textContent = en.appSubtitle;

  hero.append(title, subtitle);

  const actions = document.createElement('div');
  actions.className = 'menu__actions';

  const playButton = document.createElement('button');
  playButton.type = 'button';
  playButton.id = 'play-button';
  playButton.className = 'menu__play';
  playButton.textContent = en.play;

  const note = document.createElement('p');
  note.id = 'menu-note';
  note.className = 'menu__note';
  note.setAttribute('role', 'status');
  note.textContent = en.playNote;

  playButton.addEventListener('click', () => {
    note.textContent = en.playClicked;
    note.classList.add('menu__note--active');
    menu.classList.add('menu--acknowledged');
  });

  actions.append(playButton, note);

  const footer = document.createElement('p');
  footer.className = 'menu__footer';
  footer.textContent = en.footer;

  menu.append(top, hero, actions, footer);
  options.root.append(menu);

  const debugPanel = options.debug
    ? new DebugPanel({
        root: options.root,
        platform: options.platform,
        game: options.game,
        boot: options.boot,
      })
    : null;

  if (debugPanel) {
    document.documentElement.dataset.debug = '1';
  }

  return {
    ready: nextPaint,
    setGameReady(label: string): void {
      debugPanel?.setGameReady(label);
    },
    dispose(): void {
      playButton.remove();
      menu.remove();
      debugPanel?.dispose();
      delete document.documentElement.dataset.debug;
    },
  };
}
