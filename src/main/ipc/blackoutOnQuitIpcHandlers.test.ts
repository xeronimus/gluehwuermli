import type {SettingsStore} from '@/settings/SettingsStore';
import {appSettingsFactory} from '@/settings/appSettings';
import type {Settings} from '@/settings/settings';

import {blackoutOnQuitIpcHandlers} from './blackoutOnQuitIpcHandlers';

let stored: Settings | undefined;

const store: SettingsStore = {
  load: async () => stored,
  save: async (settings) => {
    stored = settings;
  }
};

const handlers = () => blackoutOnQuitIpcHandlers(appSettingsFactory(store));

beforeEach(() => {
  stored = {version: 1, outputPortPath: 'COM3'};
});

test('off unless it was stored', async () => {
  expect(await handlers().get()).toEqual({enabled: false});
});

test('it is stored next to the other settings and read back', async () => {
  const blackoutOnQuit = handlers();

  await blackoutOnQuit.set({enabled: true});

  expect(stored).toEqual({version: 1, outputPortPath: 'COM3', blackoutOnQuit: true});
  expect(await blackoutOnQuit.get()).toEqual({enabled: true});
});

test('an invalid request is refused and nothing is stored', async () => {
  await expect(handlers().set({enabled: 'yes'})).rejects.toThrow('invalid set-blackout-on-quit request');
  expect(stored).toEqual({version: 1, outputPortPath: 'COM3'});
});
