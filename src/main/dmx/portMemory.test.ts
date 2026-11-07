import type {SettingsStore} from '@/settings/SettingsStore';
import {appSettingsFactory} from '@/settings/appSettings';
import type {Settings} from '@/settings/settings';

import {type DmxEngine, dmxEngineFactory} from './dmxEngine';
import {type InMemoryConnector, inMemoryConnectorFactory} from './impl/inMemory/inMemoryConnectorFactory';
import {type PortMemory, forgetfulPortMemory, portMemoryFactory} from './portMemory';

const REFRESH_INTERVAL_MS = 25;
const silentLog = {debug: () => {}, info: () => {}, warn: () => {}};
const PASSWORD = {salt: '00ff', hash: 'abcdef'};

let stored: Settings | undefined;
let failingSave: boolean;
let inMemoryConnector: InMemoryConnector;
let engine: DmxEngine;

const settingsStore: SettingsStore = {
  load: async () => stored,
  save: async (settings) => {
    if (failingSave) {
      throw new Error('disk full');
    }
    stored = settings;
  }
};

const createPortMemory = (): PortMemory =>
  portMemoryFactory({engine, settings: appSettingsFactory(settingsStore), log: silentLog});

/** lets the save started by a status change finish */
const settled = () => new Promise((resolve) => setImmediate(resolve));

beforeEach(() => {
  stored = {version: 1, password: PASSWORD};
  failingSave = false;
  inMemoryConnector = inMemoryConnectorFactory();
  engine = dmxEngineFactory({connector: inMemoryConnector, refreshIntervalMs: REFRESH_INTERVAL_MS, log: silentLog});
});

afterEach(async () => {
  await engine.dispose();
});

describe('remembering', () => {
  test('nothing is remembered before the first connect', async () => {
    expect(await createPortMemory().remembered()).toEqual({type: 'none'});
  });

  test('a successful connect stores the port, keeping the password', async () => {
    const portMemory = createPortMemory();

    await engine.connect('COM3');
    await settled();

    expect(stored).toEqual({version: 1, password: PASSWORD, outputPortPath: 'COM3'});
    expect(await portMemory.remembered()).toEqual({type: 'remembered', path: 'COM3'});
  });

  test('a disconnect keeps the port', async () => {
    const portMemory = createPortMemory();
    await engine.connect('COM3');

    await engine.disconnect();
    await settled();

    expect(await portMemory.remembered()).toEqual({type: 'remembered', path: 'COM3'});
  });

  test('a port that fails to open is not stored', async () => {
    const portMemory = createPortMemory();
    inMemoryConnector.failNextOpen(new Error('Access denied'));

    await engine.connect('COM3');
    await settled();

    expect(await portMemory.remembered()).toEqual({type: 'none'});
  });

  test('the port connected last is the one remembered', async () => {
    const portMemory = createPortMemory();

    await engine.connect('COM3');
    await engine.connect('COM4');
    await settled();

    expect(await portMemory.remembered()).toEqual({type: 'remembered', path: 'COM4'});
  });

  test('a failed save leaves the output connected', async () => {
    const portMemory = createPortMemory();
    failingSave = true;

    await engine.connect('COM3');
    await settled();

    expect(engine.status()).toEqual({type: 'connected', path: 'COM3'});
    expect(await portMemory.remembered()).toEqual({type: 'none'});
  });
});

test('a remembered port is only remembered, never connected', async () => {
  stored = {version: 1, outputPortPath: 'COM4'};
  const statuses: string[] = [];
  engine.onStatusChanged((status) => statuses.push(status.type));

  const portMemory = createPortMemory();
  await settled();

  expect(await portMemory.remembered()).toEqual({type: 'remembered', path: 'COM4'});
  expect(engine.status()).toEqual({type: 'disconnected'});
  expect(statuses).toEqual([]);
});

test('the forgetful port memory of the simulated output remembers nothing', async () => {
  expect(await forgetfulPortMemory.remembered()).toEqual({type: 'none'});
});
