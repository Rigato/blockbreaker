#!/usr/bin/env node
/**
 * Generates the Bricklike v0.6.1 store covers as original SVG artwork, then
 * rasterises them at the exact portal sizes with Playwright's Chromium.
 *
 *   node store/covers/generate-covers.mjs
 *
 * The artwork reuses the game's current visual language: square "arcade tile"
 * crystal blocks with bevelled corners, HP gem pips, a teal/violet field,
 * glowing balls with trails, the cyan paddle and the Silkscreen title. It is a
 * composed key-art piece, not a screenshot. The only text is BRICKLIKE.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../..');
const fontBase64 = (await readFile(join(repo, 'src/assets/fonts/Silkscreen-Bold.ttf'))).toString(
  'base64',
);

const SIZES = {
  landscape: { w: 1920, h: 1080, title: 178, titleY: 232, tracking: 10 },
  portrait: { w: 800, h: 1200, title: 94, titleY: 196, tracking: 6 },
  portraitTall: { w: 1080, h: 1920, title: 120, titleY: 326, tracking: 8 },
  square: { w: 800, h: 800, title: 90, titleY: 176, tracking: 6 },
};

/**
 * Material palettes: light, body-light, body-mid, deep shade, outline.
 * The values follow the in-game block families (crystal, stone/obsidian,
 * multiplier gold, regenerative green, explosive orange, linked magenta).
 */
const PALETTE = {
  cyan: ['#e6feff', '#9cf6ff', '#38cfe8', '#0b4a5e', '#04141d'],
  teal: ['#d8fff8', '#7ef9e2', '#25b9b0', '#0b4a48', '#041a1a'],
  violet: ['#f0ddff', '#c39cff', '#7a4cc0', '#2a1447', '#10061f'],
  magenta: ['#ffd8f5', '#ff8fe4', '#d43a9e', '#5c0e3e', '#1e0416'],
  gold: ['#fff6d6', '#ffe59a', '#e0a62a', '#5a3508', '#1e1002'],
  green: ['#d8ffe7', '#8dffb8', '#2fbf78', '#0b3a22', '#03140c'],
  orange: ['#ffe8c8', '#ffc06b', '#e06a1e', '#5a1a06', '#1e0703'],
};

function steppedRect(x, y, w, h, step = 12) {
  const l = Math.round(x);
  const t = Math.round(y);
  const r = Math.round(x + w);
  const b = Math.round(y + h);
  const maxStep = Math.max(2, Math.floor(Math.min(w, h) / 4));
  const s = Math.max(2, Math.min(Math.round(step), maxStep));
  const half = Math.max(1, Math.floor(s / 2));
  const rest = s - half;
  return [
    `M${l + s} ${t}`,
    `H${r - s}`, `V${t + half}`, `H${r - rest}`, `V${t + s}`, `H${r}`,
    `V${b - s}`, `H${r - half}`, `V${b - rest}`, `H${r - s}`, `V${b}`,
    `H${l + s}`, `V${b - half}`, `H${l + rest}`, `V${b - s}`, `H${l}`,
    `V${t + s}`, `H${l + half}`, `V${t + rest}`, `H${l + s}`, 'Z',
  ].join(' ');
}

