import type { PlaygamaBridge } from '@playgama/bridge';

interface BridgeGlobals {
  bridge?: PlaygamaBridge;
  playgamaBridge?: PlaygamaBridge;
}

/** Returns the globally loaded Bridge SDK, if the sync script produced it. */
export function getBridge(): PlaygamaBridge | undefined {
  if (typeof window === 'undefined') return undefined;
  const candidate = window as unknown as BridgeGlobals;
  return candidate.bridge ?? candidate.playgamaBridge;
}
