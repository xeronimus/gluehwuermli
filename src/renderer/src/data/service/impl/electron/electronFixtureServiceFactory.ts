import type {PreloadBridge} from '@shared/preloadBridge';

import type FixtureService from '@/data/service/FixtureService';

/** the FixtureService over the bridge the preload script exposes */
export const electronFixtureServiceFactory = (bridge: PreloadBridge): FixtureService => ({
  load: () => bridge.loadFixtures(),
  save: (setup) => bridge.saveFixtures(setup)
});
