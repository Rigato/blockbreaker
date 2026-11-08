import { FIELD_WIDTH } from '../sim/World';

export interface SampledInput {
  paddleTargetX: number | null;
  paddleDirection: number;
}

export interface InputActions {
  launch: boolean;
  togglePause: boolean;
  laser: boolean;
}

function isUiElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (!target.isConnected || target.getClientRects().length === 0) return false;
  return (
    target instanceof HTMLButtonElement ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

/**
 * DOM input for the playable field. Touch uses relative 1:1 drag (no
 * teleport), mouse uses absolute position, and the keyboard accelerates the
 * paddle. Listeners live on the canvas only, so DOM UI buttons never leak into
 * gameplay input.
 */
export class InputController {
  private target: number | null = null;
  private direction = 0;
  private launchRequested = false;
  private pauseRequested = false;
  private laserRequested = false;
  private activePointerId: number | null = null;
  private lastClientX = 0;
  private readonly keys = new Set<string>();
  private readonly canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, private readonly getPaddleX: () => number) {
    this.canvas = canvas;
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    canvas.addEventListener('pointercancel', this.handlePointerUp);
    canvas.addEventListener('lostpointercapture', this.handlePointerUp);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  get sampledTargetX(): number | null {
    return this.target;
  }

  get sampledDirection(): number {
    return this.direction;
  }

  /** Clears the pointer target so a new run starts from the paddle centre. */
  resetTarget(): void {
    this.target = null;
    this.activePointerId = null;
  }

  sample(): SampledInput {
    return { paddleTargetX: this.target, paddleDirection: this.direction };
  }

  consumeActions(): InputActions {
    const actions = {
      launch: this.launchRequested,
      togglePause: this.pauseRequested,
      laser: this.laserRequested,
    };
    this.launchRequested = false;
    this.pauseRequested = false;
    this.laserRequested = false;
    return actions;
  }

  dispose(): void {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
    this.canvas.removeEventListener('lostpointercapture', this.handlePointerUp);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
  }

  private logicalPerCss(): number {
    const width = this.canvas.getBoundingClientRect().width;
    return width > 0 ? FIELD_WIDTH / width : 1;
  }

  private absoluteX(clientX: number): number {
    const rect = this.canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * this.logicalPerCss();
    return Math.max(0, Math.min(FIELD_WIDTH, x));
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse') {
      if (event.button !== 0) return;
      this.target = this.absoluteX(event.clientX);
      this.launchRequested = true;
      return;
    }

    // Touch/pen: start from the current paddle position so grabbing never
    // teleports the paddle under the finger.
    this.activePointerId = event.pointerId;
    this.lastClientX = event.clientX;
    this.target = this.getPaddleX();
    this.launchRequested = true;
    this.canvas.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse') {
      this.target = this.absoluteX(event.clientX);
      return;
    }
    if (this.activePointerId !== event.pointerId) return;
    const delta = (event.clientX - this.lastClientX) * this.logicalPerCss();
    this.lastClientX = event.clientX;
    const base = this.target ?? this.getPaddleX();
    this.target = Math.max(0, Math.min(FIELD_WIDTH, base + delta));
    event.preventDefault();
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (this.activePointerId === event.pointerId) this.activePointerId = null;
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (isUiElement(event.target)) return;
    switch (event.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.keys.add('left');
        this.direction = this.readDirection();
        event.preventDefault();
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.keys.add('right');
        this.direction = this.readDirection();
        event.preventDefault();
        break;
      case 'Space':
        if (!event.repeat) this.launchRequested = true;
        event.preventDefault();
        break;
      case 'KeyP':
        if (!event.repeat) this.pauseRequested = true;
        event.preventDefault();
        break;
      case 'KeyE':
        if (!event.repeat) this.laserRequested = true;
        event.preventDefault();
        break;
      default:
        break;
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    switch (event.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.keys.delete('left');
        this.direction = this.readDirection();
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.keys.delete('right');
        this.direction = this.readDirection();
        break;
      default:
        break;
    }
  };

  private readonly handleBlur = (): void => {
    this.keys.clear();
    this.direction = 0;
    this.activePointerId = null;
  };

  private readDirection(): number {
    const left = this.keys.has('left') ? 1 : 0;
    const right = this.keys.has('right') ? 1 : 0;
    return right - left;
  }
}
