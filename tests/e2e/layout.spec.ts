import { expect, test, type Page } from '@playwright/test';
import {
  clickDebugAction,
  collapseDebugPanel,
  expandDebugPanel,
  forceDefeat,
  startPlay,
  waitForMenu,
} from './helpers';

const VIEWPORTS = [
  { name: '320x568', width: 320, height: 568 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
  { name: '1440x900', width: 1440, height: 900 },
] as const;

async function expectNoScroll(page: Page): Promise<void> {
  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1);
  expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.innerHeight + 1);
}

async function expectInsideViewport(page: Page, selector: string): Promise<void> {
  const box = await page.locator(selector).first().boundingBox();
  expect(box, `${selector} should render`).not.toBeNull();
  const viewport = page.viewportSize();
  if (!box || !viewport) return;
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.y).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
}

test.describe('desktop side art', () => {
  test('is visible on a landscape viewport and hidden on mobile portrait', async ({ page }) => {
    await page.setViewportSize({ width: 907, height: 510 });
    await page.goto('/?resetSave=1');
    await waitForMenu(page);
    await expect(page.locator('#desktop-side-art')).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('#desktop-side-art')).toBeHidden();
  });
});

test.describe('layout matrix', () => {
  for (const viewport of VIEWPORTS) {
    test(`${viewport.name}: menu, levels, gameplay, pause, level up and results fit`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/?debug=1');
      await waitForMenu(page);

      await expectNoScroll(page);
      await expectInsideViewport(page, '.menu');
      await expectInsideViewport(page, '#game-shell');

      await collapseDebugPanel(page);
      await page.locator('#campaign-button').click();
      await expect(page.locator('.phase-select:not([hidden])')).toBeVisible();
      await expectNoScroll(page);
      await expectInsideViewport(page, '.phase-select__panel');
      await page.locator('.phase-select__back').click();

      await startPlay(page);
      await expectNoScroll(page);
      await expectInsideViewport(page, '#game-shell');

      await page.keyboard.press('p');
      await expect(page.locator('.overlay--pause')).toBeVisible();
      await expectNoScroll(page);
      await expectInsideViewport(page, '.overlay--pause .overlay__panel');
      await page.locator('.overlay--pause').getByRole('button', { name: 'Resume' }).click();

      await expandDebugPanel(page);
      await clickDebugAction(page, 'Add XP +20');
      await expect(page.locator('.levelup:not([hidden])')).toBeVisible();
      await expectNoScroll(page);
      await expectInsideViewport(page, '.levelup__panel');
      await page.keyboard.press('1');
      await expect(page.locator('.levelup')).toBeHidden();

      // Fresh run without perks so the results check is not skewed by a
      // defensive perk (Safety Net/sticky) that delays the forced defeat.
      await page.goto('/?debug=1&resetSave=1');
      await waitForMenu(page);
      await startPlay(page);
      await forceDefeat(page);
      await expect(page.locator('.overlay--results')).toBeVisible();
      await expectNoScroll(page);
      await expectInsideViewport(page, '.overlay--results .overlay__panel');
    });
  }
});

test.describe('mobile landscape guard', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('landscape shows rotate overlay, pauses the run and resumes on portrait', async ({ page }) => {
    await page.goto('/?debug=1');
    await waitForMenu(page);
    await startPlay(page);

    await page.setViewportSize({ width: 844, height: 390 });
    const orientation = page.locator('.orientation');
    await expect(orientation).toBeVisible();
    await expect(orientation).toContainText('Rotate to portrait');
    await expect(page.locator('.overlay--pause')).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(orientation).toBeHidden();
    await expect(page.locator('.overlay--pause')).toBeHidden();
    await expect(page.locator('.hud')).toBeVisible();
  });
});
