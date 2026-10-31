import {BrowserWindow, ipcMain} from 'electron';

import {parseLiftChannelLockRequest, parseUnlockRequest} from '@shared/ipc';
import {IpcChannel} from '@shared/ipcChannels';

import type {AppLock} from '../lock/appLock';

/**
 * Connects the lock IPC channels to the AppLock, and pushes every change of the mode or the channel lock to the
 * renderer. Payloads are checked against their schema in @shared/ipc.
 */
export function registerLockIpc(appLock: AppLock): void {
  ipcMain.handle(IpcChannel.GET_LOCK_STATUS, () => appLock.status());

  ipcMain.handle(IpcChannel.UNLOCK, (_event, payload: unknown) => {
    const request = parseUnlockRequest(payload);
    if (!request) {
      throw new Error('invalid unlock request');
    }
    return appLock.unlock(request.password);
  });

  ipcMain.handle(IpcChannel.LOCK, () => appLock.lock());

  ipcMain.handle(IpcChannel.LIFT_CHANNEL_LOCK, (_event, payload: unknown) => {
    const request = parseLiftChannelLockRequest(payload);
    if (!request) {
      throw new Error('invalid lift-channel-lock request');
    }
    return appLock.liftChannelLock(request.password);
  });

  ipcMain.handle(IpcChannel.LOCK_CHANNELS, () => appLock.lockChannels());

  ipcMain.on(IpcChannel.USER_ACTIVITY, () => appLock.registerActivity());

  appLock.onChanged((status) => {
    BrowserWindow.getAllWindows().forEach((window) => window.webContents.send(IpcChannel.LOCK_CHANGED, status));
  });
}
