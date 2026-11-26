/**
 * Regenerates the five Vibe Toplist 728x90 banners.
 *
 * Usage (from the repository root):
 *   node store/vibetoplist/source/render.mjs
 *
 * Requires the project dev dependency `playwright` and its Chromium build
 * (`npx playwright install chromium` once, if missing).
 *
 * Each HTML template is a self-contained 728x90 stage. Screenshots are taken
 * at device scale 1 so the pixel font stays crisp and the PNGs are exactly
 * 728x90, as required by vibetoplist.com.
 */
import { chromium } from "playwright";
import { stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "..");

const BANNERS = [
  ["banner-1.html", "bricklike-vibetoplist-01-neon-hero-728x90.png"],
  ["banner-2.html", "bricklike-vibetoplist-02-one-more-run-728x90.png"],
  ["banner-3.html", "bricklike-vibetoplist-03-choose-your-power-728x90.png"],
  ["banner-4.html", "bricklike-vibetoplist-04-break-the-frost-728x90.png"],
  ["banner-5.html", "bricklike-vibetoplist-05-browser-instant-728x90.png"],
];

const browser = await chromium.launch();
try {
  for (const [html, png] of BANNERS) {
    const page = await browser.newPage({
      viewport: { width: 728, height: 90 },
      deviceScaleFactor: 1,
    });
    await page.goto(pathToFileURL(join(here, html)).href, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(120);

    const target = join(outDir, png);
    await page.screenshot({
      path: target,
      clip: { x: 0, y: 0, width: 728, height: 90 },
    });
    const { size } = await stat(target);
    console.log(`${png}  ${Math.round(size / 1024)} KB`);
    await page.close();
  }
} finally {
  await browser.close();
}
