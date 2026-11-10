import { expect, test } from '@playwright/test';
import { clickDebugAction, expandDebugPanel, HUD, monitorPage, waitForMenu } from './helpers';

/**
 * v0.3.0 Endless smoke: locked until the campaign is complete, then menu
 * entry, wave progression, defeat, results content and persisted stats.
 */
test.describe('v0.3 endless runtime', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('is locked on a fresh save and explains the requirement', async ({ page }) => {
    const monitor = monitorPage(page);
    await page.goto('/?debug=1&resetSave=1');
    await waitForMenu(page);

    await page.locator('#endless-button').dispatchEvent('click');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText('Endless is locked');
    await expect(page.locator(HUD)).toBeHidden();

    await page.getByRole('button', { name: 'Got it' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
    expect(monitor.pageErrors).toEqual([]);
  });

  test('starts, advances waves, records best wave and shows results', async ({ page }) => {
    const monitor = monitorPage(page);

    await page.goto('/?debug=1');
    await waitForMenu(page);
    await page.evaluate(() => {
      localStorage.setItem(
        'bb.save',
        JSON.stringify({
          version: 1,
          unlockedPhase: 6,
          phases: {},
          endless: { bestWave: 0, bestScore: 0, runs: 0 },
          campaignComplete: true,
          updatedAt: Date.now(),
        }),
      );
    });
    await page.reload();
    await waitForMenu(page);

    await page.locator('#endless-button').click();
    await page.locator(HUD).waitFor({ state: 'visible' });
    await expandDebugPanel(page);

    const waveText = page.locator('.hud__wave-text');
    await expect(waveText).toContainText('Endless · Wave 1');

    expect(await clickDebugAction(page, 'Next wave')).toBe(true);
    await expect(waveText).toContainText('Endless · Wave 2');

    expect(await clickDebugAction(page, 'Next wave')).toBe(true);
    await expect(waveText).toContainText('Endless · Wave 3');

    expect(await clickDebugAction(page, 'Force defeat')).toBe(true);
    await page.locator('.overlay--results').waitFor({ state: 'visible', timeout: 15_000 });

    await expect(page.locator('#overlay-results-kicker')).toHaveText('Endless run');
    await expect(page.locator('.overlay__phase')).toContainText('Endless · Wave 3');
    await expect(page.locator('.overlay__endless')).toContainText('Best wave');

    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('bb.save')))
      .toContain('"bestWave":3');

    expect(monitor.pageErrors).toEqual([]);
  });
});
