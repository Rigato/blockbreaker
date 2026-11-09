import type Phaser from 'phaser';
import type { RuntimeElement } from '../sim/World';
import { blend, hashId, hashUnit, steppedRect } from './blockArt';

/**
 * Procedural field elements: walls, obstacles, deflectors, portals, movers,
 * rotors and gates.
 *
 * Everything is drawn with primitives, never assets. Positions and animation
 * state come from `RuntimeElement`, so the renderer stays stateless and only
 * reads the simulation. Colours are derived deterministically from the element
 * id/pair id and the active phase accent.
 */

export interface ElementDrawOptions {
  /** Phase accent used for rims, glow and portal cores. */
  accent?: number;
  /** World time in ms; used for cheap pulsing/rotation, never for random. */
  timeMs?: number;
  /** Disables the cheaper animated flourishes. */
  reducedMotion?: boolean;
}

const PORTAL_PALETTE = [0x64e7ff, 0xff5fd2, 0xc084ff, 0x6dff9e, 0xffd84d] as const;

/** Stable 0..1 hue sample for a portal pair id. */
export function portalHue(pairId: string | undefined): number {
  return hashUnit(hashId(pairId ?? 'portal'), 7);
}

/**
 * Colour shared by both portals of a pair. Different pairs get visibly
 * different hues, which is the main way players match them up.
 */
export function portalColor(pairId: string | undefined, accent: number): number {
  const hue = portalHue(pairId);
  const index = Math.min(PORTAL_PALETTE.length - 1, Math.floor(hue * PORTAL_PALETTE.length));
  return blend(PORTAL_PALETTE[index]!, accent, 0.18);
}

/** Base colour for one element kind; deterministic and testable. */
export function elementColor(kind: RuntimeElement['kind'], accent: number): number {
  switch (kind) {
    case 'wall':
      return blend(0x4a5568, accent, 0.22);
    case 'obstacle':
      return blend(0x8a5cff, accent, 0.3);
    case 'deflector':
      return blend(0xffd27a, accent, 0.25);
    case 'portal':
      return blend(0x64e7ff, accent, 0.2);
    case 'mover':
      return blend(0x9fb2c8, accent, 0.24);
    case 'rotor':
      return blend(0xff9a4d, accent, 0.25);
    case 'gate':
      return blend(0xff6b7a, accent, 0.24);
    default:
      return accent;
  }
}

/** Dashed line with a fixed pixel rhythm; keeps gates readable as "open". */
export function dashedLine(
  graphics: Phaser.GameObjects.Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  dash = 6,
  gap = 4,
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  if (length <= 0) return;
  const ux = dx / length;
  const uy = dy / length;
  const step = Math.max(1, dash + gap);
  for (let distance = 0; distance < length; distance += step) {
    const end = Math.min(length, distance + dash);
    graphics.lineBetween(
      Math.round(x1 + ux * distance),
      Math.round(y1 + uy * distance),
      Math.round(x1 + ux * end),
      Math.round(y1 + uy * end),
    );
  }
}

function dashedRect(
  graphics: Phaser.GameObjects.Graphics,
  left: number,
  top: number,
  width: number,
  height: number,
  dash = 6,
  gap = 4,
): void {
  dashedLine(graphics, left, top, left + width, top, dash, gap);
  dashedLine(graphics, left + width, top, left + width, top + height, dash, gap);
  dashedLine(graphics, left + width, top + height, left, top + height, dash, gap);
  dashedLine(graphics, left, top + height, left, top, dash, gap);
}

export function drawElement(
  graphics: Phaser.GameObjects.Graphics,
  element: RuntimeElement,
  options: ElementDrawOptions = {},
): void {
  const accent = options.accent ?? 0xffffff;
  switch (element.kind) {
    case 'wall':
      drawWall(graphics, element, accent);
      return;
    case 'obstacle':
      drawObstacle(graphics, element, accent);
      return;
    case 'deflector':
      drawDeflector(graphics, element, accent);
      return;
    case 'portal':
      drawPortal(graphics, element, accent, options);
      return;
    case 'mover':
      drawMover(graphics, element, accent);
      return;
    case 'rotor':
      drawRotor(graphics, element, accent);
      return;
    case 'gate':
      drawGate(graphics, element, accent, options);
      return;
  }
}

