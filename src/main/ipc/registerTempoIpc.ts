import {BrowserWindow, ipcMain} from 'electron';

import {IpcChannel} from '@shared/ipcChannels';

import type {TempoClock} from '../tempo/tempoClock';

const sendToAllWindows = (channel: string, payload: unknown) =>
  BrowserWindow.getAllWindows().forEach((window) => window.webContents.send(channel, payload));

/**
 * Connects the tempo channels to the tempo clock: a tap carries no payload, main timestamps it. Not tied to the mode,
 * tapping is playing (ADR 3). The pushed status takes the time since the beat when it is sent
 */
export function registerTempoIpc(tempoClock: TempoClock): void {
  ipcMain.on(IpcChannel.TEMPO_TAP, () => tempoClock.tap());

  ipcMain.handle(IpcChannel.GET_TEMPO_STATUS, () => tempoClock.status());

  tempoClock.onTempoChanged(() => sendToAllWindows(IpcChannel.TEMPO_STATUS_CHANGED, tempoClock.status()));
}
