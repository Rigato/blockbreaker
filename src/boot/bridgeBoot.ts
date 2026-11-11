import type { PlatformService } from '../game/contracts';
import { GAME_CONFIG } from '../game/config';
import {
  createCrazyGamesService,
  isCrazyGamesHost,
} from '../platform/CrazyGamesAdapter';
import { createBridgeService } from '../platform/BridgeAdapter';
import { createFallbackAdapter } from '../platform/FallbackAdapter';
import { getBridge } from '../platform/bridgeGlobal';

export interface BootResult {
  readonly platform: PlatformService;
  readonly elapsedMs: number;
  /** True when the Bridge global existed but did not become ready. */
  readonly bridgeFailed: boolean;
}

function browserLanguage(): string {
  if (typeof navigator === 'undefined') return 'en';
  return navigator.language || 'en';
}

function isCrazyGamesRuntime(): boolean {
  return typeof window !== 'undefined' && isCrazyGamesHost(window.location.hostname);
}

/**
 * Loads the vendored Playgama Bridge only outside CrazyGames. The script is in
 * the ZIP root (public/playgama-bridge.js) and never comes from a portal CDN.
 */
function loadPlaygamaBridge(timeoutMs: number): Promise<boolean> {
  if (getBridge()) return Promise.resolve(true);
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return Promise.resolve(false);
  }

  return new Promise<boolean>((resolve) => {
    const script = document.createElement('script');
    script.src = new URL('./playgama-bridge.js', window.location.href).href;
    script.async = true;

    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (ok: boolean): void => {
      if (settled) return;
      settled = true;
      if (timer !== undefined) clearTimeout(timer);
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
      resolve(ok && getBridge() !== undefined);
    };
    const onLoad = (): void => finish(true);
    const onError = (): void => finish(false);

    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });
    timer = setTimeout(() => finish(false), timeoutMs);
    (document.head ?? document.body ?? document.documentElement).appendChild(script);
  });
}

/**
 * Boots the platform layer. Never throws and never waits longer than the
 * configured Bridge timeout (10 s): the game must be playable without ads or
 * platform storage.
 */
export async function bootPlatform(): Promise<BootResult> {
  const startedAt = performance.now();

  // CrazyGames gets the native adapter and never loads the Playgama runtime.
  if (isCrazyGamesRuntime()) {
    const crazyGames = await createCrazyGamesService(
      GAME_CONFIG.boot.bridgeInitTimeoutMs,
    );
    if (crazyGames) {
      return {
        platform: crazyGames,
        elapsedMs: Math.round(performance.now() - startedAt),
        bridgeFailed: false,
      };
    }
    return {
      platform: createFallbackAdapter(browserLanguage()),
      elapsedMs: Math.round(performance.now() - startedAt),
      bridgeFailed: true,
    };
  }

  const hadBridgeGlobal = getBridge() !== undefined;
  const loaded = await loadPlaygamaBridge(GAME_CONFIG.boot.bridgeInitTimeoutMs);
  if (!loaded) {
    return {
      platform: createFallbackAdapter(browserLanguage()),
      elapsedMs: Math.round(performance.now() - startedAt),
      bridgeFailed: hadBridgeGlobal,
    };
  }

  const bridge = await createBridgeService(GAME_CONFIG.boot.bridgeInitTimeoutMs);

  if (bridge) {
    return {
      platform: bridge,
      elapsedMs: Math.round(performance.now() - startedAt),
      bridgeFailed: false,
    };
  }

  return {
    platform: createFallbackAdapter(browserLanguage()),
    elapsedMs: Math.round(performance.now() - startedAt),
    bridgeFailed: hadBridgeGlobal || getBridge() !== undefined,
  };
}
