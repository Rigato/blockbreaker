#!/usr/bin/env node
/**
 * Automated baseline run logger for the M6 QA kit.
 *
 * This is NOT a human playtest. It drives phase 1 with the debug projectile,
 * resolves level-ups with the keyboard and records the resulting run metrics so
 * XP/perk tuning can be compared between builds.
 *
 * Usage:
 *   npm run qa:runs -- --runs=10
 *   npm run qa:runs -- --runs=3 --phase=1 --url=http://127.0.0.1:4173
 *
 * Requires a production build (`npm run build`). If the URL is not reachable the
 * script starts `npm run preview` on port 4173 and stops it afterwards.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value = 'true'] = arg.replace(/^--/, '').split('=');
    return [key, value];
  }),
);

const runs = Math.max(1, Number(args.get('runs') ?? 10));
const phase = String(args.get('phase') ?? '1');
if (phase !== '1') {
  throw new Error('qa-runs currently supports phase 1 only (fresh save per run)');
}
const baseURL = String(args.get('url') ?? 'http://127.0.0.1:4173');
const output = resolve(String(args.get('out') ?? 'docs/qa/run-log.csv'));

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

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
  const child = spawn('npm', ['run', 'preview', '--', '--port', '4173', '--strictPort'], {
    stdio: 'ignore',
    detached: false,
  });
  for (let attempt = 0; attempt < 60; attempt += 1) {
    await sleep(500);
    if (await isReachable(baseURL)) return child;
  }
  child.kill();
  throw new Error(`preview server did not start at ${baseURL}`);
}

async function clickDebugAction(page, label) {
  return page.evaluate((text) => {
    const button = [...document.querySelectorAll('#debug-panel button')].find(
      (candidate) => candidate.textContent?.trim() === text,
    );
    if (!button) return false;
    button.click();
    return true;
  }, label);
}

async function resolveLevelUps(page) {
  let resolved = 0;
  for (let guard = 0; guard < 8; guard += 1) {
    const overlay = page.locator('.levelup:not([hidden])');
    if (!(await overlay.isVisible().catch(() => false))) return resolved;
    await page.keyboard.press('1');
    await overlay.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => null);
    resolved += 1;
  }
  return resolved;
}

async function readRun(page) {
  return page.evaluate(() => {
    const results = document.querySelector('.overlay--results');
    const values = [...(results?.querySelectorAll('.overlay__summary-value') ?? [])].map(
      (node) => node.textContent?.trim() ?? '',
    );
    const perks = [...(results?.querySelectorAll('.overlay__perk') ?? [])]
      .map((node) => node.textContent?.trim() ?? '')
      .filter((text) => text && text !== 'No perks this run');
    return {
      kicker: document.querySelector('#overlay-results-kicker')?.textContent?.trim() ?? '',
      title: document.querySelector('#overlay-results-title')?.textContent?.trim() ?? '',
      values,
      perks,
    };
  });
}

async function runOnce(browser, index) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const startedAt = Date.now();
  let levelUps = 0;

  await page.addInitScript(() => {
    if (!localStorage.getItem('bb.save')) {
      localStorage.setItem(
        'bb.save',
        JSON.stringify({
          version: 1,
          unlockedPhase: 1,
          phases: {},
          endless: { bestWave: 0, bestScore: 0, runs: 0 },
          campaignComplete: false,
          updatedAt: Date.now(),
        }),
      );
    }
  });
  await page.goto(`${baseURL}/?debug=1`);
  await page.locator('#campaign-button').waitFor({ state: 'visible' });
  await page.evaluate(() => {
    const body = document.querySelector('#debug-body');
    if (body && !body.hidden) {
      document.querySelector('#debug-panel .debug__toggle')?.click();
    }
  });
  await page.locator('#campaign-button').click();
  await page.locator('.phase-select:not([hidden])').waitFor({ state: 'visible' });
  await page.locator('.phase-card[data-phase-id="phase-1"]').click();
  await page.locator('.hud').waitFor({ state: 'visible' });

  const compact = page.locator('#debug-compact');
  if (await compact.isVisible().catch(() => false)) await compact.click();

  for (let pass = 0; pass < 16; pass += 1) {
    const columns = [...Array(8).keys()];
    if (pass % 2 === 1) columns.reverse();
    for (const column of columns) {
      const box = await page.locator('canvas').first().boundingBox();
      if (!box) throw new Error('canvas not available');
      await page.mouse.move(box.x + ((column + 0.5) / 8) * box.width, box.y + box.height * 0.9);
      await page.waitForTimeout(70);
      await clickDebugAction(page, 'Fire projectile');
      await clickDebugAction(page, 'Fire projectile');
      levelUps += await resolveLevelUps(page);
    }

    await page.waitForTimeout(1_600);
    levelUps += await resolveLevelUps(page);
    if (await page.locator('.overlay--results').isVisible().catch(() => false)) break;
  }

  const results = await page.locator('.overlay--results').isVisible().catch(() => false);
  const run = results
    ? await readRun(page)
    : { kicker: 'timeout', title: '', values: [], perks: [] };
  const durationSeconds = (Date.now() - startedAt) / 1_000;

  await context.close();

  return {
    run: index,
    phase: `phase-${phase}`,
    result: run.kicker || 'timeout',
    duration_s: durationSeconds.toFixed(1),
    score: run.values[0] ?? '',
    level: run.values[4] ?? '',
    perks: run.perks.join(' | '),
    level_ups: levelUps,
    deaths: run.kicker === 'Defeat' ? 1 : 0,
    retries: 0,
    waves: '3',
    notes: 'debug projectile baseline (not human play)',
  };
}

function toCsv(rows) {
  const columns = [
    'run',
    'phase',
    'result',
    'duration_s',
    'score',
    'level',
    'perks',
    'level_ups',
    'deaths',
    'retries',
    'waves',
    'notes',
  ];
  const escape = (value) => `"${String(value).replaceAll('"', '""')}"`;
  return [columns.join(','), ...rows.map((row) => columns.map((column) => escape(row[column])).join(','))].join(
    '\n',
  );
}

const server = await ensureServer();
const browser = await chromium.launch();
const rows = [];

try {
  for (let index = 1; index <= runs; index += 1) {
    process.stdout.write(`[qa-runs] run ${index}/${runs}... `);
    const row = await runOnce(browser, index);
    rows.push(row);
    console.log(`${row.result} ${row.duration_s}s level ${row.level} (${row.level_ups} level-ups)`);
  }
} finally {
  await browser.close();
  server?.kill();
}

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${toCsv(rows)}\n`, 'utf8');
console.log(`[qa-runs] wrote ${rows.length} runs to ${output}`);
