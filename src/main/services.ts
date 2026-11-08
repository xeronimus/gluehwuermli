import {type ChasePlayer, chasePlayerFactory} from './chase/chasePlayer';
import type {MainConfig} from './config';
import type {DmxPortConnector} from './dmx/DmxPortConnector';
import {DmxEngine, dmxEngineFactory} from './dmx/dmxEngine';
import {inMemoryConnectorFactory} from './dmx/impl/inMemory/inMemoryConnectorFactory';
import {serialPortConnectorFactory} from './dmx/impl/serialport/serialPortConnectorFactory';
import {type PortMemory, forgetfulPortMemory, portMemoryFactory} from './dmx/portMemory';
import {AppLock, appLockFactory} from './lock/appLock';
import log from './log';
import {electronProjectDialogsFactory} from './project/impl/electron/electronProjectDialogsFactory';
import {fileProjectFileStoreFactory} from './project/impl/file/fileProjectFileStoreFactory';
import {type ProjectSession, projectSessionFactory} from './project/projectSession';
import {type AppSettings, appSettingsFactory} from './settings/appSettings';
import {fileSettingsStoreFactory} from './settings/impl/file/fileSettingsStoreFactory';
import {fileExists} from './storage/fileExists';
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
  chasePlayer: ChasePlayer;
  windowStateStore: WindowStateStore;
  settings: AppSettings;
  appLock: AppLock;
  portMemory: PortMemory;
  projectSession: ProjectSession;
}

export interface MainServicesOptions {
  /** where the file dialogs for projects start: the user's Documents folder */
  projectFolder: string;
  /** where the main window's position and size are stored, in Electron's userData folder */
  windowStateFilePath: string;
  /** where the settings (the password hash, the last port) are stored, in Electron's userData folder */
  settingsFilePath: string;
}

/** The composition root of the main process: creates every service once; the only module importing from impl/. */
export function createMainServices(
  config: MainConfig,
  {projectFolder, windowStateFilePath, settingsFilePath}: MainServicesOptions
): MainServices {
  const dmxPortConnector = config.simulatedOutput ? inMemoryConnectorFactory() : serialPortConnectorFactory();
  const dmxEngine = dmxEngineFactory({connector: dmxPortConnector, refreshIntervalMs: DMX_REFRESH_INTERVAL_MS, log});
  // monotonic: a clock change on the PC (summer time, NTP) mustn't make a step wait or skip
  const chasePlayer = chasePlayerFactory({engine: dmxEngine, now: () => performance.now(), log});

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
    : portMemoryFactory({engine: dmxEngine, settings, log});

  const projectSession = projectSessionFactory({
    store: fileProjectFileStoreFactory(),
    engine: dmxEngine,
    chasePlayer,
    settings,
    isSetupMode: appLock.isSetupMode,
    dialogs: electronProjectDialogsFactory(projectFolder),
    fileExists,
    log
  });

  return {dmxPortConnector, dmxEngine, chasePlayer, windowStateStore, settings, appLock, portMemory, projectSession};
}
