#!/usr/bin/env node
/**
 * Builds the two portal targets from one source tree.
 *
 * - bridge (default): dist/ with the Playgama Bridge runtime/config;
 * - clean: dist-clean/ without Playgama or CrazyGames SDK.
 *
 * Usage: npm run build            # both
 *        npm run build:bridge     # bridge only
 *        npm run build:clean      # clean only
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TARGETS = {
  bridge: { outDir: 'dist' },
  clean: { outDir: 'dist-clean' },
};

// These files come from public/ and are Playgama-only. They must never reach
// the clean ZIP; the package validator checks the same rule independently.
const BRIDGE_ONLY_PUBLIC_FILES = [
  'playgama-bridge.js',
  'playgama-bridge-config.json',
  'licenses/playgama-bridge-LICENSE.txt',
];

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    env,
    stdio: 'inherit',
    encoding: 'utf8',
  });
  if (result.error || result.status !== 0) {
    const reason = result.error?.message ?? `exit ${result.status}`;
    throw new Error(`${command} ${args.join(' ')} failed (${reason})`);
  }
}

function walk(directory) {
  const files = [];
  for (const name of readdirSync(directory).sort()) {
    const absolute = path.join(directory, name);
    const stat = statSync(absolute);
    if (stat.isDirectory()) files.push(...walk(absolute));
    else if (stat.isFile()) files.push(absolute);
  }
  return files;
}

function stripBridgeAssets(outDir) {
  const root = path.join(ROOT, outDir);
  for (const file of BRIDGE_ONLY_PUBLIC_FILES) {
    rmSync(path.join(root, file), { force: true });
  }

  if (!existsSync(root)) {
    throw new Error(`${outDir}/ does not exist after the clean build`);
  }

  const leftovers = walk(root).filter((file) =>
    path.relative(root, file).toLowerCase().includes('playgama'),
  );
  if (leftovers.length > 0) {
    throw new Error(
      `clean build still contains Playgama assets:\n  - ${leftovers
        .map((file) => path.relative(root, file))
        .join('\n  - ')}`,
    );
  }
}

function parseTargets(argv) {
  const bridge = argv.includes('--bridge');
  const clean = argv.includes('--clean');
  if (bridge && !clean) return ['bridge'];
  if (clean && !bridge) return ['clean'];
  return ['bridge', 'clean'];
}

const targets = parseTargets(process.argv.slice(2));

run('npx', ['--no-install', 'tsc', '-b']);

for (const target of targets) {
  const { outDir } = TARGETS[target];
  console.log(`[build] ${target} -> ${outDir}/`);
  run('npx', ['--no-install', 'vite', 'build'], {
    ...process.env,
    BUILD_TARGET: target,
  });

  if (target === 'clean') stripBridgeAssets(outDir);
}

console.log(`[build] OK (${targets.join(' + ')})`);
