#!/usr/bin/env node
/**
 * Captures the eight Bricklike v0.5.0 store screenshots from the production
 * build (npm run build + vite preview).
 *
 * Usage:
 *   npm run build
 *   npx vite preview --port 4180 --strictPort
 *   node store/screenshots/capture-screenshots.mjs --url=http://localhost:4180
 *
 * The debug query flag is used only to reach deterministic gameplay states
 * (tutorial step, level-up, special blocks, boss, Endless). The debug panel is
 * hidden with CSS and the `data-debug` attribute is removed before every shot,
 * so no debug control, FPS counter or tuning value appears in the images.
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
const VERSION = '0.5.0';

/** A late-campaign save with a plausible phase-1 best for the results card. */
const PROGRESS_SAVE = {
  version: 1,
  unlockedPhase: 6,
  phases: {
    'phase-1': {
      bestScore: 24800,
      bestTimeMs: 12000,
      attempts: 3,
      clears: 1,
      bestLevel: 7,
    },
  },
  endless: { bestWave: 12, bestScore: 34500, runs: 8 },
  campaignComplete: false,
  updatedAt: Date.now(),
};

/** Full save: Endless unlocked and a visible record on the menu. */
const COMPLETE_SAVE = {
  ...PROGRESS_SAVE,
  campaignComplete: true,
  updatedAt: Date.now(),
};

async function newPage(options = {}) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    hasTouch: true,
    isMobile: true,
  });
  if (options.save) {
    await context.addInitScript((save) => {
      localStorage.setItem('bb.save', JSON.stringify(save));
    }, options.save);
  }
  const page = await context.newPage();
  return { context, page };
}

async function hideDebug(page) {
  // The panel stays in the DOM so its deterministic commands keep working;
  // only its pixels and the debug layout attribute are removed.
  await page.addStyleTag({
    content:
      '.debug{display:none!important;visibility:hidden!important}' +
      'html,body,canvas{cursor:none!important}',
  });
  await page.evaluate(() => {
    delete document.documentElement.dataset.debug;
  });
}

async function waitForMenu(page, url) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.locator('#campaign-button').waitFor({ state: 'visible' });
  await page.waitForFunction(() => !document.querySelector('#boot-screen'), {
    timeout: 15000,
  }).catch(() => null);
  await page.evaluate(() => document.fonts.ready);
}

async function waitForHud(page) {
  await page.locator('.hud').waitFor({ state: 'visible' });
  await page.waitForTimeout(500);
}

async function shot(page, name) {
  await page.screenshot({ path: join(outDir, name), animations: 'disabled' });
  console.log(`captured ${name}`);
}

async function callGame(page, fn, arg) {
  return page.evaluate(
    ({ source, argument }) => {
      const game = window.__bricklike;
      if (!game) throw new Error('window.__bricklike is not available');
      // eslint-disable-next-line no-new-func
      return new Function('game', 'arg', `return (${source})(game, arg);`)(game, argument);
    },
    { source: fn.toString(), argument: arg },
  );
}

async function launch(page) {
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  if (box) await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.64);
  await page.keyboard.press('v');
  for (let attempt = 0; attempt < 18; attempt += 1) {
    const stuck = await page.evaluate(() => {
      const game = window.__bricklike;
      const balls = game?.world?.balls ?? [];
      return balls.length === 0 || balls.every((ball) => ball.stuck);
    });
    if (!stuck) return true;
    await page.waitForTimeout(100);
    await page.keyboard.press('v');
  }
  return false;
}

async function movePaddle(page, xRatio = 0.5) {
  const box = await page.locator('canvas').boundingBox();
  if (!box) return;
  await page.mouse.move(box.x + box.width * xRatio, box.y + box.height * 0.9);
}

/** Resolve any open level-up cards so the next capture is not blocked. */
async function resolveLevelUps(page, maximum = 8) {
  for (let index = 0; index < maximum; index += 1) {
    const open = await page.locator('.levelup:not([hidden])').isVisible().catch(() => false);
    if (!open) return;
    await page.keyboard.press('1');
    await page.waitForTimeout(350);
  }
}

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();

