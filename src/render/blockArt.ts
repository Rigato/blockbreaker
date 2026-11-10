import type Phaser from 'phaser';
import type { Block } from '../sim/World';
import { BLOCK_TYPES, type BlockTypeId } from '../sim/blocks';

/**
 * Procedural pixel-art block rendering — "polished arcade tiles".
 *
 * Every block shares one tile frame (soft drop shadow, crisp 2px outline,
 * stepped corners, pronounced top-left bevel, bottom-right shade, inner gloss
 * and a phase-accent rim light). On top of that frame each block type owns one
 * clear material signature that reads in 2-3 shapes at thumbnail size:
 *
 *   crystal      bright faceted gem
 *   stone        two/three chiselled brick courses
 *   obsidian     near-black tile with a hot rune sigil
 *   explosive    charred crate, hazard stripes and a molten core
 *   regenerative living belly with a healing cross and leaf sprigs
 *   moving       recessed rail bed with bold outward arrows
 *   multiplier   gold plate with a pixel "×2" stamp
 *   generator    gear ring around a luminous portal core
 *   linked       two interlocking chain links and corner studs
 *
 * All variation is derived from `block.id` via FNV-1a hashing, never from
 * `Math.random`, so a block looks identical every time it is redrawn. Colours
 * come from `BLOCK_TYPES` plus deterministic blends, so the phase tint in
 * `BlockDrawOptions` keeps working and the whole set stays on one palette.
 */

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

/**
 * Deep shade per block family: shading pushes toward a saturated dark of the
 * same hue family instead of plain grey, which keeps bodies juicy.
 */
const DEEP_SHADE: Partial<Record<BlockTypeId, number>> = {
  crystal: 0x0b4a5e,
  stone: 0x241640,
  obsidian: 0x140616,
  explosive: 0x2a0d04,
  regenerative: 0x0a2a18,
  moving: 0x0a1a30,
  multiplier: 0x3a2a06,
  generator: 0x1e0f38,
  linked: 0x05323a,
};

export interface BlockPalette {
  /** Main body fill. */
  body: number;
  /** Near-white, hue-tinted highlight for bevels and gloss. */
  light: number;
  /** Deep saturated shade for the bottom-right bevel. */
  shade: number;
  /** Darkest interior colour used by materials. */
  deep: number;
  /** Hue-tinted near-black used for the 2px outline. */
  outline: number;
}

/**
 * Palette for a block type derived from its base colour. Exported so tests
 * can assert the grayscale value ladder (crystal bright > stone mid >
 * obsidian dark) without booting Phaser.
 */
export function blockPalette(type: BlockTypeId, base: number): BlockPalette {
  const deep = DEEP_SHADE[type] ?? 0x0a0a14;
  // Value ladder for the basic trio (bright gem / mid masonry / dark glass);
  // crystal keeps its saturated body instead of drifting towards white.
  const body =
    type === 'obsidian'
      ? blend(base, deep, 0.58)
      : type === 'stone'
        ? blend(base, deep, 0.2)
        : type === 'regenerative'
          ? blend(base, deep, 0.1)
          : type === 'crystal'
            ? base
            : blend(base, 0xffffff, 0.05);
  const light = blend(body, 0xffffff, type === 'stone' ? 0.42 : 0.55);
  return {
    body,
    light,
    shade: blend(body, deep, 0.6),
    deep,
    outline: blend(body, 0x080a16, 0.82),
  };
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
  const minDim = Math.min(width, height);
  // Corner step scales with the block so 46px cells and 350px boss tiles both
  // keep the same chunky proportions.
  const step = Math.max(4, Math.min(12, Math.round(minDim * 0.13)));
  const palette = blockPalette(block.type, base);
  const flash = block.flashMs > 0;

  drawTileBase(graphics, left, top, width, height, step, palette, hash);

  switch (block.type) {
    case 'crystal':
      drawCrystal(graphics, left, top, width, height, palette, hash);
      break;
    case 'stone':
      drawStone(graphics, left, top, width, height, palette, hash);
      break;
    case 'obsidian':
      drawObsidian(graphics, left, top, width, height, palette, accent, hash);
      break;
    case 'explosive':
      drawExplosive(graphics, block, palette, hash);
      break;
    case 'regenerative':
      drawRegenerative(graphics, block, palette, accent, hash);
      break;
    case 'moving':
      drawMoving(graphics, block, palette, accent, hash);
      break;
    case 'multiplier':
      drawMultiplier(graphics, block, palette, hash);
      break;
    case 'generator':
      drawGenerator(graphics, block, palette, accent, hash);
      break;
    case 'linked':
      drawLinked(graphics, block, palette, accent, hash);
      break;
  }

  // The gloss layer sits above every material: sheen, accent rim, sparkle.
  drawTileGlass(graphics, left, top, width, height, step, accent, hash);

  drawDamageCracks(graphics, block, hash);

  if (flash) {
    const strength = Math.min(1, block.flashMs / 80);
    graphics.fillStyle(0xffffff, 0.2 + strength * 0.42);
    graphics.fillPoints(steppedRect(left + 1, top + 1, width - 2, height - 2, 0, step), true);
    graphics.fillStyle(blend(accent, 0xffffff, 0.4), 0.4);
    graphics.fillRect(left + step, top + 2, width - step * 2, 1);
    // Re-assert the silhouette so the flash never washes the block out.
    graphics.lineStyle(1, 0x04050c, 0.9);
    graphics.strokePoints(steppedRect(left, top, width, height, 0, step), true);
  }

  drawHpPips(graphics, block, accent);
}

