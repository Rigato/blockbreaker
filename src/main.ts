import { bootPlatform } from './boot/bridgeBoot';
import { readBootOptions } from './boot/query';
import type { BlockBreakerGame } from './game/Game';
import { gameEvents } from './game/events';
import { en } from './i18n/en';
import { resetSave } from './platform/saveReset';
import { mountStageLayout } from './ui/layout';
import { mountUI } from './ui/UIRoot';

function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing required element #${id}`);
  return element as T;
}

function setBootStatus(text: string): void {
  const status = document.getElementById('boot-status');
  if (status) status.textContent = text;
}

function showFatalError(error: unknown): void {
  console.error('[boot] the foundation could not start', error);
  document.getElementById('app')?.setAttribute('aria-busy', 'false');
  const screen = document.getElementById('boot-screen');
  if (!screen) return;
  screen.classList.remove('is-hidden');
  const title = screen.querySelector<HTMLElement>('.boot__title');
  const status = document.getElementById('boot-status');
  if (title) title.textContent = en.bootErrorTitle;
  if (status) status.textContent = en.bootErrorBody;
}

async function start(): Promise<void> {
  const options = readBootOptions(window.location.search);
  const stageArea = requireElement<HTMLElement>('stage-area');
  const shell = requireElement<HTMLElement>('game-shell');
  const canvasHost = requireElement<HTMLElement>('canvas-host');
  const uiRoot = requireElement<HTMLElement>('ui-root');
  const bootScreen = document.getElementById('boot-screen');

  setBootStatus(en.bootPlatform);
  const boot = await bootPlatform();
  const { platform } = boot;

  if (options.resetSave) {
    try {
      await resetSave(platform.storage);
    } catch (error) {
      console.warn('[boot] could not reset save', error);
    }
  }

  platform.onPauseChanged((paused) => {
    gameEvents.emit('platform:pause-changed', { paused });
  });
  platform.onAudioChanged((enabled) => {
    gameEvents.emit('platform:audio-changed', { enabled });
  });

  setBootStatus(en.bootRenderer);
  let game: BlockBreakerGame | undefined;
  const layout = mountStageLayout(stageArea, shell, (size) => {
    game?.resize(size.width, size.height);
  });

  const { BlockBreakerGame: GameClass } = await import('./game/Game');
  game = new GameClass(canvasHost);
  game.resize(layout.size.width, layout.size.height);
  await game.ready;

  setBootStatus(en.bootMenu);
  const ui = mountUI({
    root: uiRoot,
    platform,
    game,
    controller: game,
    boot,
    debug: options.debug,
  });
  await ui.ready();

  bootScreen?.classList.add('is-hidden');
  document.getElementById('app')?.setAttribute('aria-busy', 'false');
  window.setTimeout(() => bootScreen?.remove(), 500);

  const readyAt = Date.now();
  gameEvents.emit('app:menu-ready', {
    platformId: platform.id,
    platformSource: platform.diagnostics.source,
    at: readyAt,
  });
  console.info(
    `[boot] menu ready in ${Math.round(performance.now())} ms — platform=${platform.id} source=${platform.diagnostics.source}`,
  );

  // The menu is now painted and interactive. Send the platform signal only
  // after this point; never during loading.
  void platform
    .sendMessage('game_ready')
    .then(() => {
      const time = new Date().toLocaleTimeString();
      ui.setGameReady(`${en.debugSent} ${time}`);
    })
    .catch((error: unknown) => {
      console.warn('[boot] game_ready was not accepted', error);
      ui.setGameReady(en.debugFailed);
    });
}

void start().catch(showFatalError);
