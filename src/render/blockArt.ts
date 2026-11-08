import type Phaser from 'phaser';
import type { Block } from '../sim/World';
import { BLOCK_TYPES } from '../sim/blocks';

/**
 * Procedural pixel-art block rendering.
 *
 * Each block type owns a distinct silhouette and interior pattern so the grid
 * stays readable in grayscale: crystal facets, stone masonry and obsidian
 * angular runes. All variation is derived from `block.id`, never from
 * `Math.random`, so a block looks identical every time it is redrawn.
 */

const CRYSTAL_LIGHT = 0xd8fbff;
const CRYSTAL_MID = 0x8cf3ff;
const STONE_MORTAR = 0x120e1e;
const OBSIDIAN_RUNE = 0xffd6f7;

type Point = { x: number; y: number };

/** FNV-1a hash of the block id; stable across sessions and frames. */
export function hashId(id: string): number {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Deterministic 0..1 sample for a hash and salt. */
export function hashUnit(hash: number, salt: number): number {
  let value = Math.imul(hash ^ Math.imul(salt + 1, 0x9e3779b1), 0x85ebca6b);
  value ^= value >>> 13;
  value = Math.imul(value, 0xc2b2ae35);
  value ^= value >>> 16;
  return (value >>> 0) / 4294967295;
}

/** Linear RGB blend; `amount` 0 keeps `from`, 1 returns `to`. */
export function blend(from: number, to: number, amount: number): number {
  const t = Math.max(0, Math.min(1, amount));
  const r = Math.round(((from >> 16) & 0xff) * (1 - t) + ((to >> 16) & 0xff) * t);
  const g = Math.round(((from >> 8) & 0xff) * (1 - t) + ((to >> 8) & 0xff) * t);
  const b = Math.round((from & 0xff) * (1 - t) + (to & 0xff) * t);
  return (r << 16) | (g << 8) | b;
}

/**
 * Clockwise outline of a rectangle with pixel-stepped corners.
 * A step of 4 carves a 4x4 corner into two 2px stairs, which reads as
 * hand-placed pixel art instead of a soft rounded rectangle.
 */
export function steppedRect(
  left: number,
  top: number,
  width: number,
  height: number,
  inset = 0,
  step = 4,
): Point[] {
  const l = Math.round(left + inset);
  const t = Math.round(top + inset);
  const r = Math.round(left + width - inset);
  const b = Math.round(top + height - inset);
  const maxStep = Math.max(0, Math.floor(Math.min(width, height) / 4));
  const s = Math.max(0, Math.min(Math.round(step), maxStep));
  if (s <= 1) {
    return [
      { x: l, y: t },
      { x: r, y: t },
      { x: r, y: b },
      { x: l, y: b },
    ];
  }
  const half = Math.max(1, Math.floor(s / 2));
  const rest = s - half;
  return [
    // top edge, stepping out at the right corner.
    { x: l + s, y: t },
    { x: r - s, y: t },
    { x: r - s, y: t + half },
    { x: r - rest, y: t + half },
    { x: r - rest, y: t + s },
    { x: r, y: t + s },
    // right edge, stepping out at the bottom corner.
    { x: r, y: b - s },
    { x: r - half, y: b - s },
    { x: r - half, y: b - rest },
    { x: r - s, y: b - rest },
    { x: r - s, y: b },
    // bottom edge, stepping out at the left corner.
    { x: l + s, y: b },
    { x: l + s, y: b - half },
    { x: l + rest, y: b - half },
    { x: l + rest, y: b - s },
    { x: l, y: b - s },
    // left edge, back to the top corner.
    { x: l, y: t + s },
    { x: l + half, y: t + s },
    { x: l + half, y: t + rest },
    { x: l + s, y: t + rest },
    { x: l + s, y: t },
  ];
}

export interface BlockDrawOptions {
  /** 0..1 multiplier used by the phase tint; 1 keeps the type colour. */
  tint?: number;
  /** Current phase accent, used for rim light, glints and runes. */
  accent?: number;
}

export function drawBlock(
  graphics: Phaser.GameObjects.Graphics,
  block: Block,
  options: BlockDrawOptions = {},
): void {
  const tint = options.tint ?? 1;
  const accent = options.accent ?? 0xffffff;
  const type = BLOCK_TYPES[block.type];
  const hash = hashId(block.id);
  const base = blend(type.color, 0x0b0a14, 1 - tint);
  const left = block.left;
  const top = block.top;
  const width = block.width;
  const height = block.height;
  const flash = block.flashMs > 0;
  // Obsidian is deliberately darker than its rune colour.
  const body =
    block.type === 'obsidian' ? blend(base, 0x06040e, 0.76) : base;
  const bodyLight = blend(body, 0xffffff, block.type === 'stone' ? 0.24 : 0.34);
  const bodyDark = blend(body, 0x03040a, 0.5);

  // Soft drop shadow, two pixels of offset so blocks sit on the lane instead
  // of floating above it.
  graphics.fillStyle(0x02040a, 0.42);
  graphics.fillPoints(steppedRect(left + 3, top + 4, width, height, 0, 6), true);

  // Dark outer frame: a two-pixel pixel-art border.
  graphics.fillStyle(0x04050c, 0.98);
  graphics.fillPoints(steppedRect(left - 2, top - 2, width + 4, height + 4, 0, 7), true);
  graphics.fillStyle(0x010208, 0.9);
  graphics.fillPoints(steppedRect(left - 1, top - 1, width + 2, height + 2, 0, 6), true);

  // Body.
  graphics.fillStyle(body, 1);
  graphics.fillPoints(steppedRect(left, top, width, height, 0, 6), true);

  // Bevel: light top/left, shade bottom/right, plus a crisp inner rim.
  graphics.fillStyle(bodyLight, block.type === 'stone' ? 0.3 : 0.42);
  graphics.fillRect(left + 4, top + 2, width - 8, 2);
  graphics.fillRect(left + 2, top + 4, 2, height - 8);
  graphics.fillStyle(bodyDark, 0.55);
  graphics.fillRect(left + 4, top + height - 4, width - 8, 2);
  graphics.fillRect(left + width - 4, top + 4, 2, height - 8);
  graphics.fillStyle(0xffffff, block.type === 'stone' ? 0.12 : 0.2);
  graphics.fillRect(left + 5, top + 2, width - 12, 1);
  graphics.fillRect(left + 2, top + 5, 1, height - 12);
  // Phase accent catches the top lip; subtle, never a full recolour.
  graphics.fillStyle(blend(accent, 0xffffff, 0.4), 0.15);
  graphics.fillRect(left + 9, top + 1, width - 18, 1);

  if (block.type === 'crystal') {
    drawCrystal(graphics, left, top, width, height, base, accent, hash);
  } else if (block.type === 'stone') {
    drawStone(graphics, left, top, width, height, base, accent, hash);
  } else {
    drawObsidian(graphics, left, top, width, height, base, accent, hash);
  }

  drawDamageCracks(graphics, block, hash);

  if (flash) {
    const strength = Math.min(1, block.flashMs / 80);
    graphics.fillStyle(0xffffff, 0.22 + strength * 0.45);
    graphics.fillPoints(steppedRect(left + 1, top + 1, width - 2, height - 2, 0, 4), true);
    // Re-assert the silhouette so the flash never washes the block out.
    graphics.lineStyle(1, 0x04050c, 0.9);
    graphics.strokePoints(steppedRect(left, top, width, height, 0, 4), true);
  }

  drawHpPips(graphics, block, accent);
}

function drawCrystal(
  graphics: Phaser.GameObjects.Graphics,
  left: number,
  top: number,
  width: number,
  height: number,
  base: number,
  accent: number,
  hash: number,
): void {
  const bottom = top + height - 5;
  const centreX = left + width / 2;
  const jitter = (hashUnit(hash, 1) - 0.5) * 5;
  const coreY = top + height * (0.42 + hashUnit(hash, 2) * 0.1);
  const coldRim = blend(accent, CRYSTAL_LIGHT, 0.55);

  // Deep inner geode panel.
  graphics.fillStyle(blend(base, 0x031018, 0.55), 0.7);
  graphics.fillPoints(steppedRect(left + 3, top + 3, width - 6, height - 6, 0, 4), true);

  // Three crystal shards: shorter flanking spires behind a tall central one.
  const shards = [
    {
      apex: { x: left + width * (0.19 + hashUnit(hash, 3) * 0.07), y: top + height * 0.3 },
      leftBase: left + 4,
      rightBase: left + width * 0.46,
      light: CRYSTAL_MID,
      alpha: 0.34,
    },
    {
      apex: { x: left + width * (0.78 + hashUnit(hash, 4) * 0.06), y: top + height * 0.34 },
      leftBase: left + width * 0.56,
      rightBase: left + width - 4,
      light: CRYSTAL_MID,
      alpha: 0.28,
    },
    {
      apex: { x: centreX + jitter, y: top + 5 },
      leftBase: left + width * 0.28,
      rightBase: left + width * 0.72,
      light: CRYSTAL_LIGHT,
      alpha: 0.48,
    },
  ];

  for (const shard of shards) {
    const apex = shard.apex;
    // Left facet catches the light, right facet falls into shadow.
    graphics.fillStyle(shard.light, shard.alpha);
    graphics.fillTriangle(apex.x, apex.y, shard.leftBase, bottom, apex.x, bottom);
    graphics.fillStyle(blend(base, 0x08222c, 0.35), 0.5);
    graphics.fillTriangle(apex.x, apex.y, apex.x, bottom, shard.rightBase, bottom);
    // Facet seam and outline.
    graphics.lineStyle(1, 0x082b35, 0.85);
    graphics.lineBetween(apex.x, apex.y, apex.x, bottom);
    graphics.lineBetween(apex.x, apex.y, shard.leftBase, bottom);
    graphics.lineBetween(apex.x, apex.y, shard.rightBase, bottom);
    // Cold accent rim on the lit edge.
    graphics.lineStyle(1, coldRim, 0.4);
    graphics.lineBetween(apex.x, apex.y, shard.leftBase, bottom);
    // Apex glint.
    graphics.fillStyle(0xffffff, 0.85);
    graphics.fillRect(Math.round(apex.x) - 1, Math.round(apex.y), 2, 2);
  }

  // Horizontal cleavage lines across the crystal cluster.
  graphics.lineStyle(1, 0x0a3f4b, 0.45);
  graphics.lineBetween(left + width * 0.24, top + height * 0.62, left + width * 0.76, top + height * 0.58);
  graphics.lineBetween(left + width * 0.3, top + height * 0.78, left + width * 0.72, top + height * 0.76);

  // Luminous core between the shards.
  graphics.fillStyle(blend(CRYSTAL_LIGHT, accent, 0.35), 0.75);
  graphics.fillPoints(
    [
      { x: centreX, y: coreY - 9 },
      { x: centreX + 5, y: coreY },
      { x: centreX, y: coreY + 9 },
      { x: centreX - 5, y: coreY },
    ],
    true,
  );
  graphics.fillStyle(0xffffff, 0.9);
  graphics.fillRect(Math.round(centreX) - 1, Math.round(coreY) - 2, 2, 3);

  // Specular glints, deterministic per block.
  graphics.fillStyle(0xffffff, 0.75);
  graphics.fillRect(left + 5, top + 5, 3, 1);
  graphics.fillRect(left + 5, top + 5, 1, 4);
  graphics.fillRect(left + Math.round(width * 0.64), top + Math.round(height * 0.26), 2, 1);
  graphics.fillStyle(blend(0xffffff, accent, 0.4), 0.5);
  graphics.fillRect(left + Math.round(width * 0.7), top + Math.round(height * 0.7), 1, 3);
}

function drawStone(
  graphics: Phaser.GameObjects.Graphics,
  left: number,
  top: number,
  width: number,
  height: number,
  base: number,
  accent: number,
  hash: number,
): void {
  const innerLeft = left + 4;
  const innerTop = top + 4;
  const innerWidth = width - 8;
  const innerHeight = height - 8;

  // Deep mortar bed.
  graphics.fillStyle(blend(base, STONE_MORTAR, 0.8), 1);
  graphics.fillPoints(steppedRect(left + 3, top + 3, width - 6, height - 6, 0, 4), true);
  graphics.lineStyle(1, 0x04030a, 0.7);
  graphics.strokePoints(steppedRect(left + 3, top + 3, width - 6, height - 6, 0, 4), true);

  const rows = 3;
  const rowHeight = innerHeight / rows;
  for (let row = 0; row < rows; row += 1) {
    const rowTop = Math.round(innerTop + row * rowHeight) + 1;
    const rowBottom = Math.round(innerTop + (row + 1) * rowHeight) - 1;
    const rowSeed = (hash >>> (row * 4)) & 0xff;
    // Staggered courses: each row has a different brick count and offset.
    const splitA = 0.22 + hashUnit(hash, row * 9 + 2) * 0.26;
    const splitB = 0.56 + hashUnit(hash, row * 9 + 5) * 0.24;
    const cuts =
      rowSeed % 3 === 0 ? [0, splitA, 1] : [0, splitA, splitB, 1];
    for (let index = 0; index < cuts.length - 1; index += 1) {
      const x0 = innerLeft + innerWidth * cuts[index]!;
      const x1 = innerLeft + innerWidth * cuts[index + 1]!;
      const brickLeft = Math.round(x0) + 1;
      const brickRight = Math.round(x1) - 1;
      const brickWidth = brickRight - brickLeft;
      if (brickWidth < 4) continue;
      const shade = hashUnit(hash, row * 13 + index * 5);
      const brickColor = blend(
        base,
        shade > 0.5 ? 0xf1e6ff : 0x181026,
        0.1 + shade * 0.24,
      );
      graphics.fillStyle(brickColor, 1);
      graphics.fillRect(brickLeft, rowTop, brickWidth, rowBottom - rowTop);
      // Chiselled top-face highlight and bottom shade.
      graphics.fillStyle(0xffffff, 0.2);
      graphics.fillRect(brickLeft + 1, rowTop, brickWidth - 2, 1);
      graphics.fillStyle(0xd8c7ff, 0.1);
      graphics.fillRect(brickLeft + 2, rowTop + 1, brickWidth - 4, 1);
      graphics.fillStyle(0x04040a, 0.38);
      graphics.fillRect(brickLeft + 1, rowBottom - 1, brickWidth - 2, 1);
      graphics.fillStyle(0x04040a, 0.22);
      graphics.fillRect(brickRight - 1, rowTop + 1, 1, rowBottom - rowTop - 2);
      // Chipped corners and missing chunks.
      if (shade > 0.62) {
        graphics.fillStyle(0x0a0714, 0.85);
        graphics.fillRect(brickRight - 3, rowTop, 3, 2);
        graphics.fillRect(brickLeft, rowBottom - 2, 2, 2);
      }
      if (shade < 0.24) {
        // A hairline fracture through one brick.
        const fx = brickLeft + Math.round(brickWidth * 0.55);
        graphics.lineStyle(1, 0x05030c, 0.62);
        graphics.lineBetween(fx, rowTop + 1, fx + 3, rowTop + 4);
        graphics.lineBetween(fx + 3, rowTop + 4, fx + 1, rowBottom - 1);
      }
    }
  }

  // Speckles and quartz flakes; fixed per block id.
  const speckles = 8;
  for (let index = 0; index < speckles; index += 1) {
    const sx = innerLeft + 2 + hashUnit(hash, 40 + index * 3) * (innerWidth - 4);
    const sy = innerTop + 2 + hashUnit(hash, 41 + index * 3) * (innerHeight - 4);
    const light = index % 3 !== 0;
    graphics.fillStyle(light ? 0xffffff : 0x080612, light ? 0.3 : 0.5);
    graphics.fillRect(Math.round(sx), Math.round(sy), light ? 2 : 1, 1);
  }

  // Accent wash on the upper row keeps stone tied to the phase palette.
  graphics.fillStyle(accent, 0.06);
  graphics.fillRect(innerLeft, innerTop, innerWidth, Math.round(rowHeight));
  // Long hairline fracture across the masonry.
  const crackX = innerLeft + innerWidth * (0.2 + hashUnit(hash, 7) * 0.55);
  graphics.lineStyle(1, 0x07050e, 0.55);
  graphics.lineBetween(Math.round(crackX), innerTop + 2, Math.round(crackX + 5), innerTop + rowHeight);
  graphics.lineBetween(Math.round(crackX + 5), innerTop + rowHeight, Math.round(crackX + 3), innerTop + rowHeight + 7);
}

function drawObsidian(
  graphics: Phaser.GameObjects.Graphics,
  left: number,
  top: number,
  width: number,
  height: number,
  base: number,
  accent: number,
  hash: number,
): void {
  const centreX = left + width / 2;
  const centreY = top + height / 2;
  const rune = blend(OBSIDIAN_RUNE, accent, 0.32);

  // Angular planes: faceted volumes read even without colour.
  graphics.fillStyle(blend(base, 0xffffff, 0.12), 0.22);
  graphics.fillTriangle(left + 3, top + 3, left + width * 0.7, top + 3, left + 3, top + height * 0.58);
  graphics.fillStyle(0x010106, 0.5);
  graphics.fillTriangle(
    left + width - 3,
    top + height * 0.32,
    left + width - 3,
    top + height - 3,
    left + width * 0.3,
    top + height - 3,
  );
  graphics.fillStyle(blend(rune, 0x000000, 0.5), 0.12);
  graphics.fillTriangle(left + 3, top + 3, left + width * 0.7, top + 3, left + width * 0.55, top + height * 0.42);

  // Double angular border.
  graphics.lineStyle(1, 0x000000, 0.8);
  graphics.strokePoints(steppedRect(left + 2, top + 2, width - 4, height - 4, 0, 4), true);
  graphics.lineStyle(1, rune, 0.3);
  graphics.strokePoints(steppedRect(left + 5, top + 5, width - 10, height - 10, 0, 3), true);
  // Chamfer ticks at the inner corners.
  graphics.lineStyle(1, rune, 0.45);
  graphics.lineBetween(left + 5, top + 11, left + 11, top + 5);
  graphics.lineBetween(left + width - 11, top + 5, left + width - 5, top + 11);
  graphics.lineBetween(left + 5, top + height - 11, left + 11, top + height - 5);
  graphics.lineBetween(left + width - 11, top + height - 5, left + width - 5, top + height - 11);

  // Faceted outer diamond.
  const spanX = Math.max(9, Math.round(width * 0.26));
  const spanY = Math.max(8, Math.round(height * 0.25));
  const outer = [
    { x: centreX, y: centreY - spanY },
    { x: centreX + spanX, y: centreY },
    { x: centreX, y: centreY + spanY },
    { x: centreX - spanX, y: centreY },
  ];
  graphics.fillStyle(blend(rune, base, 0.4), 0.28);
  graphics.fillPoints(outer, true);
  graphics.lineStyle(2, rune, 0.92);
  graphics.strokePoints(outer, true);
  // Inner diamond, a different proportion from the outer one.
  const innerSpanX = Math.max(4, Math.round(spanX * 0.5));
  const innerSpanY = Math.max(4, Math.round(spanY * 0.55));
  graphics.fillStyle(0x020108, 0.7);
  graphics.fillPoints(
    [
      { x: centreX, y: centreY - innerSpanY },
      { x: centreX + innerSpanX, y: centreY },
      { x: centreX, y: centreY + innerSpanY },
      { x: centreX - innerSpanX, y: centreY },
    ],
    true,
  );
  graphics.lineStyle(1, rune, 0.8);
  graphics.strokePoints(
    [
      { x: centreX, y: centreY - innerSpanY },
      { x: centreX + innerSpanX, y: centreY },
      { x: centreX, y: centreY + innerSpanY },
      { x: centreX - innerSpanX, y: centreY },
    ],
    true,
  );
  // Cross-hair ticks and four small rune studs.
  graphics.lineStyle(1, rune, 0.65);
  graphics.lineBetween(centreX, centreY - spanY - 3, centreX, centreY - innerSpanY);
  graphics.lineBetween(centreX, centreY + innerSpanY, centreX, centreY + spanY + 3);
  graphics.lineBetween(centreX - spanX - 3, centreY, centreX - innerSpanX, centreY);
  graphics.lineBetween(centreX + innerSpanX, centreY, centreX + spanX + 3, centreY);
  graphics.fillStyle(rune, 0.9);
  graphics.fillRect(Math.round(centreX - innerSpanX - 1), Math.round(centreY - 1), 2, 2);
  graphics.fillRect(Math.round(centreX + innerSpanX - 1), Math.round(centreY - 1), 2, 2);
  graphics.fillRect(Math.round(centreX - 1), Math.round(centreY - innerSpanY - 1), 2, 2);
  graphics.fillRect(Math.round(centreX - 1), Math.round(centreY + innerSpanY - 1), 2, 2);
  // Bright core.
  graphics.fillStyle(blend(0xffffff, rune, 0.35), 0.95);
  graphics.fillRect(Math.round(centreX) - 2, Math.round(centreY) - 2, 4, 4);
  graphics.fillStyle(accent, 0.65);
  graphics.fillRect(Math.round(centreX) - 1, Math.round(centreY) - 3, 2, 1);
  graphics.fillRect(Math.round(centreX) + 2, Math.round(centreY) - 1, 1, 2);

  // Glowing veins and micro-cracks fan out from the sigil.
  const veins = 3 + (hash % 2);
  for (let index = 0; index < veins; index += 1) {
    const angle = hashUnit(hash, 20 + index) * Math.PI * 2;
    const reach = Math.min(width, height) * (0.28 + hashUnit(hash, 30 + index) * 0.14);
    const midX = centreX + Math.cos(angle) * reach * 0.55;
    const midY = centreY + Math.sin(angle) * reach * 0.55;
    const vx = centreX + Math.cos(angle) * reach;
    const vy = centreY + Math.sin(angle) * reach;
    graphics.lineStyle(1, rune, 0.42);
    graphics.lineBetween(centreX, centreY, Math.round(midX), Math.round(midY));
    graphics.lineStyle(1, rune, 0.22);
    graphics.lineBetween(Math.round(midX), Math.round(midY), Math.round(vx), Math.round(vy));
    graphics.fillStyle(rune, 0.65);
    graphics.fillRect(Math.round(vx), Math.round(vy), 1, 1);
  }
  for (let index = 0; index < 3; index += 1) {
    const sx = left + 7 + hashUnit(hash, 50 + index * 7) * (width - 14);
    const sy = top + 7 + hashUnit(hash, 51 + index * 7) * (height - 14);
    graphics.lineStyle(1, 0x05030a, 0.8);
    graphics.lineBetween(Math.round(sx), Math.round(sy), Math.round(sx + 5), Math.round(sy + 3));
    graphics.lineStyle(1, rune, 0.2);
    graphics.lineBetween(Math.round(sx + 1), Math.round(sy), Math.round(sx + 6), Math.round(sy + 3));
  }

  // Chipped corners: one or two bites out of the silhouette.
  const chips = hashUnit(hash, 60) > 0.45 ? 2 : 1;
  for (let index = 0; index < chips; index += 1) {
    const atRight = hashUnit(hash, 61 + index) > 0.5;
    const atBottom = hashUnit(hash, 63 + index) > 0.5;
    const cx = atRight ? left + width - 9 : left + 6;
    const cy = atBottom ? top + height - 7 : top + 6;
    graphics.fillStyle(0x030208, 0.95);
    graphics.fillTriangle(cx, cy - 4, cx + 4, cy - 1, cx + 1, cy + 3);
  }
}

function drawDamageCracks(
  graphics: Phaser.GameObjects.Graphics,
  block: Block,
  hash: number,
): void {
  const damage = Math.max(0, block.maxHp - block.hp);
  if (damage === 0) return;
  const width = block.width;
  const height = block.height;
  const left = block.left;
  const top = block.top;

  for (let index = 0; index < damage; index += 1) {
    // Each crack is a jagged polyline from an edge towards the centre.
    const seed = hashUnit(hash, 70 + index * 11);
    const fromLeft = seed > 0.5;
    const startX = fromLeft
      ? left + 3
      : left + width * (0.35 + hashUnit(hash, 72 + index * 11) * 0.3);
    const startY = top + height * (0.18 + hashUnit(hash, 71 + index * 11) * 0.3);
    const points: Point[] = [{ x: startX, y: startY }];
    let x = startX;
    let y = startY;
    const segments = 4;
    for (let segment = 1; segment <= segments; segment += 1) {
      const t = segment / segments;
      x += (fromLeft ? 1 : -1) * (3 + hashUnit(hash, 80 + index * 11 + segment) * 5);
      y += (height * 0.55) / segments;
      points.push({ x: Math.round(x), y: Math.round(y) });
      if (t > 0.4 && hashUnit(hash, 90 + index * 11 + segment) > 0.6) {
        // A short branch keeps the crack organic instead of a straight gash.
        graphics.lineStyle(1, 0x04060b, 0.72);
        graphics.lineBetween(
          Math.round(x),
          Math.round(y),
          Math.round(x + (fromLeft ? 1 : -1) * 6),
          Math.round(y + 4),
        );
      }
    }
    // Dark core plus a light upper edge so cracks survive grayscale.
    graphics.lineStyle(2, 0x04060b, 0.82);
    graphics.strokePoints(points, false);
    graphics.lineStyle(1, 0xffffff, 0.2);
    const shifted = points.map((point) => ({ x: point.x + 1, y: point.y + 1 }));
    graphics.strokePoints(shifted, false);
  }
}

function drawHpPips(
  graphics: Phaser.GameObjects.Graphics,
  block: Block,
  accent: number,
): void {
  const pipSize = Math.max(7, Math.round(block.width * 0.115));
  const gap = 3;
  const total = Math.min(4, Math.max(1, block.maxHp));
  const startX = block.left + 6;
  const y = block.top + block.height - pipSize - 6;
  const backingWidth = total * (pipSize + gap) + 1;

  // Recessed socket strip keeps the pips readable over any material.
  graphics.fillStyle(0x02030a, 0.8);
  graphics.fillRect(startX - 3, y - 3, backingWidth + 2, pipSize + 6);
  graphics.fillStyle(0xffffff, 0.16);
  graphics.fillRect(startX - 3, y - 3, backingWidth + 2, 1);
  graphics.fillStyle(0x000000, 0.5);
  graphics.fillRect(startX - 3, y + pipSize + 2, backingWidth + 2, 1);

  for (let index = 0; index < total; index += 1) {
    const x = startX + index * (pipSize + gap);
    // Gem socket.
    graphics.fillStyle(0x010208, 0.9);
    graphics.fillRect(x - 1, y - 1, pipSize + 2, pipSize + 2);
    graphics.lineStyle(1, 0xffffff, 0.32);
    graphics.strokeRect(x - 1.5, y - 1.5, pipSize + 2, pipSize + 2);

    if (index < block.hp) {
      const gem =
        block.type === 'crystal'
          ? blend(CRYSTAL_LIGHT, accent, 0.3)
          : block.type === 'stone'
            ? blend(0xffffff, block.type === 'stone' ? 0xe8ddff : 0xffffff, 0.1)
            : blend(OBSIDIAN_RUNE, accent, 0.4);
      // Faceted gem: a bright pixel diamond with a shaded lower-right half.
      const diamond = [
        { x: x + pipSize / 2, y },
        { x: x + pipSize, y: y + pipSize / 2 },
        { x: x + pipSize / 2, y: y + pipSize },
        { x, y: y + pipSize / 2 },
      ];
      graphics.fillStyle(gem, 0.98);
      graphics.fillPoints(diamond, true);
      graphics.fillStyle(blend(gem, 0x05060c, 0.45), 0.6);
      graphics.fillTriangle(
        x + pipSize / 2,
        y + pipSize / 2,
        x + pipSize,
        y + pipSize / 2,
        x + pipSize / 2,
        y + pipSize,
      );
      graphics.fillStyle(0xffffff, 0.9);
      graphics.fillRect(x + Math.round(pipSize * 0.28), y + 1, 2, 1);
      graphics.lineStyle(1, 0xffffff, 0.5);
      graphics.strokePoints(diamond, true);
    } else {
      // Empty socket: a visible engraving, not a blank square.
      graphics.fillStyle(0x03040a, 0.95);
      graphics.fillRect(x + 1, y + 1, pipSize - 2, pipSize - 2);
      graphics.lineStyle(1, 0xffffff, 0.4);
      graphics.strokeRect(x + 1.5, y + 1.5, pipSize - 3, pipSize - 3);
    }
  }
}