/** Shadow, outline, body fill and bevels shared by all nine block types. */
function drawTileBase(
  graphics: Phaser.GameObjects.Graphics,
  left: number,
  top: number,
  width: number,
  height: number,
  step: number,
  palette: BlockPalette,
  hash: number,
): void {
  // Soft drop shadow: two offset passes read as a blurred edge.
  graphics.fillStyle(0x01040e, 0.2);
  graphics.fillPoints(steppedRect(left + 3, top + 5, width, height, 0, step + 2), true);
  graphics.fillStyle(0x01040e, 0.32);
  graphics.fillPoints(steppedRect(left + 2, top + 3, width, height, 0, step + 1), true);

  // Crisp 2px outline, hue-tinted so the family stays on the block's colour.
  graphics.fillStyle(palette.outline, 0.96);
  graphics.fillPoints(steppedRect(left - 2, top - 2, width + 4, height + 4, 0, step), true);

  // Body.
  graphics.fillStyle(palette.body, 1);
  graphics.fillPoints(steppedRect(left, top, width, height, 0, step), true);

  // Per-block tone jitter: a whisper of shade or light so a full grid of the
  // same material reads as siblings, never clones.
  const tone = (hashUnit(hash, 93) - 0.5) * 0.12;
  if (Math.abs(tone) > 0.012) {
    graphics.fillStyle(tone >= 0 ? 0xffffff : 0x000000, Math.abs(tone));
    graphics.fillPoints(steppedRect(left + 1, top + 1, width - 2, height - 2, 0, step - 1), true);
  }

  const bev = Math.max(2, Math.round(Math.min(width, height) * 0.05));

  // Pronounced top-left light bevel.
  graphics.fillStyle(0xffffff, 0.42);
  graphics.fillRect(left + 2, top + 2, width - 4, bev);
  graphics.fillRect(left + 2, top + 2, bev, height - 4);
  // Softer inner lip below the bevel so the edge reads as two tones.
  graphics.fillStyle(0xffffff, 0.13);
  graphics.fillRect(left + bev + 1, top + bev + 1, width - (bev + 1) * 2, 1);
  graphics.fillRect(left + bev + 1, top + bev + 1, 1, Math.max(2, height - (bev + 2) * 2));

  // Bottom-right shade bevel.
  graphics.fillStyle(0x000000, 0.3);
  graphics.fillRect(left + 2, top + height - bev - 2, width - 4, bev);
  graphics.fillRect(left + width - bev - 2, top + 2, bev, height - 4);
  graphics.fillStyle(0x000000, 0.13);
  graphics.fillRect(left + bev + 1, top + height - bev - 3, width - (bev + 1) * 2, 1);

  // Grounding band: a wider soft shade hugging the bottom of the tile.
  graphics.fillStyle(0x000000, 0.12);
  graphics.fillRect(left + bev + 2, top + height - bev * 3, width - (bev + 2) * 2, bev);
}

/** Gloss, accent rim light and deterministic sparkle over the material. */
function drawTileGlass(
  graphics: Phaser.GameObjects.Graphics,
  left: number,
  top: number,
  width: number,
  height: number,
  step: number,
  accent: number,
  hash: number,
): void {
  const bev = Math.max(2, Math.round(Math.min(width, height) * 0.05));

  // Diagonal glass sheen from a corner; half the blocks catch the light on
  // the right instead of the left so the grid never reads as wallpaper.
  const sheenRight = hashUnit(hash, 94) > 0.5;
  graphics.fillStyle(0xffffff, 0.09);
  graphics.fillPoints(
    sheenRight
      ? [
          { x: left + width - bev - 1, y: top + bev + 1 },
          { x: left + Math.round(width * 0.48), y: top + bev + 1 },
          { x: left + width - bev - 1, y: top + Math.round(height * 0.4) },
        ]
      : [
          { x: left + bev + 1, y: top + bev + 1 },
          { x: left + Math.round(width * 0.52), y: top + bev + 1 },
          { x: left + bev + 1, y: top + Math.round(height * 0.4) },
        ],
    true,
  );

  // Phase accent catches the top lip and one corner; a rim, never a wash.
  const rim = blend(accent, 0xffffff, 0.3);
  graphics.fillStyle(rim, 0.55);
  graphics.fillRect(left + step, top + 1, width - step * 2, 1);
  const kissLeft = hashUnit(hash, 90) > 0.5;
  graphics.fillRect(
    kissLeft ? left + step : left + width - step - 3,
    top + 2,
    3,
    1,
  );
  graphics.fillStyle(rim, 0.2);
  graphics.fillRect(left + 1, top + step, 1, height - step * 2);

  // Deterministic four-point sparkle near the top of the tile.
  if (Math.min(width, height) >= 26) {
    const sx = Math.round(left + bev + 3 + hashUnit(hash, 91) * Math.max(4, width * 0.3));
    const sy = Math.round(top + bev + 3 + hashUnit(hash, 92) * Math.max(3, height * 0.16));
    graphics.fillStyle(0xffffff, 0.9);
    graphics.fillRect(sx, sy, 1, 3);
    graphics.fillRect(sx - 1, sy + 1, 3, 1);
  }
}

/**
 * Crystal: a faceted gem with three deterministic cuts (vertical, horizontal
 * or diagonal) so sibling gems read as individually cut stones. A small
 * white-hot core diamond anchors the centre of every cut.
 */
function drawCrystal(
  graphics: Phaser.GameObjects.Graphics,
  left: number,
  top: number,
  width: number,
  height: number,
  palette: BlockPalette,
  hash: number,
): void {
  const bottom = top + height - 3;
  const lit = blend(palette.body, 0xffffff, 0.24);
  const shaded = blend(palette.body, palette.deep, 0.5);
  const layout = hashUnit(hash, 1);

  if (layout < 0.34) {
    // Vertical cut: lit left facet, shaded right facet, bright seam.
    const splitX = Math.round(left + width * (0.4 + hashUnit(hash, 5) * 0.18));
    graphics.fillStyle(lit, 0.55);
    graphics.fillTriangle(left + 3, top + 3, left + width * 0.6, top + 3, splitX, bottom);
    graphics.fillStyle(shaded, 0.6);
    graphics.fillTriangle(left + width - 3, top + 3, left + width * 0.52, top + 3, splitX, bottom);
    graphics.fillStyle(blend(palette.body, 0xffffff, 0.5), 0.8);
    graphics.fillRect(splitX, top + 3, 1, height - 6);
  } else if (layout < 0.67) {
    // Horizontal cut: bright crown, shaded base, bright seam between them.
    const splitY = Math.round(top + height * (0.4 + hashUnit(hash, 6) * 0.18));
    graphics.fillStyle(lit, 0.5);
    graphics.fillRect(left + 3, top + 3, width - 6, splitY - top - 3);
    graphics.fillStyle(shaded, 0.6);
    graphics.fillRect(left + 3, splitY, width - 6, bottom - splitY);
    graphics.fillStyle(blend(palette.body, 0xffffff, 0.5), 0.8);
    graphics.fillRect(left + 3, splitY, width - 6, 1);
  } else {
    // Diagonal cut: one lit triangle across the whole gem.
    const slantUp = hashUnit(hash, 7) > 0.5;
    graphics.fillStyle(lit, 0.5);
    graphics.fillTriangle(
      left + 3,
      slantUp ? top + 3 : bottom,
      left + width - 3,
      slantUp ? bottom : top + 3,
      left + 3,
      slantUp ? bottom : top + 3,
    );
    graphics.fillStyle(shaded, 0.62);
    graphics.fillTriangle(
      left + width - 3,
      slantUp ? bottom : top + 3,
      left + width - 3,
      slantUp ? top + 3 : bottom,
      left + 3,
      slantUp ? bottom : top + 3,
    );
  }

  // Core diamond, offset per block.
  const coreX = Math.round(left + width * (0.5 + (hashUnit(hash, 2) - 0.5) * 0.2));
  const coreY = Math.round(top + height * (0.52 + (hashUnit(hash, 8) - 0.5) * 0.12));
  const coreR = Math.max(3, Math.round(Math.min(width, height) * 0.1));
  graphics.fillStyle(blend(palette.body, 0xffffff, 0.8), 0.95);
  graphics.fillPoints(
    [
      { x: coreX, y: coreY - coreR },
      { x: coreX + coreR, y: coreY },
      { x: coreX, y: coreY + coreR },
      { x: coreX - coreR, y: coreY },
    ],
    true,
  );
  graphics.fillStyle(0xffffff, 0.95);
  graphics.fillRect(coreX - 1, coreY - 1, 2, 2);
}

