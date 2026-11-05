import type {PreloadBridge} from '@shared/preloadBridge';

import type AppService from '@/data/service/AppService';

/** the AppService over the bridge the preload script exposes */
export const electronAppServiceFactory = (bridge: PreloadBridge): AppService => ({
  getDataFolder: () => bridge.getDataFolder(),
  openDataFolder: () => bridge.openDataFolder(),
  getLocale: () => bridge.getLocale(),
  setLocale: (locale) => bridge.setLocale(locale),
  getBlackoutOnQuit: () => bridge.getBlackoutOnQuit(),
  setBlackoutOnQuit: (enabled) => bridge.setBlackoutOnQuit(enabled)
});
