#!/usr/bin/env node
/**
 * Records a 30–60 s Bricklike preview from the production build and composes
 * it as a 1280×720 MP4: the real portrait gameplay over a blurred game-art
 * backdrop. No debug UI is visible in the recording.
 *
 * Usage:
 *   npm run build
 *   npx vite preview --port 4180 --strictPort
 *   node store/video/capture-preview.mjs --url=http://localhost:4180 --seconds=42
 *
 * Requires the system `ffmpeg` binary. Playwright supplies the WebM recording.
 * Audio is not captured by Playwright; the exported preview is silent.
 */
import { mkdir, rm, stat } from 'node:fs/promises';
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
const seconds = Math.max(30, Math.min(60, Number(arg('seconds', '42')) || 42));
const viewport = { width: 390, height: 844 };
const rawDir = join(repo, '.qa/video-raw');
const outFile = join(here, 'bricklike-preview.mp4');
const backdrop = join(repo, 'store/covers/cover-landscape-1920x1080.png');

await rm(rawDir, { recursive: true, force: true });
await mkdir(rawDir, { recursive: true });

async function hideDebug(page) {
  await page.addStyleTag({ content: '.debug{display:none!important;visibility:hidden!important}' });
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
  await page.evaluate((id) => {
    const select = document.querySelector('#debug-perk');
    if (!(select instanceof HTMLSelectElement)) return;
    select.value = id;
    const button = [...document.querySelectorAll('button')].find(
      (candidate) => candidate.textContent?.trim() === 'Grant perk',
    );
    if (button instanceof HTMLButtonElement) button.click();
  }, perkId);
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport,
  deviceScaleFactor: 1,
  hasTouch: true,
  isMobile: true,
  recordVideo: { dir: rawDir, size: viewport },
});
const page = await context.newPage();
await page.goto(`${baseUrl}/?debug=1&resetSave=1`, { waitUntil: 'networkidle' });
await page.locator('#play-button').waitFor({ state: 'visible' });
await hideDebug(page);
await page.locator('#play-button').click();
await page.locator('.hud').waitFor({ state: 'visible' });
await page.keyboard.press('v');
await page.waitForTimeout(1500);

// Build a readable power fantasy early, then keep the run alive with periodic
// debug balls/XP. All debug chrome is hidden; only real gameplay is recorded.
await grantPerk(page, 'multiball');
await page.waitForTimeout(800);
await grantPerk(page, 'prism_laser');
await grantPerk(page, 'wide_paddle');

const started = Date.now();
let step = 0;
let levelUps = 0;
while (Date.now() - started < seconds * 1000) {
  const elapsed = (Date.now() - started) / 1000;
  // Smooth sweep across the paddle range; the ball trails make the motion read.
  const x = 40 + ((Math.sin(elapsed * 1.15) + 1) / 2) * 310;
  const box = await page.locator('canvas').boundingBox();
  if (box) {
    await page.mouse.move(box.x + x, box.y + box.height * 0.9);
  }
  if (step % 3 === 0) await page.keyboard.press('e');
  if (step % 8 === 0) await page.evaluate(() => document.querySelector('canvas')?.focus());
  if (step % 24 === 0) {
    await clickDebug(page, 'Add ball');
    await clickDebug(page, 'Add XP +20');
  }
  if (box) await page.mouse.move(box.x + x, box.y + box.height * 0.9);

  // Let the level-up card be visible for a beat, then choose the first perk.
  const levelup = page.locator('.levelup:not([hidden])');
  if (await levelup.isVisible().catch(() => false)) {
    await page.waitForTimeout(900);
    await page.keyboard.press('1');
    levelUps += 1;
  }

  // Recover from a defeat so the preview keeps showing gameplay.
  const results = page.locator('.overlay--results');
  if (await results.isVisible().catch(() => false)) {
    await page.waitForTimeout(600);
    const retry = results.getByRole('button', { name: /retry/i });
    if (await retry.isVisible().catch(() => false)) await retry.click();
    await page.waitForTimeout(800);
    await page.keyboard.press('v');
  }

  await page.waitForTimeout(230);
  step += 1;
}
const video = page.video();
await context.close();
await browser.close();
const rawPath = await video.path();
console.log(`recorded ${rawPath} (${levelUps} level-up choices)`);

// Compose 1280×720: blurred store art background + portrait gameplay card.
const filter = [
  '[0:v]scale=1280:720,boxblur=18:2,eq=brightness=0.03:saturation=1.25[bg]',
  '[1:v]scale=-2:700,pad=iw+18:ih+18:9:9:color=0x7ef9ff@0.65[fg]',
  '[bg][fg]overlay=(W-w)/2:(H-h)/2:format=auto,format=yuv420p[v]',
].join(';');
const ff = spawnSync(
  'ffmpeg',
  [
    '-y',
    '-loop', '1', '-i', backdrop,
    '-i', rawPath,
    '-filter_complex', filter,
    '-map', '[v]',
    '-t', String(seconds),
    '-r', '30',
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '20',
    '-movflags', '+faststart',
    '-an',
    outFile,
  ],
  { encoding: 'utf8' },
);
if (ff.status !== 0) {
  console.error(ff.stderr?.slice(-4000));
  throw new Error('ffmpeg could not compose the preview');
}
const info = await stat(outFile);
console.log(`composed ${outFile} (${(info.size / 1024 / 1024).toFixed(1)} MB, ${seconds}s)`);
