#!/usr/bin/env node
/**
 * Captures the nine Bricklike v0.6.1 store screenshots from the production
 * build (npm run build + vite preview).
 *
 * Usage:
 *   npm run build
 *   npx vite preview --port 4180 --strictPort
 *   node store/screenshots/capture-screenshots.mjs --url=http://localhost:4180
 *
 * The debug query flag is used only to reach deterministic gameplay states
 * (early phase-1, level-up, special blocks, boss, Endless, Workshop). The debug
 * panel is hidden with CSS and the `data-debug` attribute is removed before
 * every shot, so no debug control, FPS counter or tuning value appears in the
 * images.
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
const VERSION = '0.6.1';

/**
 * A v2 late-campaign save: tutorial and phase 1 cleared, so the menu shows
 * the campaign in progress, and 42 Sparks with three Workshop unlocks so the
 * progression card has a useful count, balance and progress bar.
 */
const PROGRESS_SAVE = {
  version: 2,
  unlockedPhase: 6,
  phases: {
    tutorial: {
      bestScore: 9800,
      bestTimeMs: 45000,
      attempts: 1,
      clears: 1,
      bestLevel: 4,
    },
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
  meta: {
    sparks: 42,
    unlocks: ['second_chance', 'explosive_core', 'sticky_paddle'],
  },
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

// 1. Menu — v2 progress save, so level 2 is the current campaign step, the
//    seven progress nodes (tutorial + six levels) are visible, and the
//    Workshop card shows its Sparks balance, unlocked count and progress bar.
{
  const { context, page } = await newPage({ save: PROGRESS_SAVE });
  await waitForMenu(page, baseUrl);
  await page.waitForTimeout(1400);
  const version = (await page.locator('.menu__version').textContent())?.trim();
  const status = (await page.locator('.menu__card-status').textContent())?.trim();
  const nodes = await page.locator('.menu__node').count();
  if (version !== `v${VERSION}`) throw new Error(`unexpected menu version ${version}`);
  if (!/level 2/i.test(status ?? '')) throw new Error(`menu does not show level 2: ${status}`);
  if (nodes !== 7) throw new Error(`expected 7 campaign nodes, found ${nodes}`);
  const workshop = {
    visible: await page.locator('#workshop-button').isVisible(),
    icon: await page.locator('.menu__workshop-icon svg').count(),
    sparks: (await page.locator('.menu__workshop-sparks').textContent())?.trim(),
    count: (await page.locator('.menu__workshop-count-value').textContent())?.trim(),
    left: (await page.locator('.menu__workshop-left').textContent())?.trim(),
    fill: await page.locator('.menu__workshop-progress-fill').evaluate(
      (node) => node.style.width,
    ),
    ready: await page.locator('.menu__workshop-ready').isVisible(),
  };
  console.log(`menu workshop: ${JSON.stringify(workshop)}`);
  if (!workshop.visible || workshop.icon === 0) {
    throw new Error('menu Workshop card or icon is missing');
  }
  if (workshop.sparks !== '42 Sparks') {
    throw new Error(`menu Workshop sparks are unexpected: ${workshop.sparks}`);
  }
  if (workshop.count !== '13 / 22' || workshop.left !== '9 left') {
    throw new Error(
      `menu Workshop count is unexpected: ${workshop.count} / ${workshop.left}`,
    );
  }
  if (workshop.fill !== '59.09%') {
    throw new Error(`menu Workshop progress is unexpected: ${workshop.fill}`);
  }
  if (!workshop.ready) throw new Error('menu Workshop Ready badge is missing');
  await shot(page, '01-menu-390x844.png');
  await context.close();
}

// 2. Phase 1 early gameplay — seeded v2 progress save, no tutorial coach mark.
//    The opening brick field, HUD, ball and paddle are all visible.
{
  const { context, page } = await newPage({ save: PROGRESS_SAVE });
  await waitForMenu(page, `${baseUrl}/?debug=1`);
  await hideDebug(page);
  await callGame(page, (game) => {
    game.startPhase('phase-1');
    game.setTuning({ ballSpeedScale: 0.84 });
  });
  await waitForHud(page);
  await page.waitForTimeout(500);
  await launch(page);
  await page.waitForTimeout(1400);
  await movePaddle(page, 0.58);
  await page.waitForTimeout(250);
  const state = await page.evaluate(() => {
    const game = window.__bricklike;
    const balls = game?.world?.balls ?? [];
    return {
      phase: game?.phase,
      balls: balls.length,
      allStuck: balls.length === 0 || balls.every((ball) => ball.stuck),
      blocks: game?.world?.blocks?.length ?? 0,
      tutorialVisible: Boolean(document.querySelector('.hud__tutorial:not([hidden])')),
      levelUpVisible: Boolean(document.querySelector('.levelup:not([hidden])')),
      waveIntroVisible: Boolean(document.querySelector('.hud__wave-intro:not([hidden])')),
    };
  });
  console.log(`phase-1 early shot: ${JSON.stringify(state)}`);
  if (state.phase !== 'playing' || state.balls === 0 || state.allStuck || state.blocks === 0) {
    throw new Error(`phase 1 is not in a playable early state: ${JSON.stringify(state)}`);
  }
  if (state.tutorialVisible || state.levelUpVisible || state.waveIntroVisible) {
    throw new Error(`phase 1 early shot has an overlay: ${JSON.stringify(state)}`);
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

// 9. Workshop — opened from the v2 progress menu, scrolled to the bottom so
//    every Tier 4 card (Overkill, Shield Bash, Conductor) is visible.
{
  const { context, page } = await newPage({ save: PROGRESS_SAVE });
  await waitForMenu(page, `${baseUrl}/?debug=1`);
  await hideDebug(page);
  await page.locator('#workshop-button').click();
  await page.locator('.workshop:not([hidden])').waitFor({ state: 'visible' });
  await page.waitForTimeout(300);
  const tiers = await page.locator('.workshop__tier').count();
  if (tiers !== 4) throw new Error(`expected 4 Workshop tiers, found ${tiers}`);
  // The four tiers are taller than the list viewport, but Tier 4 is the last
  // content, so a normal max scroll leaves Tier 3 above it. A temporary bottom
  // spacer gives the real list enough scroll range to put the Tier 4 heading
  // at the top of the viewport; the cards themselves are untouched.
  const scroll = await page.locator('.workshop__list').evaluate((list) => {
    const tier = list.querySelector('.workshop__tier:last-child');
    if (!tier) return null;
    const listRect = list.getBoundingClientRect();
    const tierRect = tier.getBoundingClientRect();
    const headingOffset = tierRect.top - listRect.top + list.scrollTop;
    const spacer = Math.max(0, Math.ceil(list.clientHeight - tierRect.height) + 2);
    list.style.paddingBottom = `${spacer}px`;
    list.scrollTop = Math.max(0, Math.round(headingOffset));
    return { headingOffset, spacer, scrollTop: list.scrollTop };
  });
  console.log(`workshop tier 4 scroll: ${JSON.stringify(scroll)}`);
  await page.waitForTimeout(350);
  const tier4 = page.locator('.workshop__tier').last();
  const tier4Names = (await tier4.locator('.workshop__card-name').allTextContents()).map(
    (name) => name.trim(),
  );
  const bounds = await tier4.evaluate((tier) => {
    const list = document.querySelector('.workshop__list');
    if (!list) return null;
    const tierRect = tier.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    const headingRect = tier
      .querySelector('.workshop__tier-title')
      ?.getBoundingClientRect();
    const firstCardRect = tier
      .querySelector('.workshop__card')
      ?.getBoundingClientRect();
    return {
      top: Math.round(tierRect.top),
      bottom: Math.round(tierRect.bottom),
      listTop: Math.round(listRect.top),
      listBottom: Math.round(listRect.bottom),
      headingTop: headingRect ? Math.round(headingRect.top) : null,
      firstCardTop: firstCardRect ? Math.round(firstCardRect.top) : null,
    };
  });
  const pinned = {
    head: await page.locator('.workshop__head').isVisible(),
    sparks: (await page.locator('#workshop-sparks').textContent())?.trim(),
  };
  console.log(
    `workshop tier 4: ${JSON.stringify(tier4Names)} ${JSON.stringify(bounds)} ${JSON.stringify(pinned)}`,
  );
  if (!['Overkill', 'Shield Bash', 'Conductor'].every((name) => tier4Names.includes(name))) {
    throw new Error(`Tier 4 cards are incomplete: ${tier4Names.join(', ')}`);
  }
  if (!pinned.head || pinned.sparks !== '42 Sparks') {
    throw new Error(`Workshop header/sparks are not pinned: ${JSON.stringify(pinned)}`);
  }
  if (!bounds || Math.abs(bounds.top - bounds.listTop) > 1) {
    throw new Error(`Tier 4 heading is not at the list top: ${JSON.stringify(bounds)}`);
  }
  if (bounds.bottom > bounds.listBottom + 1) {
    throw new Error(`Tier 4 is not fully visible in the Workshop list: ${JSON.stringify(bounds)}`);
  }
  if (
    bounds.headingTop === null ||
    bounds.firstCardTop === null ||
    bounds.headingTop < bounds.listTop - 1 ||
    bounds.firstCardTop < bounds.listTop - 1
  ) {
    throw new Error(`Tier 4 heading or Overkill is clipped: ${JSON.stringify(bounds)}`);
  }
  await shot(page, '09-workshop-tier4-390x844.png');
  await context.close();
}

await browser.close();
