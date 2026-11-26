import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { BrowserStorage, type StorageLike } from '../src/storage/BrowserStorage';

class FakeStorage implements StorageLike {
  readonly values = new Map<string, string>();
  failGet = false;
  failSet = false;
  failRemove = false;

  getItem(key: string): string | null {
    if (this.failGet) throw new Error('get failed');
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.failSet) throw new Error('set failed');
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    if (this.failRemove) throw new Error('remove failed');
    this.values.delete(key);
  }
}

describe('BrowserStorage', () => {
  it('round-trips values through localStorage and reports persistence', async () => {
    const fake = new FakeStorage();
    const storage = new BrowserStorage(fake);

    expect(storage.isPersistent).toBe(true);
    await storage.set(['bb.save'], ['value']);
    await expect(storage.get(['bb.save', 'missing'])).resolves.toEqual(['value', null]);
    await storage.delete(['bb.save']);
    await expect(storage.get(['bb.save'])).resolves.toEqual([null]);
    expect(fake.values.size).toBe(0);
  });

  it('uses memory when localStorage is unavailable', async () => {
    const storage = new BrowserStorage(null);

    expect(storage.isPersistent).toBe(false);
    await storage.set(['bb.save'], ['value']);
    await expect(storage.get(['bb.save'])).resolves.toEqual(['value']);
    await storage.delete(['bb.save']);
    await expect(storage.get(['bb.save'])).resolves.toEqual([null]);
  });

  it('degrades to memory when a write throws (quota/private mode)', async () => {
    const fake = new FakeStorage();
    fake.failSet = true;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const storage = new BrowserStorage(fake);

    await storage.set(['bb.save'], ['value']);
    expect(storage.isPersistent).toBe(false);
    await expect(storage.get(['bb.save'])).resolves.toEqual(['value']);
    expect(warn).toHaveBeenCalledOnce();
  });

  it('degrades to memory when a read or delete throws', async () => {
    const readFake = new FakeStorage();
    readFake.failGet = true;
    const readStorage = new BrowserStorage(readFake);
    await expect(readStorage.get(['bb.save'])).resolves.toEqual([null]);
    expect(readStorage.isPersistent).toBe(false);

    const deleteFake = new FakeStorage();
    deleteFake.failRemove = true;
    const deleteStorage = new BrowserStorage(deleteFake);
    await deleteStorage.delete(['bb.save']);
    expect(deleteStorage.isPersistent).toBe(false);
  });

  it('rejects mismatched key/value arrays', async () => {
    const storage = new BrowserStorage(new FakeStorage());
    await expect(storage.set(['a'], ['1', '2'])).rejects.toThrow(/same length/);
  });
});

describe('browser storage boundary', () => {
  it('keeps direct browser storage confined to src/storage/BrowserStorage.ts', () => {
    const root = fileURLToPath(new URL('..', import.meta.url));
    const src = path.join(root, 'src');
    const allowed = path.join(src, 'storage', 'BrowserStorage.ts');
    const offenders: string[] = [];

    const visit = (directory: string): void => {
      for (const name of readdirSync(directory)) {
        const absolute = path.join(directory, name);
        const stat = statSync(absolute);
        if (stat.isDirectory()) {
          visit(absolute);
        } else if (stat.isFile() && absolute !== allowed) {
          const contents = readFileSync(absolute, 'utf8');
          if (/localStorage|sessionStorage|indexedDB/.test(contents)) {
            offenders.push(path.relative(root, absolute));
          }
        }
      }
    };

    visit(src);
    expect(offenders).toEqual([]);
  });
});
