import {ipcMain, shell} from 'electron';

import {IpcChannel} from '@shared/ipcChannels';

import {openDataFolder} from '../dataFolder/openDataFolder';
import log from '../log';

/** Connects the app IPC channels: where the app keeps its files, and opening that folder. Neither takes a payload. */
export function registerAppIpc(dataFolder: string): void {
  ipcMain.handle(IpcChannel.GET_DATA_FOLDER, () => ({path: dataFolder}));

  ipcMain.handle(IpcChannel.OPEN_DATA_FOLDER, () => openDataFolder((path) => shell.openPath(path), dataFolder, log));
}
