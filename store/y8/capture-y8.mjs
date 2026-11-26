#!/usr/bin/env node
/**
 * Generates the Y8.com store asset set from the production build.
 *
 * Usage:
 *   npm run build
 *   npx vite preview --port 4180 --strictPort
 *   node store/y8/capture-y8.mjs                 # stills, promos, cards, video
 *   node store/y8/capture-y8.mjs --only=stills   # standard + widescreen
 *   node store/y8/capture-y8.mjs --only=promos   # landscape + portrait promos
 *   node store/y8/capture-y8.mjs --only=cards    # 760x570 game cards
 *   node store/y8/capture-y8.mjs --only=video    # continuous 1280x720 MP4
 *
 * Requirements: the production preview, Playwright Chromium and ffmpeg/ffprobe.
 * Every screenshot is a real 0.8.0 build capture. The debug panel is hidden and
 * `data-debug` is removed before each shot; debug hooks are used only to reach
 * deterministic scenes.
 */
import { spawnSync } from 'node:child_process';
import {
  copyFile,
  mkdir,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
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
const only = arg('only', 'all');
if (!['all', 'stills', 'promos', 'cards', 'video'].includes(only)) {
  throw new Error('--only must be all, stills, promos, cards or video');
}

const VERSION = '0.8.0';
const OUT = here;
const WORK = join(repo, '.qa/y8-work');
const DIRS = {
  standard: join(OUT, 'standard'),
  widescreen: join(OUT, 'widescreen'),
  landscape: join(OUT, 'landscape-promo'),
  portrait: join(OUT, 'portrait-promo'),
  cards: join(OUT, 'game-card'),
  video: join(OUT, 'video'),
};

const PROGRESS_SAVE = {
  version: 3,
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

const browser = await chromium.launch();

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

async function waitForMenu(page, url) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.locator('#campaign-button').waitFor({ state: 'visible' });
  await page.waitForFunction(() => !document.querySelector('#boot-screen'), {
    timeout: 15000,
  }).catch(() => null);
  await page.evaluate(() => document.fonts.ready);
}

async function newPage({ width, height, dpr = 1, debug = true }) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: dpr,
  });
  await context.addInitScript((save) => {
    localStorage.setItem('bb.save', JSON.stringify(save));
  }, PROGRESS_SAVE);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await waitForMenu(page, `${baseUrl}/${debug ? '?debug=1' : ''}`);
  if (debug) await hideDebug(page);
  await page.waitForTimeout(500);
  const version = (await page.locator('.menu__version').textContent())?.trim();
  if (version !== `v${VERSION}`) throw new Error(`unexpected menu version ${version}`);
  return { context, page, errors };
}

async function callGame(page, fn, argument) {
  return page.evaluate(
    ({ source, value }) => {
      const game = window.__bricklike;
      if (!game) throw new Error('window.__bricklike is not available');
      // eslint-disable-next-line no-new-func
      return new Function('game', 'arg', `return (${source})(game, arg);`)(game, value);
    },
    { source: fn.toString(), value: argument },
  );
}

