import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

/**
 * One source, two build targets:
 * - `bridge` (default): Playgama Bridge runtime in public/, output in dist/;
 * - `clean`: no Playgama or portal SDK, output in dist-clean/.
 *
 * The target selects the boot module at resolve time, so the clean bundle does
 * not rely on dead-code elimination to drop the Bridge loader.
 */
export default defineConfig(({ mode }) => {
  const target =
    process.env.BUILD_TARGET === 'clean' || mode === 'clean' ? 'clean' : 'bridge';
  const bootModule = path.resolve(
    root,
    target === 'clean'
      ? 'src/boot/platformBootClean.ts'
      : 'src/boot/platformBootBridge.ts',
  );

  return {
    base: './',
    resolve: {
      alias: {
        '@boot-target': bootModule,
      },
    },
    build: {
      target: 'es2020',
      sourcemap: false,
      assetsDir: 'assets',
      chunkSizeWarningLimit: 1800,
      outDir: target === 'clean' ? 'dist-clean' : 'dist',
    },
    test: {
      environment: 'node',
      include: ['tests/**/*.test.ts'],
      exclude: ['tests/e2e/**', 'node_modules/**'],
      restoreMocks: true,
    },
  };
});
