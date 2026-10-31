import logger from '@/data/service/Logger';
import {appService} from '@/data/service/services';

import {useAppStore} from '../store';

export function useActionLoadDataFolder() {
  const setDataFolder = useAppStore((state) => state.setDataFolder);

  return async () => {
    setDataFolder({type: 'loading'});
    try {
      const {path} = await appService.getDataFolder();
      setDataFolder({type: 'loaded', path});
    } catch (error) {
      logger.error('getting the data folder failed', error);
      setDataFolder({type: 'failed', message: 'Could not find out where the data folder is'});
    }
  };
}

/** a folder that can't be opened comes back as a `failed` result; a failing IPC call ends up in dataFolderError, too */
export function useActionOpenDataFolder() {
  const setDataFolderError = useAppStore((state) => state.setDataFolderError);

  return async () => {
    try {
      setDataFolderError(undefined);
      const result = await appService.openDataFolder();
      if (result.type === 'failed') {
        setDataFolderError(`Could not open the folder: ${result.message}`);
      }
    } catch (error) {
      logger.error('opening the data folder failed', error);
      setDataFolderError('Could not open the folder');
    }
  };
}
