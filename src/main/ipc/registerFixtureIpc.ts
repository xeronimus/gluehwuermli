import {ipcMain} from 'electron';

import {IpcChannel} from '@shared/ipcChannels';

import type {FixtureIpcHandlers} from './fixtureIpcHandlers';

/** Connects the fixture IPC channels to their handlers (fixtureIpcHandlers.ts). */
export function registerFixtureIpc(handlers: FixtureIpcHandlers): void {
  ipcMain.handle(IpcChannel.LOAD_FIXTURES, () => handlers.load());

  ipcMain.handle(IpcChannel.SAVE_FIXTURES, (_event, payload: unknown) => handlers.save(payload));
}
