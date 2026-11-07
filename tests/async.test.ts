import { describe, expect, it } from 'vitest';
import { TimeoutError, withTimeout } from '../src/platform/async';

describe('withTimeout', () => {
  it('resolves when the wrapped promise settles in time', async () => {
    await expect(
      withTimeout(new Promise((resolve) => setTimeout(() => resolve('ok'), 1)), 50, 'test'),
    ).resolves.toBe('ok');
  });

  it('rejects with a TimeoutError when the promise hangs', async () => {
    const hanging = new Promise<never>(() => undefined);
    await expect(withTimeout(hanging, 5, 'bridge.initialize')).rejects.toBeInstanceOf(
      TimeoutError,
    );
  });
});
