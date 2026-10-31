import type {DmxBridge} from '@shared/dmxBridge';

import type AppService from '@/data/service/AppService';

/** the AppService over the bridge the preload script exposes */
export const electronAppServiceFactory = (bridge: DmxBridge): AppService => ({
  getDataFolder: () => bridge.getDataFolder(),
  openDataFolder: () => bridge.openDataFolder()
});
