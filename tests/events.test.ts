import { describe, expect, it, vi } from 'vitest';
import { TypedEventBus } from '../src/game/events';

interface TestEvents {
  ping: { value: number };
  pong: { label: string };
}

describe('TypedEventBus', () => {
  it('delivers payloads to subscribers', () => {
    const bus = new TypedEventBus<TestEvents>();
    const listener = vi.fn();
    bus.on('ping', listener);

    bus.emit('ping', { value: 7 });

    expect(listener).toHaveBeenCalledWith({ value: 7 });
  });

  it('unsubscribes cleanly', () => {
    const bus = new TypedEventBus<TestEvents>();
    const listener = vi.fn();
    const unsubscribe = bus.on('pong', listener);

    unsubscribe();
    bus.emit('pong', { label: 'ignored' });

    expect(listener).not.toHaveBeenCalled();
  });

  it('clears every listener', () => {
    const bus = new TypedEventBus<TestEvents>();
    const listener = vi.fn();
    bus.on('ping', listener);
    bus.on('pong', listener);

    bus.clear();
    bus.emit('ping', { value: 1 });
    bus.emit('pong', { label: 'x' });

    expect(listener).not.toHaveBeenCalled();
  });
});
