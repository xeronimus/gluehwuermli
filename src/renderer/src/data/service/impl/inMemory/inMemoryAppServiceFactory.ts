import type {ChosenLocale} from '@shared/ipc';

import type AppService from '@/data/service/AppService';

/**
 * an AppService without the main process: a plain browser, or a test. There is no folder, and the chosen language is
 * kept until the page reloads
 */
export function inMemoryAppServiceFactory(dataFolder = 'none: nothing is stored outside the app'): AppService {
  let chosenLocale: ChosenLocale = {type: 'none'};
  return {
    getDataFolder: async () => ({path: dataFolder}),
    openDataFolder: async () => ({type: 'failed', message: 'there is no data folder outside the app'}),
    getLocale: async () => chosenLocale,
    setLocale: async (locale) => {
      chosenLocale = {type: 'chosen', locale};
    }
  };
}
