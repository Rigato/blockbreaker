#!/usr/bin/env node
/**
 * Optional performance smoke test for Bricklike.
 *
 * It is NOT a replacement for the manual Chrome/Edge test in
 * docs/qa/performance-testing.md. It records requestAnimationFrame frame
 * intervals, long tasks, boot time, JS heap and request errors through
 * Playwright + the Chrome DevTools Protocol.
 *
 * Usage:
 *   npm run build
 *   npm run preview -- --port 4173 --strictPort
 *   node scripts/perf-smoke.mjs --headed=1
 *
 *   # one viewport, 6x CPU throttle, direct viewport instead of iframe
 *   node scripts/perf-smoke.mjs --viewports=907x510 --cpu=6 --iframe=0 --duration=20
 *
 *   # cold boot over throttled network (menu measurement only is still recorded)
 *   node scripts/perf-smoke.mjs --network=slow4g --duration=15
 *
 * The script starts `npm run preview` on port 4173 when the URL is not
 * reachable. It never changes package.json and never publishes anything.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const DEFAULT_VIEWPORTS = [
  '907x510',
  '1216x684',
  '1280x720',
  '1920x1080',
  '800x450',
  '390x844',
];

const rawArgs = process.argv.slice(2);
if (rawArgs.includes('--help') || rawArgs.includes('-h')) {
  console.log(`perf-smoke.mjs — Playwright + CDP performance smoke

Options:
  --url=<url>            Base URL (default http://127.0.0.1:4173)
  --viewports=<list>     Comma-separated WxH list (default ${DEFAULT_VIEWPORTS.join(',')})
  --duration=<seconds>   Gameplay sample per viewport (default 30)
  --cpu=<rate>           CDP CPU throttling rate (default 4; 1 = none)
  --iframe=1|0           Measure inside an exact-size iframe (default 1)
  --headed=1             Open a real browser window (recommended locally)
  --network=slow4g|none  Throttle navigation (default none)
  --out=<path>           JSON output (default docs/qa/perf-results.json)
  --keep-open=1          Do not close the browser at the end (debug)

Notes:
  - Headless Chromium uses SwiftShader; numbers are a lower bound.
  - CPU throttling 4x approximates a low-end laptop/Chromebook better than
    real hardware, but it is not a 4 GB RAM emulator.
  - Network throttling is applied before navigation; use it for boot tests.
`);
  process.exit(0);
}

const args = new Map(
  rawArgs.map((arg) => {
    const [key, value = 'true'] = arg.replace(/^--/, '').split('=');
    return [key, value];
  }),
);

const baseURL = String(args.get('url') ?? 'http://127.0.0.1:4173').replace(/\/$/, '');
const durationSeconds = Math.max(5, Number(args.get('duration') ?? 30));
const cpuRate = Math.max(1, Number(args.get('cpu') ?? 4));
const useIframe = args.get('iframe') !== '0';
const headed = args.get('headed') === '1';
const keepOpen = args.get('keep-open') === '1';
const network = String(args.get('network') ?? 'none');
const output = resolve(String(args.get('out') ?? 'docs/qa/perf-results.json'));
const viewports = String(args.get('viewports') ?? DEFAULT_VIEWPORTS.join(','))
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean)
  .map((entry) => {
    const [width, height] = entry.split('x').map(Number);
    if (!width || !height) throw new Error(`invalid viewport "${entry}" (use WxH)`);
    return { label: entry, width, height };
  });

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

async function isReachable(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1_500) });
    return response.ok;
  } catch {
    return false;
  }
}

async function ensureServer() {
  if (await isReachable(baseURL)) return null;
  const child = spawn(
    'npm',
    ['run', 'preview', '--', '--port', '4173', '--strictPort'],
    { stdio: 'ignore', detached: false },
  );
  for (let attempt = 0; attempt < 60; attempt += 1) {
    await sleep(500);
    if (await isReachable(baseURL)) return child;
  }
  child.kill();
  throw new Error(`preview server did not start at ${baseURL}`);
}

/**
 * Installed in every frame before the game boots. It only reads browser
 * timing APIs; it does not touch game state.
 */
const initScript = () => {
  const state = {
    frames: [],
    longTasks: [],
    startedAt: performance.now(),
  };
  let last = 0;

  const tick = (time) => {
    if (last > 0) state.frames.push(time - last);
    last = time;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) state.longTasks.push(entry.duration);
    });
    observer.observe({ entryTypes: ['longtask'] });
  } catch {
    // longtask is not available in every browser/context.
  }

  window.__perfProbe = {
    reset() {
      state.frames.length = 0;
      state.longTasks.length = 0;
      state.startedAt = performance.now();
      last = 0;
    },
    snapshot() {
      const samples = [...state.frames];
      const sorted = [...samples].sort((a, b) => a - b);
      const sum = samples.reduce((total, value) => total + value, 0);
      const pick = (fraction) =>
        sorted.length === 0
          ? null
          : sorted[Math.min(sorted.length - 1, Math.floor(fraction * (sorted.length - 1)))];
      const longTasks = [...state.longTasks];
      const memory = performance.memory
        ? {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
          }
        : null;
      return {
        sampleCount: samples.length,
        avgFrameMs: samples.length ? sum / samples.length : null,
        p50FrameMs: pick(0.5),
        p95FrameMs: pick(0.95),
        p99FrameMs: pick(0.99),
        maxFrameMs: sorted.length ? sorted[sorted.length - 1] : null,
        minFrameMs: sorted.length ? sorted[0] : null,
        longTaskCount: longTasks.length,
        longTaskTotalMs: longTasks.reduce((total, value) => total + value, 0),
        longTaskMaxMs: longTasks.length ? Math.max(...longTasks) : 0,
        memory,
        elapsedMs: performance.now() - state.startedAt,
      };
    },
  };
};

