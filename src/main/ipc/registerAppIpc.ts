import {ipcMain, shell} from 'electron';

import type {OpenDataFolderResult} from '@shared/ipc';
import {IpcChannel} from '@shared/ipcChannels';

import {openDataFolder} from '../dataFolder/openDataFolder';
import log from '../log';

const REFUSED_IN_SHOW_MODE: OpenDataFolderResult = {
  type: 'failed',
  message: 'the data folder can only be opened in Setup mode'
};

/**
 * Connects the app IPC channels: where the app keeps its files, and opening that folder (only in Setup mode). Neither
 * takes a payload.
 */
export function registerAppIpc(dataFolder: string, isSetupMode: () => boolean): void {
  ipcMain.handle(IpcChannel.GET_DATA_FOLDER, () => ({path: dataFolder}));

  ipcMain.handle(IpcChannel.OPEN_DATA_FOLDER, () =>
    isSetupMode() ? openDataFolder((path) => shell.openPath(path), dataFolder, log) : REFUSED_IN_SHOW_MODE
  );
}
