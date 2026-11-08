import {BrowserWindow, ipcMain} from 'electron';

import type {ChannelsChanged} from '@shared/ipc';
import {IpcChannel} from '@shared/ipcChannels';

import type {ChasePlayer} from '../chase/chasePlayer';
import type {ChaseIpcHandlers} from './chaseIpcHandlers';

const sendToAllWindows = (channel: string, payload: unknown) =>
  BrowserWindow.getAllWindows().forEach((window) => window.webContents.send(channel, payload));

/**
 * Connects the chase IPC channels to the player (payloads checked in chaseIpcHandlers.ts), and pushes its status and
 * the values each step set: a chase is the one thing changing channel values from main, the faders follow it.
 */
export function registerChaseIpc(player: ChasePlayer, handlers: ChaseIpcHandlers): void {
  ipcMain.handle(IpcChannel.GET_CHASE_STATUS, () => handlers.status());

  ipcMain.handle(IpcChannel.START_CHASE, (_event, payload: unknown) => handlers.start(payload));

  ipcMain.handle(IpcChannel.PAUSE_CHASE, () => handlers.pause());

  ipcMain.handle(IpcChannel.RESUME_CHASE, () => handlers.resume());

  ipcMain.handle(IpcChannel.STOP_CHASE, () => handlers.stop());

  player.onStatusChanged((status) => sendToAllWindows(IpcChannel.CHASE_STATUS_CHANGED, status));

  player.onValuesApplied((values) => {
    const change: ChannelsChanged = {values: [...values]};
    sendToAllWindows(IpcChannel.CHANNELS_CHANGED, change);
  });
}
