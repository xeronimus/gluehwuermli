import type {SettingsStore} from '@/settings/SettingsStore';
import {appSettingsFactory} from '@/settings/appSettings';
import type {Settings} from '@/settings/settings';

import {localeIpcHandlers} from './localeIpcHandlers';

let stored: Settings | undefined;

const store: SettingsStore = {
  load: async () => stored,
  save: async (settings) => {
    stored = settings;
  }
};

beforeEach(() => {
  stored = {version: 1, outputPortPath: 'COM3'};
});

test('without a chosen language, there is none', async () => {
  expect(await localeIpcHandlers(appSettingsFactory(store)).get()).toEqual({type: 'none'});
});

test('the chosen language is stored next to the other settings and read back', async () => {
  const handlers = localeIpcHandlers(appSettingsFactory(store));

  await handlers.set({locale: 'de'});

  expect(stored).toEqual({version: 1, outputPortPath: 'COM3', locale: 'de'});
  expect(await handlers.get()).toEqual({type: 'chosen', locale: 'de'});
});

test('an unknown language is refused and nothing is stored', async () => {
  const handlers = localeIpcHandlers(appSettingsFactory(store));

  await expect(handlers.set({locale: 'fr'})).rejects.toThrow('invalid set-locale request');
  expect(stored).toEqual({version: 1, outputPortPath: 'COM3'});
});
