#!/usr/bin/env node
/**
 * Records the Bricklike preview from the production build.
 *
 * Two CrazyGames-ready outputs are composed from the same real gameplay clips:
 *   - bricklike-preview.mp4          1920x1080 (16:9)
 *   - bricklike-preview-portrait.mp4 1080x1620 (2:3)
 *
 * Each video opens on its static cover, then shows menu, gameplay, level-up and
 * results in ~18 s. The portrait game is composed over a blurred cover backdrop
 * so the HUD and paddle are never cropped and there are no black bars.
 *
 * Usage:
 *   npm run build
 *   npx vite preview --port 4180 --strictPort
 *   node store/video/capture-preview.mjs
 *   node store/video/capture-preview.mjs --format=portrait
 *
 * Requires the system `ffmpeg` binary. Playwright records WebM clips; the final
 * MP4 is silent because Playwright does not capture audio.
 */
import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../..');
const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const hit = args.find((value) => value.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const baseUrl = arg('url', 'http://localhost:4180').replace(/\/$/, '');
const format = arg('format', 'both');
if (!['both', 'landscape', 'portrait'].includes(format)) {
  throw new Error('--format must be both, landscape or portrait');
}

const viewport = { width: 390, height: 844 };
const rawDir = join(repo, '.qa/video-raw');
const segmentRoot = join(repo, '.qa/video-segments');
const coverLandscape = join(repo, 'store/covers/cover-landscape-1920x1080.png');
const coverPortrait = join(repo, 'store/covers/cover-portrait-800x1200.png');

const variants = [
  {
    id: 'landscape',
    width: 1920,
    height: 1080,
    cover: coverLandscape,
    foregroundHeight: 1000,
    out: join(here, 'bricklike-preview.mp4'),
  },
  {
    id: 'portrait',
    width: 1080,
    height: 1620,
    cover: coverPortrait,
    foregroundHeight: 1500,
    out: join(here, 'bricklike-preview-portrait.mp4'),
  },
].filter((variant) => format === 'both' || format === variant.id);

await rm(rawDir, { recursive: true, force: true });
await rm(segmentRoot, { recursive: true, force: true });
await mkdir(rawDir, { recursive: true });
await mkdir(segmentRoot, { recursive: true });

async function hideDebug(page) {
  await page.addStyleTag({
    content:
      '.debug{display:none!important;visibility:hidden!important}' +
      'html,body,canvas{cursor:none!important}',
  });
  await page.evaluate(() => {
    delete document.documentElement.dataset.debug;
  });
}

async function clickDebug(page, label) {
  return page.evaluate((text) => {
    const button = [...document.querySelectorAll('button')].find(
      (candidate) => candidate.textContent?.trim() === text,
    );
    if (!(button instanceof HTMLButtonElement)) return false;
    button.click();
    return true;
  }, label);
}

async function grantPerk(page, perkId) {
  const ok = await page.evaluate((id) => {
    const select = document.querySelector('#debug-perk');
    if (!(select instanceof HTMLSelectElement)) return false;
    select.value = id;
    const button = [...document.querySelectorAll('button')].find(
      (candidate) => candidate.textContent?.trim() === 'Grant perk',
    );
    if (!(button instanceof HTMLButtonElement)) return false;
    button.click();
    return select.value === id;
  }, perkId);
  if (!ok) throw new Error(`could not grant perk ${perkId}`);
}

async function setBallSpeed(page, scale) {
  await page.evaluate((value) => {
    const input = document.querySelector('#tune-ballSpeedScale');
    if (!(input instanceof HTMLInputElement)) return;
    input.value = String(value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, scale);
}

async function startRun(page) {
  await page.goto(`${baseUrl}/?debug=1&resetSave=1`, { waitUntil: 'networkidle' });
  await page.locator('#play-button').waitFor({ state: 'visible' });
  await hideDebug(page);
  await page.locator('#play-button').click();
  await page.locator('.hud').waitFor({ state: 'visible' });
  await setBallSpeed(page, 0.85);
  await grantPerk(page, 'wide_paddle');
  await grantPerk(page, 'prism_laser');
  await grantPerk(page, 'multiball');
  await grantPerk(page, 'safety_net');
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.9);
  await page.keyboard.press('v');
  await page.waitForTimeout(1200);
}

async function recordClip(name, prepare, action) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    hasTouch: true,
    isMobile: true,
    recordVideo: { dir: rawDir, size: viewport },
  });
  const page = await context.newPage();
  await prepare(page);
  await action(page);
  const video = page.video();
  await context.close();
  const path = await video.path();
  console.log(`recorded ${name}: ${path}`);
  return path;
}

async function movePaddle(page, elapsed) {
  const x = 36 + ((Math.sin(elapsed * 1.45) + 1) / 2) * 318;
  const box = await page.locator('canvas').boundingBox();
  if (box) await page.mouse.move(box.x + x, box.y + box.height * 0.9);
}

async function resolveLevelUp(page, holdMs = 800) {
  const overlay = page.locator('.levelup:not([hidden])');
  if (!(await overlay.isVisible().catch(() => false))) return false;
  await page.waitForTimeout(holdMs);
  await page.keyboard.press('1');
  await page.waitForTimeout(450);
  return true;
}

const browser = await chromium.launch();

