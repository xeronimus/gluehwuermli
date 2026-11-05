import {BrowserWindow, ipcMain} from 'electron';

import type {ProjectPathRequest} from '@shared/ipc';
import {IpcChannel} from '@shared/ipcChannels';

import type {ProjectSession} from '../project/projectSession';
import type {ProjectIpcHandlers} from './projectIpcHandlers';

/** sends once the page is there: a .glp double-clicked while the window still loads must not get lost */
function sendWhenLoaded(window: BrowserWindow, channel: string, payload: unknown) {
  if (window.webContents.isLoading()) {
    window.webContents.once('did-finish-load', () => window.webContents.send(channel, payload));
  } else {
    window.webContents.send(channel, payload);
  }
}

/**
 * Connects the project IPC channels to the session (payloads checked in projectIpcHandlers.ts), and pushes every
 * project switch and every double-clicked .glp to the renderer.
 */
export function registerProjectIpc(session: ProjectSession, handlers: ProjectIpcHandlers): void {
  ipcMain.handle(IpcChannel.GET_PROJECT_STATUS, () => session.status());

  ipcMain.handle(IpcChannel.CREATE_PROJECT, () => session.create());

  ipcMain.handle(IpcChannel.OPEN_PROJECT, () => session.openWithDialog());

  ipcMain.handle(IpcChannel.OPEN_RECENT_PROJECT, (_event, payload: unknown) => handlers.openRecent(payload));

  ipcMain.handle(IpcChannel.LIST_RECENT_PROJECTS, () => session.listRecent());

  ipcMain.handle(IpcChannel.REMOVE_RECENT_PROJECT, (_event, payload: unknown) => handlers.removeRecent(payload));

  ipcMain.handle(IpcChannel.SAVE_FIXTURES, (_event, payload: unknown) => handlers.saveFixtures(payload));

  session.onChanged((status) => {
    BrowserWindow.getAllWindows().forEach((window) => window.webContents.send(IpcChannel.PROJECT_CHANGED, status));
  });

  session.onOpenRequested((path) => {
    const request: ProjectPathRequest = {path};
    BrowserWindow.getAllWindows().forEach((window) =>
      sendWhenLoaded(window, IpcChannel.PROJECT_OPEN_REQUESTED, request)
    );
  });
}
