import {msg} from '@lingui/core/macro';

import logger from '@/data/service/Logger';
import {appService} from '@/data/service/services';

import {useAppStore} from '../store';

export function useActionLoadBlackoutOnQuit() {
  const setBlackoutOnQuit = useAppStore((state) => state.setBlackoutOnQuit);
  const setOutputError = useAppStore((state) => state.setOutputError);

  return async () => {
    try {
      const {enabled} = await appService.getBlackoutOnQuit();
      setBlackoutOnQuit(enabled);
    } catch (error) {
      logger.error('reading the blackout on quit failed', error);
      setOutputError(msg`Could not find out whether the app blacks out on quit`);
    }
  };
}

/** stored first: a change main refuses (Show mode) or can't store leaves the shown setting as it was */
export function useActionSetBlackoutOnQuit() {
  const setBlackoutOnQuit = useAppStore((state) => state.setBlackoutOnQuit);
  const setOutputError = useAppStore((state) => state.setOutputError);

  return async (enabled: boolean) => {
    try {
      setOutputError(undefined);
      await appService.setBlackoutOnQuit(enabled);
      setBlackoutOnQuit(enabled);
    } catch (error) {
      logger.error(`storing the blackout on quit (${enabled}) failed`, error);
      setOutputError(msg`Could not store whether the app blacks out on quit`);
    }
  };
}
