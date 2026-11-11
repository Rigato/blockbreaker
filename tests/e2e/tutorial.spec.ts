import { expect, test } from '@playwright/test';
import { HUD, startTutorial, waitForMenu } from './helpers';

test.describe('first-run tutorial', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('gates level 1, coaches the first launch and can be skipped', async ({ page }) => {
    await page.goto('/?resetSave=1');
    await waitForMenu(page);

    await page.locator('#campaign-button').click();
    const tutorial = page.locator('.phase-card[data-phase-id="tutorial"]');
    const levelOne = page.locator('.phase-card[data-phase-id="phase-1"]');
    await expect(tutorial).toBeVisible();
    await expect(tutorial).toBeEnabled();
    await expect(levelOne).toBeDisabled();

    await tutorial.click();
    await page.locator(HUD).waitFor({ state: 'visible' });
    const coach = page.locator('.hud__tutorial');
    await expect(coach).toBeVisible();
    await expect(coach).toContainText('Move & launch');
    await expect(page.locator('#tutorial-ack')).toBeVisible();

    await page.locator('#tutorial-skip').click();
    await expect(page.locator('.overlay--results')).toBeVisible();
    await expect(page.locator('#overlay-results-kicker')).toHaveText('Tutorial complete');

    await expect
      .poll(() =>
        page.evaluate(() => {
          const raw = localStorage.getItem('bb.save');
          return raw ? JSON.parse(raw).unlockedPhase : -1;
        }),
      )
      .toBeGreaterThanOrEqual(1);

    await page
      .locator('.overlay--results')
      .getByRole('button', { name: 'Next level' })
      .click();
    await page.locator(HUD).waitFor({ state: 'visible' });
    await expect(page.locator('.hud__tutorial')).toBeHidden();
    await expect(page.locator('.hud__wave-text')).toContainText('Wave 1/2');
  });

  test('acknowledging the first coach mark resumes the run', async ({ page }) => {
    await page.goto('/?resetSave=1');
    await waitForMenu(page);
    await startTutorial(page);

    await expect(page.locator('.hud__tutorial')).toContainText('Move & launch');
    await page.locator('#tutorial-ack').click();
    await expect(page.locator('.hud__tutorial')).toBeHidden();
    await expect(page.locator('.hud__hint')).toHaveText('Tap / click / V to launch');

    await page.keyboard.press('v');
    await expect(page.locator('.hud__hint')).not.toHaveText('Tap / click / V to launch');
  });

  test('tutorial has two waves and shows the special-block coach mark', async ({ page }) => {
    await page.goto('/?debug=1&resetSave=1');
    await waitForMenu(page);
    await startTutorial(page);

    await page.evaluate(() => {
      const game = (window as unknown as { __bricklike?: { debugNextWave(): void } })
        .__bricklike;
      game?.debugNextWave();
    });

    await expect(page.locator('.hud__wave-text')).toContainText('Wave 2/2');
    await expect(page.locator('.hud__tutorial')).toContainText('Special blocks');
  });
});
