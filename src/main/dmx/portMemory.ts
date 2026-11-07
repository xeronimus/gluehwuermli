import type {RememberedPort} from '@shared/ipc';

import type {AppSettings} from '@/settings/appSettings';

import type {DmxEngine} from './dmxEngine';

export interface PortMemoryLog {
  info: (...message: unknown[]) => void;
  warn: (...message: unknown[]) => void;
}

/**
 * Remembers the port the output was last connected to, in the settings, so it is preselected on the next start. It is
 * never connected on its own: nothing is sent before the operator presses Connect. A disconnect doesn't forget the port.
 */
export interface PortMemory {
  /** never rejects */
  remembered: () => Promise<RememberedPort>;
}

export interface PortMemoryDependencies {
  engine: Pick<DmxEngine, 'onStatusChanged'>;
  settings: AppSettings;
  log: PortMemoryLog;
}

const NO_PORT: RememberedPort = {type: 'none'};

/** remembers every port connected to */
export function portMemoryFactory({engine, settings, log}: PortMemoryDependencies): PortMemory {
  const rememberedPath = async () => (await settings.load()).outputPortPath;

  // stored on every connect, even if unchanged: a check against the settings would run outside their queue and could
  // miss a save still in progress
  const rememberPort = async (path: string) => {
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

  return {
    remembered: async () => {
      const path = await rememberedPath();
      return path === undefined ? NO_PORT : {type: 'remembered', path};
    }
  };
}

/**
 * With the simulated output: the simulated port is not remembered, so working without a widget never replaces the real
 * port in the settings.
 */
export const forgetfulPortMemory: PortMemory = {
  remembered: async () => NO_PORT
};