/** Stone: two or three chunky brick courses with chiselled edges. */
function drawStone(
  graphics: Phaser.GameObjects.Graphics,
  left: number,
  top: number,
  width: number,
  height: number,
  palette: BlockPalette,
  hash: number,
): void {
  const innerLeft = left + 3;
  const innerTop = top + 3;
  const innerWidth = width - 6;
  const innerHeight = height - 6;
  const courses = height >= 100 ? 3 : 2;
  const courseH = Math.round(innerHeight / courses);

  // Deep mortar bed behind the bricks.
  graphics.fillStyle(blend(palette.body, palette.deep, 0.62), 0.92);
  graphics.fillPoints(steppedRect(innerLeft, innerTop, innerWidth, innerHeight, 0, 4), true);

  for (let course = 0; course < courses; course += 1) {
    const rowTop = innerTop + course * courseH + 1;
    const rowBottom = innerTop + (course + 1) * courseH - 1;
    const rowHeight = rowBottom - rowTop;
    if (rowHeight < 3) continue;
    // Staggered courses: alternating brick counts and offsets.
    const cuts =
      course % 2 === 0
        ? [0, 0.5 + hashUnit(hash, 5 + course) * 0.14, 1]
        : [
            0,
            0.28 + hashUnit(hash, 8 + course) * 0.2,
            0.66 + hashUnit(hash, 11 + course) * 0.16,
            1,
          ];
    for (let index = 0; index < cuts.length - 1; index += 1) {
      const x0 = Math.round(innerLeft + innerWidth * cuts[index]!) + 1;
      const x1 = Math.round(innerLeft + innerWidth * cuts[index + 1]!) - 1;
      const brickWidth = x1 - x0;
      if (brickWidth < 4) continue;
      const tone = hashUnit(hash, 14 + course * 7 + index);
      const brick = blend(
        palette.body,
        tone > 0.5 ? 0xffffff : palette.deep,
        0.08 + tone * 0.24,
      );
      graphics.fillStyle(brick, 1);
      graphics.fillRect(x0, rowTop, brickWidth, rowHeight);
      // Chiselled edges: lit top, shaded bottom.
      graphics.fillStyle(0xffffff, 0.3);
      graphics.fillRect(x0, rowTop, brickWidth, 1);
      graphics.fillStyle(0x000000, 0.32);
      graphics.fillRect(x0, rowBottom - 1, brickWidth, 1);
    }
  }

  // Quartz speckles, fixed per block id.
  const speckles = 4 + (hash % 3);
  for (let index = 0; index < speckles; index += 1) {
    const sx = Math.round(innerLeft + 2 + hashUnit(hash, 24 + index) * (innerWidth - 4));
    const sy = Math.round(innerTop + 2 + hashUnit(hash, 25 + index) * (innerHeight - 4));
    const lit = index % 2 === 0;
    graphics.fillStyle(lit ? 0xffffff : 0x000000, lit ? 0.42 : 0.32);
    graphics.fillRect(sx, sy, 1, 1);
  }

  // Chipped edges: one or two wedges bitten out of the silhouette, keyed by
  // id so weathered blocks differ across the grid.
  const chips = hashUnit(hash, 26) > 0.55 ? 2 : 1;
  for (let index = 0; index < chips; index += 1) {
    const atRight = hashUnit(hash, 27 + index * 2) > 0.5;
    const atBottom = hashUnit(hash, 28 + index * 2) > 0.5;
    const cx = atRight ? left + width - 3 : left + 3;
    const cy = atBottom ? top + height - 4 : top + 4;
    graphics.fillStyle(palette.outline, 0.95);
    if (atRight) {
      graphics.fillTriangle(cx, cy - 2, cx - 6, cy - 2, cx, cy + 3);
    } else {
      graphics.fillTriangle(cx, cy - 2, cx + 6, cy - 2, cx, cy + 3);
    }
  }
}