function round(value, digits = 2) {
  return value === null || value === undefined || Number.isNaN(value)
    ? null
    : Number(value.toFixed(digits));
}

function summarize(snapshot) {
  const avgFrame = snapshot.avgFrameMs;
  const p95Frame = snapshot.p95FrameMs;
  const p99Frame = snapshot.p99FrameMs;
  return {
    samples: snapshot.sampleCount,
    avgFps: avgFrame ? round(1000 / avgFrame, 1) : null,
    avgFrameMs: round(avgFrame),
    p50FrameMs: round(snapshot.p50FrameMs),
    p95FrameMs: round(p95Frame),
    p99FrameMs: round(p99Frame),
    onePercentLowFps: p99Frame ? round(1000 / p99Frame, 1) : null,
    maxFrameMs: round(snapshot.maxFrameMs),
    longTasks: {
      count: snapshot.longTaskCount,
      totalMs: round(snapshot.longTaskTotalMs),
      maxMs: round(snapshot.longTaskMaxMs),
    },
    jsHeapMB: snapshot.memory
      ? round(snapshot.memory.usedJSHeapSize / 1024 / 1024, 2)
      : null,
  };
}

function makeIframePage(url, width, height) {
  const escaped = url.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
  return `<!doctype html>
<html>
  <head><meta charset="utf-8"><style>
    html,body{margin:0;background:#222;min-height:100%;}
    body{display:flex;align-items:center;justify-content:center;}
    iframe{display:block;border:0;width:${width}px;height:${height}px;background:#05070f;}
  </style></head>
  <body><iframe id="game-frame" src="${escaped}" allow="autoplay; fullscreen"></iframe></body>
</html>`;
}

async function getGameFrame(page) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const handle = await page.$('#game-frame');
    if (handle) {
      const frame = await handle.contentFrame();
      if (frame) return frame;
    }
    await sleep(100);
  }
  throw new Error('game iframe did not attach');
}