function lcg(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function facetMarkup(x, y, s, palette, seed) {
  const [light, bodyLight, bodyMid, deep] = PALETTE[palette];
  const rand = lcg(seed * 97 + 13);
  const variant = Math.floor(rand() * 3);
  const inner = s * 0.06;
  const cx = x + s / 2;
  const cy = y + s / 2;

  if (palette === 'violet') {
    // Obsidian / rune-cut stone: dark planes and a bright diamond sigil.
    return `
      <path d="M${x + inner} ${y + inner} L${x + s * 0.46} ${y + s * 0.22} L${x + s * 0.46} ${y + s - inner} L${x + inner} ${y + s - inner} Z" fill="${bodyLight}" opacity=".13"/>
      <path d="M${x + s - inner} ${y + s * 0.18} L${x + s - inner} ${y + s - inner} L${x + s * 0.42} ${y + s - inner} Z" fill="${deep}" opacity=".44"/>
      <path d="M${cx} ${cy - s * 0.23} L${cx + s * 0.2} ${cy} L${cx} ${cy + s * 0.23} L${cx - s * 0.2} ${cy} Z" fill="${bodyLight}" opacity=".18"/>
      <path d="M${cx} ${cy - s * 0.16} L${cx + s * 0.13} ${cy} L${cx} ${cy + s * 0.16} L${cx - s * 0.13} ${cy} Z" fill="none" stroke="${light}" stroke-width="${Math.max(2, s * 0.018)}" opacity=".9"/>
      <rect x="${cx - s * 0.018}" y="${cy - s * 0.018}" width="${s * 0.036}" height="${s * 0.036}" fill="#ffffff" opacity=".95"/>`;
  }

  if (palette === 'gold') {
    // Multiplier plate: sunken gold face with a cut diamond stamp.
    return `
      <path d="${steppedRect(x + s * 0.08, y + s * 0.08, s * 0.84, s * 0.84, s * 0.09)}" fill="${deep}" opacity=".55"/>
      <path d="${steppedRect(x + s * 0.115, y + s * 0.115, s * 0.77, s * 0.77, s * 0.08)}" fill="${bodyMid}" opacity=".72"/>
      <path d="M${x + s * 0.14} ${y + s * 0.14} H${x + s * 0.86}" stroke="${light}" stroke-width="${Math.max(2, s * 0.02)}" opacity=".5"/>
      <path d="M${cx} ${cy - s * 0.24} L${cx + s * 0.22} ${cy} L${cx} ${cy + s * 0.24} L${cx - s * 0.22} ${cy} Z" fill="${bodyLight}" opacity=".55"/>
      <path d="M${cx} ${cy - s * 0.15} L${cx + s * 0.14} ${cy} L${cx} ${cy + s * 0.15} L${cx - s * 0.14} ${cy} Z" fill="${deep}" opacity=".65"/>
      <rect x="${cx - s * 0.024}" y="${cy - s * 0.024}" width="${s * 0.048}" height="${s * 0.048}" fill="#ffffff" opacity=".9"/>`;
  }

  if (palette === 'green') {
    // Regenerative: a bright healing plus over a living belly.
    return `
      <path d="${steppedRect(x + s * 0.1, y + s * 0.1, s * 0.8, s * 0.8, s * 0.1)}" fill="${deep}" opacity=".5"/>
      <path d="M${cx - s * 0.24} ${cy - s * 0.07} H${cx + s * 0.24} V${cy + s * 0.07} H${cx - s * 0.24} Z" fill="${bodyLight}" opacity=".82"/>
      <path d="M${cx - s * 0.07} ${cy - s * 0.24} H${cx + s * 0.07} V${cy + s * 0.24} H${cx - s * 0.07} Z" fill="${bodyLight}" opacity=".82"/>
      <rect x="${cx - s * 0.025}" y="${cy - s * 0.025}" width="${s * 0.05}" height="${s * 0.05}" fill="#ffffff" opacity=".95"/>
      <circle cx="${x + s * 0.25}" cy="${y + s * 0.28}" r="${s * 0.025}" fill="${light}" opacity=".8"/>
      <circle cx="${x + s * 0.74}" cy="${y + s * 0.7}" r="${s * 0.018}" fill="${light}" opacity=".65"/>`;
  }

  if (palette === 'orange') {
    // Explosive crate: hazard cuts and a molten core.
    return `
      <path d="${steppedRect(x + s * 0.09, y + s * 0.09, s * 0.82, s * 0.82, s * 0.08)}" fill="${deep}" opacity=".68"/>
      <path d="M${x + s * 0.15} ${y + s * 0.4} L${x + s * 0.32} ${y + s * 0.15} L${x + s * 0.43} ${y + s * 0.15} L${x + s * 0.26} ${y + s * 0.4} Z" fill="${bodyLight}" opacity=".55"/>
      <path d="M${x + s * 0.45} ${y + s * 0.4} L${x + s * 0.62} ${y + s * 0.15} L${x + s * 0.73} ${y + s * 0.15} L${x + s * 0.56} ${y + s * 0.4} Z" fill="${bodyLight}" opacity=".55"/>
      <circle cx="${cx}" cy="${cy + s * 0.07}" r="${s * 0.19}" fill="${deep}" opacity=".9"/>
      <circle cx="${cx}" cy="${cy + s * 0.07}" r="${s * 0.13}" fill="none" stroke="${bodyLight}" stroke-width="${Math.max(2, s * 0.025)}" opacity=".95"/>
      <circle cx="${cx}" cy="${cy + s * 0.07}" r="${s * 0.06}" fill="#ffffff" opacity=".95"/>`;
  }

  if (palette === 'magenta') {
    // Linked: two interlocking cut links over a dark inlay.
    return `
      <path d="${steppedRect(x + s * 0.09, y + s * 0.09, s * 0.82, s * 0.82, s * 0.08)}" fill="${deep}" opacity=".56"/>
      <rect x="${cx - s * 0.23}" y="${cy - s * 0.09}" width="${s * 0.28}" height="${s * 0.18}" rx="${s * 0.07}" fill="none" stroke="${bodyLight}" stroke-width="${Math.max(2, s * 0.035)}" opacity=".9"/>
      <rect x="${cx - s * 0.05}" y="${cy - s * 0.09}" width="${s * 0.28}" height="${s * 0.18}" rx="${s * 0.07}" fill="none" stroke="${light}" stroke-width="${Math.max(2, s * 0.028)}" opacity=".8"/>
      <rect x="${cx - s * 0.018}" y="${cy - s * 0.018}" width="${s * 0.036}" height="${s * 0.036}" fill="#ffffff" opacity=".95"/>`;
  }

  // Crystal: three deterministic facet cuts.
  if (variant === 0) {
    const split = x + s * (0.4 + rand() * 0.18);
    return `
      <path d="M${x + inner} ${y + inner} L${x + s * 0.58} ${y + inner} L${split} ${y + s - inner} Z" fill="${light}" opacity=".34"/>
      <path d="M${x + s - inner} ${y + inner} L${x + s * 0.56} ${y + inner} L${split} ${y + s - inner} Z" fill="${deep}" opacity=".3"/>
      <rect x="${split}" y="${y + inner}" width="${Math.max(1.5, s * 0.012)}" height="${s - inner * 2}" fill="${light}" opacity=".75"/>`;
  }
  if (variant === 1) {
    const split = y + s * (0.4 + rand() * 0.18);
    return `
      <path d="M${x + inner} ${y + inner} H${x + s - inner} V${split} H${x + inner} Z" fill="${light}" opacity=".3"/>
      <path d="M${x + inner} ${split} H${x + s - inner} V${y + s - inner} H${x + inner} Z" fill="${deep}" opacity=".32"/>
      <rect x="${x + inner}" y="${split}" width="${s - inner * 2}" height="${Math.max(1.5, s * 0.012)}" fill="${light}" opacity=".7"/>`;
  }
  const up = rand() > 0.5;
  return `
    <path d="M${x + inner} ${up ? y + inner : y + s - inner} L${x + s - inner} ${up ? y + s - inner : y + inner} L${x + inner} ${up ? y + s - inner : y + inner} Z" fill="${light}" opacity=".3"/>
    <path d="M${x + s - inner} ${up ? y + s - inner : y + inner} L${x + s - inner} ${up ? y + inner : y + s - inner} L${x + inner} ${up ? y + s - inner : y + inner} Z" fill="${deep}" opacity=".34"/>`;
}

function pips(x, y, s, palette, count) {
  const [light] = PALETTE[palette];
  const size = Math.max(5, s * 0.062);
  const gap = Math.max(2, size * 0.42);
  const plateW = count * size + (count - 1) * gap + size * 0.65;
  const plateH = size + size * 0.55;
  const px = x + s * 0.065;
  const py = y + s - plateH - s * 0.06;
  let out = `<path d="${steppedRect(px - size * 0.25, py - size * 0.2, plateW, plateH, Math.max(2, size * 0.35))}" fill="#02040c" opacity=".72"/>`;
  for (let index = 0; index < count; index += 1) {
    const cx = px + size / 2 + index * (size + gap);
    const cy = py + plateH / 2;
    out += `<path d="M${cx} ${cy - size / 2} L${cx + size / 2} ${cy} L${cx} ${cy + size / 2} L${cx - size / 2} ${cy} Z" fill="${light}" opacity=".9"/>`;
    out += `<path d="M${cx} ${cy} L${cx + size / 2} ${cy} L${cx} ${cy + size / 2} Z" fill="${PALETTE[palette][3]}" opacity=".55"/>`;
    out += `<rect x="${cx - size * 0.22}" y="${cy - size * 0.28}" width="${size * 0.16}" height="${size * 0.1}" fill="#ffffff" opacity=".9"/>`;
  }
  return out;
}

function sparkle(cx, cy, size, color = '#ffffff', opacity = 0.9) {
  return `
    <path d="M${cx} ${cy - size} L${cx + size * 0.18} ${cy - size * 0.18} L${cx + size} ${cy} L${cx + size * 0.18} ${cy + size * 0.18} L${cx} ${cy + size} L${cx - size * 0.18} ${cy + size * 0.18} L${cx - size} ${cy} L${cx - size * 0.18} ${cy - size * 0.18} Z" fill="${color}" opacity="${opacity}"/>`;
}

function crack(cx, cy, s, seed) {
  const rand = lcg(seed * 41 + 7);
  let x = cx - s * 0.42;
  let y = cy - s * 0.28;
  let path = `M${x} ${y}`;
  for (let index = 0; index < 5; index += 1) {
    x += s * (0.08 + rand() * 0.07);
    y += s * (0.08 + rand() * 0.08);
    path += ` L${x} ${y}`;
  }
  return `
    <path d="${path}" fill="none" stroke="#04060b" stroke-width="${Math.max(2, s * 0.022)}" opacity=".85"/>
    <path d="${path}" fill="none" stroke="#ffffff" stroke-width="${Math.max(1, s * 0.008)}" opacity=".3" transform="translate(1 1)"/>`;
}

function block(x, y, s, palette, seed, options = {}) {
  const [light, bodyLight, bodyMid, deep, outline] = PALETTE[palette];
  const step = Math.max(8, Math.round(s * 0.13));
  const body = steppedRect(x, y, s, s, step);
  const inner = steppedRect(x + 3, y + 3, s - 6, s - 6, step - 1);
  const bevel = Math.max(3, Math.round(s * 0.045));
  const tone = ((seed % 7) - 3) * 0.015;
  const pipsCount = options.pips ?? 1 + (seed % 3);
  const damaged = options.damaged === true;

  return `
  <g>
    <path d="${steppedRect(x + s * 0.045, y + s * 0.075, s, s, step)}" fill="#01040e" opacity=".48"/>
    <path d="${steppedRect(x - 3, y - 3, s + 6, s + 6, step + 2)}" fill="${outline}" opacity=".98"/>
    <path d="${body}" fill="url(#${palette}Body)"/>
    <path d="${body}" fill="${tone >= 0 ? '#ffffff' : '#000000'}" opacity="${Math.abs(tone).toFixed(3)}"/>
    <path d="${inner}" fill="${deep}" opacity=".16"/>
    ${facetMarkup(x, y, s, palette, seed)}
    <path d="M${x + step} ${y + 2} H${x + s - step}" stroke="${light}" stroke-width="${bevel}" opacity=".44"/>
    <path d="M${x + 2} ${y + step} V${y + s - step}" stroke="${light}" stroke-width="${bevel}" opacity=".3"/>
    <path d="M${x + step} ${y + s - 2} H${x + s - step}" stroke="#000000" stroke-width="${bevel}" opacity=".28"/>
    <path d="M${x + s - 2} ${y + step} V${y + s - step}" stroke="#000000" stroke-width="${bevel}" opacity=".24"/>
    <path d="M${x + step + 2} ${y + bevel + 2} H${x + s - step - 2}" stroke="#ffffff" stroke-width="1.4" opacity=".18"/>
    <path d="M${x + 2} ${y + step + 2} V${y + s - step - 2}" stroke="#ffffff" stroke-width="1.4" opacity=".12"/>
    <path d="M${x + step} ${y + 1} H${x + s - step}" stroke="${bodyLight}" stroke-width="1.5" opacity=".62"/>
    <path d="${steppedRect(x + s * 0.12, y + s * 0.12, s * 0.32, s * 0.22, step * 0.6)}" fill="#ffffff" opacity=".075"/>
    <path d="${body}" fill="none" stroke="${light}" stroke-width="1" opacity=".28"/>
    ${sparkle(x + s * 0.72, y + s * 0.2, s * 0.055, '#ffffff', 0.9)}
    ${pips(x, y, s, palette, pipsCount)}
    ${damaged ? crack(x + s * 0.52, y + s * 0.52, s, seed) : ''}
  </g>`;
}

function paddle(cx, cy, w, h) {
  const x = cx - w / 2;
  const y = cy - h / 2;
  const r = h * 0.35;
  return `
  <g filter="url(#paddleGlow)">
    <ellipse cx="${cx}" cy="${cy + h * 0.9}" rx="${w * 0.54}" ry="${h * 0.8}" fill="#35e6ff" opacity=".16"/>
    <rect x="${x + 3}" y="${y + 5}" width="${w}" height="${h}" rx="${r}" fill="#01040a" opacity=".55"/>
    <rect x="${x - 4}" y="${y - 3}" width="${w + 8}" height="${h + 6}" rx="${r + 3}" fill="#0a1a2c" opacity=".98"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#paddleBody)"/>
    <rect x="${x + 5}" y="${y + 2}" width="${w - 10}" height="${h * 0.38}" rx="${r * 0.7}" fill="#bffaff" opacity=".24"/>
    <rect x="${x + 8}" y="${y + 3}" width="${w - 16}" height="${Math.max(2, h * 0.09)}" rx="2" fill="#ffffff" opacity=".78"/>
    <rect x="${cx - 1}" y="${y + h * 0.42}" width="2" height="${h * 0.48}" fill="#2f6f9a" opacity=".9"/>
    <path d="M${x + 5} ${y + h * 0.32} L${x + w * 0.09} ${y + h * 0.32} L${x + w * 0.07} ${y + h * 0.92} Z" fill="#9dfff2" opacity=".95"/>
    <path d="M${x + w - 5} ${y + h * 0.32} L${x + w - w * 0.09} ${y + h * 0.32} L${x + w - w * 0.07} ${y + h * 0.92} Z" fill="#9dfff2" opacity=".95"/>
    <path d="M${cx} ${y + h * 0.16} L${cx + h * 0.24} ${y + h * 0.52} L${cx} ${y + h * 0.82} L${cx - h * 0.24} ${y + h * 0.52} Z" fill="#ffffff" opacity=".92"/>
  </g>`;
}

function quadratic(points, n) {
  const [p0, p1, p2] = points;
  const out = [];
  for (let index = 0; index <= n; index += 1) {
    const t = index / n;
    const u = 1 - t;
    out.push({
      x: u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
      y: u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
      t,
    });
  }
  return out;
}

function ballWithTrail(points, radius, color = '#7ef9ff') {
  const samples = quadratic(points, 44);
  const path = samples.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
  const trail = samples
    .slice(0, -1)
    .map((point, index) => {
      const ratio = index / Math.max(1, samples.length - 1);
      const r = radius * (0.28 + ratio * 0.52);
      return `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}" opacity="${(0.018 + ratio * 0.11).toFixed(3)}"/>`;
    })
    .join('');
  const last = samples[samples.length - 1];
  return `
  <g>
    <ellipse cx="${last.x}" cy="${last.y}" rx="${radius * 3.4}" ry="${radius * 3.4}" fill="${color}" opacity=".08"/>
    <path d="${path}" fill="none" stroke="${color}" stroke-width="${radius * 2.1}" stroke-linecap="round" opacity=".035" filter="url(#trailBlur)"/>
    ${trail}
    <circle cx="${last.x}" cy="${last.y}" r="${radius * 1.9}" fill="${color}" opacity=".14"/>
    <circle cx="${last.x}" cy="${last.y}" r="${radius}" fill="url(#ballBody)"/>
    <circle cx="${last.x - radius * 0.28}" cy="${last.y - radius * 0.3}" r="${radius * 0.38}" fill="#ffffff" opacity=".95"/>
    <circle cx="${last.x}" cy="${last.y}" r="${radius}" fill="none" stroke="#ffffff" stroke-width="${Math.max(1, radius * 0.08)}" opacity=".6"/>
  </g>`;
}

function motes(w, h, count, seed = 7) {
  const rand = lcg(seed);
  let out = '';
  for (let index = 0; index < count; index += 1) {
    const x = rand() * w;
    const y = rand() * h;
    const r = 1 + rand() * 3.6;
    const color = index % 5 === 0 ? '#ff9ee8' : index % 3 === 0 ? '#ffffff' : '#8cf3ff';
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}" opacity="${(0.1 + rand() * 0.35).toFixed(2)}"/>`;
  }
  return out;
}

