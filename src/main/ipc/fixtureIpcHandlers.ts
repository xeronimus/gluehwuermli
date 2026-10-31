import {channelLimits, parseFixtureSetup} from '@shared/fixtures';
import type {FixtureSetup} from '@shared/ipc';

import type {DmxEngine} from '@/dmx/dmxEngine';
import type {FixtureStore} from '@/fixtures/FixtureStore';

export interface FixtureIpcDependencies {
  store: FixtureStore;
  engine: Pick<DmxEngine, 'setChannelLimits'>;
  isSetupMode: () => boolean;
}

export interface FixtureIpcHandlers {
  load: () => Promise<FixtureSetup>;
  /** rejects in Show mode, for an invalid setup and if it can't be stored */
  save: (payload: unknown) => Promise<void>;
}

/**
 * What the fixture IPC channels do, without Electron. The engine's channel limits follow the setup: on every load and
 * after every save.
 */
export function fixtureIpcHandlers({store, engine, isSetupMode}: FixtureIpcDependencies): FixtureIpcHandlers {
  const applyLimits = (setup: FixtureSetup) => engine.setChannelLimits(channelLimits(setup.fixtures));

  return {
    load: async () => {
      const setup = await store.load();
      applyLimits(setup);
      return setup;
    },
    save: async (payload) => {
      if (!isSetupMode()) {
        throw new Error('fixtures can only be changed in Setup mode');
      }
      const setup = parseFixtureSetup(payload);
      if (!setup) {
        throw new Error('invalid fixture setup');
      }
      await store.save(setup);
      applyLimits(setup);
    }
  };
}