function drawWall(
  graphics: Phaser.GameObjects.Graphics,
  element: RuntimeElement,
  accent: number,
): void {
  const { left, top, width, height } = element;
  const body = elementColor('wall', accent);
  const light = blend(body, 0xffffff, 0.32);
  const dark = blend(body, 0x05070c, 0.55);

  // Dark frame + stone body.
  graphics.fillStyle(0x03050a, 0.95);
  graphics.fillPoints(steppedRect(left - 1, top - 1, width + 2, height + 2, 0, 5), true);
  graphics.fillStyle(body, 1);
  graphics.fillPoints(steppedRect(left, top, width, height, 0, 5), true);

  // Large masonry courses with staggered joints.
  const rows = Math.max(2, Math.round(height / Math.max(18, width * 0.32)));
  const rowHeight = height / rows;
  graphics.fillStyle(dark, 0.65);
  for (let row = 1; row < rows; row += 1) {
    const y = Math.round(top + row * rowHeight);
    graphics.fillRect(left + 3, y, width - 6, 2);
  }
  for (let row = 0; row < rows; row += 1) {
    const y = Math.round(top + row * rowHeight) + 2;
    const nextY = Math.round(top + (row + 1) * rowHeight) - 2;
    if (nextY - y < 6) continue;
    const joints = 1 + ((row + Math.round(width)) % 2);
    for (let joint = 1; joint <= joints; joint += 1) {
      const x = Math.round(left + (width * joint) / (joints + 1));
      graphics.fillRect(x, y, 2, nextY - y);
    }
    // Chiselled top-face highlight on each course.
    graphics.fillStyle(light, 0.16);
    graphics.fillRect(left + 4, y - 2, width - 8, 1);
    graphics.fillStyle(dark, 0.65);
  }

  // Frosted rim and cold glints; keeps walls legible against the backdrop.
  graphics.lineStyle(1, blend(accent, 0xffffff, 0.4), 0.35);
  graphics.strokePoints(steppedRect(left + 2, top + 2, width - 4, height - 4, 0, 4), true);
  graphics.fillStyle(light, 0.35);
  graphics.fillRect(left + 4, top + 3, width - 8, 2);
  graphics.fillRect(left + 3, top + 4, 2, height - 8);
  graphics.fillStyle(dark, 0.5);
  graphics.fillRect(left + 4, top + height - 5, width - 8, 2);
  graphics.fillRect(left + width - 5, top + 4, 2, height - 8);
}

function drawObstacle(
  graphics: Phaser.GameObjects.Graphics,
  element: RuntimeElement,
  accent: number,
): void {
  const { left, top, width, height } = element;
  const body = elementColor('obstacle', accent);
  const light = blend(body, 0xffffff, 0.4);
  const dark = blend(body, 0x05020c, 0.6);
  const centreX = left + width / 2;
  const centreY = top + height / 2;
  const hash = hashId(element.id);

  // Dark crystalline silhouette, intentionally different from any block.
  graphics.fillStyle(0x030208, 0.95);
  const silhouette = [
    { x: centreX, y: top - 1 },
    { x: left + width * 0.72, y: top + height * 0.28 },
    { x: left + width + 1, y: top + height * 0.55 },
    { x: left + width * 0.82, y: top + height + 1 },
    { x: left + width * 0.22, y: top + height + 1 },
    { x: left - 1, y: top + height * 0.62 },
    { x: left + width * 0.2, y: top + height * 0.24 },
  ];
  graphics.fillPoints(silhouette, true);

  // Faceted shards.
  const shards = 3 + (hash % 2);
  for (let index = 0; index < shards; index += 1) {
    const t = index / Math.max(1, shards - 1);
    const baseX = left + width * (0.18 + t * 0.64);
    const baseY = top + height * (0.82 + hashUnit(hash, index) * 0.1);
    const apexX = baseX + (hashUnit(hash, 10 + index) - 0.5) * width * 0.18;
    const apexY = top + height * (0.12 + hashUnit(hash, 20 + index) * 0.3);
    graphics.fillStyle(light, 0.28 + index * 0.04);
    graphics.fillTriangle(apexX, apexY, baseX - width * 0.18, baseY, baseX, baseY);
    graphics.fillStyle(dark, 0.55);
    graphics.fillTriangle(apexX, apexY, baseX, baseY, baseX + width * 0.18, baseY);
    graphics.lineStyle(1, light, 0.45);
    graphics.lineBetween(Math.round(apexX), Math.round(apexY), Math.round(baseX), Math.round(baseY));
  }

  // Bright core and rim.
  graphics.fillStyle(0xffffff, 0.8);
  graphics.fillRect(Math.round(centreX) - 1, Math.round(centreY) - 2, 2, 3);
  graphics.lineStyle(1, blend(accent, 0xffffff, 0.5), 0.35);
  graphics.strokePoints(silhouette, true);
}

