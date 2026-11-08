import type { SfxId } from '../game/presentation';

/** Minimum gap between two starts of the same SFX, in milliseconds. */
export const SFX_THROTTLE_MS = 35;
/** Maximum simultaneous SFX voices. Multiball and explosions must not clip. */
export const MAX_SFX_VOICES = 24;

/**
 * Pure voice/throttle bookkeeping used by `AudioService`.
 *
 * Kept free of WebAudio so the limits can be unit tested without a context.
 * A per-id throttle stops the same sound from stacking on one frame while the
 * global cap protects the mix during 8-ball waves.
 */
export class VoiceBudget {
  private readonly lastStarted = new Map<SfxId, number>();
  private active = 0;

  get activeVoices(): number {
    return this.active;
  }

  canStart(
    id: SfxId,
    now: number,
    throttleMs: number = SFX_THROTTLE_MS,
    maxVoices: number = MAX_SFX_VOICES,
  ): boolean {
    if (this.active >= maxVoices) return false;
    const last = this.lastStarted.get(id);
    if (last !== undefined && now - last < throttleMs) return false;
    return true;
  }

  begin(
    id: SfxId,
    now: number,
    throttleMs: number = SFX_THROTTLE_MS,
    maxVoices: number = MAX_SFX_VOICES,
  ): boolean {
    if (!this.canStart(id, now, throttleMs, maxVoices)) return false;
    this.lastStarted.set(id, now);
    this.active += 1;
    return true;
  }

  end(): void {
    if (this.active > 0) this.active -= 1;
  }

  reset(): void {
    this.lastStarted.clear();
    this.active = 0;
  }
}