// 1. Menu — fresh save, so the tutorial is the current campaign step and the
//    seven progress nodes (tutorial + six levels) are all visible.
{
  const { context, page } = await newPage();
  await waitForMenu(page, `${baseUrl}/?resetSave=1`);
  await page.waitForTimeout(1400);
  const version = (await page.locator('.menu__version').textContent())?.trim();
  const status = (await page.locator('.menu__card-status').textContent())?.trim();
  const nodes = await page.locator('.menu__node').count();
  if (version !== `v${VERSION}`) throw new Error(`unexpected menu version ${version}`);
  if (!/tutorial/i.test(status ?? '')) throw new Error(`menu does not show tutorial: ${status}`);
  if (nodes !== 7) throw new Error(`expected 7 campaign nodes, found ${nodes}`);
  await shot(page, '01-menu-390x844.png');
  await context.close();
}

// 2. Tutorial / opening gameplay — coach mark step 2 with the ball in play.
{
  const { context, page } = await newPage();
  await waitForMenu(page, `${baseUrl}/?debug=1&resetSave=1`);
  await hideDebug(page);
  await callGame(page, (game) => game.startPhase('tutorial'));
  await waitForHud(page);
  await page.waitForTimeout(900);
  await launch(page);
  await page.waitForTimeout(950);
  await movePaddle(page, 0.62);
  await page.waitForTimeout(250);
  const coach = (await page.locator('.hud__tutorial-title').textContent())?.trim();
  if (!/break & level up/i.test(coach ?? '')) {
    throw new Error(`tutorial coach mark is not on step 2: ${coach}`);
  }
  await shot(page, '02-gameplay-early-390x844.png');
  await context.close();
}

// 3-5 share one assisted phase-1 run so the level-up and results match the
// gameplay shown immediately before them.
{
  const { context, page } = await newPage({ save: PROGRESS_SAVE });
  await waitForMenu(page, `${baseUrl}/?debug=1`);
  await hideDebug(page);
  await callGame(page, (game) => {
    game.startPhase('phase-1');
    game.setTuning({ ballSpeedScale: 0.84 });
    game.debugGrantPerk('multiball');
    game.debugGrantPerk('prism_laser');
    game.debugGrantPerk('wide_paddle');
  });
  await waitForHud(page);
  await page.waitForTimeout(500);
  await launch(page);
  await page.waitForTimeout(1400);
  await callGame(page, (game) => {
    game.spawnBall();
    game.spawnBall();
  });
  await page.waitForTimeout(650);
  await movePaddle(page, 0.5);
  await page.waitForTimeout(250);

  // 3. Prism Laser + Multiball. The 180 ms beam is held in the world only for
  //    the still so the real rendered beam is guaranteed to be visible.
  const fired = await callGame(page, (game) => {
    const ok = game.world.fireLaser();
    if (ok && game.world.laserBeamFx) {
      game.world.laserBeamFx.remainingMs = 5000;
    }
    return ok;
  });
  if (!fired) throw new Error('could not fire the Prism Laser for the screenshot');
  await page.waitForTimeout(70);
  const balls = await page.locator('.hud__ball.is-on').count();
  console.log(`laser shot: active ball HUD dots = ${balls}`);
  await shot(page, '03-gameplay-laser-multiball-390x844.png');

  // 4. Level-up with three cards.
  await page.waitForTimeout(450);
  await callGame(page, (game) => game.debugAddXp(100));
  await page.locator('.levelup:not([hidden])').waitFor({ state: 'visible' });
  await page.waitForTimeout(750);
  const cards = await page.locator('.levelup:not([hidden]) .levelup__card').count().catch(() => 0);
  console.log(`level-up cards visible: ${cards}`);
  await shot(page, '04-levelup-three-cards-390x844.png');
  await resolveLevelUps(page);

  // 5. Victory / results from the same run. Play with the assisted build for a
  //    few seconds, then finish the phase through the deterministic debug hook.
  await callGame(page, (game) => {
    game.debugGrantPerk('safety_net');
    game.debugGrantPerk('critical_strike');
  });
  const started = Date.now();
  let step = 0;
  while (Date.now() - started < 16_000) {
    const elapsed = (Date.now() - started) / 1000;
    await movePaddle(page, 0.22 + ((Math.sin(elapsed * 1.5) + 1) / 2) * 0.56);
    if (step % 2 === 0) {
      await callGame(page, (game) => {
        if (game.world.laserReady) game.world.fireLaser();
      });
    }
    if (step % 5 === 0) {
      await callGame(page, (game) => {
        if (game.world.balls.length < 3) game.spawnBall();
      });
    }
    await resolveLevelUps(page, 2);
    await page.waitForTimeout(220);
    step += 1;
  }
  const results = page.locator('.overlay--results');
  if (!(await results.isVisible().catch(() => false))) {
    await callGame(page, (game) => game.debugVictory());
  }
  await results.waitFor({ state: 'visible' });
  await page.waitForTimeout(750);
  const kicker = (await page.locator('#overlay-results-kicker').textContent())?.trim();
  if (!/victory/i.test(kicker ?? '')) throw new Error(`results are not a victory: ${kicker}`);
  await shot(page, '05-results-victory-390x844.png');
  await context.close();
}

