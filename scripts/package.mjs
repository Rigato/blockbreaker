#!/usr/bin/env node
/**
 * Packages the Vite build for portal submission.
 *
 * Creates release/blockbreaker-web.zip with the contents of dist/ at the ZIP
 * root (index.html at the top level, no dist/ folder), validates the portal
 * limits and writes release/manifest.json.
 *
 * Usage: node scripts/package.mjs
 * Requires: dist/ from `npm run build`, the system `zip`/`unzip` commands.
 */
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST_DIR = path.join(ROOT, 'dist');
const RELEASE_DIR = path.join(ROOT, 'release');
const ZIP_NAME = 'blockbreaker-web.zip';
const ZIP_PATH = path.join(RELEASE_DIR, ZIP_NAME);

const LIMITS = {
  maxFiles: 1_000,
  maxBytes: 250 * 1024 * 1024,
  maxPathLength: 240,
};

// Non-request URLs emitted by the engine/vendor code or used as XML
// namespaces. The Bridge CDN is the only network host the game itself loads.
const ALLOWED_URL_HOSTS = new Set([
  // Playgama may still appear in the vendored bridge/config.
  'bridge.playgama.com',
  // CrazyGames' own SDK is loaded only on its host (portal requirement).
  'sdk.crazygames.com',
  'www.w3.org',
  'phaser.io',
]);

const TEXT_EXTENSIONS = new Set(['.html', '.htm', '.css', '.js', '.mjs', '.json', '.svg']);
// The SDK runtime is vendored by @playgama/bridge and intentionally contains
// platform endpoints for every portal it supports; it is not game code.
const VENDOR_FILES = new Set(['playgama-bridge.js']);

class PackageError extends Error {}

function fail(message) {
  throw new PackageError(message);
}

function toPosix(relativePath) {
  return relativePath.split(path.sep).join('/');
}

function walk(directory, prefix = '') {
  const entries = [];
  for (const name of readdirSync(directory).sort()) {
    const absolute = path.join(directory, name);
    const relative = toPosix(prefix ? path.posix.join(prefix, name) : name);
    const stat = statSync(absolute);
    if (stat.isDirectory()) {
      entries.push(...walk(absolute, relative));
    } else if (stat.isFile()) {
      entries.push({ absolute, relative, bytes: stat.size });
    } else {
      fail(`unsupported non-file entry in dist/: ${relative}`);
    }
  }
  return entries;
}

function assertTool(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.error || result.status !== 0) {
    fail(
      `required command "${command}" is not available (${result.error?.message ?? `exit ${result.status}`}). ` +
        'Install zip/unzip or run in the CI image.',
    );
  }
}

