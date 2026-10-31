import type {DmxBridge} from '@shared/dmxBridge';

import type FixtureService from '@/data/service/FixtureService';

/** the FixtureService over the bridge the preload script exposes */
export const electronFixtureServiceFactory = (bridge: DmxBridge): FixtureService => ({
  load: () => bridge.loadFixtures(),
  save: (setup) => bridge.saveFixtures(setup)
});
