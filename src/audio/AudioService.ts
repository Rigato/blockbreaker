import type {
  AudioController,
  AudioState,
  SfxId,
  SfxPlayOptions,
} from '../game/presentation';
import { VoiceBudget } from './voice';

/** Set to false to drop the ambient loop without touching the SFX path. */
export const MUSIC_ENABLED = true;

const MASTER_GAIN = 0.55;
const SFX_GAIN = 0.9;
const MUSIC_GAIN = 0.2;
const MUSIC_LOOP_SECONDS = 8;

/** Sounds that survive pause/level-up so a jingle is never cut off. */
const SUSPENDED_ALLOWED: ReadonlySet<SfxId> = new Set<SfxId>([
  'level-up',
  'victory',
  'defeat',
  'ui',
]);

export interface AudioServiceOptions {
  enabled?: boolean;
  platformEnabled?: boolean;
  /** Injected only by tests; production uses the browser constructor. */
  contextFactory?: () => AudioContext;
}

type SourceNode = OscillatorNode | AudioBufferSourceNode;
type OscillatorShape = OscillatorType;

interface ToneOptions {
  type: OscillatorShape;
  frequency: number;
  endFrequency?: number;
  duration: number;
  gain: number;
  delay?: number;
  detune?: number;
}

interface NoiseOptions {
  duration: number;
  gain: number;
  delay?: number;
  filterType: BiquadFilterType;
  filterFrequency: number;
  filterEndFrequency?: number;
  q?: number;
}

