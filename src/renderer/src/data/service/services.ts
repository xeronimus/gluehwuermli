import type AppService from './AppService';
import type ChaseService from './ChaseService';
import type DmxService from './DmxService';
import type LockService from './LockService';
import logger from './Logger';
import type ProjectService from './ProjectService';
import type TempoService from './TempoService';
import {electronAppServiceFactory} from './impl/electron/electronAppServiceFactory';
import {electronChaseServiceFactory} from './impl/electron/electronChaseServiceFactory';
import {electronDmxServiceFactory} from './impl/electron/electronDmxServiceFactory';
import {electronLockServiceFactory} from './impl/electron/electronLockServiceFactory';
import {electronProjectServiceFactory} from './impl/electron/electronProjectServiceFactory';
import {electronTempoServiceFactory} from './impl/electron/electronTempoServiceFactory';
import {inMemoryAppServiceFactory} from './impl/inMemory/inMemoryAppServiceFactory';
import {inMemoryChaseServiceFactory} from './impl/inMemory/inMemoryChaseServiceFactory';
import {inMemoryDmxServiceFactory} from './impl/inMemory/inMemoryDmxServiceFactory';
import {inMemoryLockServiceFactory} from './impl/inMemory/inMemoryLockServiceFactory';
import {inMemoryProjectServiceFactory} from './impl/inMemory/inMemoryProjectServiceFactory';
import {inMemoryTempoServiceFactory} from './impl/inMemory/inMemoryTempoServiceFactory';

/**
 * The composition root of the renderer: creates every service instance once; the only module importing from impl/
 * (enforced by architecture.test.ts). Consumers import the instances from here and depend on the interfaces only.
 */
const preloadBridge = globalThis.window?.gluehwuermli;

if (!preloadBridge) {
  logger.warn('no DMX bridge from the preload script, the output is simulated and the project is kept in memory');
}

export const dmxService: DmxService = preloadBridge
  ? electronDmxServiceFactory(preloadBridge)
  : inMemoryDmxServiceFactory();

export const projectService: ProjectService = preloadBridge
  ? electronProjectServiceFactory(preloadBridge)
  : inMemoryProjectServiceFactory();

export const appService: AppService = preloadBridge
  ? electronAppServiceFactory(preloadBridge)
  : inMemoryAppServiceFactory();

export const lockService: LockService = preloadBridge
  ? electronLockServiceFactory(preloadBridge)
  : inMemoryLockServiceFactory();

export const chaseService: ChaseService = preloadBridge
  ? electronChaseServiceFactory(preloadBridge)
  : inMemoryChaseServiceFactory();

export const tempoService: TempoService = preloadBridge
  ? electronTempoServiceFactory(preloadBridge)
  : inMemoryTempoServiceFactory(() => performance.now());
