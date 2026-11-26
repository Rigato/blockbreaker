/**
 * Stable boot entry for the game. Vite resolves `@boot-target` to the bridge
 * or clean implementation at build time (see vite.config.ts), so the clean
 * bundle never contains the Playgama loader or the portal SDKs.
 */
export { bootPlatform } from '@boot-target';
export type { BootResult, BuildTarget } from './bootTypes';
