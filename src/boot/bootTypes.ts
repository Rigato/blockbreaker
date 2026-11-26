import type { PlatformService } from '../game/contracts';

export type BuildTarget = 'bridge' | 'clean';

/**
 * Result of the platform boot.
 *
 * `storagePersistent` and `storageLabel` live here, not in `PlatformService`,
 * because the DOM UI needs an honest storage hint even when the platform
 * contract is frozen. The bridge target fills them from the adapter
 * diagnostics; the clean target fills them from the browser storage adapter.
 */
export interface BootResult {
  readonly platform: PlatformService;
  readonly elapsedMs: number;
  /** True when the Bridge global existed but did not become ready. */
  readonly bridgeFailed: boolean;
  /** False when saves/settings would be lost on reload. */
  readonly storagePersistent: boolean;
  /** Short label for the debug panel: bridge, memory or browser storage. */
  readonly storageLabel: string;
  readonly buildTarget: BuildTarget;
}
