#!/usr/bin/env node
/**
 * Generates the three Bricklike store covers as SVG, then rasterises them with
 * Chromium (Playwright) at the exact store sizes.
 *
 * No runtime dependency beyond the repo's existing devDependency:
 *   node store/covers/generate-covers.mjs
 *
 * The artwork is original, built from the same visual language as the game:
 * crystal blocks, an arcade paddle/ball with a light trail, teal/violet glow
 * and the bundled Silkscreen display font. The only text is the title.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../..');
const fontPath = join(repo, 'src/assets/fonts/Silkscreen-Bold.ttf');
const fontBase64 = (await readFile(fontPath)).toString('base64');

const SIZE = {
  landscape: { w: 1920, h: 1080, title: 158, titleY: 232, tracking: 10 },
  portrait: { w: 800, h: 1200, title: 86, titleY: 208, tracking: 6 },
  square: { w: 800, h: 800, title: 84, titleY: 150, tracking: 6 },
};

const PALETTE = {
  teal: ['#8cf3ff', '#29c8c2', '#0d5c68'],
  cyan: ['#d8fbff', '#57e6ff', '#136a83'],
  violet: ['#e7c9ff', '#a06bff', '#3c1a6e'],
  magenta: ['#ffd0f2', '#ff5fd2', '#7a1b5c'],
  gold: ['#fff0bd', '#ffd479', '#7a4a12'],
};

function steppedRect(x, y, w, h, step = 10) {
  const l = x;
  const t = y;
  const r = x + w;
  const b = y + h;
  const s = Math.min(step, Math.floor(Math.min(w, h) / 3));
  const half = Math.floor(s / 2);
  return [
    `M${l + s} ${t}`,
    `H${r - s}`, `V${t + half}`, `H${r - half}`, `V${t + s}`, `H${r}`,
    `V${b - s}`, `H${r - half}`, `V${b - half}`, `H${r - s}`, `V${b}`,
    `H${l + s}`, `V${b - half}`, `H${l + half}`, `V${b - s}`, `H${l}`,
    `V${t + s}`, `H${l + half}`, `V${t + half}`, `H${l + s}`, 'Z',
  ].join(' ');
}

function block(x, y, w, h, palette, seed = 0) {
  const [light, mid, dark] = PALETTE[palette];
  const s = Math.max(6, Math.round(Math.min(w, h) * 0.14));
  const inner = steppedRect(x + 4, y + 4, w - 8, h - 8, s - 2);
  const body = steppedRect(x, y, w, h, s);
  const cx = x + w / 2;
  const skew = ((seed % 5) - 2) * 3;
  return `
  <g>
    <path d="${steppedRect(x + 5, y + 8, w, h, s)}" fill="#02060b" opacity=".55"/>
    <path d="${body}" fill="url(#${palette}Body)"/>
    <path d="${inner}" fill="${dark}" opacity=".42"/>
    <path d="M${x + s} ${y + s} L${x + w * 0.44} ${y + 5} L${x + w * 0.56} ${y + 5} L${cx + skew} ${y + h - 8} L${x + w * 0.28} ${y + h - 8} Z" fill="${light}" opacity=".34"/>
    <path d="M${cx + skew} ${y + 5} L${x + w * 0.56} ${y + 5} L${x + w - s} ${y + s} L${x + w - s} ${y + h - 8} L${cx + skew} ${y + h - 8} Z" fill="${mid}" opacity=".18"/>
    <path d="M${cx + skew} ${y + 12} L${cx + skew} ${y + h - 10}" stroke="${light}" stroke-width="2" opacity=".55"/>
    <path d="M${x + s} ${y + s} H${x + w - s}" stroke="${light}" stroke-width="3" opacity=".8"/>
    <path d="M${x + s} ${y + h - s} H${x + w - s}" stroke="#02060b" stroke-width="3" opacity=".55"/>
    <path d="${body}" fill="none" stroke="#02060b" stroke-width="4" opacity=".9"/>
    <path d="${body}" fill="none" stroke="${light}" stroke-width="1.2" opacity=".5"/>
  </g>`;
}

function paddle(cx, y, w, h = 26) {
  const x = cx - w / 2;
  return `
  <g filter="url(#paddleGlow)">
    <ellipse cx="${cx}" cy="${y + h + 12}" rx="${w * 0.52}" ry="${h * 0.55}" fill="#35e6ff" opacity=".18"/>
    <path d="${steppedRect(x, y, w, h, 8)}" fill="url(#paddleBody)"/>
    <path d="${steppedRect(x + 4, y + 3, w - 8, h - 11, 6)}" fill="#bffaff" opacity=".28"/>
    <path d="M${x + 14} ${y + 4} H${x + w - 14}" stroke="#ffffff" stroke-width="2.5" opacity=".85"/>
    <path d="${steppedRect(x, y, w, h, 8)}" fill="none" stroke="#04141d" stroke-width="3" opacity=".85"/>
  </g>`;
}

function ball(cx, cy, r = 17) {
  return `
  <g filter="url(#ballGlow)">
    <circle cx="${cx}" cy="${cy}" r="${r * 2.6}" fill="#7ef9ff" opacity=".09"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#ballBody)"/>
    <circle cx="${cx - r * 0.28}" cy="${cy - r * 0.3}" r="${r * 0.38}" fill="#ffffff" opacity=".95"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#ffffff" stroke-width="1.4" opacity=".65"/>
  </g>`;
}

function trail(points, r = 8) {
  return points
    .map(([x, y, o]) => `<circle cx="${x}" cy="${y}" r="${r * o}" fill="#8cf3ff" opacity="${(o * 0.28).toFixed(3)}"/>`)
    .join('');
}

function motes(w, h, count, seed = 7) {
  let out = '';
  let s = seed;
  for (let i = 0; i < count; i += 1) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const x = (s / 2147483648) * w;
    s = (s * 1103515245 + 12345) % 2147483648;
    const y = (s / 2147483648) * h;
    s = (s * 1103515245 + 12345) % 2147483648;
    const r = 1.4 + (s / 2147483648) * 3.4;
    const color = i % 4 === 0 ? '#ff9ee8' : i % 3 === 0 ? '#ffffff' : '#8cf3ff';
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}" opacity="${(0.16 + (i % 5) * 0.08).toFixed(2)}"/>`;
  }
  return out;
}

function title(w, size, y, tracking) {
  const common = `font-family="Silkscreen" font-size="${size}" font-weight="700" text-anchor="middle"`;
  const x = w / 2;
  return `
  <g>
    <text x="${x + 5}" y="${y + 7}" ${common} letter-spacing="${tracking}" fill="#ff2fd0" opacity=".55">BRICKLIKE</text>
    <text x="${x}" y="${y}" ${common} letter-spacing="${tracking}" fill="#04141d" stroke="#04141d" stroke-width="${Math.round(size * 0.14)}" stroke-linejoin="round">BRICKLIKE</text>
    <text x="${x}" y="${y}" ${common} letter-spacing="${tracking}" fill="url(#titleBody)" stroke="#7ef9ff" stroke-width="${Math.round(size * 0.018)}" stroke-opacity=".7">BRICKLIKE</text>
    <text x="${x}" y="${y}" ${common} letter-spacing="${tracking}" fill="url(#titleBody)">BRICKLIKE</text>
  </g>`;
}

function backdrop(w, h) {
  return `
  <rect width="${w}" height="${h}" fill="url(#bgSky)"/>
  <ellipse cx="${w * 0.5}" cy="${h * 0.42}" rx="${w * 0.52}" ry="${h * 0.42}" fill="url(#bgGlow)"/>
  <ellipse cx="${w * 0.1}" cy="${h * 0.9}" rx="${w * 0.34}" ry="${h * 0.3}" fill="#8a2be2" opacity=".13" filter="url(#soft)"/>
  <ellipse cx="${w * 0.94}" cy="${h * 0.18}" rx="${w * 0.3}" ry="${h * 0.28}" fill="#00d6c8" opacity=".11" filter="url(#soft)"/>
  <g opacity=".5">
    <path d="M0 ${h * 0.78} Q ${w * 0.25} ${h * 0.62} ${w * 0.5} ${h * 0.8} T ${w} ${h * 0.72}" fill="none" stroke="#2fe6c8" stroke-width="2" opacity=".25"/>
    <path d="M0 ${h * 0.84} Q ${w * 0.3} ${h * 0.68} ${w * 0.55} ${h * 0.86} T ${w} ${h * 0.78}" fill="none" stroke="#ff5fd2" stroke-width="1.5" opacity=".18"/>
  </g>`;
}

function scanlines(w, h) {
  return `<rect width="${w}" height="${h}" fill="url(#scan)" opacity=".55"/>`;
}

function vignette(w, h) {
  return `<rect width="${w}" height="${h}" fill="url(#vignette)"/>`;
}

function defs() {
  const gradients = Object.entries(PALETTE)
    .map(([name, [light, mid, dark]]) => `
      <linearGradient id="${name}Body" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${light}"/>
        <stop offset=".45" stop-color="${mid}"/>
        <stop offset="1" stop-color="${dark}"/>
      </linearGradient>`)
    .join('');
  return `
  <defs>
    <style>@font-face{font-family:Silkscreen;src:url(data:font/ttf;base64,${fontBase64}) format('truetype');}</style>
    <linearGradient id="bgSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#061923"/>
      <stop offset=".55" stop-color="#041019"/>
      <stop offset="1" stop-color="#02060d"/>
    </linearGradient>
    <radialGradient id="bgGlow" cx=".5" cy=".45" r=".62">
      <stop offset="0" stop-color="#0f6c78" stop-opacity=".55"/>
      <stop offset=".55" stop-color="#0a3b59" stop-opacity=".24"/>
      <stop offset="1" stop-color="#02060d" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="titleBody" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset=".42" stop-color="#c9fbff"/>
      <stop offset="1" stop-color="#6fe8ff"/>
    </linearGradient>
    <linearGradient id="paddleBody" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f2ffff"/>
      <stop offset=".35" stop-color="#7ef9ff"/>
      <stop offset=".7" stop-color="#2bb9e8"/>
      <stop offset="1" stop-color="#7a4cc0"/>
    </linearGradient>
    <radialGradient id="ballBody" cx=".36" cy=".32" r=".72">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset=".45" stop-color="#a8fff0"/>
      <stop offset="1" stop-color="#3ad9ff"/>
    </radialGradient>
    <radialGradient id="vignette" cx=".5" cy=".48" r=".75">
      <stop offset=".55" stop-color="#02060d" stop-opacity="0"/>
      <stop offset="1" stop-color="#02060d" stop-opacity=".78"/>
    </radialGradient>
    <pattern id="scan" width="6" height="6" patternUnits="userSpaceOnUse">
      <rect width="6" height="1.4" fill="#000000" opacity=".35"/>
    </pattern>
    <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="28"/>
    </filter>
    <filter id="ballGlow" x="-260%" y="-260%" width="620%" height="620%">
      <feGaussianBlur stdDeviation="9" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="paddleGlow" x="-120%" y="-180%" width="340%" height="460%">
      <feGaussianBlur stdDeviation="12" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    ${gradients}
  </defs>`;
}

function svgLandscape() {
  const { w, h, title: ts, titleY, tracking } = SIZE.landscape;
  const blocks = [
    [470, 466, 150, 76, 'violet', 1], [650, 440, 150, 76, 'teal', 2],
    [830, 414, 156, 80, 'cyan', 3], [1016, 440, 150, 76, 'magenta', 4],
    [1196, 470, 150, 76, 'gold', 5],
    [560, 572, 150, 76, 'cyan', 6], [740, 556, 150, 76, 'magenta', 7],
    [930, 540, 160, 84, 'teal', 8], [1120, 560, 150, 76, 'violet', 9],
    [1290, 590, 132, 68, 'cyan', 10],
    [700, 690, 130, 66, 'gold', 11], [890, 676, 140, 72, 'cyan', 12],
    [1070, 692, 130, 66, 'magenta', 13],
  ]
    .map((b) => block(...b))
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${defs()}
  ${backdrop(w, h)}
  <g opacity=".55">
    <path d="M250 350 L250 830" stroke="#19a9b8" stroke-width="1.5" stroke-dasharray="5 11" opacity=".35"/>
    <path d="M1670 350 L1670 830" stroke="#19a9b8" stroke-width="1.5" stroke-dasharray="5 11" opacity=".35"/>
  </g>
  ${motes(w, h, 90)}
  <g opacity=".9">${blocks}</g>
  ${trail([[960, 792, 0.3], [942, 806, 0.45], [918, 822, 0.65], [886, 838, 0.85], [846, 850, 1]])}
  ${paddle(900, 914, 330, 28)}
  ${ball(960, 772, 19)}
  <g opacity=".8">
    <path d="M310 700 C 430 620, 520 900, 640 820" fill="none" stroke="#ff5fd2" stroke-width="2.5" opacity=".35"/>
    <path d="M1300 650 C 1430 570, 1540 820, 1650 740" fill="none" stroke="#7ef9ff" stroke-width="2" opacity=".3"/>
  </g>
  ${title(w, ts, titleY, tracking)}
  ${scanlines(w, h)}
  ${vignette(w, h)}
</svg>`;
}

function svgPortrait() {
  const { w, h, title: ts, titleY, tracking } = SIZE.portrait;
  const blocks = [
    [150, 430, 150, 74, 'violet', 1], [330, 408, 156, 78, 'teal', 2], [516, 430, 150, 74, 'cyan', 3],
    [224, 536, 150, 74, 'cyan', 4], [410, 520, 160, 82, 'magenta', 5], [590, 548, 122, 66, 'gold', 6],
    [316, 652, 150, 76, 'teal', 7], [500, 664, 138, 70, 'violet', 8],
    [220, 770, 132, 68, 'magenta', 9], [390, 782, 148, 74, 'cyan', 10],
  ]
    .map((b) => block(...b))
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${defs()}
  ${backdrop(w, h)}
  ${motes(w, h, 66, 13)}
  <g opacity=".9">${blocks}</g>
  ${trail([[416, 930, 0.28], [404, 948, 0.44], [388, 970, 0.62], [366, 992, 0.82], [338, 1010, 1]])}
  ${paddle(400, 1084, 258, 26)}
  ${ball(416, 909, 17)}
  <g opacity=".8">
    <path d="M92 560 C 160 500, 202 660, 258 610" fill="none" stroke="#ff5fd2" stroke-width="2" opacity=".3"/>
    <path d="M540 860 C 610 800, 660 950, 710 900" fill="none" stroke="#7ef9ff" stroke-width="2" opacity=".26"/>
  </g>
  ${title(w, ts, titleY, tracking)}
  ${scanlines(w, h)}
  ${vignette(w, h)}
</svg>`;
}

function svgSquare() {
  const { w, h, title: ts, titleY, tracking } = SIZE.square;
  const blocks = [
    [150, 316, 136, 66, 'violet', 1], [310, 296, 142, 70, 'teal', 2], [476, 316, 136, 66, 'cyan', 3],
    [222, 408, 140, 68, 'cyan', 4], [386, 392, 148, 74, 'magenta', 5], [552, 414, 108, 58, 'gold', 6],
    [304, 502, 140, 68, 'teal', 7], [468, 512, 130, 64, 'violet', 8],
  ]
    .map((b) => block(...b))
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${defs()}
  ${backdrop(w, h)}
  ${motes(w, h, 52, 29)}
  <g opacity=".9">${blocks}</g>
  ${trail([[390, 628, 0.3], [378, 644, 0.46], [360, 662, 0.64], [338, 680, 0.85], [310, 694, 1]])}
  ${paddle(398, 718, 226, 24)}
  ${ball(390, 610, 16)}
  <g opacity=".8">
    <path d="M84 438 C 150 380, 194 530, 244 486" fill="none" stroke="#ff5fd2" stroke-width="2" opacity=".3"/>
    <path d="M548 566 C 616 510, 662 646, 716 600" fill="none" stroke="#7ef9ff" stroke-width="2" opacity=".26"/>
  </g>
  ${title(w, ts, titleY, tracking)}
  ${scanlines(w, h)}
  ${vignette(w, h)}
</svg>`;
}

const variants = [
  ['cover-landscape-1920x1080.svg', svgLandscape(), SIZE.landscape],
  ['cover-portrait-800x1200.svg', svgPortrait(), SIZE.portrait],
  ['cover-square-800x800.svg', svgSquare(), SIZE.square],
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const [name, markup, size] of variants) {
  const svgPath = join(here, name);
  await writeFile(svgPath, markup);
  await page.setViewportSize({ width: size.w, height: size.h });
  await page.goto(`file://${svgPath}`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(here, name.replace('.svg', '.png')) });
  console.log(`rendered ${name.replace('.svg', '.png')} (${size.w}x${size.h})`);
}
await browser.close();
