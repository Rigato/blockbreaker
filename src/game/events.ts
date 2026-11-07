import type {
  HudSnapshot,
  PerkOffer,
  PlatformSource,
  SimTuning,
  Unsubscribe,
} from './contracts';

/**
 * Application-wide typed events.
 *
 * Later milestones may extend this interface with module augmentation instead
 * of editing the bus implementation:
 *
 *   declare module '../game/events' {
 *     interface GameEventMap {
 *       'wave:cleared': { waveId: string };
 *     }
 *   }
 */
export interface GameEventMap {
  'app:menu-ready': {
    platformId: string;
    platformSource: PlatformSource;
    at: number;
  };
  'platform:pause-changed': { paused: boolean };
  'platform:audio-changed': { enabled: boolean };
  'save:reset': { keys: readonly string[] };
  'hud:changed': HudSnapshot;
  'tuning:changed': SimTuning;
  'levelup:offered': { offers: readonly PerkOffer[]; level: number };
  'levelup:closed': { level: number };
}

export class TypedEventBus<T extends object> {
  private readonly listeners = new Map<keyof T, Set<(payload: unknown) => void>>();

  on<K extends keyof T>(event: K, listener: (payload: T[K]) => void): Unsubscribe {
    let bucket = this.listeners.get(event);
    if (!bucket) {
      bucket = new Set();
      this.listeners.set(event, bucket);
    }

    const wrapped = listener as (payload: unknown) => void;
    bucket.add(wrapped);

    return () => {
      const current = this.listeners.get(event);
      if (!current) return;
      current.delete(wrapped);
      if (current.size === 0) this.listeners.delete(event);
    };
  }

  emit<K extends keyof T>(event: K, payload: T[K]): void {
    const bucket = this.listeners.get(event);
    if (!bucket) return;
    for (const listener of [...bucket]) listener(payload);
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const gameEvents = new TypedEventBus<GameEventMap>();