// 6. Special blocks — phase 6, wave 1 (Void Confluence) contains every special
//    block type plus the portal pair.
{
  const { context, page } = await newPage({ save: PROGRESS_SAVE });
  await waitForMenu(page, `${baseUrl}/?debug=1`);
  await hideDebug(page);
  await callGame(page, (game) => {
    game.debugStartWave('phase-6', 0);
    game.setTuning({ ballSpeedScale: 0.84 });
  });
  await waitForHud(page);
  // Let the wave intro banner leave before the shot.
  await page.waitForTimeout(3900);
  await launch(page);
  await page.waitForTimeout(900);
  await callGame(page, (game) => {
    game.spawnBall();
    game.spawnBall();
  });
  await page.waitForTimeout(650);
  await movePaddle(page, 0.5);
  await page.waitForTimeout(300);
  await shot(page, '06-special-blocks-390x844.png');
  await context.close();
}

// 7. Frost Sentinel — phase 4, wave 3, with a damaged boss and shards falling.
{
  const { context, page } = await newPage({ save: PROGRESS_SAVE });
  await waitForMenu(page, `${baseUrl}/?debug=1`);
  await hideDebug(page);
  await callGame(page, (game) => {
    game.setTuning({ ballSpeedScale: 0.8 });
    game.debugStartWave('phase-4', 2);
  });
  await page.locator('.hud__boss').waitFor({ state: 'visible' });
  // The intro banner lasts 3.5 s; keep it out of the screenshot.
  await page.waitForTimeout(3800);
  await launch(page);
  await page.waitForTimeout(1000);
  await callGame(page, (game) => {
    game.debugGrantPerk('safety_net');
    game.spawnBall();
    game.spawnBall();
  });
  await page.waitForTimeout(700);
  // Show a damaged boss in phase 2 and trigger a real shard attack.
  await callGame(page, (game) => {
    try {
      game.world.damageBossTotal(22);
    } catch {
      // Fall through: the HP bar still shows the full boss if the hook changes.
    }
    if (game.world.boss) game.world.boss.attackTimerMs = 1;
  });
  await page.waitForTimeout(700);
  await callGame(page, (game) => {
    if (game.world.boss) game.world.boss.attackTimerMs = 1;
  });
  await page.waitForTimeout(450);
  await movePaddle(page, 0.42);
  await page.waitForTimeout(250);
  const bossState = await page.evaluate(() => {
    const game = window.__bricklike;
    return {
      hp: game.world.boss?.hp ?? null,
      maxHp: game.world.boss?.maxHp ?? null,
      shards: game.world.bossShards.length,
      balls: game.world.balls.length,
    };
  });
  console.log(`boss shot: ${JSON.stringify(bossState)}`);
  await shot(page, '07-boss-frost-sentinel-390x844.png');
  await context.close();
}

// 8. Endless — full save, fresh Endless wave 1 with its own HUD.
{
  const { context, page } = await newPage({ save: COMPLETE_SAVE });
  await waitForMenu(page, `${baseUrl}/?debug=1`);
  await hideDebug(page);
  await page.locator('#endless-button').click();
  await waitForHud(page);
  await page.waitForTimeout(1100);
  await callGame(page, (game) => game.setTuning({ ballSpeedScale: 0.84 }));
  await launch(page);
  await page.waitForTimeout(1300);
  await movePaddle(page, 0.58);
  await page.waitForTimeout(250);
  const endless = (await page.locator('.hud__wave-text').textContent().catch(() => ''))?.trim();
  console.log(`endless shot: ${endless}`);
  await shot(page, '08-endless-wave-1-390x844.png');
  await context.close();
}

await browser.close();
