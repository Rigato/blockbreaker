import type { PlatformService } from '../game/contracts';
import { GAME_CONFIG } from '../game/config';
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

/**
 * Boots the platform layer. Never throws and never waits longer than the
 * configured Bridge timeout (10 s): the game must be playable without ads or
 * platform storage.
 */
export async function bootPlatform(): Promise<BootResult> {
  const startedAt = performance.now();
  const hadBridgeGlobal = getBridge() !== undefined;

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
    bridgeFailed: hadBridgeGlobal,
  };
}
