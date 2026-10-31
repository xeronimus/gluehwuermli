import {ipcMain} from 'electron';

import {parseFixtureSetup} from '@shared/fixtures';
import {IpcChannel} from '@shared/ipcChannels';

import type {FixtureStore} from '../fixtures/FixtureStore';

/** Connects the fixture IPC channels to the store; a setup from the renderer is only stored if it is valid. */
export function registerFixtureIpc(store: FixtureStore): void {
  ipcMain.handle(IpcChannel.LOAD_FIXTURES, () => store.load());

  ipcMain.handle(IpcChannel.SAVE_FIXTURES, (_event, payload: unknown) => {
    const setup = parseFixtureSetup(payload);
    if (!setup) {
      throw new Error('invalid fixture setup');
    }
    return store.save(setup);
  });
}
