import { describe, expect, it } from 'vitest';
import { CleanAdapter, createCleanAdapter } from '../src/platform/CleanAdapter';
import { BrowserStorage, type StorageLike } from '../src/storage/BrowserStorage';

class FakeStorage implements StorageLike {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe('CleanAdapter', () => {
  it('persists with localStorage and exposes no ads or SDK', async () => {
    const platform = createCleanAdapter(new BrowserStorage(new FakeStorage()));

    expect(platform.id).toBe('clean');
    expect(platform.language).not.toBe('');
    expect(platform.isAudioEnabled).toBe(true);
    expect(platform.isPaused).toBe(false);
    expect(platform.storagePersistent).toBe(true);
    expect(platform.storageLabel).toBe('localStorage');
    expect(platform.diagnostics.source).toBe('fallback');
    expect(platform.diagnostics.storageKind).toBe('bridge');
    expect(platform.diagnostics.bridgeVersion).toBeNull();
    expect(platform.diagnostics.initDurationMs).toBeNull();
    expect(platform.ads.isInterstitialSupported).toBe(false);
    expect(platform.ads.isRewardedSupported).toBe(false);
    await expect(platform.ads.showInterstitial('test')).resolves.toBe('skipped');
    await expect(platform.ads.showRewarded('test')).resolves.toBe('skipped');
    await expect(platform.sendMessage('game_ready')).resolves.toBeUndefined();

    await platform.storage.set(['bb.save'], ['value']);
    await expect(platform.storage.get(['bb.save'])).resolves.toEqual(['value']);
  });

  it('reports memory when localStorage is unavailable', () => {
    const platform = new CleanAdapter(new BrowserStorage(null));

    expect(platform.storagePersistent).toBe(false);
    expect(platform.storageLabel).toBe('memory');
    expect(platform.diagnostics.storageKind).toBe('memory');
  });

  it('returns a safe unsubscribe without a DOM', () => {
    const platform = createCleanAdapter(new BrowserStorage(new FakeStorage()));
    const unsubscribe = platform.onPauseChanged(() => {});
    expect(() => unsubscribe()).not.toThrow();
    expect(() => platform.onAudioChanged(() => {})()).not.toThrow();
  });
});
