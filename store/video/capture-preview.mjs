#!/usr/bin/env node
/**
 * Records the Bricklike v0.6.1 preview from the production build.
 *
 * Two portal-ready outputs are composed from the same real gameplay clips:
 *   - bricklike-preview.mp4          1920x1080 (16:9)
 *   - bricklike-preview-portrait.mp4 1080x1620 (2:3)
 *
 * The video shows the title menu with the Workshop progression card, the
 * seven-card campaign selector, the playable tutorial, laser + multiball
 * gameplay, a level-up and the Frost Sentinel boss. It ends on the matching
 * store cover, which carries the BRICKLIKE logo.
 *
 * Usage:
 *   npm run build
 *   npx vite preview --port 4180 --strictPort
 *   node store/video/capture-preview.mjs
 *   node store/video/capture-preview.mjs --format=portrait
 *
 * Requires ffmpeg (libx264) in PATH. Playwright records WebM clips; the final
 * MP4 is silent because Playwright does not capture audio.
 */
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
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
const rawDir = join(repo, '.qa/video-raw-v061');
const segmentRoot = join(repo, '.qa/video-segments-v061');
const coverLandscape = join(repo, 'store/covers/cover-landscape-1920x1080.png');
const coverPortrait = join(repo, 'store/covers/cover-portrait-800x1200.png');