/** Obsidian: darkest tile, lit by a hot rune sigil and glowing veins. */
function drawObsidian(
  graphics: Phaser.GameObjects.Graphics,
  left: number,
  top: number,
  width: number,
  height: number,
  palette: BlockPalette,
  accent: number,
  hash: number,
): void {
  const centreX = left + width / 2;
  const centreY = top + height / 2;
  const rune = blend(0xff9df0, accent, 0.3);

  // Soft glow behind the sigil fills the dark body without adding noise.
  graphics.fillStyle(rune, 0.07);
  graphics.fillCircle(centreX, centreY, Math.min(width, height) * 0.36);

  // Angular planes so the dark body still reads as a 3D cut; the lit plane
  // switches sides per block, like light moving across polished glass.
  const sheenRight = hashUnit(hash, 24) > 0.5;
  graphics.fillStyle(0xffffff, 0.14);
  if (sheenRight) {
    graphics.fillTriangle(
      left + width - 3,
      top + 3,
      left + width * 0.18,
      top + 3,
      left + width - 3,
      top + height * 0.55,
    );
    graphics.fillStyle(0x000000, 0.45);
    graphics.fillTriangle(
      left + 3,
      top + height * 0.28,
      left + 3,
      top + height - 3,
      left + width * 0.7,
      top + height - 3,
    );
  } else {
    graphics.fillTriangle(left + 3, top + 3, left + width * 0.82, top + 3, left + 3, top + height * 0.55);
    graphics.fillStyle(0x000000, 0.45);
    graphics.fillTriangle(
      left + width - 3,
      top + height * 0.28,
      left + width - 3,
      top + height - 3,
      left + width * 0.3,
      top + height - 3,
    );
  }

  // Rune sigil: filled outer diamond, stroked edge, dark inner diamond, core.
  // Three proportions per block — diamond, tall rhombus or wide rhombus.
  const runeVariant = hashUnit(hash, 23);
  let spanX = Math.max(8, Math.round(width * 0.24));
  let spanY = Math.max(8, Math.round(height * 0.22));
  if (runeVariant < 0.34) {
    spanX = Math.max(7, Math.round(width * 0.18));
    spanY = Math.max(10, Math.round(height * 0.3));
  } else if (runeVariant >= 0.67) {
    spanX = Math.max(10, Math.round(width * 0.3));
    spanY = Math.max(6, Math.round(height * 0.17));
  }
  const outer = [
    { x: centreX, y: centreY - spanY },
    { x: centreX + spanX, y: centreY },
    { x: centreX, y: centreY + spanY },
    { x: centreX - spanX, y: centreY },
  ];
  graphics.fillStyle(blend(rune, palette.body, 0.35), 0.3);
  graphics.fillPoints(outer, true);
  graphics.lineStyle(2, rune, 0.95);
  graphics.strokePoints(outer, true);
  const inX = Math.max(3, Math.round(spanX * 0.5));
  const inY = Math.max(3, Math.round(spanY * 0.5));
  graphics.fillStyle(0x0a0410, 0.85);
  graphics.fillPoints(
    [
      { x: centreX, y: centreY - inY },
      { x: centreX + inX, y: centreY },
      { x: centreX, y: centreY + inY },
      { x: centreX - inX, y: centreY },
    ],
    true,
  );
  graphics.fillStyle(0xffffff, 0.95);
  graphics.fillRect(Math.round(centreX) - 1, Math.round(centreY) - 1, 2, 2);

  // Chamfer ticks on one diagonal pair of corners, swapped per block.
  graphics.fillStyle(rune, 0.65);
  if (hashUnit(hash, 25) > 0.5) {
    graphics.fillRect(left + 5, top + 9, 4, 1);
    graphics.fillRect(left + 9, top + 5, 1, 4);
    graphics.fillRect(left + width - 12, top + height - 6, 4, 1);
    graphics.fillRect(left + width - 6, top + height - 9, 1, 4);
  } else {
    graphics.fillRect(left + width - 9, top + 5, 4, 1);
    graphics.fillRect(left + width - 6, top + 9, 1, 4);
    graphics.fillRect(left + 8, top + height - 6, 4, 1);
    graphics.fillRect(left + 5, top + height - 9, 1, 4);
  }

  // Angular chips bitten out of the silhouette; one or two per block.
  const chips = hashUnit(hash, 26) > 0.5 ? 2 : 1;
  for (let index = 0; index < chips; index += 1) {
    const atRight = hashUnit(hash, 28 + index) > 0.5;
    const atBottom = hashUnit(hash, 29 + index) > 0.5;
    const cx = atRight ? left + width - 4 : left + 3;
    const cy = atBottom ? top + height - 4 : top + 4;
    graphics.fillStyle(0x030208, 0.95);
    if (atRight) {
      graphics.fillTriangle(cx, cy - 3, cx - 5, cy - 1, cx - 1, cy + 3);
    } else {
      graphics.fillTriangle(cx, cy - 3, cx + 5, cy - 1, cx + 1, cy + 3);
    }
  }

  // Glowing veins fanning out from the sigil; dots read crisper than thin
  // anti-aliased lines at small sizes.
  for (let index = 0; index < 3; index += 1) {
    const angle = hashUnit(hash, 20 + index) * Math.PI * 2;
    const reach = Math.min(width, height) * (0.24 + hashUnit(hash, 22 + index) * 0.12);
    for (let dot = 1; dot <= 2; dot += 1) {
      const d = reach * (dot / 2);
      const vx = Math.round(centreX + Math.cos(angle) * d);
      const vy = Math.round(centreY + Math.sin(angle) * d);
      graphics.fillStyle(rune, dot === 2 ? 0.65 : 0.3);
      graphics.fillRect(vx, vy, dot === 2 ? 2 : 1, 1);
    }
  }
}

/**
 * Explosive: charred crate with hazard stripes, a short fuse and a molten
 * core. Reads as "do not hit" even in grayscale thanks to the bright centre.
 */
