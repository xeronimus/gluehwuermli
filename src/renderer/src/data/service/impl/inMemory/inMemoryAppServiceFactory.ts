import type {ChosenLocale} from '@shared/ipc';

import type AppService from '@/data/service/AppService';

/**
 * an AppService without the main process: a plain browser, or a test. There is no folder, the chosen language and the
 * blackout on quit are kept until the page reloads
 */
export function inMemoryAppServiceFactory(dataFolder = 'none: nothing is stored outside the app'): AppService {
  let chosenLocale: ChosenLocale = {type: 'none'};
  let blackoutOnQuit = false;
  return {
    getDataFolder: async () => ({path: dataFolder}),
    openDataFolder: async () => ({type: 'failed', message: 'there is no data folder outside the app'}),
    getLocale: async () => chosenLocale,
    setLocale: async (locale) => {
      chosenLocale = {type: 'chosen', locale};
    },
    getBlackoutOnQuit: async () => ({enabled: blackoutOnQuit}),
    setBlackoutOnQuit: async (enabled) => {
      blackoutOnQuit = enabled;
    }
  };
}
