import { expect, test } from '@playwright/test';
import {
  HUD,
  collapseDebugPanel,
  monitorPage,
  startPlay,
  waitForMenu,
} from './helpers';

test.describe('clean build', () => {
  test('boots with no Playgama/CrazyGames SDK and no external requests', async ({
    page,
  }) => {
    const monitor = monitorPage(page);
    await page.goto('/?debug=1');
    await waitForMenu(page);

    await expect(page.locator('#debug-platform')).toContainText('clean');
    await expect(page.locator('#debug-storage')).toHaveText('localStorage');
    await expect(page.locator('#debug-bridge')).toHaveText('no SDK');
    await expect(page.locator('#debug-ads')).toHaveText('— / —');
    await expect(page.locator('#storage-warning-button')).toBeHidden();

    const globals = await page.evaluate(() => ({
      bridge: 'bridge' in window,
      playgamaBridge: 'playgamaBridge' in window,
      crazyGames: 'CrazyGames' in window,
    }));
    expect(globals).toEqual({
      bridge: false,
      playgamaBridge: false,
      crazyGames: false,
    });

    expect(monitor.requests.filter((url) => /playgama|crazygames/i.test(url))).toEqual([]);
    expect(
      monitor.requests.filter(
        (url) =>
          !url.startsWith('http://127.0.0.1:4174') &&
          !url.startsWith('data:') &&
          !url.startsWith('blob:'),
      ),
    ).toEqual([]);
    expect(monitor.failedRequests).toEqual([]);
    expect(monitor.pageErrors).toEqual([]);
  });

  test('persists settings across reload through localStorage', async ({ page }) => {
    await page.goto('/?debug=1');
    await waitForMenu(page);
    await collapseDebugPanel(page);

    await page.locator('#settings-button').click();
    const settings = page.getByRole('dialog').filter({ hasText: 'Tune the experience' });
    await expect(settings).toBeVisible();
    const sound = settings.getByRole('switch', { name: 'Sound effects' });
    await expect(sound).toHaveAttribute('aria-checked', 'true');
    await sound.click();
    await expect(sound).toHaveAttribute('aria-checked', 'false');
    await settings.getByRole('button', { name: 'Close' }).click();

    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('bb.settings')))
      .toContain('"sound":false');

    await page.reload();
    await waitForMenu(page);
    await collapseDebugPanel(page);
    await page.locator('#settings-button').click();
    const reloaded = page.getByRole('dialog').filter({ hasText: 'Tune the experience' });
    await expect(reloaded.getByRole('switch', { name: 'Sound effects' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    await expect(page.locator('#storage-warning-button')).toBeHidden();
  });

  test('starts gameplay with the HUD and no page errors', async ({ page }) => {
    const monitor = monitorPage(page);
    await page.goto('/');
    await waitForMenu(page);
    await startPlay(page);

    await expect(page.locator(HUD)).toBeVisible();
    await expect(page.locator('.hud__wave-text')).toContainText('Crystal Grove');
    expect(monitor.pageErrors).toEqual([]);
    expect(monitor.consoleErrors).toEqual([]);
  });
});
