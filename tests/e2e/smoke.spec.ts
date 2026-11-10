import { expect, test } from '@playwright/test';
import {
  LAUNCH_HINT,
  MENU_READY,
  clickDebugAction,
  collapseDebugPanel,
  expandDebugPanel,
  forceDefeat,
  forceVictory,
  monitorPage,
  readResults,
  resolveLevelUps,
  startPlay,
  waitForMenu,
} from './helpers';

test.describe('smoke', () => {
  test('boot: menu loads with Campaign, Endless and Settings and no platform API calls', async ({
    page,
  }) => {
    const monitor = monitorPage(page);
    await page.goto('/');
    await waitForMenu(page);

    await expect(page.locator('#campaign-button')).toBeVisible();
    await expect(page.locator('#endless-button')).toBeVisible();
    await expect(page.locator('#settings-button')).toBeVisible();
    await expect(page.locator('.menu__title')).toHaveText('Bricklike');
    await expect(page.getByText('XP · Perks · Levels')).toHaveCount(0);
    await expect(page.getByText('Portrait · Touch · Mouse · Keyboard')).toHaveCount(0);
    await expect(page.locator('.menu__card--campaign')).toBeVisible();
    await expect(page.locator('.menu__card--endless')).toBeVisible();

    expect(monitor.consoleErrors).toEqual([]);
    expect(monitor.pageErrors).toEqual([]);
    expect(monitor.requests.filter((url) => url.includes('api.playgama.com'))).toEqual([]);
  });

  test('controls: Space does not launch, V launches, pause/resume and settings persist', async ({
    page,
  }) => {
    const monitor = monitorPage(page);
    await page.goto('/');
    await waitForMenu(page);
    await startPlay(page);

    await expect(page.locator('canvas')).toBeVisible();
    const hint = page.locator('.hud__hint');
    await expect(hint).toHaveText(LAUNCH_HINT);

    await page.keyboard.press('Space');
    await page.waitForTimeout(250);
    await expect(hint).toHaveText(LAUNCH_HINT);

    await page.keyboard.press('v');
    await expect.poll(async () => hint.textContent()).not.toBe(LAUNCH_HINT);

    await page.keyboard.press('p');
    await expect(page.locator('.overlay--pause')).toBeVisible();
    await page.locator('.overlay--pause').getByRole('button', { name: 'Resume' }).click();
    await expect(page.locator('.overlay--pause')).toBeHidden();

    await page.keyboard.press('p');
    await page.locator('.overlay--pause').getByRole('button', { name: 'Menu' }).click();
    await expect(page.locator(MENU_READY)).toBeVisible();

    await page.locator('#settings-button').click();
    const settings = page.getByRole('dialog').filter({ hasText: 'Tune the experience' });
    await expect(settings).toBeVisible();
    const soundSwitch = settings.getByRole('switch', { name: 'Sound effects' });
    const musicSwitch = settings.getByRole('switch', { name: 'Music' });
    const shakeSwitch = settings.getByRole('switch', { name: 'Screen shake' });
    await expect(soundSwitch).toHaveAttribute('aria-checked', 'true');
    await expect(musicSwitch).toHaveAttribute('aria-checked', 'true');
    await expect(shakeSwitch).toHaveAttribute('aria-checked', 'true');
    await soundSwitch.click();
    await musicSwitch.click();
    await shakeSwitch.click();
    await expect(soundSwitch).toHaveAttribute('aria-checked', 'false');
    await expect(musicSwitch).toHaveAttribute('aria-checked', 'false');
    await expect(shakeSwitch).toHaveAttribute('aria-checked', 'false');
    await settings.getByRole('button', { name: 'Close' }).click();

    await page.reload();
    await waitForMenu(page);
    await page.locator('#settings-button').click();
    const reloaded = page.getByRole('dialog').filter({ hasText: 'Tune the experience' });
    await expect(reloaded.getByRole('switch', { name: 'Sound effects' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    await expect(reloaded.getByRole('switch', { name: 'Music' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    await expect(reloaded.getByRole('switch', { name: 'Screen shake' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(await page.evaluate(() => localStorage.getItem('bb.settings'))).toContain('"sound":false');
    expect(await page.evaluate(() => localStorage.getItem('bb.settings'))).toContain('"music":false');
    expect(await page.evaluate(() => localStorage.getItem('bb.settings'))).toContain(
      '"screenShake":false',
    );

    expect(monitor.pageErrors).toEqual([]);
  });

  test('level up: +100 XP offers three cards, keyboard choice resumes the run', async ({ page }) => {
    await page.goto('/?debug=1');
    await waitForMenu(page);
    await startPlay(page);
    await expandDebugPanel(page);

    await clickDebugAction(page, 'Add XP +100');
    const levelup = page.locator('.levelup:not([hidden])');
    await expect(levelup).toBeVisible();
    await expect(levelup.locator('.levelup__card')).toHaveCount(3);

    await page.keyboard.press('1');
    // +100 XP queues several levels; resolve the remaining cards with the same
    // keyboard path and confirm the modal closes and the field resumes.
    await resolveLevelUps(page);
    await expect(page.locator('.levelup')).toBeHidden();
    await expect(page.locator('.overlay--pause')).toBeHidden();
    await expect(page.locator('.hud')).toBeVisible();
  });

  test('results: phase 1 victory unlocks and starts phase 2 across reloads', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/?debug=1&resetSave=1');
    await waitForMenu(page);
    await startPlay(page);
    await forceVictory(page);

    const results = await readResults(page);
    expect(results.kicker).toBe('Victory');
    expect(results.title).toBe('Crystal Grove');
    expect(results.values).toHaveLength(5);
    expect(results.nextVisible).toBe(true);

    // The results screen renders the campaign epilogue and rank.
    await expect(page.locator('.overlay__ending')).toBeVisible();
    await expect(page.locator('.overlay__ending-title')).not.toBeEmpty();
    await expect(page.locator('.overlay__ending-rank')).toHaveText(/^[SAB]$/);

    const resultsPanel = page.locator('.overlay--results');
    await resultsPanel.getByRole('button', { name: 'Next level' }).click();
    await expect(page.locator('.hud')).toBeVisible();
    await expect(page.locator('#debug-phase')).toContainText('(2/6)');
    await expect(page.locator('.hud__wave-text')).toContainText('Ruined Halls');

    const saved = await page.evaluate(() => localStorage.getItem('bb.save'));
    expect(saved).not.toBeNull();

    await page.goto('/?debug=1');
    await waitForMenu(page);
    await collapseDebugPanel(page);
    await page.locator('#campaign-button').click();
    const phase2 = page.locator('.phase-card[data-phase-index="2"]');
    await expect(phase2).toBeVisible();
    await expect(phase2).toBeEnabled();
    await expect(phase2).not.toHaveClass(/is-locked/);
    await expect(page.locator('.phase-card[data-phase-index="3"]')).toBeDisabled();
  });

  for (const mode of ['show', 'fail'] as const) {
    test(`ad mock (${mode}): retry shows the ad overlay and resumes`, async ({ page }) => {
      const monitor = monitorPage(page);
      await page.goto(`/?debug=1&adMock=${mode}&resetSave=1`);
      await waitForMenu(page);
      await startPlay(page);
      await forceDefeat(page);

      await expect(page.locator('.overlay--results')).toBeVisible();
      await expect(page.locator('#overlay-results-kicker')).toHaveText('Defeat');

      await page
        .locator('.overlay--results')
        .getByRole('button', { name: 'Retry' })
        .click();
      const ad = page.locator('.ad-overlay');
      await expect(ad).toBeVisible();
      await expect(ad).toBeHidden({ timeout: 5_000 });
      await expect(page.locator('.hud')).toBeVisible();
      await expect(page.locator('.overlay--results')).toBeHidden();

      expect(monitor.pageErrors).toEqual([]);
    });
  }

  test('CDN blocked: local bridge fallback still boots and starts a run', async ({ page }) => {
    const monitor = monitorPage(page);
    await page.route('**://bridge.playgama.com/**', (route) => route.abort());

    await page.goto('/?debug=1');
    await waitForMenu(page);
    await startPlay(page);

    await expect(page.locator('canvas')).toBeVisible();
    await expect(page.locator('#debug-platform')).toContainText('mock');

    expect(monitor.pageErrors).toEqual([]);
    expect(monitor.failedRequests.some((url) => url.includes('bridge.playgama.com'))).toBe(true);
    expect(monitor.consoleErrors).toHaveLength(1);
    expect(monitor.consoleErrors[0]).toMatch(/ERR_FAILED|Failed to load resource/i);
  });
});
