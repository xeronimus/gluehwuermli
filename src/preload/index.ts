import {IpcRendererEvent, contextBridge, ipcRenderer} from 'electron';

import {DMX_BRIDGE_GLOBAL, DmxBridge} from '@shared/dmxBridge';
import type {DmxOutputStatus} from '@shared/ipc';
import {IpcChannel} from '@shared/ipcChannels';

/** The only bridge between renderer and main: a narrow, typed API instead of ipcRenderer itself. */
const dmxBridge: DmxBridge = {
  setChannel: (channel, value) => ipcRenderer.send(IpcChannel.SET_CHANNEL, {channel, value}),
  listPorts: () => ipcRenderer.invoke(IpcChannel.LIST_PORTS),
  connect: (path) => ipcRenderer.invoke(IpcChannel.CONNECT, {path}),
  disconnect: () => ipcRenderer.invoke(IpcChannel.DISCONNECT),
  getStatus: () => ipcRenderer.invoke(IpcChannel.GET_STATUS),
  onStatusChanged: (listener) => {
    const handler = (_event: IpcRendererEvent, status: DmxOutputStatus) => listener(status);
    ipcRenderer.on(IpcChannel.STATUS_CHANGED, handler);
    return () => {
      ipcRenderer.removeListener(IpcChannel.STATUS_CHANGED, handler);
    };
  },
  loadFixtures: () => ipcRenderer.invoke(IpcChannel.LOAD_FIXTURES),
  saveFixtures: (setup) => ipcRenderer.invoke(IpcChannel.SAVE_FIXTURES, setup)
};

contextBridge.exposeInMainWorld(DMX_BRIDGE_GLOBAL, dmxBridge);