function drawExplosive(
  graphics: Phaser.GameObjects.Graphics,
  block: Block,
  palette: BlockPalette,
  hash: number,
): void {
  const left = block.left;
  const top = block.top;
  const width = block.width;
  const height = block.height;
  const centreX = left + width / 2;
  const coreX = centreX + Math.round((hashUnit(hash, 31) - 0.5) * width * 0.14);
  const coreY = top + height * (0.56 + hashUnit(hash, 32) * 0.1);
  const minDim = Math.min(width, height);
  const hot = blend(0xffb347, 0xffe9c4, 0.4);

  // Scorched interior.
  graphics.fillStyle(blend(palette.body, palette.deep, 0.38), 0.95);
  graphics.fillPoints(steppedRect(left + 3, top + 3, width - 6, height - 6, 0, 4), true);

  // Warm ember halo so the interior never reads as an empty dark box.
  graphics.fillStyle(hot, 0.1);
  graphics.fillCircle(coreX, coreY, minDim * 0.44);

  // Hazard stripes: four bold diagonal cuts across the top; the slant flips
  // per block like crates packed in different directions.
  const stripe = Math.max(4, Math.round(width * 0.09));
  const slantRight = hashUnit(hash, 33) > 0.5;
  graphics.fillStyle(blend(0xffe27d, palette.body, 0.15), 0.95);
  for (let index = 0; index < 4; index += 1) {
    const sx = left + 4 + index * stripe * 1.6;
    if (slantRight) {
      graphics.fillTriangle(sx, top + 3, sx + stripe, top + 3, sx + stripe, top + 3 + stripe);
      graphics.fillTriangle(sx + stripe, top + 3, sx + stripe * 2, top + 3, sx + stripe, top + 3 + stripe);
    } else {
      graphics.fillTriangle(sx, top + 3, sx + stripe, top + 3, sx, top + 3 + stripe);
      graphics.fillTriangle(sx, top + 3, sx - stripe, top + 3, sx, top + 3 + stripe);
    }
  }

  // Short stepped fuse sprouting from the top edge, offset per block.
  const fuseX = Math.round(centreX + (hashUnit(hash, 30) - 0.5) * width * 0.3);
  graphics.fillStyle(0x1c0a04, 0.95);
  graphics.fillRect(fuseX, top + 4, 1, 4);
  graphics.fillRect(fuseX + 1, top + 3, 2, 1);
  graphics.fillRect(fuseX + 3, top + 4, 1, 4);
  graphics.fillStyle(0xd9a066, 0.8);
  graphics.fillRect(fuseX + 3, top + 3, 2, 1);
  // Spark at the tip.
  graphics.fillStyle(0xfff2c4, 0.95);
  graphics.fillRect(fuseX + 4, top + 3, 2, 2);
  graphics.fillStyle(0xffb347, 0.85);
  graphics.fillRect(fuseX + 6, top + 2, 1, 1);

  // Molten core: dark socket, hot ring, white-hot centre with a star spark.
  graphics.fillStyle(0x180602, 0.95);
  graphics.fillCircle(coreX, coreY, minDim * 0.26);
  graphics.lineStyle(Math.max(2, Math.round(minDim * 0.045)), hot, 0.95);
  graphics.strokeCircle(coreX, coreY, minDim * 0.19);
  graphics.fillStyle(blend(0xffcf6b, 0xffffff, 0.35), 0.9);
  graphics.fillCircle(coreX, coreY, minDim * 0.1);
  graphics.fillStyle(0xffffff, 0.95);
  graphics.fillRect(Math.round(coreX) - 2, Math.round(coreY) - 2, 3, 3);
  graphics.fillRect(Math.round(coreX) - 1, Math.round(coreY) - 5, 1, 2);
  graphics.fillRect(Math.round(coreX) + 3, Math.round(coreY) - 1, 2, 1);
}

/** Regenerative: living green belly, healing cross, leaf sprigs. */
function drawRegenerative(
  graphics: Phaser.GameObjects.Graphics,
  block: Block,
  palette: BlockPalette,
  accent: number,
  hash: number,
): void {
  const left = block.left;
  const top = block.top;
  const width = block.width;
  const height = block.height;
  const minDim = Math.min(width, height);
  const centreX = left + width / 2 + Math.round((hashUnit(hash, 40) - 0.5) * minDim * 0.1);
  const centreY = top + height * 0.52 + Math.round((hashUnit(hash, 41) - 0.5) * minDim * 0.08);
  const vein = blend(0x7dffb0, 0xffffff, 0.2);

  // Living belly, slightly darker than the tile body.
  graphics.fillStyle(blend(palette.body, palette.deep, 0.4), 0.95);
  graphics.fillPoints(steppedRect(left + 4, top + 4, width - 8, height - 8, 0, 6), true);

  // Soft glow behind the cross, tied to the phase accent.
  graphics.fillStyle(vein, 0.1);
  graphics.fillCircle(centreX, centreY, minDim * 0.3);
  graphics.fillStyle(accent, 0.08);
  graphics.fillCircle(centreX, centreY, minDim * 0.38);

  // Healing cross: dark backing, bright stepped plus, white glint. Arm
  // proportions and position vary per block like living growth; about half
  // the blocks grow a hollow cross with a bud instead of a solid one.
  const arm = Math.max(4, Math.round(minDim * 0.11 * (0.95 + hashUnit(hash, 42) * 0.15)));
  const thick = Math.max(4, Math.round(arm * (1.05 + hashUnit(hash, 43) * 0.2)));
  const crossX = Math.round(centreX - arm);
  const crossY = Math.round(centreY - arm);
  const hollow = hashUnit(hash, 44) > 0.55;
  graphics.fillStyle(blend(vein, 0x000000, 0.55), 0.9);
  graphics.fillRect(crossX - 1, crossY - 1, arm * 2 + 2, thick + 2);
  graphics.fillRect(Math.round(centreX - thick / 2) - 1, crossY - 1, thick + 2, arm * 2 + 2);
  graphics.fillStyle(vein, 0.95);
  if (hollow) {
    // Hollow cross: four bright arms around a dark bud socket.
    graphics.fillRect(Math.round(centreX - thick / 2), crossY, thick, arm - thick / 2);
    graphics.fillRect(Math.round(centreX - thick / 2), crossY + arm + thick / 2, thick, arm - thick / 2);
    graphics.fillRect(crossX, Math.round(centreY - thick / 2), arm - thick / 2, thick);
    graphics.fillRect(crossX + arm + thick / 2, Math.round(centreY - thick / 2), arm - thick / 2, thick);
    graphics.fillStyle(blend(vein, 0xffffff, 0.35), 0.9);
    graphics.fillRect(Math.round(centreX) - 2, Math.round(centreY) - 2, 4, 4);
  } else {
    graphics.fillRect(crossX, crossY, arm * 2, thick);
    graphics.fillRect(Math.round(centreX - thick / 2), crossY, thick, arm * 2);
    graphics.fillStyle(0xffffff, 0.9);
    graphics.fillRect(crossX, crossY, Math.max(2, arm - 2), Math.max(2, Math.round(thick * 0.4)));
    graphics.fillRect(
      Math.round(centreX - thick / 2),
      crossY,
      Math.max(2, Math.round(thick * 0.4)),
      Math.max(2, arm - 2),
    );
  }

  // Leaf sprigs orbit the cross; two or three per block, positions fixed.
  const sprigs = 2 + (hash % 2);
  for (let index = 0; index < sprigs; index += 1) {
    const angle = (index / sprigs) * Math.PI * 2 + hashUnit(hash, 40 + index) * 0.9;
    const dist = minDim * (0.3 + hashUnit(hash, 45 + index) * 0.06);
    const leafX = Math.round(centreX + Math.cos(angle) * dist);
    const leafY = Math.round(centreY + Math.sin(angle) * dist);
    graphics.fillStyle(vein, 0.75);
    graphics.fillRect(leafX, leafY, 2, 2);
  }
}

