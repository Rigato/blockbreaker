import type Phaser from 'phaser';
import type { Block } from '../sim/World';
import { BLOCK_TYPES } from '../sim/blocks';

/**
 * Procedural pixel-art block rendering.
 *
 * Each block type owns a distinct silhouette and interior pattern so the grid
 * stays readable in grayscale: crystal facets, stone masonry and obsidian
 * angular runes. Damage adds deterministic cracks plus explicit HP pips.
 */

const CRYSTAL_LIGHT = 0xd8fbff;
const CRYSTAL_MID = 0x8cf3ff;
const STONE_MORTAR = 0x1d1730;
const OBSIDIAN_RUNE = 0xffd6f7;

function hashId(id: string): number {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export interface BlockDrawOptions {
  /** 0..1 multiplier used by the phase tint; 1 keeps the type colour. */
  tint?: number;
}

export function drawBlock(
  graphics: Phaser.GameObjects.Graphics,
  block: Block,
  options: BlockDrawOptions = {},
): void {
  const tint = options.tint ?? 1;
  const type = BLOCK_TYPES[block.type];
  const baseColor = blend(type.color, 0x0b0a14, 1 - tint);
  const left = block.left;
  const top = block.top;
  const width = block.width;
  const height = block.height;
  const flash = block.flashMs > 0;

  // Drop shadow keeps the grid readable against every backdrop.
  graphics.fillStyle(0x02040a, 0.55);
  graphics.fillRect(left + 3, top + 4, width, height);

  // Outer silhouette.
  graphics.fillStyle(0x05070f, 0.95);
  graphics.fillRoundedRect(left - 1, top - 1, width + 2, height + 2, 5);
  graphics.fillStyle(baseColor, block.type === 'obsidian' ? 0.96 : 0.9);
  graphics.fillRoundedRect(left, top, width, height, 4);

  // Common bevel: bright top/left edge, dark bottom/right edge.
  graphics.fillStyle(0xffffff, block.type === 'stone' ? 0.18 : 0.28);
  graphics.fillRect(left + 2, top + 2, width - 4, 3);
  graphics.fillRect(left + 2, top + 2, 3, height - 4);
  graphics.fillStyle(0x000000, 0.28);
  graphics.fillRect(left + 2, top + height - 5, width - 4, 3);
  graphics.fillRect(left + width - 5, top + 2, 3, height - 4);

  if (block.type === 'crystal') {
    drawCrystalFacets(graphics, left, top, width, height);
  } else if (block.type === 'stone') {
    drawStoneBricks(graphics, left, top, width, height);
  } else {
    drawObsidianRunes(graphics, left, top, width, height, block.id);
  }

  drawDamageCracks(graphics, block);

  if (flash) {
    const strength = Math.min(1, block.flashMs / 80);
    graphics.fillStyle(0xffffff, 0.28 + strength * 0.5);
    graphics.fillRoundedRect(left, top, width, height, 4);
  }

  drawHpPips(graphics, block);
}

function drawCrystalFacets(
  graphics: Phaser.GameObjects.Graphics,
  left: number,
  top: number,
  width: number,
  height: number,
): void {
  const centreX = left + width / 2;
  // A large central facet plus two shoulder facets.
  graphics.fillStyle(CRYSTAL_MID, 0.5);
  graphics.fillTriangle(centreX, top + 5, left + 7, top + height - 6, centreX, top + height - 6);
  graphics.fillStyle(CRYSTAL_LIGHT, 0.42);
  graphics.fillTriangle(centreX, top + 5, centreX, top + height - 6, left + width - 7, top + height - 6);
  graphics.lineStyle(1, 0x083b46, 0.75);
  graphics.lineBetween(centreX, top + 6, centreX, top + height - 6);
  graphics.lineBetween(centreX, top + 6, left + 8, top + height - 7);
  graphics.lineBetween(centreX, top + 6, left + width - 8, top + height - 7);
  // Top glint.
  graphics.fillStyle(0xffffff, 0.85);
  graphics.fillRect(left + 5, top + 5, 4, 2);
  graphics.fillRect(left + 5, top + 5, 2, 5);
}

function drawStoneBricks(
  graphics: Phaser.GameObjects.Graphics,
  left: number,
  top: number,
  width: number,
  height: number,
): void {
  const rows = 2;
  const rowHeight = height / rows;
  graphics.lineStyle(2, STONE_MORTAR, 0.85);
  for (let row = 0; row < rows; row += 1) {
    const y = Math.round(top + row * rowHeight);
    graphics.lineBetween(left + 2, y, left + width - 2, y);
    const offset = row % 2 === 0 ? width * 0.36 : width * 0.64;
    const x = Math.round(left + offset);
    graphics.lineBetween(x, y, x, Math.round(y + rowHeight));
  }
  // Thick inner border reads as masonry even without colour.
  graphics.lineStyle(2, 0x0a0812, 0.55);
  graphics.strokeRoundedRect(left + 3, top + 3, width - 6, height - 6, 3);
  // Brick highlights.
  graphics.fillStyle(0xffffff, 0.14);
  graphics.fillRect(left + 5, top + Math.round(rowHeight) + 2, width * 0.22, 2);
  graphics.fillRect(left + width * 0.58, top + Math.round(rowHeight) + 2, width * 0.24, 2);
}

function drawObsidianRunes(
  graphics: Phaser.GameObjects.Graphics,
  left: number,
  top: number,
  width: number,
  height: number,
  id: string,
): void {
  const hash = hashId(id);
  const centreX = left + width / 2;
  const centreY = top + height / 2;

  // Double border.
  graphics.lineStyle(1, 0x000000, 0.65);
  graphics.strokeRoundedRect(left + 3, top + 3, width - 6, height - 6, 3);
  graphics.lineStyle(1, OBSIDIAN_RUNE, 0.35);
  graphics.strokeRoundedRect(left + 5, top + 5, width - 10, height - 10, 2);

  // Angular sigil: deterministic zigzag through the block centre.
  const spanX = Math.max(6, width * 0.22);
  const spanY = Math.max(5, height * 0.2);
  // Alternate chevrons: some blocks point up, others down, but never flatten.
  const flip = hash % 2 === 0 ? 1 : -1;
  const tipY = centreY - spanY * flip;
  const edgeY = centreY + spanY * flip;
  graphics.lineStyle(2, OBSIDIAN_RUNE, 0.85);
  graphics.lineBetween(centreX - spanX, edgeY, centreX, tipY);
  graphics.lineBetween(centreX, tipY, centreX + spanX, edgeY);
  graphics.lineBetween(centreX, tipY, centreX, tipY - 5 * flip);
  // Small corner ticks.
  graphics.fillStyle(OBSIDIAN_RUNE, 0.55);
  graphics.fillRect(left + 6, top + 6, 3, 3);
  graphics.fillRect(left + width - 9, top + height - 9, 3, 3);
  // Faceted dark glints.
  graphics.fillStyle(0xffffff, 0.1);
  graphics.fillTriangle(left + 4, top + 4, left + width * 0.55, top + 4, left + 4, top + height * 0.45);
}

function drawDamageCracks(graphics: Phaser.GameObjects.Graphics, block: Block): void {
  const damage = Math.max(0, block.maxHp - block.hp);
  if (damage === 0) return;
  const hash = hashId(block.id);
  const width = block.width;
  const height = block.height;
  for (let index = 0; index < damage; index += 1) {
    const seed = (hash >> (index * 5)) & 0xff;
    const startX = block.left + 6 + (seed / 255) * (width - 12);
    const startY = block.top + 4;
    const midX = block.left + 6 + (((seed >> 2) & 0xff) / 255) * (width - 12);
    const midY = block.top + height * 0.52;
    const endX = block.left + 6 + (((seed >> 4) & 0xff) / 255) * (width - 12);
    const endY = block.top + height - 5;
    graphics.lineStyle(2, 0x05070c, 0.8);
    graphics.lineBetween(startX, startY, midX, midY);
    graphics.lineBetween(midX, midY, endX, endY);
    graphics.lineStyle(1, 0xffffff, 0.22);
    graphics.lineBetween(startX + 1, startY + 1, midX + 1, midY + 1);
  }
}

function drawHpPips(graphics: Phaser.GameObjects.Graphics, block: Block): void {
  const pipSize = Math.max(4, Math.round(block.width * 0.07));
  const gap = 3;
  const total = Math.min(3, Math.max(1, block.maxHp));
  const startX = block.left + 6;
  const y = block.top + block.height - pipSize - 5;
  graphics.fillStyle(0x05070f, 0.7);
  graphics.fillRect(startX - 2, y - 2, total * (pipSize + gap) + 1, pipSize + 4);
  for (let index = 0; index < total; index += 1) {
    const x = startX + index * (pipSize + gap);
    if (index < block.hp) {
      graphics.fillStyle(0xffffff, 0.92);
      graphics.fillRect(x, y, pipSize, pipSize);
      graphics.fillStyle(0x0a0a12, 0.6);
      graphics.fillRect(x + pipSize - 2, y + pipSize - 2, 2, 2);
    } else {
      graphics.lineStyle(1, 0xffffff, 0.4);
      graphics.strokeRect(x + 0.5, y + 0.5, pipSize - 1, pipSize - 1);
    }
  }
}

function blend(from: number, to: number, amount: number): number {
  const t = Math.max(0, Math.min(1, amount));
  const r = Math.round(((from >> 16) & 0xff) * (1 - t) + ((to >> 16) & 0xff) * t);
  const g = Math.round(((from >> 8) & 0xff) * (1 - t) + ((to >> 8) & 0xff) * t);
  const b = Math.round((from & 0xff) * (1 - t) + (to & 0xff) * t);
  return (r << 16) | (g << 8) | b;
}
