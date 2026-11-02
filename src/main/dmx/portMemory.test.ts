import type {SerialPortDescription} from '@shared/ipc';

import type {SettingsStore} from '@/settings/SettingsStore';
import {appSettingsFactory} from '@/settings/appSettings';
import type {Settings} from '@/settings/settings';

import {type DmxEngine, dmxEngineFactory} from './dmxEngine';
import {type InMemoryConnector, inMemoryConnectorFactory} from './impl/inMemory/inMemoryConnectorFactory';
import {type PortMemory, forgetfulPortMemory, portMemoryFactory} from './portMemory';

const REFRESH_INTERVAL_MS = 25;
const silentLog = {debug: () => {}, info: () => {}, warn: () => {}};
const PASSWORD = {salt: '00ff', hash: 'abcdef'};
const COM3: SerialPortDescription = {path: 'COM3', likelyEnttecPro: true};
const COM4: SerialPortDescription = {path: 'COM4', likelyEnttecPro: false};

let stored: Settings | undefined;
let failingSave: boolean;
let listedPorts: readonly SerialPortDescription[] | Error;
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
  portMemoryFactory({
    engine,
    connector: {
      listPorts: async () => {
        if (listedPorts instanceof Error) {
          throw listedPorts;
        }
        return listedPorts;
      }
    },
    settings: appSettingsFactory(settingsStore),
    log: silentLog
  });

/** lets the save started by a status change finish */
const settled = () => new Promise((resolve) => setImmediate(resolve));

beforeEach(() => {
  stored = {version: 1, password: PASSWORD};
  failingSave = false;
  listedPorts = [COM3, COM4];
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

describe('reconnecting on start', () => {
  test('connects to the remembered port when it is listed', async () => {
    stored = {version: 1, outputPortPath: 'COM4'};
    const statuses: string[] = [];
    engine.onStatusChanged((status) => statuses.push(status.type));

    await createPortMemory().reconnect();

    expect(engine.status()).toEqual({type: 'connected', path: 'COM4'});
    expect(statuses).toEqual(['connecting', 'connected']);
  });

  test('a remembered port that fails to open ends in the failed status', async () => {
    stored = {version: 1, outputPortPath: 'COM4'};
    inMemoryConnector.failNextOpen(new Error('Access denied'));

    await createPortMemory().reconnect();

    expect(engine.status()).toEqual({type: 'failed', path: 'COM4', reason: 'port-error', message: 'Access denied'});
  });

  test('stays disconnected when the remembered port is not listed, and keeps remembering it', async () => {
    stored = {version: 1, outputPortPath: 'COM7'};
    const portMemory = createPortMemory();

    await portMemory.reconnect();

    expect(engine.status()).toEqual({type: 'disconnected'});
    expect(await portMemory.remembered()).toEqual({type: 'remembered', path: 'COM7'});
  });

  test('stays disconnected without a remembered port', async () => {
    await createPortMemory().reconnect();

    expect(engine.status()).toEqual({type: 'disconnected'});
  });

  test('stays disconnected when the ports cannot be listed', async () => {
    stored = {version: 1, outputPortPath: 'COM4'};
    listedPorts = new Error('no access');

    await expect(createPortMemory().reconnect()).resolves.toBeUndefined();

    expect(engine.status()).toEqual({type: 'disconnected'});
  });

  test('leaves a port connected in the meantime alone', async () => {
    stored = {version: 1, outputPortPath: 'COM4'};
    const portMemory = createPortMemory();
    await engine.connect('COM3');

    await portMemory.reconnect();

    expect(engine.status()).toEqual({type: 'connected', path: 'COM3'});
  });
});

test('the forgetful port memory of the simulated output remembers nothing and connects nothing', async () => {
  await forgetfulPortMemory.reconnect();

  expect(await forgetfulPortMemory.remembered()).toEqual({type: 'none'});
  expect(engine.status()).toEqual({type: 'disconnected'});
});