function drawDeflector(
  graphics: Phaser.GameObjects.Graphics,
  element: RuntimeElement,
  accent: number,
): void {
  const body = elementColor('deflector', accent);
  const { x1, y1, x2, y2 } = element;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const nx = -uy;
  const ny = ux;
  const active = element.active;

  // Glow under the blade.
  graphics.lineStyle(14, body, active ? 0.14 : 0.05);
  graphics.lineBetween(x1, y1, x2, y2);
  graphics.lineStyle(8, 0x08101a, 0.9);
  graphics.lineBetween(x1, y1, x2, y2);
  graphics.lineStyle(5, body, active ? 0.95 : 0.35);
  graphics.lineBetween(x1, y1, x2, y2);
  graphics.lineStyle(1, 0xffffff, active ? 0.7 : 0.25);
  graphics.lineBetween(x1 + nx * 1.5, y1 + ny * 1.5, x2 + nx * 1.5, y2 + ny * 1.5);

  // Hatching along the blade.
  graphics.lineStyle(1, blend(body, 0xffffff, 0.5), active ? 0.45 : 0.18);
  const hatchCount = Math.max(2, Math.floor(length / 14));
  for (let index = 1; index < hatchCount; index += 1) {
    const t = index / hatchCount;
    const hx = x1 + dx * t;
    const hy = y1 + dy * t;
    graphics.lineBetween(
      Math.round(hx - ux * 5 - nx * 2),
      Math.round(hy - uy * 5 - ny * 2),
      Math.round(hx + ux * 5 + nx * 2),
      Math.round(hy + uy * 5 + ny * 2),
    );
  }

  // End caps.
  graphics.fillStyle(blend(body, 0xffffff, 0.35), active ? 0.9 : 0.3);
  graphics.fillCircle(x1, y1, 3);
  graphics.fillCircle(x2, y2, 3);

  // Arrow showing the normal (the bounce direction).
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const tipX = midX + nx * 15;
  const tipY = midY + ny * 15;
  graphics.fillStyle(blend(accent, 0xffffff, 0.45), active ? 0.85 : 0.25);
  graphics.fillTriangle(
    tipX,
    tipY,
    midX + nx * 5 - ux * 6,
    midY + ny * 5 - uy * 6,
    midX + nx * 5 + ux * 6,
    midY + ny * 5 + uy * 6,
  );
  graphics.fillStyle(0xffffff, active ? 0.9 : 0.3);
  graphics.fillRect(Math.round(tipX) - 1, Math.round(tipY) - 1, 2, 2);
}