async function launch(page) {
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  if (box) await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.64);
  await page.keyboard.press('v');
  for (let attempt = 0; attempt < 18; attempt += 1) {
    const stuck = await page.evaluate(() => {
      const balls = window.__bricklike?.world?.balls ?? [];
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

async function waitForHud(page) {
  await page.locator('.hud').waitFor({ state: 'visible' });
  await page.waitForTimeout(500);
}

const SCENES = {
  menu: async (page) => {
    await page.waitForTimeout(1200);
  },
  'phase-select': async (page) => {
    await page.locator('#campaign-button').click();
    await page.locator('.phase-select:not([hidden])').waitFor({ state: 'visible' });
    await page.waitForTimeout(500);
    const node = page.locator('.phase-node[data-phase-id="phase-2"]');
    if (await node.isVisible().catch(() => false)) {
      await node.evaluate((element) =>
        element.scrollIntoView({ block: 'center', behavior: 'instant' }),
      );
      await node.click();
      await page.locator('.phase-sheet__play').waitFor({ state: 'visible' }).catch(() => null);
    }
    await page.waitForTimeout(400);
  },
  gameplay: async (page) => {
    await callGame(page, (game) => {
      game.startPhase('phase-1');
      game.setTuning({ ballSpeedScale: 0.84 });
    });
    await waitForHud(page);
    await page.waitForTimeout(500);
    await launch(page);
    await page.waitForTimeout(1500);
    await movePaddle(page, 0.58);
    await page.waitForTimeout(250);
  },
  'laser-multiball': async (page) => {
    await callGame(page, (game) => {
      game.startPhase('phase-1');
      game.setTuning({ ballSpeedScale: 0.84 });
      game.debugGrantPerk('multiball');
      game.debugGrantPerk('prism_laser');
      game.debugGrantPerk('wide_paddle');
    });
    await waitForHud(page);
    await page.waitForTimeout(400);
    await launch(page);
    await page.waitForTimeout(1300);
    await callGame(page, (game) => {
      game.spawnBall();
      game.spawnBall();
    });
    await page.waitForTimeout(600);
    const fired = await callGame(page, (game) => {
      const ok = game.world.fireLaser();
      if (ok && game.world.laserBeamFx) game.world.laserBeamFx.remainingMs = 5000;
      return ok;
    });
    if (!fired) throw new Error('could not fire the Prism Laser');
    await page.waitForTimeout(80);
    await movePaddle(page, 0.5);
    await page.waitForTimeout(200);
  },
  boss: async (page) => {
    await callGame(page, (game) => {
      game.setTuning({ ballSpeedScale: 0.8 });
      game.debugStartWave('phase-4', 2);
    });
    await page.locator('.hud__boss').waitFor({ state: 'visible', timeout: 8000 });
    await page.waitForTimeout(3800);
    await launch(page);
    await page.waitForTimeout(900);
    await callGame(page, (game) => {
      game.debugGrantPerk('safety_net');
      game.spawnBall();
      game.spawnBall();
    });
    await page.waitForTimeout(600);
    await callGame(page, (game) => {
      try {
        game.world.damageBossTotal(22);
      } catch {
        // The HP bar still shows the boss if the debug hook changes.
      }
      if (game.world.boss) game.world.boss.attackTimerMs = 1;
    });
    await page.waitForTimeout(650);
    await callGame(page, (game) => {
      if (game.world.boss) game.world.boss.attackTimerMs = 1;
    });
    await page.waitForTimeout(450);
    await movePaddle(page, 0.42);
    await page.waitForTimeout(200);
  },
  levelup: async (page) => {
    await callGame(page, (game) => {
      game.startPhase('phase-1');
      game.setTuning({ ballSpeedScale: 0.84 });
    });
    await waitForHud(page);
    await page.waitForTimeout(400);
    await callGame(page, (game) => game.debugAddXp(100));
    await page.locator('.levelup:not([hidden])').waitFor({ state: 'visible' });
    await page.waitForTimeout(700);
  },
};

async function shot(page, path) {
  await page.screenshot({ path, animations: 'disabled' });
  const size = (await stat(path)).size;
  console.log(`captured ${path.replace(`${repo}/`, '')} (${(size / 1024).toFixed(1)} KiB)`);
  return size;
}

async function captureSet({ dir, label, width, height, dpr = 1, scenes, maxBytes }) {
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const fileWidth = width * dpr;
  const fileHeight = height * dpr;

  for (let index = 0; index < scenes.length; index += 1) {
    const scene = scenes[index];
    const { context, page, errors } = await newPage({ width, height, dpr });
    try {
      await SCENES[scene](page);
      const file = join(
        dir,
        `${String(index + 1).padStart(2, '0')}-${scene}-${fileWidth}x${fileHeight}.png`,
      );
      const size = await shot(page, file);
      if (size > maxBytes) {
        throw new Error(`${file} is ${(size / 1024 / 1024).toFixed(2)} MiB; limit is ${maxBytes / 1024 / 1024} MiB`);
      }
      if (errors.length > 0) {
        throw new Error(`${label}/${scene} had page errors: ${errors.join(' | ')}`);
      }
    } finally {
      await context.close();
    }
  }
}

async function copyCover(source, destination) {
  await copyFile(source, destination);
  const size = (await stat(destination)).size;
  console.log(`copied ${destination.replace(`${repo}/`, '')} (${(size / 1024).toFixed(1)} KiB)`);
}

async function makeCards() {
  await rm(DIRS.cards, { recursive: true, force: true });
  await mkdir(DIRS.cards, { recursive: true });
  const font = (await readFile(join(repo, 'src/assets/fonts/Silkscreen-Bold.ttf'))).toString('base64');
  const sources = [
    ['gameplay', join(WORK, 'portrait-gameplay.png')],
    ['laser-multiball', join(WORK, 'portrait-laser-multiball.png')],
    ['boss', join(WORK, 'portrait-boss.png')],
  ];

  const page = await browser.newPage({ viewport: { width: 760, height: 570 } });
  for (let index = 0; index < sources.length; index += 1) {
    const [scene, source] = sources[index];
    const image = (await readFile(source)).toString('base64');
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      @font-face{font-family:Silkscreen;src:url(data:font/ttf;base64,${font}) format('truetype')}
      *{box-sizing:border-box}html,body{margin:0;width:760px;height:570px;overflow:hidden;background:#04070f;font-family:Silkscreen,monospace}
      .scene{position:absolute;inset:-24px;background-image:url(data:image/png;base64,${image});background-position:center;background-size:cover;filter:blur(18px) brightness(.3) saturate(1.25);transform:scale(1.06)}
      .veil{position:absolute;inset:0;background:radial-gradient(circle at 28% 42%,rgba(26,138,160,.24),transparent 55%),linear-gradient(90deg,rgba(3,7,16,.98) 0%,rgba(3,7,16,.88) 48%,rgba(3,7,16,.3) 100%)}
      .scan{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(126,249,255,.045) 0 1px,transparent 1px 3px);opacity:.55}
      .copy{position:absolute;left:40px;top:108px;width:360px;color:#dff8ff}
      .kicker{font-size:12px;letter-spacing:.22em;color:#7ef9ff}
      .title{margin-top:10px;font-size:54px;line-height:.95;letter-spacing:.01em;color:#eaffff;text-shadow:0 0 18px rgba(126,249,255,.35),0 5px 0 #0a2a36}
      .title b{color:#b388ff;font-weight:400}
      .tagline{margin-top:18px;font-size:14px;line-height:1.55;color:#9fd8e8}
      .meta{margin-top:22px;font-size:10px;letter-spacing:.14em;color:#ffd479}
      .card{position:absolute;right:42px;top:28px;width:286px;height:514px;border:2px solid rgba(126,249,255,.55);border-radius:18px;overflow:hidden;box-shadow:0 18px 40px rgba(0,0,0,.55),0 0 28px rgba(126,249,255,.22);background:#05070f}
      .card img{display:block;width:100%;height:100%;object-fit:cover}
      .card:after{content:'';position:absolute;inset:0;border-radius:16px;box-shadow:inset 0 0 30px rgba(0,0,0,.45)}
      .badge{position:absolute;left:40px;bottom:34px;font-size:9px;letter-spacing:.16em;color:#7ef9ff;opacity:.85}
    </style></head><body>
      <div class="scene"></div><div class="veil"></div><div class="scan"></div>
      <div class="copy"><div class="kicker">ARCADE · ROGUELITE</div><div class="title">BRICK<b>LIKE</b></div><div class="tagline">Break the field.<br>Build the run.</div><div class="meta">3 WORLDS · 18 LEVELS · ENDLESS</div></div>
      <div class="card"><img src="data:image/png;base64,${image}"></div>
      <div class="badge">MOVE · LAUNCH · FIRE</div>
    </body></html>`;
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(200);
    const file = join(
      DIRS.cards,
      `${String(index + 1).padStart(2, '0')}-${scene}-760x570.png`,
    );
    await shot(page, file);
  }
  await page.close();
}

async function recordVideo() {
  await rm(DIRS.video, { recursive: true, force: true });
  await mkdir(DIRS.video, { recursive: true });
  await rm(WORK, { recursive: true, force: true });
  await mkdir(WORK, { recursive: true });

  const width = 1280;
  const height = 720;
  const contextStartedAt = Date.now();
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    recordVideo: { dir: WORK, size: { width, height } },
  });
  await context.addInitScript((save) => {
    localStorage.setItem('bb.save', JSON.stringify(save));
  }, PROGRESS_SAVE);
  const page = await context.newPage();
  await waitForMenu(page, `${baseUrl}/?debug=1`);
  await hideDebug(page);
  await callGame(page, (game) => {
    game.startPhase('phase-1');
    game.setTuning({ ballSpeedScale: 0.78 });
    game.debugGrantPerk('safety_net');
  });
  await waitForHud(page);
  await page.waitForTimeout(500);
  await launch(page);
  const gameplayStartedAt = Date.now();

  const deadline = gameplayStartedAt + 32_000;
  let step = 0;
  while (Date.now() < deadline) {
    const state = await page.evaluate(() => {
      const game = window.__bricklike;
      if (!game) return null;
      const ball = game.world?.balls?.[0];
      return {
        phase: game.phase,
        ball: ball ? { x: ball.x, stuck: ball.stuck } : null,
        levelUp: Boolean(document.querySelector('.levelup:not([hidden])')),
      };
    });
    if (state?.levelUp) {
      await page.keyboard.press('1');
      await page.waitForTimeout(350);
      continue;
    }
    if (state?.ball) {
      await movePaddle(page, Math.max(0.08, Math.min(0.92, state.ball.x / 720)));
      if (state.ball.stuck) await page.keyboard.press('v');
    } else if (step % 4 === 0) {
      await callGame(page, (game) => game.spawnBall());
    }
    if (step % 16 === 0) {
      await callGame(page, (game) => {
        if (game.world.balls.length < 2) game.spawnBall();
      });
    }
    await page.waitForTimeout(220);
    step += 1;
  }

  const prepSeconds = (gameplayStartedAt - contextStartedAt) / 1000;
  const video = page.video();
  await context.close();
  const raw = await video.path();
  const out = join(DIRS.video, 'bricklike-gameplay-y8-1280x720.mp4');
  const trimStart = Math.max(0, prepSeconds + 0.2);
  const result = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-ss', trimStart.toFixed(2),
      '-i', raw,
      '-t', '30',
      '-vf', 'scale=1280:720',
      '-r', '30',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '22',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-an',
      out,
    ],
    { encoding: 'utf8' },
  );
  if (result.status !== 0) {
    console.error(result.stderr?.slice(-4000));
    throw new Error('ffmpeg could not encode the continuous Y8 gameplay video');
  }
  const probe = spawnSync(
    'ffprobe',
    [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height:format=duration,size',
      '-of', 'json',
      out,
    ],
    { encoding: 'utf8' },
  );
  if (probe.status !== 0) throw new Error('ffprobe could not read the Y8 video');
  const info = JSON.parse(probe.stdout);
  const bytes = (await stat(out)).size;
  console.log(`video ${out.replace(`${repo}/`, '')}: ${JSON.stringify(info.format)} ${JSON.stringify(info.streams?.[0])}`);
  if (bytes > 50 * 1024 * 1024) throw new Error('Y8 video exceeds 50 MB');
  if (Number(info.format.duration) < 15) throw new Error('Y8 video is shorter than 15 s');
}

await mkdir(WORK, { recursive: true });
for (const dir of Object.values(DIRS)) await mkdir(dir, { recursive: true });

if (only === 'all' || only === 'stills') {
  await captureSet({
    dir: DIRS.standard,
    label: 'standard',
    width: 760,
    height: 570,
    scenes: ['menu', 'phase-select', 'gameplay', 'laser-multiball', 'boss', 'levelup'],
    maxBytes: 2 * 1024 * 1024,
  });
  await captureSet({
    dir: DIRS.widescreen,
    label: 'widescreen',
    width: 1280,
    height: 720,
    scenes: ['menu', 'phase-select', 'gameplay', 'laser-multiball', 'boss', 'levelup'],
    maxBytes: 5 * 1024 * 1024,
  });
}

if (only === 'all' || only === 'promos') {
  await rm(DIRS.landscape, { recursive: true, force: true });
  await mkdir(DIRS.landscape, { recursive: true });
  await rm(DIRS.portrait, { recursive: true, force: true });
  await mkdir(DIRS.portrait, { recursive: true });

  await copyCover(
    join(repo, 'store/covers/cover-landscape-1920x1080.png'),
    join(DIRS.landscape, '01-key-art-1920x1080.png'),
  );
  await captureSet({
    dir: join(WORK, 'landscape-promo'),
    label: 'landscape-promo',
    width: 1920,
    height: 1080,
    scenes: ['gameplay', 'boss'],
    maxBytes: 5 * 1024 * 1024,
  });
  for (const [index, scene] of ['gameplay', 'boss'].entries()) {
    await copyFile(
      join(WORK, 'landscape-promo', `${String(index + 1).padStart(2, '0')}-${scene}-1920x1080.png`),
      join(DIRS.landscape, `${String(index + 2).padStart(2, '0')}-${scene}-1920x1080.png`),
    );
  }

  await copyCover(
    join(repo, 'store/covers/cover-portrait-1080x1920.png'),
    join(DIRS.portrait, '01-key-art-1080x1920.png'),
  );
  await captureSet({
    dir: join(WORK, 'portrait-promo'),
    label: 'portrait-promo',
    width: 540,
    height: 960,
    dpr: 2,
    scenes: ['gameplay', 'boss'],
    maxBytes: 5 * 1024 * 1024,
  });
  for (const [index, scene] of ['gameplay', 'boss'].entries()) {
    await copyFile(
      join(WORK, 'portrait-promo', `${String(index + 1).padStart(2, '0')}-${scene}-1080x1920.png`),
      join(DIRS.portrait, `${String(index + 2).padStart(2, '0')}-${scene}-1080x1920.png`),
    );
  }
}

if (only === 'all' || only === 'cards') {
  // Portrait card sources, captured at a full-bleed 1080x1920.
  await captureSet({
    dir: join(WORK, 'portrait-cards'),
    label: 'portrait-cards',
    width: 540,
    height: 960,
    dpr: 2,
    scenes: ['gameplay', 'laser-multiball', 'boss'],
    maxBytes: 5 * 1024 * 1024,
  });
  for (const [index, scene] of ['gameplay', 'laser-multiball', 'boss'].entries()) {
    await copyFile(
      join(WORK, 'portrait-cards', `${String(index + 1).padStart(2, '0')}-${scene}-1080x1920.png`),
      join(WORK, `portrait-${scene}.png`),
    );
  }
  await makeCards();
}

if (only === 'all' || only === 'video') {
  await recordVideo();
}

await browser.close();
console.log(`[y8] done (${only})`);
