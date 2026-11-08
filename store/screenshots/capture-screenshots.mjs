#!/usr/bin/env node
/**
 * Captures the five store screenshots from the production build.
 *
 * Usage:
 *   npm run build
 *   npx vite preview --port 4180 --strictPort
 *   node store/screenshots/capture-screenshots.mjs --url http://localhost:4180
 *
 * The debug query flag is used only to reach deterministic states (level-up,
 * victory, forced perks). The debug panel itself is hidden before every shot,
 * so no debug control or counter appears in the images.
 */
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here);
const args = process.argv.slice(2);
const urlArg = args.find((arg) => arg.startsWith('--url='));
const baseUrl = (urlArg ? urlArg.slice(6) : 'http://localhost:4180').replace(/\/$/, '');

const VIEWPORT = { width: 390, height: 844 };

async function hideDebug(page) {
  // The panel remains in the DOM for driving state; only its pixels are hidden.
  // Removing the debug attribute also restores the normal HUD/menu chrome that
  // the debug layout intentionally suppresses.
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

async function shot(page, name) {
  await page.screenshot({ path: join(outDir, name), animations: 'disabled' });
  console.log(`captured ${name}`);
}

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: 1,
  hasTouch: true,
  isMobile: true,
});
const page = await context.newPage();

// 1. Menu. No debug flag is needed for a clean title screen.
await page.goto(`${baseUrl}/?resetSave=1`, { waitUntil: 'networkidle' });
await page.locator('#play-button').waitFor({ state: 'visible' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
await shot(page, '01-menu-390x844.png');

// 2. Opening gameplay: ball in play, formation intact, HUD visible.
await page.goto(`${baseUrl}/?debug=1&resetSave=1`, { waitUntil: 'networkidle' });
await page.locator('#play-button').waitFor({ state: 'visible' });
await hideDebug(page);
await page.locator('#play-button').click();
await page.locator('.hud').waitFor({ state: 'visible' });
await page.locator('canvas').hover({ position: { x: 195, y: 600 } });
await page.keyboard.press('v');
await page.waitForTimeout(1600);
await shot(page, '02-gameplay-early-390x844.png');

// 3. Mid-run power fantasy: Multiball + Prism Laser, laser fired.
await grantPerk(page, 'multiball');
await page.waitForTimeout(250);
await grantPerk(page, 'prism_laser');
await page.waitForTimeout(350);
await page.keyboard.press('e');
await page.waitForTimeout(90);
await shot(page, '03-gameplay-laser-multiball-390x844.png');
await page.waitForTimeout(400);

// 4. Level-up with three perk cards.
await page.waitForTimeout(300);
await clickDebug(page, 'Add XP +100');
await page.locator('.levelup:not([hidden])').waitFor({ state: 'visible' });
await page.waitForTimeout(750);
await shot(page, '04-levelup-three-cards-390x844.png');
// Resolve remaining queued level-ups so the results shot is clean.
for (let i = 0; i < 8; i += 1) {
  const open = await page.locator('.levelup:not([hidden])').isVisible().catch(() => false);
  if (!open) break;
  await page.keyboard.press('1');
  await page.waitForTimeout(350);
}

// 5. Victory / results.
await clickDebug(page, 'Force victory');
await page.locator('.overlay--results').waitFor({ state: 'visible' });
await page.waitForTimeout(650);
await shot(page, '05-results-victory-390x844.png');

await browser.close();
