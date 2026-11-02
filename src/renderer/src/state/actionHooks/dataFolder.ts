import {msg} from '@lingui/core/macro';

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
      setDataFolder({type: 'failed', message: msg`Could not find out where the data folder is`});
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
        const {message} = result;
        setDataFolderError(msg`Could not open the folder: ${message}`);
      } else if (result.type === 'refused') {
        setDataFolderError(msg`The data folder can only be opened in Setup mode`);
      }
    } catch (error) {
      logger.error('opening the data folder failed', error);
      setDataFolderError(msg`Could not open the folder`);
    }
  };
}
