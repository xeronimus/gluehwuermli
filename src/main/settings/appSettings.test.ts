import type {SettingsStore} from './SettingsStore';
import {appSettingsFactory} from './appSettings';
import type {Settings} from './settings';

const PASSWORD = {salt: '00ff', hash: 'abcdef'};
const NEW_PASSWORD = {salt: '0011', hash: '123456'};

let stored: Settings | undefined;
let failingSave: boolean;

const store: SettingsStore = {
  load: async () => stored,
  save: async (settings) => {
    if (failingSave) {
      throw new Error('disk full');
    }
    stored = settings;
  }
};

beforeEach(() => {
  stored = {version: 1, password: PASSWORD};
  failingSave = false;
});

test('loads the stored settings', async () => {
  expect(await appSettingsFactory(store).load()).toEqual({version: 1, password: PASSWORD});
});

test('without stored settings, loads empty ones', async () => {
  stored = undefined;

  expect(await appSettingsFactory(store).load()).toEqual({version: 1});
});

test('storing the port keeps the password', async () => {
  const settings = appSettingsFactory(store);

  await settings.update({outputPortPath: 'COM3'});

  expect(stored).toEqual({version: 1, password: PASSWORD, outputPortPath: 'COM3'});
  expect(await settings.load()).toEqual(stored);
});

test('storing the password keeps the port', async () => {
  stored = {version: 1, password: PASSWORD, outputPortPath: 'COM3'};
  const settings = appSettingsFactory(store);

  await settings.update({password: NEW_PASSWORD});

  expect(stored).toEqual({version: 1, password: NEW_PASSWORD, outputPortPath: 'COM3'});
});

test('overlapping updates each build on the one before', async () => {
  const settings = appSettingsFactory(store);

  await Promise.all([settings.update({outputPortPath: 'COM3'}), settings.update({password: NEW_PASSWORD})]);

  expect(stored).toEqual({version: 1, password: NEW_PASSWORD, outputPortPath: 'COM3'});
});

test('a failed update rejects and leaves the settings as they were', async () => {
  const settings = appSettingsFactory(store);
  failingSave = true;

  await expect(settings.update({outputPortPath: 'COM3'})).rejects.toThrow('disk full');

  expect(await settings.load()).toEqual({version: 1, password: PASSWORD});
});