function spires(w, h) {
  const base = h * 0.83;
  const left = [
    [0.02, 0.83, 0.1, 0.56],
    [0.1, 0.83, 0.07, 0.68],
    [0.17, 0.83, 0.12, 0.62],
  ];
  const right = [
    [0.83, 0.83, 0.1, 0.6],
    [0.9, 0.83, 0.07, 0.7],
    [0.96, 0.83, 0.1, 0.52],
  ];
  const poly = ([x, y, half, top]) => {
    const cx = x * w;
    const by = y * h;
    const hw = half * w;
    const ty = top * h;
    return `<path d="M${cx - hw} ${by} L${cx - hw * 0.45} ${ty + h * 0.06} L${cx} ${ty} L${cx + hw * 0.4} ${ty + h * 0.08} L${cx + hw} ${by} Z" fill="#03141a" opacity=".78"/>
      <path d="M${cx} ${ty} L${cx + hw * 0.4} ${ty + h * 0.08} L${cx + hw * 0.16} ${by} L${cx} ${by} Z" fill="#0a2b34" opacity=".22"/>`;
  };
  return `<g>${left.map(poly).join('')}${right.map(poly).join('')}</g>`;
}

function defs() {
  const paletteGradients = Object.entries(PALETTE)
    .map(
      ([name, [light, bodyLight, bodyMid, deep]]) => `
      <linearGradient id="${name}Body" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${light}"/>
        <stop offset=".18" stop-color="${bodyLight}"/>
        <stop offset=".62" stop-color="${bodyMid}"/>
        <stop offset="1" stop-color="${deep}"/>
      </linearGradient>`,
    )
    .join('');
  return `
  <defs>
    <style>@font-face{font-family:Silkscreen;src:url(data:font/ttf;base64,${fontBase64}) format('truetype');}</style>
    <linearGradient id="bgSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#061923"/>
      <stop offset=".48" stop-color="#04131d"/>
      <stop offset="1" stop-color="#02060d"/>
    </linearGradient>
    <radialGradient id="bgGlow" cx=".5" cy=".38" r=".62">
      <stop offset="0" stop-color="#12808a" stop-opacity=".5"/>
      <stop offset=".5" stop-color="#0a3b59" stop-opacity=".24"/>
      <stop offset="1" stop-color="#02060d" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="violetGlow" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#9a5cff" stop-opacity=".22"/>
      <stop offset="1" stop-color="#02060d" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="titleBody" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset=".44" stop-color="#d6fdff"/>
      <stop offset="1" stop-color="#6fe8ff"/>
    </linearGradient>
    <linearGradient id="paddleBody" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f2ffff"/>
      <stop offset=".34" stop-color="#7ef9ff"/>
      <stop offset=".72" stop-color="#2bb9e8"/>
      <stop offset="1" stop-color="#7a4cc0"/>
    </linearGradient>
    <radialGradient id="ballBody" cx=".36" cy=".32" r=".72">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset=".45" stop-color="#a8fff0"/>
      <stop offset="1" stop-color="#3ad9ff"/>
    </radialGradient>
    <radialGradient id="vignette" cx=".5" cy=".48" r=".76">
      <stop offset=".52" stop-color="#02060d" stop-opacity="0"/>
      <stop offset="1" stop-color="#02060d" stop-opacity=".8"/>
    </radialGradient>
    <pattern id="scan" width="6" height="6" patternUnits="userSpaceOnUse">
      <rect width="6" height="1.2" fill="#000000" opacity=".32"/>
    </pattern>
    <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="34"/>
    </filter>
    <filter id="ballGlow" x="-260%" y="-260%" width="620%" height="620%">
      <feGaussianBlur stdDeviation="8" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="paddleGlow" x="-140%" y="-200%" width="380%" height="500%">
      <feGaussianBlur stdDeviation="12" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="trailBlur" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="4"/>
    </filter>
    ${paletteGradients}
  </defs>`;
}

