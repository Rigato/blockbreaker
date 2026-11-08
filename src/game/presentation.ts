import type { SimEvent } from '../sim/World';

/**
 * M4 presentation boundary.
 *
 * The game forwards simulation events once per drained batch; the renderer and
 * audio service decide what to show or play. Keeping this seam narrow means
 * gameplay never imports Phaser or WebAudio details.
 */

export type SfxId =
  | 'paddle'
  | 'block-hit'
  | 'block-damage'
  | 'block-break'
  | 'ball-lost'
  | 'laser'
  | 'explosion'
  | 'safety'
  | 'wave-clear'
  | 'level-up'
  | 'victory'
  | 'defeat'
  | 'ui';

export interface SfxPlayOptions {
  /** Linear gain multiplier, 0..1. Defaults to 1. */
  volume?: number;
  /** Playback-rate multiplier; 0.5 = one octave down, 2 = one octave up. */
  rate?: number;
}

export type AudioState = 'locked' | 'running' | 'suspended' | 'muted' | 'background';

/**
 * Audio boundary implemented by `src/audio/AudioService`.
 *
 * `enabled` is the player setting; `platformEnabled` comes from the portal;
 * `suspended` covers pause/level-up/orientation; `background` is a hard mute
 * while the tab is hidden. The service is responsible for unlocking WebAudio
 * on the first user gesture and for resuming only after a gesture.
 */
export interface AudioController {
  readonly state: AudioState;
  readonly unlocked: boolean;

  unlock(): void;
  setEnabled(enabled: boolean): void;
  setPlatformEnabled(enabled: boolean): void;
  setSuspended(suspended: boolean): void;
  setBackground(background: boolean): void;
  play(id: SfxId, options?: SfxPlayOptions): void;
  dispose(): void;
}

/** Rendering boundary implemented by `GameScene`. */
export interface ScenePresentation {
  /** Queues one drained simulation batch for trails, particles and shake. */
  pushEvents(events: readonly SimEvent[]): void;
  /** Switches the backdrop/palette to the active phase. */
  setPhase(phaseId: string, phaseIndex: number): void;
}