/** Moving: recessed rail bed with sleepers and bold outward arrows. */
function drawMoving(
  graphics: Phaser.GameObjects.Graphics,
  block: Block,
  palette: BlockPalette,
  accent: number,
  hash: number,
): void {
  const left = block.left;
  const top = block.top;
  const width = block.width;
  const height = block.height;
  // Rail height varies a little per block so the line of movers breathes.
  const centreY = top + height * (0.5 + (hashUnit(hash, 50) - 0.5) * 0.12);
  const railDark = blend(palette.body, palette.deep, 0.4);
  const railLit = blend(0xffffff, accent, 0.35);
  const arrowL = Math.max(5, Math.round(Math.min(width, height) * (0.16 + hashUnit(hash, 51) * 0.05)));

  // Recessed panel.
  graphics.fillStyle(blend(palette.body, palette.deep, 0.35), 0.85);
  graphics.fillPoints(steppedRect(left + 3, top + 3, width - 6, height - 6, 0, 4), true);

  if (block.motion?.axis === 'vertical') {
    const centreX = left + width / 2;
    graphics.fillStyle(railDark, 0.92);
    graphics.fillRect(centreX - 3, top + 5, 6, height - 10);
    graphics.fillStyle(railLit, 0.75);
    for (let y = top + 8; y < top + height - 8; y += 8) {
      graphics.fillRect(centreX - 2, y, 4, 2);
    }
    graphics.fillStyle(railLit, 0.95);
    graphics.fillTriangle(centreX, top + 4, centreX - arrowL, top + 4 + arrowL, centreX + arrowL, top + 4 + arrowL);
    graphics.fillTriangle(
      centreX,
      top + height - 4,
      centreX - arrowL,
      top + height - 4 - arrowL,
      centreX + arrowL,
      top + height - 4 - arrowL,
    );
    return;
  }

  // Rail band with sleepers.
  graphics.fillStyle(railDark, 0.92);
  graphics.fillRect(left + 4, centreY - 3, width - 8, 6);
  graphics.fillStyle(railLit, 0.7);
  for (let x = left + 7; x < left + width - 7; x += 9) {
    graphics.fillRect(x, centreY - 2, 5, 2);
  }
  graphics.fillStyle(0xffffff, 0.26);
  graphics.fillRect(left + 4, centreY - 4, width - 8, 1);
  graphics.fillStyle(0x000000, 0.3);
  graphics.fillRect(left + 4, centreY + 3, width - 8, 1);

  // Bold outward chevrons, cut for a two-tone arrow.
  graphics.fillStyle(railLit, 0.95);
  graphics.fillTriangle(left + 4, centreY, left + 4 + arrowL, centreY - arrowL, left + 4 + arrowL, centreY + arrowL);
  graphics.fillTriangle(
    left + width - 4,
    centreY,
    left + width - 4 - arrowL,
    centreY - arrowL,
    left + width - 4 - arrowL,
    centreY + arrowL,
  );
  graphics.fillStyle(railDark, 1);
  graphics.fillTriangle(
    left + 4 + arrowL * 0.4,
    centreY,
    left + 4 + arrowL,
    centreY - arrowL * 0.55,
    left + 4 + arrowL,
    centreY + arrowL * 0.55,
  );
  graphics.fillTriangle(
    left + width - 4 - arrowL * 0.4,
    centreY,
    left + width - 4 - arrowL,
    centreY - arrowL * 0.55,
    left + width - 4 - arrowL,
    centreY + arrowL * 0.55,
  );

  // Motion streaks above and below the rail, length seeded by id.
  const streak = Math.round((width - 16) * (0.4 + hashUnit(hash, 52) * 0.35));
  graphics.fillStyle(railLit, 0.4);
  graphics.fillRect(left + 8, centreY - 8, streak, 1);
  graphics.fillRect(left + width - 8 - streak, centreY + 7, streak, 1);
}

/** Pixel glyphs for the multiplier plate: a "×2" stamp in a 5x7 grid. */
const GLYPH_TWO = ['01110', '10001', '00001', '00110', '01000', '10000', '11111'];
const GLYPH_X = ['00000', '10001', '01010', '00100', '01010', '10001', '00000'];

function drawPixelGlyph(
  graphics: Phaser.GameObjects.Graphics,
  pattern: readonly string[],
  originX: number,
  originY: number,
  scale: number,
): number {
  const glyphWidth = (pattern[0]?.length ?? 0) * scale;
  for (let row = 0; row < pattern.length; row += 1) {
    const line = pattern[row]!;
    for (let col = 0; col < line.length; col += 1) {
      if (line[col] === '1') {
        graphics.fillRect(originX + col * scale, originY + row * scale, scale, scale);
      }
    }
  }
  return glyphWidth;
}

/** Multiplier: golden score plate with a bold "×2" stamp. */
function drawMultiplier(
  graphics: Phaser.GameObjects.Graphics,
  block: Block,
  palette: BlockPalette,
  hash: number,
): void {
  const left = block.left;
  const top = block.top;
  const width = block.width;
  const height = block.height;
  const gold = blend(0xffd84d, 0xfff2c4, 0.3);

  // Sunken gold plate with a lit top edge.
  graphics.fillStyle(blend(palette.body, 0x2a1e03, 0.5), 0.95);
  graphics.fillPoints(steppedRect(left + 3, top + 3, width - 6, height - 6, 0, 5), true);
  graphics.fillStyle(blend(gold, 0x7a5708, 0.28), 0.92);
  graphics.fillPoints(steppedRect(left + 5, top + 5, width - 10, height - 10, 0, 4), true);
  graphics.fillStyle(0xfff8d8, 0.45);
  graphics.fillRect(left + 5, top + 5, width - 10, 1);

  // Deterministic gleam streak on the plate.
  const gleamX = Math.round(left + 8 + hashUnit(hash, 60) * (width - 20));
  graphics.fillStyle(0xffffff, 0.2);
  graphics.fillRect(gleamX, top + 7, 1, height - 16);

  // "×2" stamp: dark ink with a light emboss, centred. Stamp size steps up or
  // down by one pixel per block, like individually pressed plates.
  const glyphHeight = 7;
  const scale = Math.max(
    2,
    Math.floor(Math.min(width * 0.72, height * 0.62) / glyphHeight) +
      (hashUnit(hash, 61) > 0.5 ? 1 : 0),
  );
  const glyphWidth = 5 * scale;
  const gap = Math.max(2, Math.round(scale * 0.8));
  const totalWidth = glyphWidth * 2 + gap;
  const originX = Math.round(left + (width - totalWidth) / 2);
  const originY = Math.round(top + (height - glyphHeight * scale) / 2);
  graphics.fillStyle(0x3a2600, 0.5);
  drawPixelGlyph(graphics, GLYPH_X, originX + 1, originY + 1, scale);
  drawPixelGlyph(graphics, GLYPH_TWO, originX + glyphWidth + gap + 1, originY + 1, scale);
  graphics.fillStyle(0x201400, 0.95);
  drawPixelGlyph(graphics, GLYPH_X, originX, originY, scale);
  drawPixelGlyph(graphics, GLYPH_TWO, originX + glyphWidth + gap, originY, scale);

  // Corner sparkle on the plate.
  graphics.fillStyle(0xffffff, 0.8);
  graphics.fillRect(left + width - 9, top + 6, 1, 3);
  graphics.fillRect(left + width - 10, top + 7, 3, 1);
}

