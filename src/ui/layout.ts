import { GAME_CONFIG } from '../game/config';

export interface StageSize {
  readonly width: number;
  readonly height: number;
}

/**
 * Fits a portrait stage inside the available content box.
 *
 * Rules from the plan (§4.7): fixed logical width, aspect between 9:16 and 1:2,
 * centered with decorative letterboxing on taller screens and a framed stage on
 * desktop. The result never overflows the available area.
 */
export function computeStageSize(
  availableWidth: number,
  availableHeight: number,
  maxWidthPx: number = GAME_CONFIG.stage.maxWidthPx,
): StageSize {
  if (!Number.isFinite(availableWidth) || !Number.isFinite(availableHeight)) {
    return { width: 1, height: 1 };
  }

  const safeWidth = Math.max(1, Math.floor(availableWidth));
  const safeHeight = Math.max(1, Math.floor(availableHeight));
  const safeMaxWidth = Math.max(1, maxWidthPx);

  const rawWidth = Math.min(safeWidth, safeMaxWidth, safeHeight * GAME_CONFIG.stage.minAspect);
  const rawHeight = Math.min(safeHeight, rawWidth / GAME_CONFIG.stage.maxAspect);

  return {
    width: Math.max(1, Math.min(Math.round(rawWidth), safeWidth)),
    height: Math.max(1, Math.min(Math.round(rawHeight), safeHeight)),
  };
}

export interface StageLayoutHandle {
  readonly size: StageSize;
  dispose(): void;
}

/** Applies computeStageSize to the DOM and reacts to viewport changes. */
export function mountStageLayout(
  area: HTMLElement,
  shell: HTMLElement,
  onChange: (size: StageSize) => void,
): StageLayoutHandle {
  let current: StageSize = { width: 1, height: 1 };
  let frame = 0;

  const apply = (): void => {
    const rect = area.getBoundingClientRect();
    const size = computeStageSize(rect.width, rect.height);
    current = size;
    shell.style.width = `${size.width}px`;
    shell.style.height = `${size.height}px`;
    onChange(size);
  };

  const schedule = (): void => {
    if (frame !== 0) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      apply();
    });
  };

  apply();

  const observer = new ResizeObserver(schedule);
  observer.observe(area);
  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  window.visualViewport?.addEventListener('resize', schedule);

  return {
    get size(): StageSize {
      return current;
    },
    dispose(): void {
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    },
  };
}
