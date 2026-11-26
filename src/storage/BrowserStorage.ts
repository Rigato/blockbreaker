import type { StorageService } from '../game/contracts';
import { assertSameLength, MemoryStorage } from '../platform/MemoryStorage';

/** Minimal synchronous localStorage surface used by the clean build. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function defaultStorage(): StorageLike | null {
  if (typeof globalThis === 'undefined') return null;
  try {
    const candidate = (
      globalThis as typeof globalThis & { localStorage?: StorageLike }
    ).localStorage;
    return candidate ?? null;
  } catch {
    // Safari private mode and some sandboxed iframes throw on property access.
    return null;
  }
}

/**
 * localStorage-backed StorageService for the clean build.
 *
 * Direct browser storage is confined to this module: platform/game code keeps
 * using the StorageService abstraction. If localStorage is unavailable or a
 * call throws (quota, privacy mode, sandbox), the adapter degrades to memory
 * for the session and reports `isPersistent = false`.
 */
export class BrowserStorage implements StorageService {
  private readonly storage: StorageLike | null;
  private readonly memory = new MemoryStorage();
  private persistent: boolean;
  private warned = false;

  constructor(storage: StorageLike | null = defaultStorage()) {
    this.storage = storage;
    this.persistent = storage !== null;
  }

  get isPersistent(): boolean {
    return this.persistent;
  }

  /** Human-readable storage kind for the debug panel. */
  get label(): string {
    return this.persistent ? 'localStorage' : 'memory';
  }

  async get(keys: readonly string[]): Promise<(string | null)[]> {
    if (keys.length === 0) return [];
    if (!this.persistent || this.storage === null) return this.memory.get(keys);

    try {
      return keys.map((key) => this.storage?.getItem(key) ?? null);
    } catch (error) {
      this.degrade('read', error);
      return this.memory.get(keys);
    }
  }

  async set(keys: readonly string[], values: readonly string[]): Promise<void> {
    assertSameLength(keys, values);
    if (keys.length === 0) return;

    if (!this.persistent || this.storage === null) {
      await this.memory.set(keys, values);
      return;
    }

    try {
      for (let index = 0; index < keys.length; index += 1) {
        const key = keys[index];
        const value = values[index];
        if (key === undefined || value === undefined) {
          throw new Error('Storage keys and values must be defined');
        }
        this.storage.setItem(key, value);
      }
    } catch (error) {
      this.degrade('write', error);
      await this.memory.set(keys, values);
    }
  }

  async delete(keys: readonly string[]): Promise<void> {
    if (keys.length === 0) return;

    if (!this.persistent || this.storage === null) {
      await this.memory.delete(keys);
      return;
    }

    try {
      for (const key of keys) this.storage.removeItem(key);
    } catch (error) {
      this.degrade('delete', error);
      await this.memory.delete(keys);
    }
  }

  private degrade(action: string, error: unknown): void {
    if (!this.persistent) return;
    this.persistent = false;
    if (this.warned) return;
    this.warned = true;
    console.warn(
      `[storage] localStorage ${action} failed; using in-memory storage for this session.`,
      error,
    );
  }
}
