import type { StorageService } from '../game/contracts';

/** In-memory storage used by the fallback adapter and failed Bridge calls. */
export class MemoryStorage implements StorageService {
  private readonly values = new Map<string, string>();

  async get(keys: readonly string[]): Promise<(string | null)[]> {
    return keys.map((key) => this.values.get(key) ?? null);
  }

  async set(keys: readonly string[], values: readonly string[]): Promise<void> {
    assertSameLength(keys, values);
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      const value = values[index];
      if (key === undefined || value === undefined) {
        throw new Error('Storage keys and values must be defined');
      }
      this.values.set(key, value);
    }
  }

  async delete(keys: readonly string[]): Promise<void> {
    for (const key of keys) this.values.delete(key);
  }

  clear(): void {
    this.values.clear();
  }
}

export function assertSameLength(keys: readonly string[], values: readonly string[]): void {
  if (keys.length !== values.length) {
    throw new Error(
      `Storage keys and values must have the same length (${keys.length} !== ${values.length})`,
    );
  }
}
