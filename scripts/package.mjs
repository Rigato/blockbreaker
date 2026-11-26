#!/usr/bin/env node
/**
 * Packages the Vite builds for portal submission.
 *
 * Usage:
 *   node scripts/package.mjs --target all     (default)
 *   node scripts/package.mjs --target bridge
 *   node scripts/package.mjs --target clean
 *
 * bridge -> release/blockbreaker-web.zip + release/manifest.json
 * clean  -> release/blockbreaker-web-clean.zip + release/manifest-clean.json
 *
 * Requires dist/ and/or dist-clean/ from `npm run build`, and the system
 * `zip`/`unzip` commands.
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
const RELEASE_DIR = path.join(ROOT, 'release');

const MB = 1024 * 1024;

const TARGETS = {
  bridge: {
    label: 'bridge',
    distDir: 'dist',
    zipName: 'blockbreaker-web.zip',
    manifestName: 'manifest.json',
    requireBridgeConfig: true,
    maxFiles: 1_000,
    maxBytes: 250 * MB,
    maxZipBytes: 250 * MB,
    targetZipBytes: null,
    allowedHosts: new Set([
      // Playgama may still appear in the vendored bridge/config.
      'bridge.playgama.com',
      // CrazyGames' own SDK is loaded only on its host (bridge safety net).
      'sdk.crazygames.com',
      'www.w3.org',
      'phaser.io',
    ]),
    vendorFiles: new Set(['playgama-bridge.js']),
    forbiddenTerms: [],
  },
  clean: {
    label: 'clean',
    distDir: 'dist-clean',
    zipName: 'blockbreaker-web-clean.zip',
    manifestName: 'manifest-clean.json',
    requireBridgeConfig: false,
    maxFiles: 1_500,
    maxBytes: 50 * MB,
    maxZipBytes: 50 * MB,
    targetZipBytes: 20 * MB,
    allowedHosts: new Set(['www.w3.org', 'phaser.io']),
    vendorFiles: new Set(),
    forbiddenTerms: [
      /playgama/i,
      /sdk\.crazygames\.com/i,
      /crazygames\.com/i,
      /1001juegos\.com/i,
    ],
  },
};

const CODE_EXTENSIONS = new Set([
  '.html',
  '.htm',
  '.css',
  '.js',
  '.mjs',
  '.json',
  '.svg',
]);
const TEXT_EXTENSIONS = new Set([...CODE_EXTENSIONS, '.txt', '.md']);
const MAX_PATH_LENGTH = 240;

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
  return text.match(/https?:\/\/[^\s"'<>)\\\x60]*/gi) ?? [];
}

function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function validateTextFile(file, text, target) {
  const issues = [];

  if (target.vendorFiles.has(file.relative)) return issues;

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

  const extension = path.extname(file.relative).toLowerCase();
  if (CODE_EXTENSIONS.has(extension)) {
    for (const url of extractUrls(text)) {
      const host = hostOf(url);
      if (host === null || !target.allowedHosts.has(host)) {
        issues.push(`${file.relative}: external URL is not allowed: ${url.slice(0, 120)}`);
      }
    }
  }

  for (const term of target.forbiddenTerms) {
    if (term.test(text)) {
      issues.push(`${file.relative}: forbidden term ${term} in the ${target.label} build`);
    }
  }

  return issues;
}