function title(w, size, y, tracking) {
  const x = w / 2;
  const common = `font-family="Silkscreen" font-size="${size}" font-weight="700" text-anchor="middle" letter-spacing="${tracking}"`;
  return `
  <g>
    <text x="${x + size * 0.04}" y="${y + size * 0.055}" ${common} fill="#ff2fd0" opacity=".4">BRICKLIKE</text>
    <text x="${x}" y="${y}" ${common} fill="#04141d" stroke="#04141d" stroke-width="${Math.round(size * 0.15)}" stroke-linejoin="round">BRICKLIKE</text>
    <text x="${x}" y="${y}" ${common} fill="url(#titleBody)" stroke="#7ef9ff" stroke-width="${Math.round(size * 0.018)}" stroke-opacity=".8">BRICKLIKE</text>
    <text x="${x}" y="${y}" ${common} fill="url(#titleBody)">BRICKLIKE</text>
  </g>`;
}

function backdrop(w, h, seed) {
  return `
  <rect width="${w}" height="${h}" fill="url(#bgSky)"/>
  <ellipse cx="${w * 0.5}" cy="${h * 0.42}" rx="${w * 0.55}" ry="${h * 0.46}" fill="url(#bgGlow)"/>
  <ellipse cx="${w * 0.16}" cy="${h * 0.88}" rx="${w * 0.42}" ry="${h * 0.32}" fill="url(#violetGlow)" filter="url(#soft)"/>
  <ellipse cx="${w * 0.88}" cy="${h * 0.2}" rx="${w * 0.3}" ry="${h * 0.24}" fill="#00d6c8" opacity=".08" filter="url(#soft)"/>
  ${spires(w, h)}
  <g opacity=".55">
    <path d="M0 ${h * 0.34} H${w}" stroke="#1a6f79" stroke-width="1" opacity=".18"/>
    <path d="M0 ${h * 0.47} H${w}" stroke="#1a6f79" stroke-width="1" opacity=".15"/>
    <path d="M0 ${h * 0.6} H${w}" stroke="#1a6f79" stroke-width="1" opacity=".12"/>
    <path d="M0 ${h * 0.73} H${w}" stroke="#1a6f79" stroke-width="1" opacity=".1"/>
  </g>
  <g opacity=".4">
    <path d="M0 ${h * 0.72} Q ${w * 0.2} ${h * 0.58} ${w * 0.42} ${h * 0.76} T ${w} ${h * 0.66}" fill="none" stroke="#2fe6c8" stroke-width="1.5" opacity=".2"/>
    <path d="M0 ${h * 0.8} Q ${w * 0.28} ${h * 0.64} ${w * 0.55} ${h * 0.84} T ${w} ${h * 0.74}" fill="none" stroke="#ff5fd2" stroke-width="1.2" opacity=".14"/>
  </g>
  ${motes(w, h, Math.round((w * h) / 18000), seed)}
  ${shards(w, h, seed)}`;
}

