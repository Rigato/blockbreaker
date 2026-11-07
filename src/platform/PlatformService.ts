/**
 * Canonical entry point for the platform contract.
 *
 * The interfaces are declared in `src/game/contracts.ts` so gameplay and
 * platform code share one frozen source of truth. This module keeps the
 * folder structure from the implementation plan (§4.3) and gives later
 * milestones a stable import path for platform-facing work.
 */
export type {
  AdsService,
  InterstitialResult,
  PlatformDiagnostics,
  PlatformMessage,
  PlatformMessagePayload,
  PlatformService,
  StorageKind,
  StorageService,
  Unsubscribe,
} from '../game/contracts';
