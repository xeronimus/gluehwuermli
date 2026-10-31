import type {
  DataFolder,
  DmxOutputStatus,
  FixtureSetup,
  OpenDataFolderResult,
  SerialPortDescription,
  SetChannelRequest
} from './ipc';

/** the global under which the preload script exposes the DmxBridge to the renderer (`window.gluehwuermli`) */
export const DMX_BRIDGE_GLOBAL = 'gluehwuermli';

/** What the preload script exposes to the renderer. The renderer never sees ipcRenderer or any Node API. */
export interface DmxBridge {
  setChannel: (channel: number, value: number) => void;
  setChannelValues: (values: readonly SetChannelRequest[]) => void;
  listPorts: () => Promise<readonly SerialPortDescription[]>;
  connect: (path: string) => Promise<DmxOutputStatus>;
  disconnect: () => Promise<DmxOutputStatus>;
  getStatus: () => Promise<DmxOutputStatus>;
  /** returns the function that removes the listener again */
  onStatusChanged: (listener: (status: DmxOutputStatus) => void) => () => void;
  /** the stored fixture setup; an empty one when there is no valid file yet */
  loadFixtures: () => Promise<FixtureSetup>;
  /** rejects when the main process refuses the setup or cannot write it */
  saveFixtures: (setup: FixtureSetup) => Promise<void>;
  getDataFolder: () => Promise<DataFolder>;
  /** a folder that can't be opened is a `failed` result, not a rejection */
  openDataFolder: () => Promise<OpenDataFolderResult>;
}
