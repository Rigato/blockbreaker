import type { GameCommands, HudSnapshot, PlatformService } from '../game/contracts';
import type { BootResult } from '../boot/bridgeBoot';
import type { BlockBreakerGame } from '../game/Game';
import { gameEvents } from '../game/events';
import { en } from '../i18n/en';
import { DebugPanel } from './DebugPanel';
import { Hud } from './Hud';
import { HudOverlay } from './Overlay';

export interface UIRootOptions {
  root: HTMLElement;
  platform: PlatformService;
  game: BlockBreakerGame;
  controller: GameCommands;
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

  const handlePlay = (): void => {
    note.classList.add('menu__note--active');
    menu.classList.add('menu--acknowledged');
    options.controller.startRun();
    playButton.blur();
  };
  playButton.addEventListener('click', handlePlay);

  actions.append(playButton, note);

  const footer = document.createElement('p');
  footer.className = 'menu__footer';
  footer.textContent = en.footer;

  menu.append(top, hero, actions, footer);
  options.root.append(menu);

  const hud = new Hud({ root: options.root, controller: options.controller });
  const overlay = new HudOverlay({ root: options.root, controller: options.controller });

  const debugPanel = options.debug
    ? new DebugPanel({
        root: options.root,
        platform: options.platform,
        game: options.game,
        controller: options.controller,
        boot: options.boot,
      })
    : null;

  if (debugPanel) {
    document.documentElement.dataset.debug = '1';
  }

  let menuDismissed = false;
  let debugAutoCollapsed = false;

  const applySnapshot = (snapshot: HudSnapshot): void => {
    if (snapshot.phase !== 'menu') menuDismissed = true;

    if (debugPanel && !debugAutoCollapsed && snapshot.phase === 'playing') {
      debugPanel.collapse();
      debugAutoCollapsed = true;
    }

    menu.hidden = menuDismissed || snapshot.phase !== 'menu';

    hud.update(snapshot);
    hud.setVisible(snapshot.phase === 'playing' || snapshot.phase === 'paused');
    overlay.update(snapshot);
  };

  const unsubscribeHud = gameEvents.on('hud:changed', applySnapshot);
  applySnapshot(options.controller.getHudState());

  return {
    ready: nextPaint,
    setGameReady(label: string): void {
      debugPanel?.setGameReady(label);
    },
    dispose(): void {
      unsubscribeHud();
      playButton.removeEventListener('click', handlePlay);
      hud.dispose();
      overlay.dispose();
      menu.remove();
      debugPanel?.dispose();
      delete document.documentElement.dataset.debug;
    },
  };
}
