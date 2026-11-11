import { defineConfig } from 'vitest/config';
import { playgamaBridge } from '@playgama/bridge/vite';

export default defineConfig({
  base: './',
  // Local-only Bridge: no external script on the boot path. The official
  // 2.4.1 runtime still detects Playgama/CrazyGames at runtime.
  plugins: [playgamaBridge({ mode: 'local' })],
  build: {
    target: 'es2020',
    sourcemap: false,
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1800,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    restoreMocks: true,
  },
});
