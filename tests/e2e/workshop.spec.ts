import { expect, test, type Page } from '@playwright/test';
import {
  collapseDebugPanel,
  forceVictory,
  monitorPage,
  startPlay,
  waitForMenu,
} from './helpers';

const SECOND_CHANCE = '.workshop__card[data-perk-id="second_chance"]';
const EXPLOSIVE_CORE = '.workshop__card[data-perk-id="explosive_core"]';
const CONDUCTOR = '.workshop__card[data-perk-id="conductor"]';

async function addSparks(page: Page, amount: number): Promise<void> {
  await page.evaluate((value) => {
    const game = (
      window as unknown as { __bricklike?: { debugAddSparks(amount: number): void } }
    ).__bricklike;
    if (!game) throw new Error('debug game handle is unavailable');
    game.debugAddSparks(value);
  }, amount);
}

async function openWorkshop(page: Page): Promise<void> {
  await collapseDebugPanel(page);
  await page.locator('#workshop-button').click();
  await expect(page.locator('.workshop:not([hidden])')).toBeVisible();
}

async function expectNoDocumentScroll(page: Page): Promise<void> {
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

test.describe('workshop', () => {
  test('fresh save: menu strip shows 0 Sparks and locked cards need more', async ({ page }) => {
    const monitor = monitorPage(page);
    await page.goto('/?debug=1&resetSave=1');
    await waitForMenu(page);

    const strip = page.locator('#workshop-button');
    await expect(strip).toBeVisible();
    await expect(strip).toContainText('Workshop');
    await expect(strip).toContainText('0 Sparks');
    await expect(strip.locator('.menu__workshop-ready')).toBeHidden();

    await openWorkshop(page);
    const workshop = page.locator('.workshop:not([hidden])');
    await expect(page.locator('#workshop-sparks')).toHaveText('0 Sparks');
    await expect(workshop.locator('.workshop__tier-title')).toHaveText([
      'Tier 1',
      'Tier 2',
      'Tier 3',
      'Tier 4',
    ]);
    await expect(workshop.locator('.workshop__card')).toHaveCount(12);

    const card = workshop.locator(SECOND_CHANCE);
    await expect(card).toHaveAttribute('data-state', 'locked');
    await expect(card).toContainText('Need 12 more Sparks');
    await expect(card.locator('.workshop__buy')).toBeEnabled();

    await card.locator('.workshop__buy').click();
    await expect(page.locator('#workshop-status')).toHaveText('Not enough Sparks.');
    await expect(page.locator('#workshop-sparks')).toHaveText('0 Sparks');
    await expect(card).toHaveAttribute('data-state', 'locked');

    // Debug Sparks emit meta:changed, so the open dialog refreshes in place.
    await addSparks(page, 20);
    await expect(page.locator('#workshop-sparks')).toHaveText('20 Sparks');
    await expect(card).toHaveAttribute('data-state', 'affordable');
    await expect(card).not.toContainText('Need 12 more Sparks');

    await page.keyboard.press('Escape');
    await expect(page.locator('.workshop')).toBeHidden();
    await expect(strip).toBeFocused();

    expect(monitor.pageErrors).toEqual([]);
    expect(monitor.consoleErrors).toEqual([]);
  });

  test('buy, menu badge and persistence across reloads', async ({ page }) => {
    await page.goto('/?debug=1&resetSave=1');
    await waitForMenu(page);

    const strip = page.locator('#workshop-button');
    await addSparks(page, 20);
    await expect(strip).toContainText('20 Sparks');
    await expect(strip.locator('.menu__workshop-ready')).toBeVisible();

    await openWorkshop(page);
    const card = page.locator(SECOND_CHANCE);
    await expect(card).toHaveAttribute('data-state', 'affordable');
    await expect(page.locator('#workshop-sparks')).toHaveText('20 Sparks');

    await card.locator('.workshop__buy').click();
    await expect(page.locator('#workshop-sparks')).toHaveText('8 Sparks');
    await expect(page.locator('#workshop-status')).toHaveText('Second Chance unlocked.');
    await expect(card).toHaveAttribute('data-state', 'owned');
    await expect(card).toContainText('Owned');
    await expect(card.locator('.workshop__buy')).toBeDisabled();

    await page.locator('#workshop-close').click();
    await expect(page.locator('.workshop')).toBeHidden();
    await expect(strip).toContainText('8 Sparks');
    await expect(strip.locator('.menu__workshop-ready')).toBeHidden();

    // Sparks and the unlock are already on disk before the reload.
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('bb.save') ?? ''))
      .toContain('"second_chance"');

    await page.goto('/?debug=1');
    await waitForMenu(page);
    await expect(strip).toContainText('8 Sparks');

    await openWorkshop(page);
    await expect(page.locator('#workshop-sparks')).toHaveText('8 Sparks');
    const persisted = page.locator(SECOND_CHANCE);
    await expect(persisted).toHaveAttribute('data-state', 'owned');
    await expect(persisted.locator('.workshop__buy')).toBeDisabled();

    // 8 Sparks cannot afford Explosive Core (15).
    const expensive = page.locator(EXPLOSIVE_CORE);
    await expect(expensive).toHaveAttribute('data-state', 'locked');
    await expect(expensive).toContainText('Need 7 more Sparks');
    await expensive.locator('.workshop__buy').click();
    await expect(page.locator('#workshop-status')).toHaveText('Not enough Sparks.');
    await expect(page.locator('#workshop-sparks')).toHaveText('8 Sparks');
  });

  test('results show Sparks earned and the new total', async ({ page }) => {
    await page.goto('/?debug=1&resetSave=1');
    await waitForMenu(page);
    await startPlay(page);
    await forceVictory(page);

    const sparks = page.locator('#results-sparks');
    await expect(sparks).toBeVisible();
    await expect(sparks).toHaveText('+7 Sparks · total 7');
  });
});

const VIEWPORTS = [
  { name: '320x568', width: 320, height: 568 },
  { name: '390x844', width: 390, height: 844 },
] as const;

test.describe('workshop layout', () => {
  for (const viewport of VIEWPORTS) {
    test(`${viewport.name}: menu strip and workshop fit without clipping`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/?debug=1&resetSave=1');
      await waitForMenu(page);
      await collapseDebugPanel(page);

      await expectNoDocumentScroll(page);
      await expect(page.locator('#workshop-button')).toBeVisible();
      await expectInsideViewport(page, '#campaign-button');
      await expectInsideViewport(page, '#endless-button');
      await expectInsideViewport(page, '#workshop-button');
      await expectInsideViewport(page, '.menu__footer');

      await page.locator('#workshop-button').click();
      await expect(page.locator('.workshop:not([hidden])')).toBeVisible();
      await expectNoDocumentScroll(page);
      await expectInsideViewport(page, '.workshop__panel');
      await expectInsideViewport(page, '#workshop-close');

      const list = page.locator('.workshop__list');
      const overflowY = await list.evaluate((element) => getComputedStyle(element).overflowY);
      expect(overflowY).toBe('auto');

      const lastCard = page.locator(CONDUCTOR);
      await lastCard.scrollIntoViewIfNeeded();
      await expect(lastCard).toBeVisible();

      await page.locator('#workshop-close').click();
      await expect(page.locator('.workshop')).toBeHidden();
      await expectNoDocumentScroll(page);
    });
  }
});