function shards(w, h, seed) {
  const rand = lcg(seed + 91);
  let out = '';
  for (let index = 0; index < 12; index += 1) {
    const x = (0.08 + rand() * 0.84) * w;
    const y = (0.28 + rand() * 0.5) * h;
    const size = 4 + rand() * 14;
    const color = index % 3 === 0 ? '#ff9ee8' : index % 2 === 0 ? '#8cf3ff' : '#b388ff';
    out += `<path d="M${x} ${y - size} L${x + size * 0.55} ${y} L${x} ${y + size} L${x - size * 0.5} ${y} Z" fill="${color}" opacity="${(0.08 + rand() * 0.18).toFixed(2)}"/>`;
  }
  return out;
}

function defsLaser(w, h) {
  return `<rect x="${w * 0.497}" y="${h * 0.36}" width="${w * 0.006}" height="${h * 0.48}" fill="url(#beamGrad)" opacity=".34" filter="url(#soft)"/>`;
}

function layoutFor(kind) {
  if (kind === 'landscape') {
    return [
      [0.36, 0.36, 'cyan', 1], [0.46, 0.36, 'violet', 2], [0.56, 0.36, 'cyan', 3], [0.66, 0.36, 'gold', 4],
      [0.26, 0.52, 'teal', 5], [0.36, 0.52, 'cyan', 6], [0.46, 0.52, 'magenta', 7], [0.56, 0.52, 'cyan', 8], [0.66, 0.52, 'violet', 9], [0.76, 0.52, 'cyan', 10],
      [0.36, 0.68, 'cyan', 11], [0.46, 0.68, 'green', 12], [0.56, 0.68, 'cyan', 13], [0.66, 0.68, 'orange', 14],
    ];
  }
  if (kind === 'portrait') {
    return [
      [0.26, 0.33, 'cyan', 1], [0.42, 0.33, 'violet', 2], [0.58, 0.33, 'cyan', 3], [0.74, 0.33, 'gold', 4],
      [0.18, 0.44, 'teal', 5], [0.34, 0.44, 'cyan', 6], [0.5, 0.44, 'magenta', 7], [0.66, 0.44, 'cyan', 8], [0.82, 0.44, 'violet', 9],
      [0.26, 0.55, 'cyan', 10], [0.42, 0.55, 'green', 11], [0.58, 0.55, 'cyan', 12], [0.74, 0.55, 'orange', 13],
      [0.34, 0.66, 'cyan', 14], [0.5, 0.66, 'violet', 15], [0.66, 0.66, 'cyan', 16],
    ];
  }
  if (kind === 'portraitTall') {
    return [
      [0.26, 0.31, 'cyan', 1], [0.42, 0.31, 'violet', 2], [0.58, 0.31, 'cyan', 3], [0.74, 0.31, 'gold', 4],
      [0.18, 0.43, 'teal', 5], [0.34, 0.43, 'cyan', 6], [0.5, 0.43, 'magenta', 7], [0.66, 0.43, 'cyan', 8], [0.82, 0.43, 'violet', 9],
      [0.26, 0.55, 'cyan', 10], [0.42, 0.55, 'green', 11], [0.58, 0.55, 'cyan', 12], [0.74, 0.55, 'orange', 13],
      [0.34, 0.67, 'cyan', 14], [0.5, 0.67, 'violet', 15], [0.66, 0.67, 'cyan', 16],
    ];
  }
  return [
    [0.32, 0.36, 'cyan', 1], [0.5, 0.36, 'violet', 2], [0.68, 0.36, 'gold', 3],
    [0.24, 0.49, 'teal', 4], [0.42, 0.49, 'cyan', 5], [0.58, 0.49, 'magenta', 6], [0.76, 0.49, 'cyan', 7],
    [0.32, 0.62, 'cyan', 8], [0.5, 0.62, 'green', 9], [0.68, 0.62, 'cyan', 10],
  ];
}

