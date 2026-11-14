import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  HUD,
  MENU_READY,
  PHASE_SELECT,
  PHASE_SHEET_PLAY,
  collapseDebugPanel,
  playSelectedPhase,
  selectPhase,
  waitForMenu,
} from './helpers';

const PHASE_IDS = [
  'tutorial',
  'phase-1',
  'phase-2',
  'phase-3',
  'phase-4',
  'phase-5',
  'phase-6',
] as const;

/** Seeds level 1 as unlocked so the map has two playable nodes. */
async function seedLevelOne(page: Page): Promise<void> {
  await page.addInitScript(() => {
    if (localStorage.getItem('bb.save')) return;
    localStorage.setItem(
      'bb.save',
      JSON.stringify({
        version: 1,
        unlockedPhase: 1,
        phases: {},
        endless: { bestWave: 0, bestScore: 0, runs: 0 },
        campaignComplete: false,
        updatedAt: Date.now(),
      }),
    );
  });
}

async function openCampaign(page: Page): Promise<void> {
  await waitForMenu(page);
  await collapseDebugPanel(page);
  await page.locator(MENU_READY).click();
  await expect(page.locator(PHASE_SELECT)).toBeVisible();
}

/** Vertical translation of a parallax layer in px (0 when not translated). */
function layerTranslateY(layer: Locator): Promise<number> {
  return layer.evaluate((element) => {
    const transform = getComputedStyle(element).transform;
    if (!transform || transform === 'none') return 0;
    return new DOMMatrixReadOnly(transform).m42;
  });
}

test.describe('phase select map', () => {
  test.use({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' });

  test('map: seven phase nodes plus the endless node open the play sheet', async ({ page }) => {
    await page.goto('/?debug=1&resetSave=1');
    await openCampaign(page);

    const nodes = page.locator('.phase-node[data-phase-id]');
    await expect(nodes).toHaveCount(7);
    const ids = await nodes.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('data-phase-id')).sort(),
    );
    expect(ids).toEqual([...PHASE_IDS].sort());

    for (const phaseId of PHASE_IDS) {
      await expect(page.locator(`.phase-node[data-phase-id="${phaseId}"]`)).toBeVisible();
    }

    const endless = page.locator('.phase-node--endless');
    await expect(endless).toHaveCount(1);
    await expect(endless).toBeVisible();
    expect(await endless.getAttribute('data-phase-index')).toBeNull();

    await selectPhase(page, 'tutorial');
    await expect(page.locator('.phase-sheet')).toBeVisible();
    await expect(page.locator(PHASE_SHEET_PLAY)).toBeVisible();
    await expect(page.locator(PHASE_SHEET_PLAY)).toHaveText('Play');
    await expect(page.locator('.phase-sheet__name')).not.toBeEmpty();
    await expect(page.locator('.phase-node[data-phase-id="tutorial"]')).toHaveClass(/is-selected/);
  });

  test('sheet: selecting a node updates the name and Play starts that phase', async ({ page }) => {
    await seedLevelOne(page);
    await page.goto('/?debug=1');
    await openCampaign(page);

    await selectPhase(page, 'tutorial');
    const name = page.locator('.phase-sheet__name');
    const tutorialName = (await name.textContent())?.trim() ?? '';
    expect(tutorialName.length).toBeGreaterThan(0);

    await selectPhase(page, 'phase-1');
    await expect(page.locator('.phase-node[data-phase-id="phase-1"]')).toHaveClass(/is-selected/);
    await expect(page.locator('.phase-node[data-phase-id="tutorial"]')).not.toHaveClass(
      /is-selected/,
    );

    const phaseOneName = (await name.textContent())?.trim() ?? '';
    expect(phaseOneName.length).toBeGreaterThan(0);
    expect(phaseOneName).not.toBe(tutorialName);

    await playSelectedPhase(page);
    await expect(page.locator(HUD)).toBeVisible();
    await expect(page.locator(PHASE_SELECT)).toBeHidden();
    await expect(page.locator('#debug-phase')).toContainText('(1/6)');
  });

  test('map: locked phases stay disabled and keep the lock class', async ({ page }) => {
    await page.goto('/?debug=1&resetSave=1');
    await openCampaign(page);

    const locked = page.locator('.phase-node[data-phase-index="3"]');
    await expect(locked).toBeVisible();
    await expect(locked).toBeDisabled();
    await expect(locked).toHaveClass(/is-locked/);
    await expect(locked).not.toHaveClass(/is-current/);
    await expect(page.locator('.phase-node[data-phase-id="phase-1"]')).toBeDisabled();

    // A disabled node cannot start a run through the sheet.
    await locked.evaluate((element: HTMLElement) => element.click());
    await expect(page.locator(PHASE_SELECT)).toBeVisible();
    await expect(page.locator(HUD)).toBeHidden();
  });

  test('map: opens centered on the current node and the far layer parallaxes', async ({ page }) => {
    await page.goto('/?debug=1&resetSave=1');
    await openCampaign(page);

    const scroller = page.locator('.phase-select__scroller');
    const metrics = () =>
      scroller.evaluate((element) => ({
        top: element.scrollTop,
        max: element.scrollHeight - element.clientHeight,
      }));

    // The 390x900 map is taller than the scroller and opens on the current node
    // (the tutorial sits near the bottom of the map), so scrollTop starts > 0.
    await expect.poll(async () => (await metrics()).max).toBeGreaterThan(0);
    await expect.poll(async () => (await metrics()).top).toBeGreaterThan(0);

    const far = page.locator('.phase-map__layer--far');
    const near = page.locator('.phase-map__layer--near');

    await scroller.evaluate((element) => {
      element.scrollTop = Math.round((element.scrollHeight - element.clientHeight) / 2);
    });
    await expect.poll(async () => Math.abs(await layerTranslateY(far))).toBeGreaterThan(0);

    // Nodes live on the near layer, which must stay untouched by the parallax.
    expect(await layerTranslateY(near)).toBe(0);
    const nearTransform = await near.evaluate((element) => getComputedStyle(element).transform);
    expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(nearTransform);
  });
});