function drawPortal(
  graphics: Phaser.GameObjects.Graphics,
  element: RuntimeElement,
  accent: number,
  options: ElementDrawOptions,
): void {
  const { left, top, width, height } = element;
  const centreX = left + width / 2;
  const centreY = top + height / 2;
  const radiusX = width / 2 - 3;
  const radiusY = height / 2 - 3;
  const color = portalColor(element.pairId, accent);
  const time = options.reducedMotion ? 0 : (options.timeMs ?? 0);
  const pulse = 0.75 + Math.sin(time / 260 + portalHue(element.pairId) * 6) * 0.25;

  // Soft halo and dark throat.
  graphics.fillStyle(color, 0.12 * pulse);
  graphics.fillEllipse(centreX, centreY, width + 10, height + 10);
  graphics.fillStyle(0x02030a, 0.92);
  graphics.fillEllipse(centreX, centreY, width - 4, height - 4);

  // Aro externo / inner ring.
  graphics.lineStyle(3, blend(color, 0xffffff, 0.25), 0.85);
  graphics.strokeEllipse(centreX, centreY, width - 6, height - 6);
  graphics.lineStyle(1, 0xffffff, 0.35);
  graphics.strokeEllipse(centreX, centreY, width - 12, height - 12);

  // Portal core: nested ellipses with a bright slit.
  graphics.fillStyle(color, 0.24 * pulse);
  graphics.fillEllipse(centreX, centreY, width * 0.55, height * 0.55);
  graphics.fillStyle(color, 0.55);
  graphics.fillEllipse(centreX, centreY, width * 0.3, height * 0.3);
  graphics.fillStyle(0xffffff, 0.9);
  graphics.fillEllipse(centreX, centreY, width * 0.1, height * 0.18);

  // Orbiting sparks, deterministic per pair.
  const hue = portalHue(element.pairId);
  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * Math.PI * 2 + time / 900 + hue * Math.PI;
    const sparkX = centreX + Math.cos(angle) * radiusX * 0.82;
    const sparkY = centreY + Math.sin(angle) * radiusY * 0.82;
    graphics.fillStyle(blend(color, 0xffffff, 0.6), 0.55 * pulse);
    graphics.fillRect(Math.round(sparkX) - 1, Math.round(sparkY) - 1, 2, 2);
  }

  // Corner brackets so a portal reads as a two-tile landmark.
  graphics.lineStyle(2, blend(color, 0xffffff, 0.5), 0.6);
  const corner = Math.max(5, Math.round(width * 0.16));
  graphics.lineBetween(left + 2, top + corner, left + 2, top + 2);
  graphics.lineBetween(left + 2, top + 2, left + corner, top + 2);
  graphics.lineBetween(left + width - corner, top + 2, left + width - 2, top + 2);
  graphics.lineBetween(left + width - 2, top + 2, left + width - 2, top + corner);
  graphics.lineBetween(left + 2, top + height - corner, left + 2, top + height - 2);
  graphics.lineBetween(left + 2, top + height - 2, left + corner, top + height - 2);
  graphics.lineBetween(left + width - corner, top + height - 2, left + width - 2, top + height - 2);
  graphics.lineBetween(left + width - 2, top + height - 2, left + width - 2, top + height - corner);
}

