import type {MainConfig} from './config';
import type {DmxPortConnector} from './dmx/DmxPortConnector';
import {DmxEngine, dmxEngineFactory} from './dmx/dmxEngine';
import {inMemoryConnectorFactory} from './dmx/impl/inMemory/inMemoryConnectorFactory';
import {serialPortConnectorFactory} from './dmx/impl/serialport/serialPortConnectorFactory';
import {type PortMemory, forgetfulPortMemory, portMemoryFactory} from './dmx/portMemory';
import type {FixtureStore} from './fixtures/FixtureStore';
import {fileFixtureStoreFactory} from './fixtures/impl/file/fileFixtureStoreFactory';
import {AppLock, appLockFactory} from './lock/appLock';
import log from './log';
import {type AppSettings, appSettingsFactory} from './settings/appSettings';
import {fileSettingsStoreFactory} from './settings/impl/file/fileSettingsStoreFactory';
import type {WindowStateStore} from './window/WindowStateStore';
import {fileWindowStateStoreFactory} from './window/impl/file/fileWindowStateStoreFactory';

/**
 * At most one packet per DMX frame: a full universe takes ~22.7 ms on the wire (44 Hz), sending more often only
 * fills the widget's input buffer (doc/dmx-latency-and-stack.md)
 */
const DMX_REFRESH_INTERVAL_MS = 23;

/** Setup mode locks itself after this long without input, so it isn't left open at an event */
const IDLE_LOCK_TIMEOUT_MS = 10 * 60 * 1000;

/** after a wrong password: hardly noticeable for a typo, slows down guessing */
const WRONG_PASSWORD_DELAY_MS = 1000;

export interface MainServices {
  dmxPortConnector: DmxPortConnector;
  dmxEngine: DmxEngine;
  fixtureStore: FixtureStore;
  windowStateStore: WindowStateStore;
  settings: AppSettings;
  appLock: AppLock;
  portMemory: PortMemory;
}

export interface MainServicesOptions {
  /** where the fixture setup is stored, in Electron's userData folder */
  fixtureFilePath: string;
  /** where the main window's position and size are stored, in Electron's userData folder */
  windowStateFilePath: string;
  /** where the settings (the password hash, the last port) are stored, in Electron's userData folder */
  settingsFilePath: string;
}

/** The composition root of the main process: creates every service once; the only module importing from impl/. */
export function createMainServices(
  config: MainConfig,
  {fixtureFilePath, windowStateFilePath, settingsFilePath}: MainServicesOptions
): MainServices {
  const dmxPortConnector = config.simulatedOutput ? inMemoryConnectorFactory() : serialPortConnectorFactory();
  const dmxEngine = dmxEngineFactory({connector: dmxPortConnector, refreshIntervalMs: DMX_REFRESH_INTERVAL_MS, log});

  const fixtureStore = fileFixtureStoreFactory({filePath: fixtureFilePath, log});

  const windowStateStore = fileWindowStateStoreFactory({filePath: windowStateFilePath, log});

  const settings = appSettingsFactory(fileSettingsStoreFactory({filePath: settingsFilePath, log}));
  const appLock = appLockFactory({
    settings,
    engine: dmxEngine,
    idleTimeoutMs: IDLE_LOCK_TIMEOUT_MS,
    wrongPasswordDelayMs: WRONG_PASSWORD_DELAY_MS,
    log
  });

  const portMemory = config.simulatedOutput
    ? forgetfulPortMemory
    : portMemoryFactory({engine: dmxEngine, connector: dmxPortConnector, settings, log});

  return {dmxPortConnector, dmxEngine, fixtureStore, windowStateStore, settings, appLock, portMemory};
}
