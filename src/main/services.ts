import type {MainConfig} from './config';
import type {DmxPortConnector} from './dmx/DmxPortConnector';
import {DmxEngine, dmxEngineFactory} from './dmx/dmxEngine';
import {inMemoryConnectorFactory} from './dmx/impl/inMemory/inMemoryConnectorFactory';
import {serialPortConnectorFactory} from './dmx/impl/serialport/serialPortConnectorFactory';
import type {FixtureStore} from './fixtures/FixtureStore';
import {fileFixtureStoreFactory} from './fixtures/impl/file/fileFixtureStoreFactory';
import log from './log';

/**
 * At most one packet per DMX frame: a full universe takes ~22.7 ms on the wire (44 Hz), sending more often only
 * fills the widget's input buffer (doc/dmx-latency-and-stack.md)
 */
const DMX_REFRESH_INTERVAL_MS = 23;

export interface MainServices {
  dmxPortConnector: DmxPortConnector;
  dmxEngine: DmxEngine;
  fixtureStore: FixtureStore;
}

export interface MainServicesOptions {
  /** where the fixture setup is stored, in Electron's userData folder */
  fixtureFilePath: string;
}

/** The composition root of the main process: creates every service once; the only module importing from impl/. */
export function createMainServices(config: MainConfig, {fixtureFilePath}: MainServicesOptions): MainServices {
  const dmxPortConnector = config.simulatedOutput ? inMemoryConnectorFactory() : serialPortConnectorFactory();
  const dmxEngine = dmxEngineFactory({connector: dmxPortConnector, refreshIntervalMs: DMX_REFRESH_INTERVAL_MS, log});

  const fixtureStore = fileFixtureStoreFactory({filePath: fixtureFilePath, log});

  return {dmxPortConnector, dmxEngine, fixtureStore};
}
