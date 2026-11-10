import { expect, test } from '@playwright/test';
import {
  clickDebugAction,
  expandDebugPanel,
  resolveLevelUps,
  startPlay,
  waitForMenu,
} from './helpers';

interface DebugGame {
  getHudState(): { elapsedMs: number };
}

const elapsed = (page: import('@playwright/test').Page): Promise<number> =>
  page.evaluate(() => {
    const game = (window as unknown as { __bricklike?: DebugGame }).__bricklike;
    return game?.getHudState().elapsedMs ?? -1;
  });

test.describe('run clock', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('does not count pause or level-up time', async ({ page }) => {
    await page.goto('/?debug=1&resetSave=1');
    await waitForMenu(page);
    await startPlay(page);
    await page.waitForTimeout(800);

    const beforePause = await elapsed(page);
    await page.keyboard.press('p');
    await expect(page.locator('.overlay--pause')).toBeVisible();
    await page.waitForTimeout(1500);
    await page.locator('.overlay--pause').getByRole('button', { name: 'Resume' }).click();
    await expect(page.locator('.overlay--pause')).toBeHidden();
    await page.waitForTimeout(500);
    const afterPause = await elapsed(page);
    expect(afterPause - beforePause).toBeLessThan(1500);

    await expandDebugPanel(page);
    await page.waitForTimeout(300);
    const beforeLevelUp = await elapsed(page);
    expect(await clickDebugAction(page, 'Add XP +100')).toBe(true);
    await expect(page.locator('.levelup:not([hidden])')).toBeVisible();
    await page.waitForTimeout(1500);
    expect(await elapsed(page)).toBe(beforeLevelUp);
    await resolveLevelUps(page);
    await expect(page.locator('.levelup')).toBeHidden();
  });
});
