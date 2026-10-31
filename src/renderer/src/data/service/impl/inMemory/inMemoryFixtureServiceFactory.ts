import {emptyFixtureSetup} from '@shared/fixtures';
import type {FixtureSetup} from '@shared/ipc';

import type FixtureService from '@/data/service/FixtureService';

/** a FixtureService without the main process, forgetting everything on reload: a plain browser, or a test */
export function inMemoryFixtureServiceFactory(initialSetup: FixtureSetup = emptyFixtureSetup()): FixtureService {
  let setup = initialSetup;

  return {
    load: async () => setup,
    save: async (next) => {
      setup = next;
    }
  };
}