function blockSize(kind, w) {
  if (kind === 'landscape') return w * 0.08;
  if (kind === 'portrait') return w * 0.145;
  if (kind === 'portraitTall') return w * 0.125;
  return w * 0.115;
}

function paddleSpec(kind) {
  if (kind === 'landscape') return { cx: 0.5, cy: 0.86, w: 0.33, h: 0.03 };
  if (kind === 'portrait') return { cx: 0.5, cy: 0.9, w: 0.31, h: 0.035 };
  if (kind === 'portraitTall') return { cx: 0.5, cy: 0.9, w: 0.3, h: 0.028 };
  return { cx: 0.5, cy: 0.88, w: 0.31, h: 0.04 };
}

function ballSpecs(kind) {
  if (kind === 'landscape') {
    return [
      { points: [[0.7, 0.62], [0.64, 0.68], [0.59, 0.8]], r: 0.011 },
      { points: [[0.32, 0.63], [0.29, 0.69], [0.34, 0.8]], r: 0.008 },
      { points: [[0.78, 0.66], [0.72, 0.72], [0.7, 0.82]], r: 0.007 },
    ];
  }
  if (kind === 'portrait') {
    return [
      { points: [[0.64, 0.62], [0.57, 0.7], [0.52, 0.8]], r: 0.024 },
      { points: [[0.3, 0.65], [0.28, 0.71], [0.34, 0.8]], r: 0.017 },
      { points: [[0.74, 0.7], [0.68, 0.76], [0.68, 0.85]], r: 0.014 },
    ];
  }
  if (kind === 'portraitTall') {
    return [
      { points: [[0.64, 0.62], [0.57, 0.7], [0.52, 0.79]], r: 0.02 },
      { points: [[0.3, 0.66], [0.27, 0.73], [0.34, 0.82]], r: 0.014 },
      { points: [[0.74, 0.71], [0.68, 0.78], [0.68, 0.85]], r: 0.012 },
    ];
  }
  return [
    { points: [[0.64, 0.56], [0.58, 0.63], [0.54, 0.74]], r: 0.02 },
    { points: [[0.32, 0.6], [0.29, 0.66], [0.34, 0.76]], r: 0.014 },
    { points: [[0.74, 0.63], [0.68, 0.68], [0.68, 0.78]], r: 0.012 },
  ];
}