async function runScenario(browser, viewport) {
  const isMobile = viewport.width <= 800;
  const contextViewport = useIframe
    ? { width: viewport.width + 40, height: viewport.height + 40 }
    : { width: viewport.width, height: viewport.height };

  const context = await browser.newContext({
    viewport: contextViewport,
    deviceScaleFactor: 1,
    hasTouch: isMobile,
    isMobile,
  });
  await context.addInitScript(initScript);
  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  let bootConsole = null;

  page.on('console', (message) => {
    const text = message.text();
    if (message.type() === 'error') consoleErrors.push(text.slice(0, 500));
    const match = text.match(/\[boot\] menu ready in (\d+) ms/);
    if (match) bootConsole = Number(match[1]);
  });
  page.on('pageerror', (error) => pageErrors.push(String(error).slice(0, 500)));
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.method()} ${request.url()} — ${request.failure()?.errorText ?? 'failed'}`);
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      failedRequests.push(`${response.status()} ${response.url()}`);
    }
  });

  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  await cdp.send('HeapProfiler.enable');
  if (cpuRate > 1) {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpuRate });
  }
  if (network === 'slow4g') {
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 400,
      downloadThroughput: Math.round((400 * 1024) / 8),
      uploadThroughput: Math.round((400 * 1024) / 8),
      connectionType: 'cellular4g',
    });
  }

  const gameUrl = `${baseURL}/?debug=1&resetSave=1`;
  let frame;
  try {
    if (useIframe) {
      await page.setContent(makeIframePage(gameUrl, viewport.width, viewport.height), {
        waitUntil: 'domcontentloaded',
      });
      frame = await getGameFrame(page);
    } else {
      await page.goto(gameUrl, { waitUntil: 'domcontentloaded' });
      frame = page.mainFrame();
    }

    await frame.waitForSelector('#campaign-button', { state: 'visible', timeout: 30_000 });
    const bootMs = await frame.evaluate(() => performance.now());

    // The debug panel can overlap the menu at small sizes. Use a DOM click so
    // the menu path is identical to a real click but is not blocked by it.
    await frame.evaluate(() => document.querySelector('#campaign-button')?.click());
    await frame.waitForSelector('.phase-card', { state: 'visible', timeout: 15_000 });
    await frame.evaluate(() => document.querySelector('.phase-card')?.click());
    await frame.waitForSelector('.hud', { state: 'visible', timeout: 15_000 });

    // Let shaders compile and the first wave settle before sampling.
    await sleep(2_000);
    await cdp.send('HeapProfiler.collectGarbage');
    const heapBefore = await frame.evaluate(() => window.__perfProbe?.snapshot().memory ?? null);

    await frame.evaluate(() => window.__perfProbe?.reset());
    const startedAt = Date.now();

    const canvas = frame.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.82);
    }

    // Stress the renderer: 8 balls, continuous projectiles and level-up cards.
    await frame.evaluate(() => {
      for (let index = 0; index < 7; index += 1) {
        const button = [...document.querySelectorAll('#debug-panel button')].find(
          (candidate) => candidate.textContent?.trim() === 'Add ball',
        );
        button?.click();
      }
    });

    const stressTimer = setInterval(() => {
      void frame
        .evaluate(() => {
          const card = document.querySelector('.levelup:not([hidden]) .levelup__card');
          if (card) {
            card.click();
            return;
          }
          const button = [...document.querySelectorAll('#debug-panel button')].find(
            (candidate) => candidate.textContent?.trim() === 'Fire projectile',
          );
          button?.click();
        })
        .catch(() => null);
    }, 300);

    await sleep(durationSeconds * 1_000);
    clearInterval(stressTimer);

    const snapshot = await frame.evaluate(() => window.__perfProbe?.snapshot() ?? null);
    if (!snapshot) throw new Error('performance probe did not run');

    const heapBeforeGc = snapshot.memory
      ? round(snapshot.memory.usedJSHeapSize / 1024 / 1024, 2)
      : null;
    await cdp.send('HeapProfiler.collectGarbage');
    const heapAfterGc = await frame.evaluate(() =>
      performance.memory ? performance.memory.usedJSHeapSize / 1024 / 1024 : null,
    );

    const endedEarly = await frame.evaluate(
      () => Boolean(document.querySelector('.overlay--results:not([hidden])')),
    );
    const elapsedSeconds = (Date.now() - startedAt) / 1_000;

    const heapStart = heapBefore
      ? round(heapBefore.usedJSHeapSize / 1024 / 1024, 2)
      : null;

    return {
      viewport: viewport.label,
      iframe: useIframe,
      dpr: 1,
      cpuThrottle: cpuRate,
      network,
      durationSeconds: round(elapsedSeconds, 1),
      bootMs: round(bootMs, 0),
      bootConsoleMs: bootConsole,
      ...summarize(snapshot),
      heapBeforeMB: heapStart,
      heapBeforeGcMB: heapBeforeGc,
      heapAfterGcMB: heapAfterGc === null ? null : round(heapAfterGc, 2),
      // Start (after GC) -> end (after GC): retained heap over the sample.
      heapDeltaMB:
        heapStart !== null && heapAfterGc !== null
          ? round(heapAfterGc - heapStart, 2)
          : null,
      // How much garbage the forced GC reclaimed at the end.
      heapGcReclaimedMB:
        heapBeforeGc !== null && heapAfterGc !== null
          ? round(heapBeforeGc - heapAfterGc, 2)
          : null,
      endedEarly,
      consoleErrors,
      pageErrors,
      failedRequests,
    };
  } finally {
    await context.close();
  }
}

const server = await ensureServer();
const browser = await chromium.launch({
  headless: !headed,
  args: ['--enable-precise-memory-info', '--disable-extensions'],
});
const results = [];

try {
  for (const viewport of viewports) {
    process.stdout.write(
      `[perf] ${viewport.label} iframe=${useIframe ? 'yes' : 'no'} cpu=${cpuRate}x network=${network} ... `,
    );
    try {
      const result = await runScenario(browser, viewport);
      results.push(result);
      console.log(
        `boot ${result.bootMs}ms | avg ${result.avgFps} FPS | p95 ${result.p95FrameMs}ms | ` +
          `long ${result.longTasks.count} | heap ${result.heapAfterGcMB}MB | ` +
          `${result.endedEarly ? 'ended early' : 'ok'}`,
      );
    } catch (error) {
      console.log(`FAILED: ${error instanceof Error ? error.message : error}`);
      results.push({
        viewport: viewport.label,
        iframe: useIframe,
        cpuThrottle: cpuRate,
        network,
        error: String(error instanceof Error ? error.message : error),
      });
    }
  }
} finally {
  if (!keepOpen) await browser.close();
  server?.kill();
}

mkdirSync(dirname(output), { recursive: true });
writeFileSync(
  output,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      baseURL,
      note: 'Headless Chromium uses SwiftShader; treat these numbers as a lower bound. Use Chrome/Edge headed for the manual test.',
      results,
    },
    null,
    2,
  )}\n`,
  'utf8',
);

console.log(`[perf] wrote ${results.length} scenarios to ${output}`);
