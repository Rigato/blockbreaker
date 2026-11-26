import { createCleanAdapter } from '../platform/CleanAdapter';
import type { BootResult } from './bootTypes';

/**
 * Boots the clean build: no Playgama Bridge, no CrazyGames SDK, no ads.
 * Persistence uses browser storage through the clean platform adapter.
 */
export async function bootPlatform(): Promise<BootResult> {
  const startedAt = performance.now();
  const platform = createCleanAdapter();

  return {
    platform,
    elapsedMs: Math.round(performance.now() - startedAt),
    bridgeFailed: false,
    storagePersistent: platform.storagePersistent,
    storageLabel: platform.storageLabel,
    buildTarget: 'clean',
  };
}