function drawMover(
  graphics: Phaser.GameObjects.Graphics,
  element: RuntimeElement,
  accent: number,
): void {
  const { left, top, width, height } = element;
  const body = elementColor('mover', accent);
  const light = blend(body, 0xffffff, 0.38);
  const dark = blend(body, 0x06080e, 0.55);
  const horizontal = element.axis === 'horizontal';

  // Track drawn from the base position across the full travel range.
  const trackLeft = horizontal ? element.baseLeft - element.rangePx : element.baseLeft + width / 2;
  const trackTop = horizontal ? element.baseTop + height / 2 : element.baseTop - element.rangePx;
  const trackLength = element.rangePx * 2;
  graphics.lineStyle(3, dark, 0.55);
  if (horizontal) {
    graphics.lineBetween(trackLeft, trackTop, trackLeft + trackLength, trackTop);
    graphics.lineStyle(1, light, 0.3);
    graphics.lineBetween(trackLeft, trackTop - 2, trackLeft + trackLength, trackTop - 2);
    graphics.lineStyle(1, blend(accent, 0xffffff, 0.4), 0.4);
    for (let x = trackLeft + 4; x < trackLeft + trackLength; x += 12) {
      graphics.lineBetween(Math.round(x), trackTop - 4, Math.round(x), trackTop + 4);
    }
  } else {
    graphics.lineBetween(trackLeft, trackTop, trackLeft, trackTop + trackLength);
    graphics.lineStyle(1, light, 0.3);
    graphics.lineBetween(trackLeft - 2, trackTop, trackLeft - 2, trackTop + trackLength);
    graphics.lineStyle(1, blend(accent, 0xffffff, 0.4), 0.4);
    for (let y = trackTop + 4; y < trackTop + trackLength; y += 12) {
      graphics.lineBetween(trackLeft - 4, Math.round(y), trackLeft + 4, Math.round(y));
    }
  }

  // Metal platform: dark frame, plated body, bright lip.
  graphics.fillStyle(0x03050a, 0.95);
  graphics.fillPoints(steppedRect(left - 1, top - 1, width + 2, height + 2, 0, 4), true);
  graphics.fillStyle(body, 1);
  graphics.fillPoints(steppedRect(left, top, width, height, 0, 4), true);
  graphics.fillStyle(light, 0.4);
  graphics.fillRect(left + 3, top + 2, width - 6, 2);
  graphics.fillRect(left + 2, top + 3, 2, height - 6);
  graphics.fillStyle(dark, 0.6);
  graphics.fillRect(left + 3, top + height - 4, width - 6, 2);

  // Rivets.
  graphics.fillStyle(0x11161f, 0.9);
  graphics.fillRect(left + 4, top + 4, 2, 2);
  graphics.fillRect(left + width - 6, top + 4, 2, 2);
  graphics.fillRect(left + 4, top + height - 6, 2, 2);
  graphics.fillRect(left + width - 6, top + height - 6, 2, 2);

  // Direction arrows along the travel axis.
  const centreY = top + height / 2;
  const centreX = left + width / 2;
  graphics.fillStyle(blend(accent, 0xffffff, 0.35), 0.85);
  if (horizontal) {
    graphics.fillTriangle(left + 5, centreY, left + 12, centreY - 5, left + 12, centreY + 5);
    graphics.fillTriangle(left + width - 5, centreY, left + width - 12, centreY - 5, left + width - 12, centreY + 5);
  } else {
    graphics.fillTriangle(centreX, top + 5, centreX - 5, top + 12, centreX + 5, top + 12);
    graphics.fillTriangle(centreX, top + height - 5, centreX - 5, top + height - 12, centreX + 5, top + height - 12);
  }
}

function drawRotor(
  graphics: Phaser.GameObjects.Graphics,
  element: RuntimeElement,
  accent: number,
): void {
  const body = elementColor('rotor', accent);
  const { x1, y1, x2, y2 } = element;
  const centreX = (x1 + x2) / 2;
  const centreY = (y1 + y2) / 2;
  const active = element.active;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy) || 1;

  // Bar under-glow, shaft and bright edge.
  graphics.lineStyle(12, body, active ? 0.14 : 0.05);
  graphics.lineBetween(x1, y1, x2, y2);
  graphics.lineStyle(7, 0x08060c, 0.95);
  graphics.lineBetween(x1, y1, x2, y2);
  graphics.lineStyle(4, body, active ? 0.95 : 0.35);
  graphics.lineBetween(x1, y1, x2, y2);
  graphics.lineStyle(1, 0xffffff, active ? 0.65 : 0.2);
  graphics.lineBetween(x1, y1, x2, y2);

  // Hazard ticks along the bar.
  const ux = dx / length;
  const uy = dy / length;
  graphics.lineStyle(1, blend(body, 0xffffff, 0.5), active ? 0.5 : 0.18);
  const ticks = Math.max(2, Math.floor(length / 18));
  for (let index = 1; index < ticks; index += 1) {
    const t = index / ticks;
    const tx = x1 + dx * t;
    const ty = y1 + dy * t;
    graphics.lineBetween(
      Math.round(tx - uy * 4),
      Math.round(ty + ux * 4),
      Math.round(tx + uy * 4),
      Math.round(ty - ux * 4),
    );
  }

  // Hub with a bright axle.
  graphics.fillStyle(0x05030a, 1);
  graphics.fillCircle(centreX, centreY, 8);
  graphics.lineStyle(2, blend(body, 0xffffff, 0.35), active ? 0.9 : 0.3);
  graphics.strokeCircle(centreX, centreY, 8);
  graphics.fillStyle(blend(accent, 0xffffff, 0.5), active ? 0.95 : 0.35);
  graphics.fillCircle(centreX, centreY, 3);
  graphics.fillStyle(0xffffff, 0.9);
  graphics.fillRect(Math.round(centreX) - 1, Math.round(centreY) - 1, 2, 2);

  // Capped tips.
  graphics.fillStyle(blend(body, 0xffffff, 0.4), active ? 0.95 : 0.3);
  graphics.fillCircle(x1, y1, 4);
  graphics.fillCircle(x2, y2, 4);
  graphics.fillStyle(0x05030a, 0.9);
  graphics.fillCircle(x1, y1, 1.5);
  graphics.fillCircle(x2, y2, 1.5);
}