function validateDist(files, target) {
  if (files.length === 0) fail(`${target.distDir}/ is empty; run "npm run build" first`);

  const names = new Set(files.map((file) => file.relative));
  if (!names.has('index.html')) {
    fail(`${target.distDir}/index.html is missing (must be at the ZIP root)`);
  }

  if (target.requireBridgeConfig && !names.has('playgama-bridge-config.json')) {
    fail(
      `${target.distDir}/playgama-bridge-config.json is missing (must sit next to index.html)`,
    );
  }

  if (target.label === 'clean') {
    for (const name of names) {
      if (/playgama/i.test(name)) {
        fail(`${target.distDir}/${name} is a Playgama asset and cannot be in the clean ZIP`);
      }
    }
    if (names.has('playgama-bridge-config.json')) {
      fail('the clean build must not include playgama-bridge-config.json');
    }
  }

  if (files.length > target.maxFiles) {
    fail(
      `${target.distDir}/ has ${files.length} files; the ${target.label} limit is ${target.maxFiles}`,
    );
  }

  const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
  if (totalBytes > target.maxBytes) {
    fail(
      `${target.distDir}/ is ${(totalBytes / MB).toFixed(1)} MiB; the ${target.label} limit is ${(target.maxBytes / MB).toFixed(0)} MiB`,
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
    if (file.relative.length > MAX_PATH_LENGTH) {
      issues.push(
        `${file.relative}: path is ${file.relative.length} chars (limit ${MAX_PATH_LENGTH})`,
      );
    }
    if (file.relative.includes('\\')) {
      issues.push(`${file.relative}: backslash in ZIP path`);
    }

    const extension = path.extname(file.relative).toLowerCase();
    if (TEXT_EXTENSIONS.has(extension) && file.bytes <= 8 * MB) {
      issues.push(...validateTextFile(file, readFileSync(file.absolute, 'utf8'), target));
    }
  }

  if (issues.length > 0) {
    fail(`content validation failed with ${issues.length} issue(s):\n  - ${issues.join('\n  - ')}`);
  }

  return { totalBytes };
}

function createZip(files, target) {
  assertTool('zip', ['-v']);
  assertTool('unzip', ['-v']);

  const distDir = path.join(ROOT, target.distDir);
  const zipPath = path.join(RELEASE_DIR, target.zipName);
  const result = spawnSync(
    'zip',
    ['-q', '-9', '-X', zipPath, ...files.map((file) => file.relative)],
    { cwd: distDir, encoding: 'utf8' },
  );
  if (result.error || result.status !== 0) {
    fail(`zip failed: ${result.error?.message ?? result.stderr?.trim() ?? `exit ${result.status}`}`);
  }

  const listing = spawnSync('unzip', ['-Z1', zipPath], { encoding: 'utf8' });
  if (listing.error || listing.status !== 0) {
    fail(
      `unzip could not read the generated ZIP: ${listing.stderr?.trim() ?? listing.error?.message}`,
    );
  }
  const entries = listing.stdout.split(/\r?\n/).filter(Boolean).sort();
  const expected = files.map((file) => file.relative).sort();
  if (entries.length !== expected.length || entries.some((entry, index) => entry !== expected[index])) {
    fail('ZIP entries do not match dist/ (unexpected or missing paths)');
  }

  const test = spawnSync('unzip', ['-t', zipPath], { encoding: 'utf8' });
  if (test.error || test.status !== 0) {
    fail(`ZIP integrity check failed: ${test.stdout?.trim() ?? test.error?.message}`);
  }

  return zipPath;
}

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function parseTargets(argv) {
  const equals = argv.find((argument) => argument.startsWith('--target='));
  const inline = equals ? equals.slice('--target='.length) : null;
  const index = argv.indexOf('--target');
  const explicit = index >= 0 ? argv[index + 1] : null;
  const raw = inline ?? explicit ?? 'all';

  if (raw === 'all') return ['bridge', 'clean'];
  if (raw === 'bridge' || raw === 'clean') return [raw];
  fail(`unknown --target "${raw}"; expected all, bridge or clean`);
}

function packageTarget(target) {
  const distDir = path.join(ROOT, target.distDir);
  if (!existsSync(distDir)) {
    fail(`${target.distDir}/ does not exist; run "npm run build" first`);
  }

  const files = walk(distDir);
  const { totalBytes } = validateDist(files, target);
  const zipPath = createZip(files, target);
  const zipBytes = statSync(zipPath).size;

  if (zipBytes > target.maxZipBytes) {
    fail(
      `release/${target.zipName} is ${(zipBytes / MB).toFixed(1)} MiB; ` +
        `the ${target.label} limit is ${(target.maxZipBytes / MB).toFixed(0)} MiB`,
    );
  }
  if (target.targetZipBytes !== null && zipBytes > target.targetZipBytes) {
    console.warn(
      `[package] warning: ${target.zipName} is ${(zipBytes / MB).toFixed(1)} MiB; ` +
        `the CrazyGames target is ${(target.targetZipBytes / MB).toFixed(0)} MiB`,
    );
  }

  const hash = sha256(zipPath);
  const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const manifest = {
    name: pkg.name,
    version: pkg.version,
    target: target.label,
    createdAt: new Date().toISOString(),
    zip: target.zipName,
    bytes: zipBytes,
    sha256: hash,
    fileCount: files.length,
    uncompressedBytes: totalBytes,
    maxPathLength: Math.max(...files.map((file) => file.relative.length)),
    paths: files.map((file) => file.relative),
  };
  writeFileSync(
    path.join(RELEASE_DIR, target.manifestName),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );

  console.log(`[package] ${target.label} OK`);
  console.log(`  zip:          release/${target.zipName}`);
  console.log(`  files:        ${files.length}`);
  console.log(`  size:         ${(zipBytes / 1024).toFixed(1)} KiB (${zipBytes} bytes)`);
  console.log(`  sha256:       ${hash}`);
  console.log(`  root entries: index.html${target.requireBridgeConfig ? ', playgama-bridge-config.json' : ''}`);
}

function main() {
  const targets = parseTargets(process.argv.slice(2));

  if (targets.length === 2) {
    rmSync(RELEASE_DIR, { recursive: true, force: true });
  }
  mkdirSync(RELEASE_DIR, { recursive: true });

  for (const label of targets) {
    const target = TARGETS[label];
    rmSync(path.join(RELEASE_DIR, target.zipName), { force: true });
    rmSync(path.join(RELEASE_DIR, target.manifestName), { force: true });
    packageTarget(target);
  }
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
