import type {RememberedPort} from '@shared/ipc';

import type {AppSettings} from '@/settings/appSettings';

import type {DmxPortConnector} from './DmxPortConnector';
import type {DmxEngine} from './dmxEngine';

export interface PortMemoryLog {
  info: (...message: unknown[]) => void;
  warn: (...message: unknown[]) => void;
}

/**
 * Remembers the port the output was last connected to, in the settings, and connects to it again on start: at a gig
 * the widget is plugged in, the app started, and it plays. A disconnect doesn't forget the port.
 */
export interface PortMemory {
  /** never rejects */
  remembered: () => Promise<RememberedPort>;
  /**
   * on start: connects to the remembered port if the OS lists it and nothing was connected in the meantime; otherwise
   * the output stays disconnected. Never rejects, a port that fails to open ends in the engine's `failed` status
   */
  reconnect: () => Promise<void>;
}

export interface PortMemoryDependencies {
  engine: Pick<DmxEngine, 'connect' | 'status' | 'onStatusChanged'>;
  connector: Pick<DmxPortConnector, 'listPorts'>;
  settings: AppSettings;
  log: PortMemoryLog;
}

const NO_PORT: RememberedPort = {type: 'none'};

/** remembers every port connected to, whether by hand or by reconnect() */
export function portMemoryFactory({engine, connector, settings, log}: PortMemoryDependencies): PortMemory {
  const rememberedPath = async () => (await settings.load()).outputPortPath;

  const rememberPort = async (path: string) => {
    if ((await rememberedPath()) === path) {
      return;
    }
    try {
      await settings.update({outputPortPath: path});
      log.info(`remembering the port ${path} for the next start`);
    } catch (error) {
      log.warn(`storing the port ${path} failed`, error);
    }
  };

  engine.onStatusChanged((status) => {
    if (status.type === 'connected') {
      void rememberPort(status.path);
    }
  });

  const isListed = async (path: string) => {
    try {
      const ports = await connector.listPorts();
      return ports.some((port) => port.path === path);
    } catch (error) {
      log.warn('listing the ports to connect to the remembered one failed', error);
      return false;
    }
  };

  const reconnect = async () => {
    const path = await rememberedPath();
    if (path === undefined) {
      return;
    }
    if (!(await isListed(path))) {
      log.info(`the remembered port ${path} is not there, starting disconnected`);
      return;
    }
    // connected by hand while the ports were listed
    if (engine.status().type !== 'disconnected') {
      return;
    }
    log.info(`connecting to the remembered port ${path}`);
    await engine.connect(path);
  };

  return {
    remembered: async () => {
      const path = await rememberedPath();
      return path === undefined ? NO_PORT : {type: 'remembered', path};
    },
    reconnect
  };
}

/**
 * With the simulated output: the simulated port is neither remembered nor connected on start, so working without a
 * widget never replaces the real port in the settings.
 */
export const forgetfulPortMemory: PortMemory = {
  remembered: async () => NO_PORT,
  reconnect: async () => {}
};
