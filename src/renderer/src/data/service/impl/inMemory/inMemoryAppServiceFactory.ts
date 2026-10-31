import type AppService from '@/data/service/AppService';

/** an AppService without the main process: a plain browser, or a test. There is no folder, nothing is stored */
export function inMemoryAppServiceFactory(dataFolder = 'none: nothing is stored outside the app'): AppService {
  return {
    getDataFolder: async () => ({path: dataFolder}),
    openDataFolder: async () => ({type: 'failed', message: 'there is no data folder outside the app'})
  };
}
