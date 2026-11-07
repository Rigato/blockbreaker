import { describe, expect, it, vi } from 'vitest';
import { MemoryStorage } from '../src/platform/MemoryStorage';
import { createFallbackAdapter } from '../src/platform/FallbackAdapter';
import { resetSave } from '../src/platform/saveReset';
import { gameEvents } from '../src/game/events';
import { GAME_CONFIG } from '../src/game/config';

describe('MemoryStorage', () => {
  it('returns null for missing keys and round-trips values', async () => {
    const storage = new MemoryStorage();
    await expect(storage.get(['a', 'b'])).resolves.toEqual([null, null]);

    await storage.set(['a', 'b'], ['one', 'two']);
    await expect(storage.get(['a', 'b'])).resolves.toEqual(['one', 'two']);

    await storage.delete(['a']);
    await expect(storage.get(['a', 'b'])).resolves.toEqual([null, 'two']);
  });

  it('rejects mismatched key/value array lengths', async () => {
    const storage = new MemoryStorage();
    await expect(storage.set(['a'], ['1', '2'])).rejects.toThrow(/same length/);
  });
});

describe('resetSave', () => {
  it('deletes only the game-owned keys and emits an event', async () => {
    const storage = new MemoryStorage();
    await storage.set(
      [GAME_CONFIG.storage.saveKey, GAME_CONFIG.storage.settingsKey, 'other'],
      ['save', 'settings', 'keep'],
    );

    const listener = vi.fn();
    const unsubscribe = gameEvents.on('save:reset', listener);
    await resetSave(storage);
    unsubscribe();

    await expect(
      storage.get([
        GAME_CONFIG.storage.saveKey,
        GAME_CONFIG.storage.settingsKey,
        'other',
      ]),
    ).resolves.toEqual([null, null, 'keep']);
    expect(listener).toHaveBeenCalledOnce();
  });
});

describe('FallbackAdapter', () => {
  it('reports the mock platform and in-memory storage', async () => {
    const platform = createFallbackAdapter('pt-BR');

    expect(platform.id).toBe('mock');
    expect(platform.language).toBe('pt-BR');
    expect(platform.diagnostics.source).toBe('fallback');
    expect(platform.diagnostics.storageKind).toBe('memory');
    expect(platform.ads.isInterstitialSupported).toBe(false);
    await expect(platform.ads.showInterstitial('test')).resolves.toBe('skipped');
    await expect(platform.sendMessage('game_ready')).resolves.toBeUndefined();
  });
});
