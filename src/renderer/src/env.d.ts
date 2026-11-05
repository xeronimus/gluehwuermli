/// <reference types="vite/client" />
import type {PreloadBridge} from '@shared/preloadBridge';

declare global {
  /** the version in package.json, set by Vite's `define` (electron.vite.config.ts, vitest.config.mts) */
  const __APP_VERSION__: string;

  interface Window {
    /** exposed by the preload script (PRELOAD_BRIDGE_GLOBAL); missing when the renderer runs outside Electron */
    gluehwuermli?: PreloadBridge;
  }
}