/** Generator: notched gear ring around a luminous portal core. */
function drawGenerator(
  graphics: Phaser.GameObjects.Graphics,
  block: Block,
  palette: BlockPalette,
  accent: number,
  hash: number,
): void {
  const left = block.left;
  const top = block.top;
  const width = block.width;
  const height = block.height;
  const centreX = left + width / 2;
  const centreY = top + height / 2;
  const radius = Math.min(width, height) * 0.32;
  const metal = blend(palette.body, 0x1a1030, 0.3);
  const lit = blend(palette.body, 0xffffff, 0.45);

  // Dark socket, kept purple-tinted and inset so the tile frame still shows.
  graphics.fillStyle(0x140a24, 0.92);
  graphics.fillPoints(steppedRect(left + 5, top + 5, width - 10, height - 10, 0, 4), true);

  // Gear teeth: eight studs around the ring, one rotation per block.
  const tooth = Math.max(3, Math.round(radius * 0.32));
  const spin = hashUnit(hash, 70) * 0.3;
  graphics.fillStyle(metal, 1);
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2 + spin;
    const tx = Math.round(centreX + Math.cos(angle) * (radius + tooth * 0.45));
    const ty = Math.round(centreY + Math.sin(angle) * (radius + tooth * 0.45));
    graphics.fillRect(tx - tooth / 2, ty - tooth / 2, tooth, tooth);
  }

  // Ring body with light and accent edges.
  graphics.lineStyle(Math.max(2, Math.round(radius * 0.28)), metal, 1);
  graphics.strokeCircle(centreX, centreY, radius);
  graphics.lineStyle(1, lit, 0.55);
  graphics.strokeCircle(centreX, centreY, radius + 2);
  graphics.lineStyle(1, blend(accent, 0xffffff, 0.35), 0.6);
  graphics.strokeCircle(centreX, centreY, radius - 3);

  // Spokes, rotated per block so no two gears mesh at the same angle.
  graphics.lineStyle(1, metal, 0.85);
  const spokeBase = hashUnit(hash, 71) * Math.PI * 0.5;
  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * Math.PI * 2 + spokeBase;
    graphics.lineBetween(
      Math.round(centreX + Math.cos(angle) * radius * 0.3),
      Math.round(centreY + Math.sin(angle) * radius * 0.3),
      Math.round(centreX + Math.cos(angle) * radius * 0.82),
      Math.round(centreY + Math.sin(angle) * radius * 0.82),
    );
  }

  // Portal core, sized per block.
  const coreR = radius * (0.2 + hashUnit(hash, 72) * 0.07);
  graphics.fillStyle(accent, 0.16);
  graphics.fillCircle(centreX, centreY, radius * 0.8);
  graphics.fillStyle(blend(accent, 0xffffff, 0.35), 0.5);
  graphics.fillCircle(centreX, centreY, coreR * 2);
  graphics.fillStyle(0x0a0518, 0.9);
  graphics.fillCircle(centreX, centreY, coreR);
  graphics.fillStyle(0xffffff, 0.95);
  graphics.fillCircle(centreX, centreY, Math.max(2, coreR * 0.45));
}

