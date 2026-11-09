import { expect, test } from '@playwright/test';
import { HUD, monitorPage, waitForMenu } from './helpers';

interface DebugGame {
  debugStartWave(phaseId: string, waveIndex: number): void;
}

/**
 * v0.2.0 runtime smoke for the new campaign systems. The debug jump lets the
 * suite load boss/challenge waves directly, so rendering and HUD wiring are
 * exercised without replaying 21 waves.
 */
test.describe('v0.2 campaign runtime', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('loads challenge and boss waves without page errors', async ({ page }) => {
    const monitor = monitorPage(page);

    await page.addInitScript(() => {
      localStorage.setItem(
        'bb.save',
        JSON.stringify({
          version: 1,
          unlockedPhase: 6,
          phases: {},
          updatedAt: Date.now(),
        }),
      );
    });

    await page.goto('/?debug=1');
    await waitForMenu(page);
    // The debug strip intentionally hides `.hud__top`; restore the normal HUD
    // so the boss bar is exercised the way players see it.
    await page.evaluate(() => {
      delete document.documentElement.dataset.debug;
    });

    const jump = async (phaseId: string, waveIndex: number): Promise<void> => {
      await page.evaluate(
        ({ phaseId: targetPhase, waveIndex: targetWave }) => {
          const game = (
            window as unknown as { __bricklike?: DebugGame }
          ).__bricklike;
          if (!game) throw new Error('debug game handle is missing');
          game.debugStartWave(targetPhase, targetWave);
        },
        { phaseId, waveIndex },
      );
      await page.locator(HUD).waitFor({ state: 'visible' });
    };

    await jump('phase-4', 1);
    await expect(page.locator('.hud__chip--rule')).toContainText('TIME');

    await jump('phase-4', 2);
    await expect(page.locator('.hud__boss')).toBeVisible();
    await expect(page.locator('.hud__boss-name')).toContainText('Frost Sentinel');

    await jump('phase-5', 1);
    await expect(page.locator('.hud__chip--rule')).toContainText('NO LASER');

    await jump('phase-6', 4);
    await expect(page.locator('.hud__boss-name')).toContainText('Void Herald');
    await page.waitForTimeout(1_200);

    expect(monitor.pageErrors).toEqual([]);
    expect(monitor.consoleErrors).toEqual([]);
  });
});