function extractUrls(text) {
  // Exclude template-literal backticks and common trailing punctuation.
  return text.match(/https?:\/\/[^\s"'<>)\\\x60]*/gi) ?? [];
}

function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function validateTextFile(file, text) {
  const issues = [];

  if (VENDOR_FILES.has(file.relative)) return issues;

  if (/(?:src|href)\s*=\s*["']\/(?!\/)/i.test(text)) {
    issues.push(`${file.relative}: absolute src/href path (must start from the ZIP root)`);
  }
  if (/url\(\s*["']?\/(?!\/)/i.test(text)) {
    issues.push(`${file.relative}: absolute url() path in CSS`);
  }
  if (/(?:from\s*|import\s*\(\s*)["']\/(?!\/)/i.test(text)) {
    issues.push(`${file.relative}: absolute module import path`);
  }
  if (/(?:src|href)\s*=\s*["']\/\//i.test(text)) {
    issues.push(`${file.relative}: protocol-relative asset URL`);
  }

  for (const url of extractUrls(text)) {
    const host = hostOf(url);
    if (host === null || !ALLOWED_URL_HOSTS.has(host)) {
      issues.push(`${file.relative}: external URL is not allowed: ${url.slice(0, 120)}`);
    }
  }

  return issues;
}

function validateDist(files) {
  if (files.length === 0) fail('dist/ is empty; run "npm run build" first');

  const names = new Set(files.map((file) => file.relative));
  if (!names.has('index.html')) fail('dist/index.html is missing (must be at the ZIP root)');
  if (!names.has('playgama-bridge-config.json')) {
    fail('dist/playgama-bridge-config.json is missing (must sit next to index.html)');
  }

  if (files.length > LIMITS.maxFiles) {
    fail(`dist/ has ${files.length} files; the portal limit is ${LIMITS.maxFiles}`);
  }

  const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
  if (totalBytes > LIMITS.maxBytes) {
    fail(
      `dist/ is ${(totalBytes / 1024 / 1024).toFixed(1)} MiB; the portal limit is 250 MiB`,
    );
  }

  const issues = [];
  for (const file of files) {
    if (file.relative.startsWith('/')) {
      issues.push(`${file.relative}: leading slash in path`);
    }
    if (file.relative.split('/').includes('..')) {
      issues.push(`${file.relative}: path escapes the ZIP root`);
    }
    if (file.relative.length > LIMITS.maxPathLength) {
      issues.push(
        `${file.relative}: path is ${file.relative.length} chars (limit ${LIMITS.maxPathLength})`,
      );
    }
    if (file.relative.includes('\\')) {
      issues.push(`${file.relative}: backslash in ZIP path`);
    }

    const extension = path.extname(file.relative).toLowerCase();
    if (TEXT_EXTENSIONS.has(extension) && file.bytes <= 8 * 1024 * 1024) {
      issues.push(...validateTextFile(file, readFileSync(file.absolute, 'utf8')));
    }
  }

  if (issues.length > 0) {
    fail(`content validation failed with ${issues.length} issue(s):\n  - ${issues.join('\n  - ')}`);
  }

  return { totalBytes };
}

function createZip(files) {
  assertTool('zip', ['-v']);
  assertTool('unzip', ['-v']);

  const result = spawnSync(
    'zip',
    ['-q', '-9', '-X', ZIP_PATH, ...files.map((file) => file.relative)],
    { cwd: DIST_DIR, encoding: 'utf8' },
  );
  if (result.error || result.status !== 0) {
    fail(`zip failed: ${result.error?.message ?? result.stderr?.trim() ?? `exit ${result.status}`}`);
  }

  const listing = spawnSync('unzip', ['-Z1', ZIP_PATH], { encoding: 'utf8' });
  if (listing.error || listing.status !== 0) {
    fail(`unzip could not read the generated ZIP: ${listing.stderr?.trim() ?? listing.error?.message}`);
  }
  const entries = listing.stdout.split(/\r?\n/).filter(Boolean).sort();
  const expected = files.map((file) => file.relative).sort();
  if (entries.length !== expected.length || entries.some((entry, index) => entry !== expected[index])) {
    fail('ZIP entries do not match dist/ (unexpected or missing paths)');
  }

  const test = spawnSync('unzip', ['-t', ZIP_PATH], { encoding: 'utf8' });
  if (test.error || test.status !== 0) {
    fail(`ZIP integrity check failed: ${test.stdout?.trim() ?? test.error?.message}`);
  }
}

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function main() {
  if (!existsSync(DIST_DIR)) fail('dist/ does not exist; run "npm run build" first');

  rmSync(RELEASE_DIR, { recursive: true, force: true });
  mkdirSync(RELEASE_DIR, { recursive: true });

  const files = walk(DIST_DIR);
  const { totalBytes } = validateDist(files);

  createZip(files);

  const zipBytes = statSync(ZIP_PATH).size;
  const hash = sha256(ZIP_PATH);
  const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const manifest = {
    name: pkg.name,
    version: pkg.version,
    createdAt: new Date().toISOString(),
    zip: ZIP_NAME,
    bytes: zipBytes,
    sha256: hash,
    fileCount: files.length,
    uncompressedBytes: totalBytes,
    maxPathLength: Math.max(...files.map((file) => file.relative.length)),
    paths: files.map((file) => file.relative),
  };
  writeFileSync(
    path.join(RELEASE_DIR, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );

  console.log('[package] OK');
  console.log(`  zip:          release/${ZIP_NAME}`);
  console.log(`  files:        ${files.length}`);
  console.log(`  size:         ${(zipBytes / 1024).toFixed(1)} KiB (${zipBytes} bytes)`);
  console.log(`  paths <=      ${LIMITS.maxPathLength} chars`);
  console.log(`  sha256:       ${hash}`);
  console.log('  root entries: index.html, playgama-bridge-config.json');
}

try {
  main();
} catch (error) {
  if (error instanceof PackageError) {
    console.error(`[package] FAILED: ${error.message}`);
  } else {
    console.error('[package] FAILED:', error);
  }
  process.exitCode = 1;
}
