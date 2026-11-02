import type AppService from './AppService';
import type DmxService from './DmxService';
import type FixtureService from './FixtureService';
import type LockService from './LockService';
import logger from './Logger';
import {electronAppServiceFactory} from './impl/electron/electronAppServiceFactory';
import {electronDmxServiceFactory} from './impl/electron/electronDmxServiceFactory';
import {electronFixtureServiceFactory} from './impl/electron/electronFixtureServiceFactory';
import {electronLockServiceFactory} from './impl/electron/electronLockServiceFactory';
import {inMemoryAppServiceFactory} from './impl/inMemory/inMemoryAppServiceFactory';
import {inMemoryDmxServiceFactory} from './impl/inMemory/inMemoryDmxServiceFactory';
import {inMemoryFixtureServiceFactory} from './impl/inMemory/inMemoryFixtureServiceFactory';
import {inMemoryLockServiceFactory} from './impl/inMemory/inMemoryLockServiceFactory';

/**
 * The composition root of the renderer: creates every service instance once; the only module importing from impl/
 * (enforced by architecture.test.ts). Consumers import the instances from here and depend on the interfaces only.
 */
const preloadBridge = globalThis.window?.gluehwuermli;

if (!preloadBridge) {
  logger.warn('no DMX bridge from the preload script, the output is simulated and fixtures are not stored');
}

export const dmxService: DmxService = preloadBridge
  ? electronDmxServiceFactory(preloadBridge)
  : inMemoryDmxServiceFactory();

export const fixtureService: FixtureService = preloadBridge
  ? electronFixtureServiceFactory(preloadBridge)
  : inMemoryFixtureServiceFactory();

export const appService: AppService = preloadBridge
  ? electronAppServiceFactory(preloadBridge)
  : inMemoryAppServiceFactory();

export const lockService: LockService = preloadBridge
  ? electronLockServiceFactory(preloadBridge)
  : inMemoryLockServiceFactory();
