import { expect, test } from '@playwright/test';
import {
  clickDebugAction,
  expandDebugPanel,
  startPlay,
  waitForMenu,
} from './helpers';

test.describe('natural-pause ads', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('shows an interstitial when leaving a live run through the pause menu', async ({
    page,
  }) => {
    await page.goto('/?debug=1&adMock=show');
    await waitForMenu(page);
    await startPlay(page);
    await page.keyboard.press('p');
    await expect(page.locator('.overlay--pause')).toBeVisible();

    await page.locator('.overlay--pause').getByRole('button', { name: 'Menu' }).click();
    const ad = page.locator('.ad-overlay');
    await expect(ad).toBeVisible();
    await expect(ad).toBeHidden({ timeout: 5_000 });
    await expect(page.locator('#campaign-button')).toBeVisible();
  });

  test('does not stack a pause ad right after a rewarded revive', async ({ page }) => {
    await page.goto('/?debug=1&adMock=rewarded&resetSave=1');
    await waitForMenu(page);
    await startPlay(page);
    await expandDebugPanel(page);

    expect(await clickDebugAction(page, 'Force defeat')).toBe(true);
    await page.locator('#revive-watch').click();
    const ad = page.locator('.ad-overlay');
    await expect(ad).toBeVisible();
    await expect(ad).toBeHidden({ timeout: 10_000 });

    await page.keyboard.press('p');
    await expect(page.locator('.overlay--pause')).toBeVisible();
    await page.locator('.overlay--pause').getByRole('button', { name: 'Menu' }).click();
    await expect(ad).toBeHidden();
    await expect(page.locator('#campaign-button')).toBeVisible();
  });
});
