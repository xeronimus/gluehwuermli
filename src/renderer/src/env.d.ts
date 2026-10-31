/// <reference types="vite/client" />
import type {DmxBridge} from '@shared/dmxBridge';

declare global {
  interface Window {
    /** exposed by the preload script (DMX_BRIDGE_GLOBAL); missing when the renderer runs outside Electron */
    gluehwuermli?: DmxBridge;
  }
}