function svg(kind) {
  const { w, h, title: ts, titleY, tracking } = SIZES[kind];
  const size = blockSize(kind, w);
  const blocks = layoutFor(kind)
    .map(([cx, cy, palette, seed]) => {
      const s = size * (0.92 + ((seed * 7) % 5) * 0.035);
      return block(cx * w - s / 2, cy * h - s / 2, s, palette, seed, {
        damaged: seed % 6 === 0,
        pips: 1 + (seed % 3),
      });
    })
    .join('');
  const paddleInfo = paddleSpec(kind);
  const balls = ballSpecs(kind)
    .map((spec) => ballWithTrail(spec.points.map(([x, y]) => [x * w, y * h]), spec.r * w))
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${defs()}
  <defs>
    <linearGradient id="beamGrad" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#ffe08a" stop-opacity=".9"/>
      <stop offset=".55" stop-color="#7ef9ff" stop-opacity=".45"/>
      <stop offset="1" stop-color="#7ef9ff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  ${backdrop(w, h, kind === 'landscape' ? 9 : kind === 'portrait' ? 21 : kind === 'portraitTall' ? 33 : 45)}
  <g opacity=".8">
    <ellipse cx="${w * 0.5}" cy="${h * 0.52}" rx="${w * 0.32}" ry="${h * 0.36}" fill="none" stroke="#7ef9ff" stroke-width="1.2" opacity=".08"/>
    <path d="M${w * 0.5} ${h * 0.18} L${w * 0.68} ${h * 0.52} L${w * 0.5} ${h * 0.82} L${w * 0.32} ${h * 0.52} Z" fill="none" stroke="#b388ff" stroke-width="1.4" opacity=".08"/>
  </g>
  ${defsLaser(w, h)}
  ${balls}
  <g opacity=".98">${blocks}</g>
  ${paddle(paddleInfo.cx * w, paddleInfo.cy * h, paddleInfo.w * w, paddleInfo.h * h)}
  ${title(w, ts, titleY, tracking)}
  <rect width="${w}" height="${h}" fill="url(#scan)" opacity=".22"/>
  <rect width="${w}" height="${h}" fill="url(#vignette)"/>
</svg>`;
}

const variants = [
  ['cover-landscape-1920x1080.svg', 'landscape'],
  ['cover-portrait-800x1200.svg', 'portrait'],
  ['cover-portrait-1080x1920.svg', 'portraitTall'],
  ['cover-square-800x800.svg', 'square'],
];

await mkdir(here, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });

for (const [name, kind] of variants) {
  const markup = svg(kind);
  const svgPath = join(here, name);
  await writeFile(svgPath, markup);
  const size = SIZES[kind];
  await page.setViewportSize({ width: size.w, height: size.h });
  await page.goto(`file://${svgPath}`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(here, name.replace('.svg', '.png')) });
  console.log(`rendered ${name.replace('.svg', '.png')} (${size.w}x${size.h})`);
}