/** Linked: two interlocking chain links, a spark and corner studs. */
function drawLinked(
  graphics: Phaser.GameObjects.Graphics,
  block: Block,
  palette: BlockPalette,
  accent: number,
  hash: number,
): void {
  const left = block.left;
  const top = block.top;
  const width = block.width;
  const height = block.height;
  const centreX = left + width / 2;
  const centreY = top + height / 2;
  const rune = blend(palette.body, 0xffffff, 0.5);
  const dark = blend(palette.body, palette.deep, 0.5);
  const groupSalt = block.linkGroup ?? 0;
  // Chain direction follows the link group: even groups hang horizontal,
  // odd groups hang vertical, so linked waves read as grouped runs.
  const vertical = groupSalt % 2 === 1;

  // Dark inlay.
  graphics.fillStyle(dark, 0.75);
  graphics.fillPoints(steppedRect(left + 4, top + 4, width - 8, height - 8, 0, 6), true);

  // Two interlocking links drawn as stepped capsules.
  const linkWidth = Math.max(9, Math.round(width * 0.28));
  const linkHeight = vertical
    ? Math.max(12, Math.round(height * 0.4))
    : Math.max(7, Math.round(height * 0.34));
  for (let index = 0; index < 2; index += 1) {
    let linkX: number;
    let linkY: number;
    if (vertical) {
      linkX = Math.round(
        centreX - linkWidth / 2 + (index === 0 ? -width * 0.17 : width * 0.17) + (hashUnit(hash, 80 + index) - 0.5) * 2,
      );
      linkY = Math.round(centreY - linkHeight / 2);
    } else {
      linkX = Math.round(
        left + width * (0.2 + index * 0.3) + (hashUnit(hash, 80 + index) - 0.5) * 2,
      );
      linkY = Math.round(centreY - linkHeight / 2);
    }
    graphics.lineStyle(4, dark, 0.95);
    graphics.strokeRoundedRect(linkX, linkY, linkWidth, linkHeight, 4);
    graphics.lineStyle(2, rune, 0.95);
    graphics.strokeRoundedRect(linkX, linkY, linkWidth, linkHeight, 4);
    graphics.lineStyle(1, 0xffffff, 0.5);
    graphics.strokeRoundedRect(linkX + 1, linkY + 1, linkWidth - 2, linkHeight - 2, 3);
  }

  // Connection spark between the links, tinted by the phase.
  graphics.fillStyle(0xffffff, 0.85);
  graphics.fillRect(Math.round(centreX) - 1, Math.round(centreY) - 1, 2, 2);
  graphics.fillStyle(accent, 0.55);
  if (vertical) {
    graphics.fillRect(Math.round(centreX), Math.round(centreY) - 3, 1, 6);
  } else {
    graphics.fillRect(Math.round(centreX) - 3, Math.round(centreY), 6, 1);
  }

  // Corner studs; the lit pattern varies by link group.
  const inset = Math.max(4, Math.round(width * 0.12));
  const studs = [
    [left + inset, top + inset],
    [left + width - inset, top + inset],
    [left + inset, top + height - inset],
    [left + width - inset, top + height - inset],
  ] as const;
  for (let index = 0; index < studs.length; index += 1) {
    const [sx, sy] = studs[index]!;
    const lit = (index + groupSalt) % 2 === 0;
    graphics.fillStyle(lit ? rune : dark, lit ? 0.9 : 0.95);
    graphics.fillRect(Math.round(sx) - 1, Math.round(sy) - 1, 3, 3);
    if (lit) {
      graphics.fillStyle(0xffffff, 0.7);
      graphics.fillRect(Math.round(sx), Math.round(sy), 1, 1);
    }
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
    const seed = hashUnit(hash, 100 + index * 11);
    const fromLeft = seed > 0.5;
    const startX = fromLeft
      ? left + 3
      : left + width * (0.35 + hashUnit(hash, 102 + index * 11) * 0.3);
    const startY = top + height * (0.16 + hashUnit(hash, 101 + index * 11) * 0.28);
    const points: Point[] = [{ x: startX, y: startY }];
    let x = startX;
    let y = startY;
    const segments = 4;
    for (let segment = 1; segment <= segments; segment += 1) {
      x += (fromLeft ? 1 : -1) * (3 + hashUnit(hash, 110 + index * 11 + segment) * 5);
      y += (height * 0.5) / segments;
      points.push({ x: Math.round(x), y: Math.round(y) });
    }
    // Impact chip where the crack enters the tile.
    const dir = fromLeft ? 1 : -1;
    graphics.fillStyle(0x04060b, 0.92);
    graphics.fillTriangle(
      Math.round(startX) + dir * 2,
      Math.round(startY) - 1,
      Math.round(startX) - dir * 3,
      Math.round(startY) + 2,
      Math.round(startX) + dir * 1,
      Math.round(startY) + 5,
    );
    // Dark core plus a light lower edge so cracks survive grayscale.
    graphics.lineStyle(2, 0x04060b, 0.85);
    graphics.strokePoints(points, false);
    graphics.lineStyle(1, 0xffffff, 0.35);
    const shifted = points.map((point) => ({ x: point.x + 1, y: point.y + 1 }));
    graphics.strokePoints(shifted, false);
  }
}

/** Gem colour for filled HP pips, matched to each material family. */
function pipGemColor(type: BlockTypeId, accent: number): number {
  switch (type) {
    case 'crystal':
      return blend(0xd8fbff, accent, 0.3);
    case 'stone':
      return 0xf0e6ff;
    case 'obsidian':
      return blend(0xff9df0, accent, 0.4);
    default:
      return blend(BLOCK_TYPES[type].color, 0xffffff, 0.4);
  }
}

/**
 * HP pips as faceted gems on a small dark plate (bottom-left corner), so they
 * stay readable on every material including the bright crystal body.
 */
function drawHpPips(
  graphics: Phaser.GameObjects.Graphics,
  block: Block,
  accent: number,
): void {
  const width = block.width;
  const size = Math.max(6, Math.min(8, Math.round(width * 0.14)));
  const gap = 2;
  const total = Math.min(3, Math.max(1, block.maxHp));
  const plateWidth = total * (size + gap) + 3;
  const x0 = block.left + 5;
  const y0 = block.top + block.height - size - 5;

  // Recessed plate with a lit top edge and shaded bottom.
  graphics.fillStyle(0x02040c, 0.78);
  graphics.fillPoints(steppedRect(x0 - 2, y0 - 2, plateWidth, size + 4, 0, 2), true);
  graphics.fillStyle(0xffffff, 0.14);
  graphics.fillRect(x0 - 1, y0 - 1, plateWidth - 2, 1);
  graphics.fillStyle(0x000000, 0.4);
  graphics.fillRect(x0 - 1, y0 + size + 1, plateWidth - 2, 1);

  for (let index = 0; index < total; index += 1) {
    const x = x0 + index * (size + gap);
    const diamond = [
      { x: x + size / 2, y: y0 },
      { x: x + size, y: y0 + size / 2 },
      { x: x + size / 2, y: y0 + size },
      { x, y: y0 + size / 2 },
    ];
    if (index < block.hp) {
      const gem = pipGemColor(block.type, accent);
      // Faceted gem: bright diamond with a shaded lower-right half.
      graphics.fillStyle(gem, 0.98);
      graphics.fillPoints(diamond, true);
      graphics.fillStyle(blend(gem, 0x060a12, 0.45), 0.65);
      graphics.fillTriangle(
        x + size / 2,
        y0 + size / 2,
        x + size,
        y0 + size / 2,
        x + size / 2,
        y0 + size,
      );
      graphics.fillStyle(0xffffff, 0.95);
      graphics.fillRect(x + Math.round(size * 0.28), y0 + 1, 2, 1);
      graphics.lineStyle(1, 0xffffff, 0.5);
      graphics.strokePoints(diamond, true);
    } else {
      // Empty socket: a visible engraving, not a blank square.
      graphics.fillStyle(0x0a0c16, 0.92);
      graphics.fillRect(x + 1, y0 + 1, size - 2, size - 2);
      graphics.lineStyle(1, 0xffffff, 0.3);
      graphics.strokePoints(diamond, true);
    }
  }
}
