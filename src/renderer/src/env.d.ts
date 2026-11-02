/// <reference types="vite/client" />
import type {PreloadBridge} from '@shared/preloadBridge';

declare global {
  interface Window {
    /** exposed by the preload script (PRELOAD_BRIDGE_GLOBAL); missing when the renderer runs outside Electron */
    gluehwuermli?: PreloadBridge;
  }
}
