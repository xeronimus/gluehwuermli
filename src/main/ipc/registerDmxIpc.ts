import {BrowserWindow, ipcMain} from 'electron';

import {parseConnectRequest, parseSetChannelRequest, parseSetChannelValuesRequest} from '@shared/ipc';
import {IpcChannel} from '@shared/ipcChannels';

import type {ChasePlayer} from '../chase/chasePlayer';
import type {DmxPortConnector} from '../dmx/DmxPortConnector';
import type {DmxEngine} from '../dmx/dmxEngine';
import {emergencyOffFactory} from '../dmx/emergencyOff';
import type {PortMemory} from '../dmx/portMemory';
import log from '../log';

/**
 * Connects the IPC channels of @shared/ipcChannels to the DMX engine. Payloads from the renderer are checked against
 * their schema in @shared/ipc; an invalid one is logged and dropped.
 */
export function registerDmxIpc(
  engine: DmxEngine,
  connector: DmxPortConnector,
  portMemory: PortMemory,
  chasePlayer: ChasePlayer
): void {
  ipcMain.on(IpcChannel.SET_CHANNEL, (_event, payload: unknown) => {
    const request = parseSetChannelRequest(payload);
    if (!request) {
      log.warn('dropped invalid set-channel request', payload);
      return;
    }
    engine.setChannel(request.channel, request.value);
  });

  ipcMain.on(IpcChannel.SET_CHANNEL_VALUES, (_event, payload: unknown) => {
    const request = parseSetChannelValuesRequest(payload);
    if (!request) {
      log.warn('dropped invalid set-channel-values request', payload);
      return;
    }
    // the engine only writes its buffer: all of them go out together on its next tick
    request.values.forEach(({channel, value}) => engine.setChannel(channel, value));
  });

  // no payload to check, whatever comes along is ignored; not tied to the mode, an emergency off always works
  const emergencyOff = emergencyOffFactory(chasePlayer, engine);
  ipcMain.on(IpcChannel.BLACKOUT, () => emergencyOff());

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

  ipcMain.handle(IpcChannel.GET_REMEMBERED_PORT, () => portMemory.remembered());

  engine.onStatusChanged((status) => {
    BrowserWindow.getAllWindows().forEach((window) => window.webContents.send(IpcChannel.STATUS_CHANGED, status));
  });
}