// Contact sheet for internal review (not a portal cover).
const contact = `<!doctype html><html><head><meta charset="utf-8"/>
<style>
@font-face{font-family:Silkscreen;src:url(data:font/ttf;base64,${fontBase64}) format('truetype');}
html,body{margin:0;background:#02060d;color:#7ef9ff;font-family:Silkscreen;letter-spacing:.06em}
body{width:1608px;height:674px;display:flex;align-items:center;justify-content:center;gap:18px;padding:24px;box-sizing:border-box}
figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:10px}
img{display:block;box-shadow:0 0 0 1px rgba(126,249,255,.18),0 12px 40px rgba(0,0,0,.5)}
figcaption{font-size:12px;color:#b9f7ff;opacity:.8}
.l{width:700px}.p{width:260px}.t{width:180px}.s{width:260px}
</style></head><body>
<figure><img class="l" src="cover-landscape-1920x1080.png"/><figcaption>16:9 — 1920×1080</figcaption></figure>
<figure><img class="p" src="cover-portrait-800x1200.png"/><figcaption>2:3 — 800×1200</figcaption></figure>
<figure><img class="t" src="cover-portrait-1080x1920.png"/><figcaption>9:16 — 1080×1920</figcaption></figure>
<figure><img class="s" src="cover-square-800x800.png"/><figcaption>1:1 — 800×800</figcaption></figure>
</body></html>`;
const contactPath = join(here, 'cover-contact-sheet.html');
await writeFile(contactPath, contact);
await page.setViewportSize({ width: 1608, height: 674 });
await page.goto(`file://${contactPath}`);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: join(here, 'cover-contact-sheet.png') });
console.log('rendered cover-contact-sheet.png (1608x674)');

await browser.close();
