import { defineConfig } from 'vitest/config';
import { playgamaBridge } from '@playgama/bridge/vite';

export default defineConfig({
  base: './',
  plugins: [playgamaBridge()],
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