/**
 * A v2 late-campaign save: tutorial and phase 1 cleared, so the menu shows
 * the campaign in progress and the Workshop card has 42 Sparks, three
 * unlocks, a useful count and a visible progress bar.
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

async function movePaddle(page, xRatio) {
  const box = await page.locator('canvas').boundingBox();
  if (!box) return;
  await page.mouse.move(box.x + box.width * xRatio, box.y + box.height * 0.9);
}

async function recordClip(name, prepare, action) {
  const startedAt = Date.now();
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    hasTouch: true,
    isMobile: true,
    recordVideo: { dir: rawDir, size: viewport },
  });
  await context.addInitScript((save) => {
    localStorage.setItem('bb.save', JSON.stringify(save));
  }, PROGRESS_SAVE);
  const page = await context.newPage();
  await prepare(page);
  const prepSeconds = (Date.now() - startedAt) / 1000;
  await action(page);
  const video = page.video();
  await context.close();
  const path = await video.path();
  console.log(`recorded ${name}: ${path} (prep ${prepSeconds.toFixed(2)}s)`);
  return { name, path, prepSeconds };
}

// 1. Title menu. The v2 progress save shows level 2 as the current campaign
//    step and the Workshop progression card with Sparks, unlocks and progress.
const menuClip = await recordClip(
  'menu',
  async (page) => {
    await waitForMenu(page, `${baseUrl}/`);
    await page.locator('#workshop-button').waitFor({ state: 'visible' });
    const workshop = {
      sparks: (await page.locator('.menu__workshop-sparks').textContent())?.trim(),
      count: (await page.locator('.menu__workshop-count-value').textContent())?.trim(),
      left: (await page.locator('.menu__workshop-left').textContent())?.trim(),
    };
    console.log(`menu workshop: ${JSON.stringify(workshop)}`);
    if (workshop.sparks !== '42 Sparks') {
      throw new Error(`menu Workshop sparks are unexpected: ${workshop.sparks}`);
    }
    await page.waitForTimeout(1000);
  },
  async (page) => {
    await page.waitForTimeout(1500);
  },
);

// 2. Campaign selector: the tutorial card plus the six level cards scroll past.
const selectClip = await recordClip(
  'select',
  async (page) => {
    await waitForMenu(page, `${baseUrl}/`);
    await page.locator('#campaign-button').click();
    await page.locator('.phase-select:not([hidden])').waitFor({ state: 'visible' });
    await page.waitForTimeout(600);
  },
  async (page) => {
    // Hold the tutorial card, then scroll to level 6 at a readable pace.
    await page.waitForTimeout(800);
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          const list = document.querySelector('.phase-select__list');
          if (!list) {
            resolve();
            return;
          }
          list.scrollTop = 0;
          const start = performance.now();
          const duration = 1800;
          const step = (now) => {
            const t = Math.min(1, (now - start) / duration);
            list.scrollTop = t * (list.scrollHeight - list.clientHeight);
            if (t < 1) window.requestAnimationFrame(step);
            else resolve();
          };
          window.requestAnimationFrame(step);
        }),
    );
  },
);

// 3. Tutorial: coach mark, launch, then the XP/perk step with the ball in play.
const tutorialClip = await recordClip(
  'tutorial',
  async (page) => {
    await waitForMenu(page, `${baseUrl}/?debug=1&resetSave=1`);
    await hideDebug(page);
    await callGame(page, (game) => game.startPhase('tutorial'));
    await page.locator('.hud').waitFor({ state: 'visible' });
    await page.waitForTimeout(750);
  },
  async (page) => {
    await page.waitForTimeout(500);
    await launch(page);
    await page.waitForTimeout(1050);
    await movePaddle(page, 0.62);
    await page.waitForTimeout(900);
  },
);

// 4. Gameplay: Prism Laser and multiball on the current build.
const gameplayClip = await recordClip(
  'gameplay',
  async (page) => {
    await waitForMenu(page, `${baseUrl}/?debug=1`);
    await hideDebug(page);
    await callGame(page, (game) => {
      game.startPhase('phase-1');
      game.setTuning({ ballSpeedScale: 0.84 });
      game.debugGrantPerk('multiball');
      game.debugGrantPerk('prism_laser');
      game.debugGrantPerk('wide_paddle');
    });
    await page.locator('.hud').waitFor({ state: 'visible' });
    await page.waitForTimeout(450);
    await launch(page);
    await page.waitForTimeout(1000);
    await callGame(page, (game) => {
      game.spawnBall();
      game.spawnBall();
    });
    await page.waitForTimeout(500);
  },
  async (page) => {
    const started = Date.now();
    let step = 0;
    while (Date.now() - started < 4200) {
      const elapsed = (Date.now() - started) / 1000;
      await movePaddle(page, 0.2 + ((Math.sin(elapsed * 1.6) + 1) / 2) * 0.6);
      if (step === 5 || step === 13) {
        await callGame(page, (game) => {
          if (!game.world.laserReady) return;
          const fired = game.world.fireLaser();
          // Hold the real beam for ~0.9 s so the preview can read it.
          if (fired && game.world.laserBeamFx) game.world.laserBeamFx.remainingMs = 900;
        });
      }
      if (step === 9) {
        await callGame(page, (game) => {
          if (game.world.balls.length < 4) game.spawnBall();
        });
      }
      await page.waitForTimeout(220);
      step += 1;
    }
  },
);

// 5. Level-up: the three-card overlay, held long enough to read.
const levelUpClip = await recordClip(
  'levelup',
  async (page) => {
    await waitForMenu(page, `${baseUrl}/?debug=1`);
    await hideDebug(page);
    await callGame(page, (game) => {
      game.startPhase('phase-1');
      game.debugGrantPerk('multiball');
      game.debugGrantPerk('prism_laser');
    });
    await page.locator('.hud').waitFor({ state: 'visible' });
    await page.waitForTimeout(650);
    await callGame(page, (game) => game.debugAddXp(100));
    await page.locator('.levelup:not([hidden])').waitFor({ state: 'visible' });
    await page.waitForTimeout(300);
  },
  async (page) => {
    await page.waitForTimeout(2250);
    await page.keyboard.press('1');
    await page.waitForTimeout(400);
  },
);

// 6. Boss: Frost Sentinel, damaged into phase 2 with real shards falling.
const bossClip = await recordClip(
  'boss',
  async (page) => {
    await waitForMenu(page, `${baseUrl}/?debug=1`);
    await hideDebug(page);
    await callGame(page, (game) => {
      game.setTuning({ ballSpeedScale: 0.8 });
      game.debugStartWave('phase-4', 2);
    });
    await page.locator('.hud__boss').waitFor({ state: 'visible' });
    await page.waitForTimeout(3800);
    await callGame(page, (game) => game.debugGrantPerk('safety_net'));
    await launch(page);
    await page.waitForTimeout(800);
    await callGame(page, (game) => {
      game.spawnBall();
      game.spawnBall();
    });
    await page.waitForTimeout(500);
  },
  async (page) => {
    const started = Date.now();
    let step = 0;
    while (Date.now() - started < 4200) {
      const elapsed = (Date.now() - started) / 1000;
      await movePaddle(page, 0.2 + ((Math.sin(elapsed * 1.4) + 1) / 2) * 0.58);
      if (step === 1) {
        await callGame(page, (game) => {
          try {
            game.world.damageBossTotal(22);
          } catch {
            // Keep the boss alive if the debug hook changes.
          }
          if (game.world.boss) game.world.boss.attackTimerMs = 1;
        });
      }
      if (step === 6) {
        await callGame(page, (game) => {
          if (game.world.boss) game.world.boss.attackTimerMs = 1;
        });
      }
      if (step === 9) {
        await callGame(page, (game) => {
          if (game.world.laserReady) game.world.fireLaser();
        });
      }
      await page.waitForTimeout(220);
      step += 1;
    }
  },
);

await browser.close();

/** Clip order and durations keep the final video between 15 and 20 seconds. */
const clips = [
  { path: menuClip.path, offset: menuClip.prepSeconds + 0.25, duration: 1.5 },
  { path: selectClip.path, offset: selectClip.prepSeconds + 0.1, duration: 2.6 },
  { path: tutorialClip.path, offset: tutorialClip.prepSeconds + 0.25, duration: 2.8 },
  { path: gameplayClip.path, offset: gameplayClip.prepSeconds + 0.25, duration: 4.2 },
  { path: levelUpClip.path, offset: levelUpClip.prepSeconds + 0.25, duration: 2.6 },
  { path: bossClip.path, offset: bossClip.prepSeconds + 0.3, duration: 4.2 },
];
const coverSeconds = 1.2;
const totalSeconds =
  coverSeconds + clips.reduce((sum, clip) => sum + clip.duration, 0);

