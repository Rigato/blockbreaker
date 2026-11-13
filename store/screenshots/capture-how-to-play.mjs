#!/usr/bin/env node
/**
 * Captures the five 5:3 How to Play panels (780x468) from the v0.6.1
 * production build. Each panel is a real 390x234 crop of the 390x844 portrait
 * game, rendered at deviceScaleFactor 2 so the text stays sharp.
 *
 * Usage:
 *   npm run build
 *   npx vite preview --port 4180 --strictPort
 *   node store/screenshots/capture-how-to-play.mjs --url=http://localhost:4180
 */
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../..');
const outDir = join(repo, 'public/how-to-play');
const args = process.argv.slice(2);
const urlArg = args.find((arg) => arg.startsWith('--url='));
const baseUrl = (urlArg ? urlArg.slice(6) : 'http://localhost:4180').replace(/\/$/, '');

const VIEWPORT = { width: 390, height: 844 };
const PROGRESS_SAVE = {
  version: 2,
  unlockedPhase: 6,
  phases: {},
  endless: { bestWave: 12, bestScore: 34500, runs: 8 },
  campaignComplete: false,
  meta: { sparks: 0, unlocks: [] },
  updatedAt: Date.now(),
};
const COMPLETE_SAVE = { ...PROGRESS_SAVE, campaignComplete: true, updatedAt: Date.now() };

async function newPage(save) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  });
  if (save) {
    await context.addInitScript((snapshot) => {
      localStorage.setItem('bb.save', JSON.stringify(snapshot));
    }, save);
  }
  const page = await context.newPage();
  return { context, page };
}

async function waitForMenu(page, url) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.locator('#campaign-button').waitFor({ state: 'visible' });
  await page.waitForFunction(() => !document.querySelector('#boot-screen'), {
    timeout: 15000,
  }).catch(() => null);
  await page.evaluate(() => document.fonts.ready);
}

async function hideDebug(page) {
  await page.addStyleTag({
    content: '.debug{display:none!important;visibility:hidden!important}',
  });
  await page.evaluate(() => {
    delete document.documentElement.dataset.debug;
  });
}

async function callGame(page, fn) {
  return page.evaluate(
    (source) => {
      const game = window.__bricklike;
      if (!game) throw new Error('window.__bricklike is not available');
      // eslint-disable-next-line no-new-func
      return new Function('game', `return (${source})(game);`)(game);
    },
    fn.toString(),
  );
}

async function launch(page) {
  const box = await page.locator('canvas').boundingBox();
  if (box) await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.64);
  await page.keyboard.press('v');
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const stuck = await page.evaluate(() => {
      const balls = window.__bricklike?.world?.balls ?? [];
      return balls.length === 0 || balls.every((ball) => ball.stuck);
    });
    if (!stuck) return;
    await page.waitForTimeout(100);
    await page.keyboard.press('v');
  }
}

async function crop(page, name, y) {
  await page.screenshot({
    path: join(outDir, name),
    clip: { x: 0, y, width: VIEWPORT.width, height: 234 },
    animations: 'disabled',
  });
  console.log(`captured ${name} (780x468 crop at y=${y})`);
}

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();

// 1. Move & launch: clean campaign start with the ball stuck to the paddle.
{
  const { context, page } = await newPage(PROGRESS_SAVE);
  await waitForMenu(page, `${baseUrl}/?debug=1`);
  await hideDebug(page);
  await callGame(page, (game) => game.startPhase('phase-1'));
  await page.locator('.hud').waitFor({ state: 'visible' });
  await page.waitForTimeout(1000);
  await crop(page, 'move-launch.png', 580);
  await context.close();
}

// 2. Level up: the three-card overlay, cropped from the current build.
{
  const { context, page } = await newPage(PROGRESS_SAVE);
  await waitForMenu(page, `${baseUrl}/?debug=1`);
  await hideDebug(page);
  await callGame(page, (game) => {
    game.startPhase('phase-1');
    game.debugGrantPerk('multiball');
    game.debugGrantPerk('prism_laser');
  });
  await page.locator('.hud').waitFor({ state: 'visible' });
  await page.waitForTimeout(600);
  await callGame(page, (game) => game.debugAddXp(100));
  await page.locator('.levelup:not([hidden])').waitFor({ state: 'visible' });
  await page.waitForTimeout(700);
  await crop(page, 'level-up.png', 218);
  await context.close();
}

// 3. Special blocks: phase 6 wave 1, with every special material on screen.
{
  const { context, page } = await newPage(PROGRESS_SAVE);
  await waitForMenu(page, `${baseUrl}/?debug=1`);
  await hideDebug(page);
  await callGame(page, (game) => {
    game.debugStartWave('phase-6', 0);
    game.setTuning({ ballSpeedScale: 0.84 });
  });
  await page.locator('.hud').waitFor({ state: 'visible' });
  await page.waitForTimeout(3900);
  await launch(page);
  await page.waitForTimeout(1400);
  await crop(page, 'specials.png', 125);
  await context.close();
}

// 4. Boss: Frost Sentinel in phase 2 with shards falling.
{
  const { context, page } = await newPage(PROGRESS_SAVE);
  await waitForMenu(page, `${baseUrl}/?debug=1`);
  await hideDebug(page);
  await callGame(page, (game) => {
    game.setTuning({ ballSpeedScale: 0.8 });
    game.debugStartWave('phase-4', 2);
  });
  await page.locator('.hud__boss').waitFor({ state: 'visible' });
  await page.waitForTimeout(3800);
  await callGame(page, (game) => {
    game.debugGrantPerk('safety_net');
  });
  await launch(page);
  await page.waitForTimeout(900);
  await callGame(page, (game) => {
    game.spawnBall();
    game.spawnBall();
  });
  await page.waitForTimeout(500);
  await callGame(page, (game) => {
    try {
      game.world.damageBossTotal(22);
    } catch {
      // Keep the boss alive even if the debug hook changes.
    }
    if (game.world.boss) game.world.boss.attackTimerMs = 1;
  });
  await page.waitForTimeout(700);
  await callGame(page, (game) => {
    if (game.world.boss) game.world.boss.attackTimerMs = 1;
  });
  await page.waitForTimeout(450);
  const defeated = await page.locator('.overlay--results').isVisible().catch(() => false);
  if (defeated) throw new Error('boss How to Play capture ended before the crop');
  await crop(page, 'boss.png', 76);
  await context.close();
}

// 5. Endless: fresh wave 1 with the Endless HUD.
{
  const { context, page } = await newPage(COMPLETE_SAVE);
  await waitForMenu(page, `${baseUrl}/?debug=1`);
  await hideDebug(page);
  await page.locator('#endless-button').click();
  await page.locator('.hud').waitFor({ state: 'visible' });
  await page.waitForTimeout(900);
  await callGame(page, (game) => game.setTuning({ ballSpeedScale: 0.84 }));
  await launch(page);
  await page.waitForTimeout(1300);
  await crop(page, 'endless.png', 40);
  await context.close();
}

await browser.close();