function nowMs(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function defaultContextFactory(): (() => AudioContext) | undefined {
  const scope = globalThis as {
    AudioContext?: new () => AudioContext;
    webkitAudioContext?: new () => AudioContext;
  };
  const Ctor = scope.AudioContext ?? scope.webkitAudioContext;
  return Ctor ? () => new Ctor() : undefined;
}

/**
 * Synthesized audio for Bricklike.
 *
 * Everything is generated with WebAudio oscillators and noise buffers, so the
 * bundle ships zero audio files and no licensed samples. The service is
 * intentionally defensive: a browser without WebAudio, a closed context or a
 * rejected `resume()` all degrade to a silent no-op instead of throwing.
 */
export class AudioService implements AudioController {
  private readonly budget = new VoiceBudget();
  private readonly contextFactory: (() => AudioContext) | undefined;
  private readonly doc: Document | null;

  private enabled: boolean;
  private platformEnabled: boolean;
  private suspended = false;
  private background: boolean;

  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private gestureUnlocked = false;
  private gestureSinceBackground = true;
  private disposed = false;

  private musicRunning = false;
  private musicTimer: ReturnType<typeof setTimeout> | null = null;
  private musicSources: SourceNode[] = [];

  constructor(options: AudioServiceOptions = {}) {
    this.enabled = options.enabled ?? true;
    this.platformEnabled = options.platformEnabled ?? true;
    this.contextFactory = options.contextFactory ?? defaultContextFactory();
    this.doc = typeof document !== 'undefined' ? document : null;
    this.background = this.doc?.hidden === true;

    if (this.doc) {
      this.doc.addEventListener('pointerdown', this.handleGesture, { passive: true });
      this.doc.addEventListener('touchend', this.handleGesture, { passive: true });
      this.doc.addEventListener('keydown', this.handleGesture, { passive: true });
      this.doc.addEventListener('visibilitychange', this.handleVisibility);
      this.doc.addEventListener('click', this.handleUiClick);
    }

    this.syncDataset();
  }

  get state(): AudioState {
    if (this.disposed) return 'locked';
    if (this.background) return 'background';
    if (!this.enabled || !this.platformEnabled) return 'muted';
    if (this.suspended) return 'suspended';
    if (!this.isRunningUnlocked()) return 'locked';
    return 'running';
  }

  get unlocked(): boolean {
    return !this.disposed && this.isRunningUnlocked();
  }

  /** Must run inside the first user gesture (iOS keeps contexts suspended otherwise). */
  unlock(): void {
    if (this.disposed) return;
    this.gestureUnlocked = true;
    this.gestureSinceBackground = true;

    const context = this.ensureContext();
    if (!context) {
      this.syncDataset();
      return;
    }

    if ((context.state as string) !== 'running') {
      try {
        const resumed = context.resume();
        if (resumed && typeof resumed.then === 'function') {
          resumed.then(
            () => this.afterResume(),
            () => undefined,
          );
        }
      } catch {
        // Some WebViews reject resume outside a gesture; stay locked.
      }
    }

    this.afterResume();
  }

  setEnabled(enabled: boolean): void {
    if (this.disposed) return;
    this.enabled = enabled;
    if (!enabled) this.stopMusic();
    this.applyMute();
    if (enabled) this.startMusicIfEligible();
    this.syncDataset();
  }

  setPlatformEnabled(enabled: boolean): void {
    if (this.disposed) return;
    this.platformEnabled = enabled;
    if (!enabled) this.stopMusic();
    this.applyMute();
    if (enabled) this.startMusicIfEligible();
    this.syncDataset();
  }

  setSuspended(suspended: boolean): void {
    if (this.disposed) return;
    this.suspended = suspended;
    if (suspended) this.stopMusic();
    else this.startMusicIfEligible();
    this.syncDataset();
  }

  setBackground(background: boolean): void {
    if (this.disposed) return;
    this.background = background;
    if (background) {
      // Returning from background requires a fresh gesture before any sound.
      this.gestureSinceBackground = false;
      this.stopMusic();
    }
    this.applyMute();
    if (!background) this.startMusicIfEligible();
    this.syncDataset();
  }

  play(id: SfxId, options: SfxPlayOptions = {}): void {
    if (!this.canPlay(id)) return;
    if (!this.budget.begin(id, nowMs())) return;

    try {
      const source = this.render(id, options);
      if (source) source.onended = () => this.budget.end();
      else this.budget.end();
    } catch (error) {
      this.budget.end();
      console.warn('[audio] could not play sfx', id, error);
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    if (this.doc) {
      this.doc.removeEventListener('pointerdown', this.handleGesture);
      this.doc.removeEventListener('touchend', this.handleGesture);
      this.doc.removeEventListener('keydown', this.handleGesture);
      this.doc.removeEventListener('visibilitychange', this.handleVisibility);
      this.doc.removeEventListener('click', this.handleUiClick);
    }

    this.stopMusic();
    this.budget.reset();

    const context = this.context;
    this.context = null;
    this.master = null;
    this.sfxBus = null;
    this.musicBus = null;
    this.noiseBuffer = null;

    if (context) {
      try {
        const closed = context.close();
        if (closed && typeof closed.then === 'function') closed.catch(() => undefined);
      } catch {
        // A context that is already closed or never started is safe to ignore.
      }
    }

    if (this.doc?.documentElement?.dataset) {
      delete this.doc.documentElement.dataset.audioState;
    }
  }

  // -------------------------------------------------------------------------
  // Graph and state
  // -------------------------------------------------------------------------

  private isRunningUnlocked(): boolean {
    return (
      this.gestureUnlocked &&
      this.gestureSinceBackground &&
      this.context !== null &&
      (this.context.state as string) === 'running'
    );
  }

  private ensureContext(): AudioContext | null {
    if (this.context) return this.context;
    if (!this.contextFactory) return null;

    let created: AudioContext | null = null;
    try {
      created = this.contextFactory();
      this.context = created;
      this.buildGraph(created);
      return created;
    } catch (error) {
      console.warn('[audio] WebAudio unavailable; running silently', error);
      this.context = null;
      if (created) {
        try {
          void created.close().catch(() => undefined);
        } catch {
          // Ignore a context that failed before it could start.
        }
      }
      return null;
    }
  }

  private buildGraph(context: AudioContext): void {
    const master = context.createGain();
    master.gain.value = MASTER_GAIN;

    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.knee.value = 12;
    compressor.ratio.value = 16;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    const sfx = context.createGain();
    sfx.gain.value = SFX_GAIN;

    const music = context.createGain();
    music.gain.value = MUSIC_GAIN;

    sfx.connect(master);
    music.connect(master);
    master.connect(compressor);
    compressor.connect(context.destination);

    context.onstatechange = () => {
      if (this.disposed || this.context !== context) return;
      const running = (context.state as string) === 'running';
      if (!running) this.stopMusic();
      this.applyMute();
      this.syncDataset();
      if (running) this.startMusicIfEligible();
    };

    this.master = master;
    this.sfxBus = sfx;
    this.musicBus = music;
    this.applyMute();
  }

  private applyMute(): void {
    const context = this.context;
    const master = this.master;
    if (!context || !master) return;

    const muted = !this.enabled || !this.platformEnabled || this.background;
    const when = context.currentTime;
    master.gain.cancelScheduledValues(when);
    master.gain.setValueAtTime(muted ? 0 : MASTER_GAIN, when);
  }

  private afterResume(): void {
    if (this.disposed) return;
    this.applyMute();
    this.syncDataset();
    this.startMusicIfEligible();
  }

  private syncDataset(): void {
    const element = this.doc?.documentElement;
    if (element?.dataset) element.dataset.audioState = this.state;
  }

  private canPlay(id: SfxId): boolean {
    if (this.disposed) return false;
    if (!this.enabled || !this.platformEnabled || this.background) return false;
    if (!this.isRunningUnlocked()) return false;
    if (this.suspended && !SUSPENDED_ALLOWED.has(id)) return false;
    return true;
  }

  // -------------------------------------------------------------------------
  // Explicit browser listeners
  // -------------------------------------------------------------------------

  private readonly handleGesture = (): void => {
    this.unlock();
  };

  private readonly handleVisibility = (): void => {
    this.setBackground(this.doc?.hidden === true);
  };

  private readonly handleUiClick = (event: Event): void => {
    const target = event.target as { closest?: (selector: string) => unknown } | null;
    if (target && typeof target.closest === 'function' && target.closest('button')) {
      this.play('ui');
    }
  };

  // -------------------------------------------------------------------------
  // Synthesis
  // -------------------------------------------------------------------------

  private render(id: SfxId, options: SfxPlayOptions): SourceNode | null {
    const volume = clamp(options.volume ?? 1, 0, 1);
    const rate = clamp(options.rate ?? 1, 0.25, 4);
    const rateVariation = rate * (0.97 + Math.random() * 0.06);

    switch (id) {
      case 'paddle': {
        return this.tone({
          type: 'triangle',
          frequency: 640 * rateVariation,
          endFrequency: 460 * rateVariation,
          duration: 0.04 / rate,
          gain: 0.16 * volume,
          detune: -12 + Math.random() * 24,
        });
      }
      case 'block-hit': {
        const thud = this.tone({
          type: 'triangle',
          frequency: 200 * rate,
          endFrequency: 105 * rate,
          duration: 0.075 / rate,
          gain: 0.22 * volume,
        });
        this.noise({
          duration: 0.05 / rate,
          gain: 0.09 * volume,
          filterType: 'lowpass',
          filterFrequency: 650 * rate,
          filterEndFrequency: 180 * rate,
        });
        return thud;
      }
      case 'block-damage': {
        // Surviving a hit on a multi-HP block: a bright, quiet metallic ping
        // that is clearly different from the break crack.
        const ping = this.tone({
          type: 'triangle',
          frequency: 1480 * rateVariation,
          endFrequency: 1180 * rateVariation,
          duration: 0.055 / rate,
          gain: 0.1 * volume,
          detune: 14,
        });
        this.tone({
          type: 'sine',
          frequency: 2360 * rateVariation,
          duration: 0.045 / rate,
          gain: 0.045 * volume,
          delay: 0.006,
        });
        this.noise({
          duration: 0.035 / rate,
          gain: 0.025 * volume,
          filterType: 'highpass',
          filterFrequency: 3200 * rate,
          q: 0.6,
        });
        return ping;
      }
      case 'block-break': {
        const crack = this.tone({
          type: 'square',
          frequency: 920 * rate,
          endFrequency: 260 * rate,
          duration: 0.12 / rate,
          gain: 0.11 * volume,
        });
        this.tone({
          type: 'sine',
          frequency: 1560 * rate,
          endFrequency: 880 * rate,
          duration: 0.09 / rate,
          gain: 0.08 * volume,
          delay: 0.012,
        });
        this.noise({
          duration: 0.17 / rate,
          gain: 0.2 * volume,
          filterType: 'bandpass',
          filterFrequency: 2100 * rate,
          filterEndFrequency: 700 * rate,
          q: 0.9,
        });
        return crack;
      }
      case 'ball-lost': {
        return this.tone({
          type: 'sawtooth',
          frequency: 330 * rate,
          endFrequency: 88 * rate,
          duration: 0.38 / rate,
          gain: 0.16 * volume,
        });
      }
      case 'laser': {
        const zap = this.tone({
          type: 'square',
          frequency: 1500 * rate,
          endFrequency: 240 * rate,
          duration: 0.15 / rate,
          gain: 0.12 * volume,
        });
        this.noise({
          duration: 0.12 / rate,
          gain: 0.07 * volume,
          filterType: 'highpass',
          filterFrequency: 2200 * rate,
          filterEndFrequency: 600 * rate,
        });
        return zap;
      }
      case 'explosion': {
        const boom = this.tone({
          type: 'sine',
          frequency: 108 * rate,
          endFrequency: 30 * rate,
          duration: 0.5 / rate,
          gain: 0.3 * volume,
        });
        this.noise({
          duration: 0.45 / rate,
          gain: 0.26 * volume,
          filterType: 'lowpass',
          filterFrequency: 950 * rate,
          filterEndFrequency: 90 * rate,
          q: 0.7,
        });
        return boom;
      }
      case 'safety': {
        const shimmer = this.tone({
          type: 'sine',
          frequency: 880 * rate,
          endFrequency: 1046 * rate,
          duration: 0.22 / rate,
          gain: 0.13 * volume,
        });
        this.tone({
          type: 'sine',
          frequency: 1320 * rate,
          endFrequency: 1568 * rate,
          duration: 0.26 / rate,
          gain: 0.09 * volume,
          delay: 0.055,
        });
        this.tone({
          type: 'sine',
          frequency: 1760 * rate,
          duration: 0.18 / rate,
          gain: 0.05 * volume,
          delay: 0.11,
        });
        return shimmer;
      }
      case 'wave-clear': {
        return this.arpeggio([523.25, 659.25, 783.99, 1046.5], rate, 0.075, 0.18, 0.13 * volume);
      }
      case 'level-up': {
        const chime = this.arpeggio(
          [659.25, 783.99, 987.77, 1318.51],
          rate,
          0.09,
          0.28,
          0.14 * volume,
        );
        this.tone({
          type: 'sine',
          frequency: 1975.53 * rate,
          duration: 0.45 / rate,
          gain: 0.06 * volume,
          delay: 0.36,
        });
        return chime;
      }
      case 'victory': {
        const fanfare = this.arpeggio(
          [523.25, 659.25, 783.99, 1046.5, 1318.51],
          rate,
          0.1,
          0.3,
          0.13 * volume,
        );
        this.tone({
          type: 'triangle',
          frequency: 523.25 * rate,
          duration: 0.7 / rate,
          gain: 0.07 * volume,
          delay: 0.5,
        });
        this.tone({
          type: 'triangle',
          frequency: 783.99 * rate,
          duration: 0.7 / rate,
          gain: 0.06 * volume,
          delay: 0.5,
        });
        this.tone({
          type: 'triangle',
          frequency: 1046.5 * rate,
          duration: 0.7 / rate,
          gain: 0.05 * volume,
          delay: 0.5,
        });
        return fanfare;
      }
      case 'defeat': {
        return this.arpeggio([392, 349.23, 293.66, 220], rate, 0.14, 0.34, 0.12 * volume, 'sawtooth');
      }
      case 'ui': {
        return this.tone({
          type: 'triangle',
          frequency: 920 * rate,
          endFrequency: 660 * rate,
          duration: 0.03 / rate,
          gain: 0.07 * volume,
        });
      }
      default:
        return null;
    }
  }

  private arpeggio(
    frequencies: readonly number[],
    rate: number,
    stepSeconds: number,
    duration: number,
    gain: number,
    type: OscillatorShape = 'triangle',
  ): SourceNode | null {
    let first: SourceNode | null = null;
    frequencies.forEach((frequency, index) => {
      const node = this.tone({
        type,
        frequency: frequency * rate,
        duration: duration / rate,
        gain,
        delay: index * stepSeconds,
      });
      if (!first) first = node;
    });
    return first;
  }

  private tone(options: ToneOptions): SourceNode | null {
    const context = this.context;
    const bus = this.sfxBus;
    if (!context || !bus) return null;

    const when = context.currentTime + (options.delay ?? 0);
    const frequency = Math.max(1, options.frequency);
    const duration = Math.max(0.01, options.duration);

    const oscillator = context.createOscillator();
    oscillator.type = options.type;
    oscillator.detune.value = options.detune ?? 0;
    oscillator.frequency.setValueAtTime(frequency, when);
    if (options.endFrequency !== undefined) {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(1, options.endFrequency),
        when + duration,
      );
    }

    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0.0001, when);
    envelope.gain.exponentialRampToValueAtTime(
      Math.max(0.0002, options.gain),
      when + Math.min(0.02, duration * 0.3),
    );
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration);

    oscillator.connect(envelope);
    envelope.connect(bus);
    oscillator.start(when);
    oscillator.stop(when + duration + 0.02);
    return oscillator;
  }

  private noise(options: NoiseOptions): SourceNode | null {
    const context = this.context;
    const bus = this.sfxBus;
    if (!context || !bus) return null;

    const when = context.currentTime + (options.delay ?? 0);
    const duration = Math.max(0.01, options.duration);

    const source = context.createBufferSource();
    source.buffer = this.getNoiseBuffer(context);

    const filter = context.createBiquadFilter();
    filter.type = options.filterType;
    filter.Q.value = options.q ?? 1;
    filter.frequency.setValueAtTime(Math.max(1, options.filterFrequency), when);
    if (options.filterEndFrequency !== undefined) {
      filter.frequency.exponentialRampToValueAtTime(
        Math.max(1, options.filterEndFrequency),
        when + duration,
      );
    }

    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0.0001, when);
    envelope.gain.exponentialRampToValueAtTime(
      Math.max(0.0002, options.gain),
      when + Math.min(0.015, duration * 0.3),
    );
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration);

    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(bus);
    source.start(when);
    source.stop(when + duration + 0.02);
    return source;
  }

  private getNoiseBuffer(context: AudioContext): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer;

    const length = Math.max(1, Math.floor(context.sampleRate * 0.6));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  // -------------------------------------------------------------------------
  // Ambient loop
  // -------------------------------------------------------------------------

  private startMusicIfEligible(): void {
    if (!MUSIC_ENABLED || this.disposed || this.musicRunning) return;
    if (this.state !== 'running' || !this.musicBus) return;

    this.musicRunning = true;
    this.scheduleMusicLoop(0);
  }

  private scheduleMusicLoop(delaySeconds: number): void {
    const context = this.context;
    if (!context || !this.musicBus) {
      this.musicRunning = false;
      return;
    }

    const start = context.currentTime + delaySeconds;
    const step = MUSIC_LOOP_SECONDS / 8;

    for (const frequency of [220, 261.63, 329.63]) {
      this.musicTone(frequency, start, MUSIC_LOOP_SECONDS, 'triangle', 0.05, 1.4, 2.4);
    }

    const arpeggioNotes = [440, 523.25, 659.25, 523.25, 392, 493.88, 587.33, 493.88];
    arpeggioNotes.forEach((frequency, index) => {
      this.musicTone(frequency, start + index * step, 0.55, 'sine', 0.03, 0.05, 0.45);
    });

    this.musicTimer = setTimeout(
      () => {
        this.musicTimer = null;
        if (this.musicRunning && this.state === 'running') this.scheduleMusicLoop(0);
        else this.musicRunning = false;
      },
      Math.max(50, (MUSIC_LOOP_SECONDS - 0.15) * 1000),
    );
  }

  private musicTone(
    frequency: number,
    when: number,
    duration: number,
    type: OscillatorShape,
    gain: number,
    attack: number,
    release: number,
  ): void {
    const context = this.context;
    const bus = this.musicBus;
    if (!context || !bus) return;

    try {
      const oscillator = context.createOscillator();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, when);

      const envelope = context.createGain();
      envelope.gain.setValueAtTime(0.0001, when);
      envelope.gain.exponentialRampToValueAtTime(gain, when + Math.min(attack, duration * 0.4));
      envelope.gain.exponentialRampToValueAtTime(
        0.0001,
        when + Math.max(attack + release, duration),
      );

      oscillator.connect(envelope);
      envelope.connect(bus);
      oscillator.onended = () => {
        const index = this.musicSources.indexOf(oscillator);
        if (index >= 0) this.musicSources.splice(index, 1);
      };
      oscillator.start(when);
      oscillator.stop(when + duration + 0.05);
      this.musicSources.push(oscillator);
    } catch {
      // Music is optional; never let a partial loop break gameplay.
    }
  }

  private stopMusic(): void {
    this.musicRunning = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }

    const sources = this.musicSources;
    this.musicSources = [];
    for (const source of sources) {
      try {
        source.onended = null;
        source.stop();
      } catch {
        // Already stopped or context closed.
      }
    }
  }
}
