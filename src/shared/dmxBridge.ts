import type {DmxOutputStatus, SerialPortDescription} from './ipc';

/** the global under which the preload script exposes the DmxBridge to the renderer (`window.gluehwuermli`) */
export const DMX_BRIDGE_GLOBAL = 'gluehwuermli';

/** What the preload script exposes to the renderer. The renderer never sees ipcRenderer or any Node API. */
export interface DmxBridge {
  setChannel: (channel: number, value: number) => void;
  listPorts: () => Promise<readonly SerialPortDescription[]>;
  connect: (path: string) => Promise<DmxOutputStatus>;
  disconnect: () => Promise<DmxOutputStatus>;
  getStatus: () => Promise<DmxOutputStatus>;
  /** returns the function that removes the listener again */
  onStatusChanged: (listener: (status: DmxOutputStatus) => void) => () => void;
}
