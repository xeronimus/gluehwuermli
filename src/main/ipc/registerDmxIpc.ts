import {BrowserWindow, ipcMain} from 'electron';

import {parseConnectRequest, parseSetChannelRequest} from '@shared/ipc';
import {IpcChannel} from '@shared/ipcChannels';

import type {DmxPortConnector} from '../dmx/DmxPortConnector';
import type {DmxEngine} from '../dmx/dmxEngine';
import log from '../log';

/**
 * Connects the IPC channels of @shared/ipcChannels to the DMX engine. Payloads from the renderer are checked against
 * their schema in @shared/ipc; an invalid one is logged and dropped.
 */
export function registerDmxIpc(engine: DmxEngine, connector: DmxPortConnector): void {
  ipcMain.on(IpcChannel.SET_CHANNEL, (_event, payload: unknown) => {
    const request = parseSetChannelRequest(payload);
    if (!request) {
      log.warn('dropped invalid set-channel request', payload);
      return;
    }
    engine.setChannel(request.channel, request.value);
  });

  ipcMain.handle(IpcChannel.LIST_PORTS, () => connector.listPorts());

  ipcMain.handle(IpcChannel.CONNECT, (_event, payload: unknown) => {
    const request = parseConnectRequest(payload);
    if (!request) {
      throw new Error('invalid connect request');
    }
    return engine.connect(request.path);
  });

  ipcMain.handle(IpcChannel.DISCONNECT, () => engine.disconnect());

  ipcMain.handle(IpcChannel.GET_STATUS, () => engine.status());

  engine.onStatusChanged((status) => {
    BrowserWindow.getAllWindows().forEach((window) => window.webContents.send(IpcChannel.STATUS_CHANGED, status));
  });
}
