import type { StorageService } from '../game/contracts';
import { gameEvents } from '../game/events';
import { GAME_CONFIG } from '../game/config';

/**
 * Deletes only game-owned keys. There is no direct localStorage access: the
 * call goes through whichever PlatformService storage is active.
 */
export async function resetSave(storage: StorageService): Promise<void> {
  const keys = [GAME_CONFIG.storage.saveKey, GAME_CONFIG.storage.settingsKey] as const;
  await storage.delete(keys);
  gameEvents.emit('save:reset', { keys });
}
