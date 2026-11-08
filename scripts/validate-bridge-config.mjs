#!/usr/bin/env node
/**
 * Validates public/playgama-bridge-config.json against the Bridge 2.4.x
 * schema that ships with @playgama/bridge. No dependencies.
 *
 * Usage: node scripts/validate-bridge-config.mjs
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG_PATH = path.join(ROOT, 'public', 'playgama-bridge-config.json');

/** Keys read by the installed Bridge runtime, checked against its bundle. */
const BRIDGE_KEYS = [
  'loadingScreenType',
  'showFullLoadingLogo',
  'showLoadingText',
  'sendAnalyticsEvents',
  'adaptToSafeArea',
  'minimumDelayBetweenInterstitial',
  'initialInterstitialDelay',
  'placementFallback',
];

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function installedBridgeVersion() {
  try {
    const pkg = JSON.parse(
      readFileSync(path.join(ROOT, 'node_modules', '@playgama', 'bridge', 'package.json'), 'utf8'),
    );
    return typeof pkg.version === 'string' ? pkg.version : null;
  } catch {
    return null;
  }
}

function installedBridgeRuntime() {
  try {
    return readFileSync(
      path.join(ROOT, 'node_modules', '@playgama', 'bridge', 'dist', 'playgama-bridge.js'),
      'utf8',
    );
  } catch {
    return null;
  }
}

/**
 * Returns a list of human-readable issues; an empty list means the config is
 * valid for the M5 build.
 */
export function validateBridgeConfig(config, options = {}) {
  const issues = [];
  const add = (message) => issues.push(message);
  const bridgeVersion = options.bridgeVersion ?? installedBridgeVersion();
  const runtime = options.runtime ?? installedBridgeRuntime();

  if (!isRecord(config)) {
    return ['config root must be a JSON object'];
  }

  if (config.loadingScreenType !== 'none') {
    add('loadingScreenType must be "none" (no Bridge loading screen)');
  }
  if (config.showFullLoadingLogo !== false) {
    add('showFullLoadingLogo must be false');
  }
  if (config.sendAnalyticsEvents !== false) {
    add('sendAnalyticsEvents must be false (no external analytics)');
  }
  if (config.showLoadingText !== true) {
    add('showLoadingText must be true for the no-logo loading screen');
  }

  if (!isRecord(config.game) || config.game.adaptToSafeArea !== true) {
    add('game.adaptToSafeArea must be true');
  }

  const advertisement = config.advertisement;
  if (!isRecord(advertisement)) {
    add('advertisement must be an object');
  } else {
    if (
      typeof advertisement.minimumDelayBetweenInterstitial !== 'number' ||
      !Number.isFinite(advertisement.minimumDelayBetweenInterstitial) ||
      advertisement.minimumDelayBetweenInterstitial < 0
    ) {
      add('advertisement.minimumDelayBetweenInterstitial must be a non-negative number');
    }

    // Supported by 2.4.1 and still used by the Playgama platform. Keep it
    // explicit so the Bridge does not fall back to an undocumented default.
    if (
      typeof advertisement.initialInterstitialDelay !== 'number' ||
      !Number.isFinite(advertisement.initialInterstitialDelay) ||
      advertisement.initialInterstitialDelay < 0
    ) {
      add('advertisement.initialInterstitialDelay must be a non-negative number');
    }

    if (!isRecord(advertisement.interstitial)) {
      add('advertisement.interstitial must be an object');
    } else {
      if (
        typeof advertisement.interstitial.placementFallback !== 'string' ||
        advertisement.interstitial.placementFallback.length === 0
      ) {
        add('advertisement.interstitial.placementFallback must be a non-empty string');
      }
      const autoShow = advertisement.interstitial.autoShow;
      if (Array.isArray(autoShow) && autoShow.length > 0) {
        add('advertisement.interstitial.autoShow must be empty: ads are requested once from results');
      }
    }

    // Rewarded is not part of the MVP UI. A fallback placement may stay in the
    // file (4.9/5.2) but it must never auto-show.
    if (isRecord(advertisement.rewarded)) {
      const autoShow = advertisement.rewarded.autoShow;
      if (Array.isArray(autoShow) && autoShow.length > 0) {
        add('advertisement.rewarded.autoShow must be empty: no rewarded UI in the MVP');
      }
    }

    if (advertisement.banner !== undefined) {
      const banner = advertisement.banner;
      if (!isRecord(banner) || banner.disable !== true) {
        add('advertisement.banner must be absent or disabled (no banner ads in the MVP)');
      }
    }

    if (advertisement.advancedBanners !== undefined) {
      add('advertisement.advancedBanners must be absent (no banner ads in the MVP)');
    }
  }

  if (!isRecord(config.platforms) || !isRecord(config.platforms.mock)) {
    add('platforms.mock must be an object');
  } else {
    const mock = config.platforms.mock;
    if (mock.sendAnalyticsEvents !== false) {
      add('platforms.mock.sendAnalyticsEvents must be false');
    }
    if (mock.showFullLoadingLogo !== false) {
      add('platforms.mock.showFullLoadingLogo must be false');
    }
    if (mock.loadingScreenType !== undefined && mock.loadingScreenType !== 'none') {
      add('platforms.mock.loadingScreenType must be "none" when present');
    }
  }

  for (const [key, value] of Object.entries(config)) {
    if (key === 'platforms') continue;
    if (containsExternalUrl(value)) {
      add(`config key "${key}" contains an external URL; configuration must stay offline`);
    }
  }
  if (isRecord(config.platforms)) {
    for (const [key, value] of Object.entries(config.platforms)) {
      if (containsExternalUrl(value)) {
        add(`platforms.${key} contains an external URL; configuration must stay offline`);
      }
    }
  }

  if (bridgeVersion !== null && !/^2\.4\./.test(bridgeVersion)) {
    add(`@playgama/bridge ${bridgeVersion} is not the validated 2.4.x line`);
  }

  if (runtime !== null) {
    for (const key of BRIDGE_KEYS) {
      if (!runtime.includes(key)) {
        add(`installed Bridge 2.4.x runtime does not read "${key}"`);
      }
    }
  }

  return issues;
}

function containsExternalUrl(value) {
  if (typeof value === 'string') return /https?:\/\//i.test(value);
  if (Array.isArray(value)) return value.some(containsExternalUrl);
  if (isRecord(value)) return Object.values(value).some(containsExternalUrl);
  return false;
}

function main() {
  let config;
  try {
    config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  } catch (error) {
    console.error(`[bridge-config] cannot read ${CONFIG_PATH}: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const issues = validateBridgeConfig(config);
  if (issues.length > 0) {
    console.error(`[bridge-config] ${issues.length} issue(s):`);
    for (const issue of issues) console.error(`  - ${issue}`);
    process.exitCode = 1;
    return;
  }

  const version = installedBridgeVersion();
  console.log(
    `[bridge-config] OK (Bridge ${version ?? 'not installed'} schema, no external URLs, no banner/rewarded UI).`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
