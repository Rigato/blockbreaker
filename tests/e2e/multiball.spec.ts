import { expect, test } from '@playwright/test';
import { clickDebugAction, expandDebugPanel, monitorPage, startPlay, waitForMenu } from './helpers';

interface DebugGame {
  debugGrantPerk(perkId: string): void;
  getHudState(): { ballsActive: number; ballStuck: boolean };
}

/**
 * Regression: Multiball extras must be re-armed on the next wave and released
 * automatically after the player's first launch.
 */
test.describe('multiball wave carry-over', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('spawns queued extra balls after launching the next wave', async ({ page }) => {
    const monitor = monitorPage(page);

    await page.goto('/?debug=1&resetSave=1');
    await waitForMenu(page);
    await startPlay(page);
    await expandDebugPanel(page);

    const grant = await page.evaluate(() => {
      const game = (window as unknown as { __bricklike?: DebugGame }).__bricklike;
      if (!game) return false;
      game.debugGrantPerk('multiball');
      return true;
    });
    expect(grant).toBe(true);

    expect(await clickDebugAction(page, 'Next wave')).toBe(true);
    await expect
      .poll(() =>
        page.evaluate(() => {
          const game = (window as unknown as { __bricklike?: DebugGame }).__bricklike;
          return game?.getHudState().ballsActive ?? 0;
        }),
      )
      .toBe(1);

    await page.keyboard.press('v');
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const game = (window as unknown as { __bricklike?: DebugGame }).__bricklike;
            return game?.getHudState().ballsActive ?? 0;
          }),
        { timeout: 5_000 },
      )
      .toBeGreaterThanOrEqual(2);

    expect(monitor.pageErrors).toEqual([]);
  });
});
