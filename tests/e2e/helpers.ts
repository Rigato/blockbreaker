import type { ConsoleMessage, Page, Request } from '@playwright/test';

export const MENU_READY = '#play-button';
export const HUD = '.hud';
export const LAUNCH_HINT = 'Tap / click / V to launch';

export interface PageMonitor {
  readonly consoleErrors: string[];
  readonly pageErrors: string[];
  readonly requests: string[];
  readonly failedRequests: string[];
}

/** Collects console/page errors and request URLs for a single page. */
export function monitorPage(page: Page): PageMonitor {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const requests: string[] = [];
  const failedRequests: string[] = [];

  page.on('console', (message: ConsoleMessage) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error: Error) => pageErrors.push(error.message));
  page.on('request', (request: Request) => requests.push(request.url()));
  page.on('requestfailed', (request: Request) => failedRequests.push(request.url()));

  return { consoleErrors, pageErrors, requests, failedRequests };
}

export async function waitForMenu(page: Page): Promise<void> {
  await page.locator(MENU_READY).waitFor({ state: 'visible' });
}

/** Starts the level the Play button resolves to (phase 1 on a fresh save). */
export async function startPlay(page: Page): Promise<void> {
  await page.locator(MENU_READY).click();
  await page.locator(HUD).waitFor({ state: 'visible' });
}

export async function expandDebugPanel(page: Page): Promise<void> {
  const compact = page.locator('#debug-compact');
  if (await compact.isVisible().catch(() => false)) await compact.click();
  await page.locator('#debug-body').waitFor({ state: 'visible' });
}

/**
 * Clicks a debug action by its visible label. The debug strip is hidden while
 * a modal is open, so the call runs in the DOM and never fights the overlay.
 */
export async function clickDebugAction(page: Page, label: string): Promise<boolean> {
  return page.evaluate((text) => {
    const button = [...document.querySelectorAll<HTMLButtonElement>('#debug-panel button')].find(
      (candidate) => candidate.textContent?.trim() === text,
    );
    if (!button) return false;
    button.click();
    return true;
  }, label);
}

/**
 * Chooses the first perk card for every open level-up modal and returns how
 * many levels were resolved.
 */
export async function resolveLevelUps(page: Page): Promise<number> {
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

export async function canvasColumn(page: Page, column: number, columns = 8): Promise<void> {
  const box = await page.locator('canvas').first().boundingBox();
  if (!box) throw new Error('canvas has no bounding box');
  const x = box.x + ((column + 0.5) / columns) * box.width;
  await page.mouse.move(x, box.y + box.height * 0.9);
}

/**
 * Clears phase 1 with the debug projectile, moving the paddle across the eight
 * columns and resolving every level-up. This is the QA shortcut documented in
 * the M6 run protocol, not a substitute for human play.
 */
export async function clearPhaseOne(page: Page): Promise<{ levelUps: number }> {
  await startPlay(page);
  await expandDebugPanel(page);

  let levelUps = 0;
  for (let pass = 0; pass < 16; pass += 1) {
    const columns = [...Array(8).keys()];
    if (pass % 2 === 1) columns.reverse();
    for (const column of columns) {
      await canvasColumn(page, column);
      await page.waitForTimeout(70);
      // Two projectiles per column stay under the 16-projectile cap; each one
      // removes one HP from the lowest block in that column.
      await clickDebugAction(page, 'Fire projectile');
      await clickDebugAction(page, 'Fire projectile');
      levelUps += await resolveLevelUps(page);
    }

    await page.waitForTimeout(1_600);
    levelUps += await resolveLevelUps(page);
    if (await page.locator('.overlay--results').isVisible().catch(() => false)) {
      return { levelUps };
    }
  }

  throw new Error('phase 1 did not reach the results screen through debug projectiles');
}

/**
 * Ends the current run deterministically through the debug-only Force defeat
 * button. The old ball-speed/paddle trick depended on headless frame rate and
 * made CI flaky; the debug action is a QA shortcut, not a gameplay feature.
 */
export async function forceDefeat(page: Page): Promise<void> {
  await expandDebugPanel(page);
  const clicked = await clickDebugAction(page, 'Force defeat');
  if (!clicked) throw new Error('Force defeat debug action is unavailable');
  await page.locator('.overlay--results').waitFor({ state: 'visible', timeout: 15_000 });
}

/** Deterministic phase victory shortcut for results/unlock E2E. */
export async function forceVictory(page: Page): Promise<void> {
  await expandDebugPanel(page);
  const clicked = await clickDebugAction(page, 'Force victory');
  if (!clicked) throw new Error('Force victory debug action is unavailable');
  await page.locator('.overlay--results').waitFor({ state: 'visible', timeout: 15_000 });
}

export interface ResultsSnapshot {
  readonly kicker: string;
  readonly title: string;
  readonly values: readonly string[];
  readonly nextVisible: boolean;
}

export async function readResults(page: Page): Promise<ResultsSnapshot> {
  return page.evaluate(() => {
    const results = document.querySelector<HTMLElement>('.overlay--results');
    if (!results || results.hidden) throw new Error('results overlay is not visible');
    return {
      kicker: document.querySelector('#overlay-results-kicker')?.textContent ?? '',
      title: document.querySelector('#overlay-results-title')?.textContent ?? '',
      values: [...results.querySelectorAll('.overlay__summary-value')].map(
        (node) => node.textContent ?? '',
      ),
      nextVisible: !(
        results.querySelector<HTMLElement>('.overlay__button--secondary')?.hidden ?? true
      ),
    };
  });
}
