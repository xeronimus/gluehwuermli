import type AppService from './AppService';
import type DmxService from './DmxService';
import type FixtureService from './FixtureService';
import logger from './Logger';
import {electronAppServiceFactory} from './impl/electron/electronAppServiceFactory';
import {electronDmxServiceFactory} from './impl/electron/electronDmxServiceFactory';
import {electronFixtureServiceFactory} from './impl/electron/electronFixtureServiceFactory';
import {inMemoryAppServiceFactory} from './impl/inMemory/inMemoryAppServiceFactory';
import {inMemoryDmxServiceFactory} from './impl/inMemory/inMemoryDmxServiceFactory';
import {inMemoryFixtureServiceFactory} from './impl/inMemory/inMemoryFixtureServiceFactory';

/**
 * The composition root of the renderer: creates every service instance once; the only module importing from impl/
 * (enforced by architecture.test.ts). Consumers import the instances from here and depend on the interfaces only.
 */
const dmxBridge = globalThis.window?.gluehwuermli;

if (!dmxBridge) {
  logger.warn('no DMX bridge from the preload script, the output is simulated and fixtures are not stored');
}

export const dmxService: DmxService = dmxBridge ? electronDmxServiceFactory(dmxBridge) : inMemoryDmxServiceFactory();

export const fixtureService: FixtureService = dmxBridge
  ? electronFixtureServiceFactory(dmxBridge)
  : inMemoryFixtureServiceFactory();

export const appService: AppService = dmxBridge ? electronAppServiceFactory(dmxBridge) : inMemoryAppServiceFactory();