function runFfmpeg(argumentsToRun, message) {
  const result = spawnSync('ffmpeg', argumentsToRun, { encoding: 'utf8' });
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
    `[0:v]scale=${variant.width}:${variant.height},boxblur=22:2,eq=brightness=0.01:saturation=1.2,setpts=PTS-STARTPTS[bg]`,
    // The browser recording includes the 32 px shell letterbox. Crop it so the
    // preview card is the game itself, not a black-banded screenshot.
    `[1:v]crop=390:780:0:32,scale=-2:${variant.foregroundHeight},pad=iw+20:ih+20:10:10:color=0x7ef9ff@0.55,setpts=PTS-STARTPTS[fg]`,
    '[bg][fg]overlay=(W-w)/2:(H-h)/2:format=auto,format=yuv420p[v]',
  ].join(';');
  runFfmpeg(
    [
      '-y',
      '-loop', '1', '-i', variant.cover,
      '-ss', String(clip.offset), '-i', clip.path,
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

  for (let index = 0; index < clips.length; index += 1) {
    const out = join(dir, `segment-${index}.mp4`);
    composeGameplaySegment(variant, clips[index], out);
    segmentFiles.push(out);
  }

  const coverFile = join(dir, 'segment-cover.mp4');
  composeCoverSegment(variant, coverFile);
  segmentFiles.push(coverFile);

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

await writeFile(
  join(rawDir, 'clips.json'),
  JSON.stringify(
    { menuClip, selectClip, tutorialClip, gameplayClip, levelUpClip, bossClip },
    null,
    2,
  ),
);

// Keep the raw clip metadata next to the previews for future re-cuts.
try {
  await readFile(join(rawDir, 'clips.json'));
} catch {
  // Non-fatal: the composed MP4s are the deliverable.
}