const menuClip = await recordClip(
  'menu',
  async (page) => {
    await page.goto(`${baseUrl}/?resetSave=1`, { waitUntil: 'networkidle' });
    await page.locator('#play-button').waitFor({ state: 'visible' });
    await page.evaluate(() => document.fonts.ready);
  },
  async (page) => {
    await page.waitForTimeout(3600);
  },
);

const gameplayClip = await recordClip(
  'gameplay',
  startRun,
  async (page) => {
    const started = Date.now();
    let step = 0;
    while (Date.now() - started < 21_000) {
      const elapsed = (Date.now() - started) / 1000;
      await movePaddle(page, elapsed);
      if (step % 2 === 0) await clickDebug(page, 'Fire projectile');
      if (step % 8 === 0) await page.keyboard.press('e');
      if (step % 7 === 0) await clickDebug(page, 'Add ball');
      if (step % 26 === 0) await clickDebug(page, 'Add XP +20');
      await resolveLevelUp(page, 650);
      await page.waitForTimeout(230);
      step += 1;
    }
    // Finish the same run so the results screen matches the gameplay stats.
    await clickDebug(page, 'Force victory');
    await page.locator('.overlay--results').waitFor({ state: 'visible' });
    await page.waitForTimeout(3600);
  },
);

const levelUpClip = await recordClip(
  'levelup',
  startRun,
  async (page) => {
    await clickDebug(page, 'Add XP +100');
    await page.locator('.levelup:not([hidden])').waitFor({ state: 'visible' });
    await page.waitForTimeout(2800);
    await page.keyboard.press('1');
    await page.waitForTimeout(900);
  },
);

await browser.close();

/** Clip order and durations keep the final video between 15 and 20 seconds. */
const clips = [
  { path: menuClip, start: 0.4, duration: 2.0 },
  { path: gameplayClip, start: 0.7, duration: 9.5 },
  { path: levelUpClip, start: 3.8, duration: 2.6 },
  { path: gameplayClip, fromEnd: 4.0, duration: 3.0 },
];
const coverSeconds = 1.2;
const totalSeconds =
  coverSeconds + clips.reduce((sum, clip) => sum + clip.duration, 0);

function runFfmpeg(argsToRun, message) {
  const result = spawnSync('ffmpeg', argsToRun, { encoding: 'utf8' });
  if (result.status !== 0) {
    console.error(result.stderr?.slice(-4000));
    throw new Error(message);
  }
}

function composeCoverSegment(variant, out) {
  runFfmpeg(
    [
      '-y',
      '-loop', '1', '-i', variant.cover,
      '-vf', `scale=${variant.width}:${variant.height},format=yuv420p`,
      '-t', String(coverSeconds),
      '-r', '30',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '20',
      '-an',
      out,
    ],
    `ffmpeg could not compose the ${variant.id} cover frame`,
  );
}

function composeGameplaySegment(variant, clip, out) {
  const filter = [
    `[0:v]scale=${variant.width}:${variant.height},boxblur=18:2,eq=brightness=0.03:saturation=1.25[bg]`,
    `[1:v]scale=-2:${variant.foregroundHeight},pad=iw+18:ih+18:9:9:color=0x7ef9ff@0.65[fg]`,
    '[bg][fg]overlay=(W-w)/2:(H-h)/2:format=auto,format=yuv420p[v]',
  ].join(';');
  const seek = clip.fromEnd
    ? ['-sseof', `-${clip.fromEnd}`]
    : ['-ss', String(clip.start)];
  runFfmpeg(
    [
      '-y',
      '-loop', '1', '-i', variant.cover,
      ...seek, '-i', clip.path,
      '-filter_complex', filter,
      '-map', '[v]',
      '-t', String(clip.duration),
      '-r', '30',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '20',
      '-an',
      out,
    ],
    `ffmpeg could not compose a ${variant.id} gameplay segment`,
  );
}

for (const variant of variants) {
  const dir = join(segmentRoot, variant.id);
  await mkdir(dir, { recursive: true });
  const segmentFiles = [];

  const coverFile = join(dir, 'segment-cover.mp4');
  composeCoverSegment(variant, coverFile);
  segmentFiles.push(coverFile);

  for (let index = 0; index < clips.length; index += 1) {
    const out = join(dir, `segment-${index}.mp4`);
    composeGameplaySegment(variant, clips[index], out);
    segmentFiles.push(out);
  }

  const listFile = join(dir, 'list.txt');
  await writeFile(
    listFile,
    segmentFiles.map((file) => `file '${file}'`).join('\n'),
  );

  const concatFile = join(dir, 'concat.mp4');
  runFfmpeg(
    [
      '-y',
      '-f', 'concat',
      '-safe', '0',
      '-i', listFile,
      '-c', 'copy',
      concatFile,
    ],
    `ffmpeg could not concatenate the ${variant.id} preview`,
  );

  runFfmpeg(
    [
      '-y',
      '-i', concatFile,
      '-vf', `fade=t=out:st=${Math.max(0, totalSeconds - 0.4)}:d=0.4`,
      '-r', '30',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '20',
      '-movflags', '+faststart',
      '-an',
      variant.out,
    ],
    `ffmpeg could not finish the ${variant.id} preview`,
  );

  const info = await stat(variant.out);
  console.log(
    `composed ${variant.out} (${variant.width}x${variant.height}, ` +
      `${totalSeconds.toFixed(1)} s, ${(info.size / 1024 / 1024).toFixed(1)} MB)`,
  );
}
