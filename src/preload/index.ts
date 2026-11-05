import {IpcRendererEvent, contextBridge, ipcRenderer} from 'electron';

import type {DmxOutputStatus, LockStatus} from '@shared/ipc';
import {IpcChannel} from '@shared/ipcChannels';
import {PRELOAD_BRIDGE_GLOBAL, PreloadBridge} from '@shared/preloadBridge';

/** The only bridge between renderer and main: a narrow, typed API instead of ipcRenderer itself. */
const preloadBridge: PreloadBridge = {
  setChannel: (channel, value) => ipcRenderer.send(IpcChannel.SET_CHANNEL, {channel, value}),
  setChannelValues: (values) => ipcRenderer.send(IpcChannel.SET_CHANNEL_VALUES, {values}),
  listPorts: () => ipcRenderer.invoke(IpcChannel.LIST_PORTS),
  connect: (path) => ipcRenderer.invoke(IpcChannel.CONNECT, {path}),
  disconnect: () => ipcRenderer.invoke(IpcChannel.DISCONNECT),
  getStatus: () => ipcRenderer.invoke(IpcChannel.GET_STATUS),
  getRememberedPort: () => ipcRenderer.invoke(IpcChannel.GET_REMEMBERED_PORT),
  onStatusChanged: (listener) => {
    const handler = (_event: IpcRendererEvent, status: DmxOutputStatus) => listener(status);
    ipcRenderer.on(IpcChannel.STATUS_CHANGED, handler);
    return () => {
      ipcRenderer.removeListener(IpcChannel.STATUS_CHANGED, handler);
    };
  },
  loadFixtures: () => ipcRenderer.invoke(IpcChannel.LOAD_FIXTURES),
  saveFixtures: (setup) => ipcRenderer.invoke(IpcChannel.SAVE_FIXTURES, setup),
  getDataFolder: () => ipcRenderer.invoke(IpcChannel.GET_DATA_FOLDER),
  openDataFolder: () => ipcRenderer.invoke(IpcChannel.OPEN_DATA_FOLDER),
  getLocale: () => ipcRenderer.invoke(IpcChannel.GET_LOCALE),
  setLocale: (locale) => ipcRenderer.invoke(IpcChannel.SET_LOCALE, {locale}),
  getBlackoutOnQuit: () => ipcRenderer.invoke(IpcChannel.GET_BLACKOUT_ON_QUIT),
  setBlackoutOnQuit: (enabled) => ipcRenderer.invoke(IpcChannel.SET_BLACKOUT_ON_QUIT, {enabled}),
  getLockStatus: () => ipcRenderer.invoke(IpcChannel.GET_LOCK_STATUS),
  unlock: (password) => ipcRenderer.invoke(IpcChannel.UNLOCK, {password}),
  lock: () => ipcRenderer.invoke(IpcChannel.LOCK),
  // no `password: undefined` key: the schema allows the key to be missing, not to be undefined
  liftChannelLock: (password) =>
    ipcRenderer.invoke(IpcChannel.LIFT_CHANNEL_LOCK, password === undefined ? {} : {password}),
  lockChannels: () => ipcRenderer.invoke(IpcChannel.LOCK_CHANNELS),
  changePassword: (currentPassword, newPassword) =>
    ipcRenderer.invoke(IpcChannel.CHANGE_PASSWORD, {currentPassword, newPassword}),
  reportActivity: () => ipcRenderer.send(IpcChannel.USER_ACTIVITY),
  onLockChanged: (listener) => {
    const handler = (_event: IpcRendererEvent, status: LockStatus) => listener(status);
    ipcRenderer.on(IpcChannel.LOCK_CHANGED, handler);
    return () => {
      ipcRenderer.removeListener(IpcChannel.LOCK_CHANGED, handler);
    };
  }
};

contextBridge.exposeInMainWorld(PRELOAD_BRIDGE_GLOBAL, preloadBridge);
