import { expect, test } from '@playwright/test';
import {
  HUD,
  clickDebugAction,
  expandDebugPanel,
  startPlay,
  waitForMenu,
} from './helpers';

interface DebugGame {
  getHudState(): { phase: string; elapsedMs: number; adReviveUsed: boolean };
}

const elapsed = (page: import('@playwright/test').Page): Promise<number> =>
  page.evaluate(() => {
    const game = (window as unknown as { __bricklike?: DebugGame }).__bricklike;
    return game?.getHudState().elapsedMs ?? -1;
  });

test.describe('rewarded revive and results ads', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('offers one rewarded revive, resumes the run and shows the results Menu ad', async ({
    page,
  }) => {
    await page.goto('/?debug=1&adMock=rewarded&resetSave=1');
    await waitForMenu(page);
    await startPlay(page);
    await expandDebugPanel(page);

    expect(await clickDebugAction(page, 'Force defeat')).toBe(true);
    const revive = page.locator('.revive:not([hidden])');
    await expect(revive).toBeVisible();
    await expect(revive).toContainText('Save this run?');

    const before = await elapsed(page);
    await page.waitForTimeout(1400);
    expect(await elapsed(page)).toBe(before);

    await page.locator('#revive-watch').click();
    const ad = page.locator('.ad-overlay');
    await expect(ad).toBeVisible();
    await expect(ad).toBeHidden({ timeout: 10_000 });
    await expect(page.locator(HUD)).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => {
          const game = (window as unknown as { __bricklike?: DebugGame }).__bricklike;
          return game?.getHudState().phase;
        }),
      )
      .toBe('playing');

    // The one-per-run offer is gone: the next defeat goes straight to results.
    expect(await clickDebugAction(page, 'Force defeat')).toBe(true);
    await expect(page.locator('.overlay--results')).toBeVisible();
    await expect(revive).toBeHidden();
    await expect
      .poll(() =>
        page.evaluate(() => {
          const game = (window as unknown as { __bricklike?: DebugGame }).__bricklike;
          return game?.getHudState().adReviveUsed;
        }),
      )
      .toBe(true);

    // Leaving results via Menu also requests the results interstitial.
    await page.locator('.overlay--results').getByRole('button', { name: 'Menu' }).click();
    await expect(ad).toBeVisible();
    await expect(ad).toBeHidden({ timeout: 10_000 });
    await expect(page.locator('#campaign-button')).toBeVisible();
  });

  test('declining the revive offer ends the run without an ad', async ({ page }) => {
    await page.goto('/?debug=1&adMock=rewarded&resetSave=1');
    await waitForMenu(page);
    await startPlay(page);
    await expandDebugPanel(page);

    expect(await clickDebugAction(page, 'Force defeat')).toBe(true);
    await expect(page.locator('.revive:not([hidden])')).toBeVisible();
    await page.locator('#revive-decline').click();
    await expect(page.locator('.overlay--results')).toBeVisible();
    await expect(page.locator('.ad-overlay')).toBeHidden();
  });
});
