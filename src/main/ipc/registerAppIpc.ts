import {ipcMain, shell} from 'electron';

import type {OpenDataFolderResult} from '@shared/ipc';
import {IpcChannel} from '@shared/ipcChannels';

import {openDataFolder} from '../dataFolder/openDataFolder';
import log from '../log';
import type {BlackoutOnQuitIpcHandlers} from './blackoutOnQuitIpcHandlers';
import type {LocaleIpcHandlers} from './localeIpcHandlers';

const REFUSED_IN_SHOW_MODE: OpenDataFolderResult = {type: 'refused'};

/**
 * Connects the app IPC channels: where the app keeps its files, opening that folder (only in Setup mode), the
 * language chosen in the app (localeIpcHandlers.ts) and the blackout on quit (blackoutOnQuitIpcHandlers.ts).
 */
export function registerAppIpc(
  dataFolder: string,
  isSetupMode: () => boolean,
  locale: LocaleIpcHandlers,
  blackoutOnQuit: BlackoutOnQuitIpcHandlers
): void {
  ipcMain.handle(IpcChannel.GET_DATA_FOLDER, () => ({path: dataFolder}));

  ipcMain.handle(IpcChannel.OPEN_DATA_FOLDER, () =>
    isSetupMode() ? openDataFolder((path) => shell.openPath(path), dataFolder, log) : REFUSED_IN_SHOW_MODE
  );

  ipcMain.handle(IpcChannel.GET_LOCALE, () => locale.get());

  ipcMain.handle(IpcChannel.SET_LOCALE, (_event, payload: unknown) => locale.set(payload));

  ipcMain.handle(IpcChannel.GET_BLACKOUT_ON_QUIT, () => blackoutOnQuit.get());

  ipcMain.handle(IpcChannel.SET_BLACKOUT_ON_QUIT, (_event, payload: unknown) => blackoutOnQuit.set(payload));
}
