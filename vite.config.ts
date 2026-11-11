import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  // The Playgama runtime is vendored in public/playgama-bridge.js and loaded
  // at runtime only outside CrazyGames; CrazyGames uses its native SDK.
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
