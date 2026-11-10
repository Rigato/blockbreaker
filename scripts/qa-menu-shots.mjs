/* Screenshot + layout QA for the new menu and dialogs.
 * Usage: node scripts/qa-menu-shots.mjs [baseURL] [outDir]
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const base = process.argv[2] ?? 'http://127.0.0.1:5176';
const out = process.argv[3] ?? '/tmp/opencode/shots';
mkdirSync(out, { recursive: true });

const UNLOCKED_SAVE = {
  version: 1,
  unlockedPhase: 6,
  phases: {
    'phase-1': { bestScore: 1200, bestTimeMs: 65000, attempts: 2, clears: 1, bestLevel: 5 },
  },
  endless: { bestWave: 12, bestScore: 34500, runs: 8 },
  campaignComplete: true,
  updatedAt: Date.now(),
};

async function domAudit(page, label) {
  return page.evaluate((tag) => {
    const shell = document.querySelector('#game-shell');
    const srect = shell.getBoundingClientRect();
    const report = { label: tag, shell: { w: srect.width, h: srect.height }, issues: [], boxes: {} };
    const sels = [
      '.menu', '.menu__brand', '.menu__title', '.menu__subtitle-row',
      '.menu__modes', '#campaign-button', '.menu__card-gem', '.menu__nodes',
      '.menu__card-foot', '.menu__card-status', '.menu__card-cta',
      '#endless-button', '.menu__card-badge', '.menu__card-stat', '.menu__card-locknote',
      '.menu__footer', '#settings-button', '.menu__version',
      '.settings', '.settings__panel', '.settings__rows', '.settings__row',
      '.settings__close', '.info', '.info__panel', '.info__confirm',
    ];
    for (const sel of sels) {
      const el = document.querySelector(sel);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const rendered = r.width > 0 && r.height > 0 && el.offsetParent !== null;
      report.boxes[sel] = {
        x: Math.round(r.x - srect.x), y: Math.round(r.y - srect.y),
        w: Math.round(r.width), h: Math.round(r.height),
        bottom: Math.round(r.bottom - srect.y), right: Math.round(r.right - srect.x),
        hidden: el.hidden || getComputedStyle(el).display === 'none',
        text: (el.textContent || '').trim().slice(0, 70).replace(/\s+/g, ' '),
      };
      if (!rendered) continue;
      if (r.right > srect.right + 1.5) report.issues.push(`${sel} overflows right by ${(r.right - srect.right).toFixed(1)}px`);
      if (r.bottom > srect.bottom + 1.5) report.issues.push(`${sel} overflows bottom by ${(r.bottom - srect.bottom).toFixed(1)}px`);
      if (r.left < srect.left - 1.5) report.issues.push(`${sel} overflows left`);
      if (r.top < srect.top - 1.5) report.issues.push(`${sel} overflows top`);
    }
    const status = document.querySelector('.menu__card-status');
    if (status) {
      report.statusTruncated = status.scrollWidth > status.clientWidth + 1;
      report.statusText = status.textContent;
      report.statusWidths = { client: status.clientWidth, scroll: status.scrollWidth };
    }
    const rows = document.querySelector('.settings__rows');
    if (rows) report.settingsRows = { client: rows.clientHeight, scroll: rows.scrollHeight };
    return report;
  }, label);
}

async function readSwitches(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('.settings__switch')].map((el) => ({
      label: el.getAttribute('aria-label'),
      checked: el.getAttribute('aria-checked'),
      on: el.classList.contains('is-on'),
      value: el.querySelector('.settings__switch-value')?.textContent,
    })),
  );
}

async function waitMenu(page) {
  await page.locator('#campaign-button').waitFor({ state: 'visible', timeout: 30000 });
  await page.waitForSelector('.boot.is-hidden', { timeout: 15000 }).catch(() => null);
  await page.waitForTimeout(1200);
}

const browser = await chromium.launch();

// --- 1. Default menu at 390x844 -------------------------------------------
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(base + '/?resetSave=1');
  await waitMenu(page);
  await page.screenshot({ path: `${out}/menu-390-new.png` });
  console.log(JSON.stringify(await domAudit(page, 'menu-390'), null, 2));
  // Plain click on the campaign card (opens phase select, then back).
  await page.locator('#campaign-button').click({ timeout: 5000 });
  await page.locator('.phase-select:not([hidden])').waitFor({ state: 'visible', timeout: 5000 });
  console.log('campaign click: OK (phase select opened)');
  await page.locator('.phase-select__back').click();
  await page.locator('#campaign-button').waitFor({ state: 'visible', timeout: 5000 });
  await page.close();
}

// --- 2. Default menu at 320x568 -------------------------------------------
{
  const page = await browser.newPage({ viewport: { width: 320, height: 568 } });
  await page.goto(base + '/?resetSave=1');
  await waitMenu(page);
  await page.screenshot({ path: `${out}/menu-320-new.png` });
  console.log(JSON.stringify(await domAudit(page, 'menu-320'), null, 2));
  await page.close();
}

// --- 3. Endless unlocked at 390x844 ----------------------------------------
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript((save) => {
    localStorage.setItem('bb.save', JSON.stringify(save));
  }, UNLOCKED_SAVE);
  const page = await context.newPage();
  await page.goto(base + '/');
  await waitMenu(page);
  await page.screenshot({ path: `${out}/menu-390-unlocked.png` });
  console.log(JSON.stringify(await domAudit(page, 'menu-390-unlocked'), null, 2));
  // Plain click starts the Endless run (no aria-disabled when unlocked).
  await page.locator('#endless-button').click({ timeout: 5000 });
  await page.locator('.hud').waitFor({ state: 'visible', timeout: 10000 });
  console.log('endless unlocked click: OK (run started)');
  await context.close();
}

// --- 4. Settings dialog open at 390x844 ------------------------------------
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(base + '/?resetSave=1');
  await waitMenu(page);
  await page.locator('#settings-button').click({ timeout: 5000 });
  await page.locator('.settings:not([hidden])').waitFor({ state: 'visible' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/settings-390.png` });
  console.log('settings switches:', JSON.stringify(await readSwitches(page)));
  console.log(JSON.stringify(await domAudit(page, 'settings-390'), null, 2));
  // Toggle Sound off/on through the real click path.
  const sound = page.getByRole('switch', { name: 'Sound effects' });
  await sound.click();
  const afterOff = await sound.getAttribute('aria-checked');
  await sound.click();
  const afterOn = await sound.getAttribute('aria-checked');
  console.log(`sound toggle: true -> ${afterOff} -> ${afterOn}`);
  await page.locator('#settings-close').click();
  await page.locator('.settings').waitFor({ state: 'hidden', timeout: 5000 });
  console.log('settings close: OK');
  await page.close();
}

// --- 5. Endless locked dialog at 390x844 ------------------------------------
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(base + '/?resetSave=1');
  await waitMenu(page);
  // NOTE: Playwright refuses plain clicks on aria-disabled buttons, so the
  // locked card needs force: true (real browsers dispatch the click fine).
  await page.locator('#endless-button').click({ force: true, timeout: 5000 });
  await page.locator('.info:not([hidden])').waitFor({ state: 'visible' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/endless-locked-390.png` });
  console.log(JSON.stringify(await domAudit(page, 'endless-locked-390'), null, 2));
  await page.locator('#info-confirm').click();
  await page.locator('.info').waitFor({ state: 'hidden', timeout: 5000 });
  console.log('info dialog close: OK');
  await page.close();
}

// --- 6. Settings dialog at 320x568 (must fit without cut content) ---------
{
  const page = await browser.newPage({ viewport: { width: 320, height: 568 } });
  await page.goto(base + '/?resetSave=1');
  await waitMenu(page);
  await page.locator('#settings-button').click({ timeout: 5000 });
  await page.locator('.settings:not([hidden])').waitFor({ state: 'visible' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/settings-320.png` });
  const audit = await domAudit(page, 'settings-320');
  console.log(JSON.stringify(audit, null, 2));
  await page.close();
}

// --- 7. Canvas luminance behind the menu (background visibility probe) ------
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(base + '/?resetSave=1');
  await waitMenu(page);
  const stats = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;
    const probe = document.createElement('canvas');
    probe.width = canvas.width;
    probe.height = canvas.height;
    const ctx = probe.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(canvas, 0, 0);
    const data = ctx.getImageData(0, 0, probe.width, probe.height).data;
    let sum = 0;
    let bright = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 16) {
      const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      sum += lum;
      if (lum > 90) bright += 1;
      count += 1;
    }
    return {
      size: { w: probe.width, h: probe.height },
      avgLum: Math.round((sum / Math.max(1, count)) * 10) / 10,
      brightFrac: Math.round((bright / Math.max(1, count)) * 1000) / 10,
      samples: count,
    };
  });
  console.log('canvas stats:', JSON.stringify(stats));
  await page.close();
}

await browser.close();
console.log('DONE');