function drawGate(
  graphics: Phaser.GameObjects.Graphics,
  element: RuntimeElement,
  accent: number,
  options: ElementDrawOptions,
): void {
  const { left, top, width, height } = element;
  const body = elementColor('gate', accent);
  const closed = element.active;
  const time = options.reducedMotion ? 0 : (options.timeMs ?? 0);
  const pulse = 0.6 + Math.sin(time / 300) * 0.4;

  if (!closed) {
    // Open: only a dashed frame and faint threshold remain.
    graphics.fillStyle(0x02030a, 0.35);
    graphics.fillRect(left + 2, top + 2, width - 4, height - 4);
    graphics.lineStyle(1, blend(accent, 0xffffff, 0.35), 0.35 + pulse * 0.2);
    dashedRect(graphics, left + 3, top + 3, width - 6, height - 6, 6, 5);
    graphics.lineStyle(1, body, 0.18);
    graphics.lineBetween(left + 4, top + height / 2, left + width - 4, top + height / 2);
    // Chevrons pointing inward: "passable".
    graphics.fillStyle(blend(accent, 0xffffff, 0.4), 0.4);
    graphics.fillTriangle(left + width / 2, top + height / 2 - 5, left + width / 2 - 5, top + height / 2 + 2, left + width / 2 + 5, top + height / 2 + 2);
    return;
  }

  // Closed: heavy metal door with vertical bars.
  graphics.fillStyle(0x03050a, 0.98);
  graphics.fillPoints(steppedRect(left - 1, top - 1, width + 2, height + 2, 0, 5), true);
  graphics.fillStyle(blend(body, 0x1a0508, 0.55), 1);
  graphics.fillPoints(steppedRect(left, top, width, height, 0, 5), true);
  graphics.fillStyle(blend(body, 0xffffff, 0.2), 0.35);
  graphics.fillRect(left + 3, top + 2, width - 6, 2);

  const bars = Math.max(2, Math.round(width / 16));
  for (let index = 0; index < bars; index += 1) {
    const x = left + 5 + ((width - 10) * (index + 0.5)) / bars;
    graphics.fillStyle(0x0a0306, 0.55);
    graphics.fillRect(Math.round(x) - 2, top + 5, 4, height - 10);
    graphics.fillStyle(blend(body, 0xffffff, 0.3), 0.55);
    graphics.fillRect(Math.round(x) - 1, top + 5, 1, height - 10);
  }

  // Central rune lock, pulsing while closed.
  const centreX = left + width / 2;
  const centreY = top + height / 2;
  graphics.fillStyle(0x0a0306, 0.9);
  graphics.fillCircle(centreX, centreY, Math.min(width, height) * 0.16);
  graphics.lineStyle(2, blend(body, 0xffffff, 0.4), 0.75 * pulse + 0.25);
  graphics.strokeCircle(centreX, centreY, Math.min(width, height) * 0.16);
  graphics.fillStyle(blend(accent, 0xffffff, 0.5), 0.5 + pulse * 0.4);
  graphics.fillRect(Math.round(centreX) - 2, Math.round(centreY) - 1, 4, 2);
  graphics.fillRect(Math.round(centreX) - 1, Math.round(centreY) - 3, 2, 6);
}
