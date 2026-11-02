import {msg} from '@lingui/core/macro';

import logger from '@/data/service/Logger';
import {dmxService} from '@/data/service/services';

import {useAppStore} from '../store';

/** a failing port ends in the `failed` status; only a failing IPC call ends up in outputError */
export function useActionConnectOutput() {
  const setOutputStatus = useAppStore((state) => state.setOutputStatus);
  const setOutputError = useAppStore((state) => state.setOutputError);

  return async (path: string) => {
    try {
      setOutputError(undefined);
      setOutputStatus(await dmxService.connect(path));
    } catch (error) {
      logger.error(`connecting to ${path} failed`, error);
      setOutputError(msg`Could not connect to ${path}`);
    }
  };
}

export function useActionDisconnectOutput() {
  const setOutputStatus = useAppStore((state) => state.setOutputStatus);
  const setOutputError = useAppStore((state) => state.setOutputError);

  return async () => {
    try {
      setOutputError(undefined);
      setOutputStatus(await dmxService.disconnect());
    } catch (error) {
      logger.error('disconnecting failed', error);
      setOutputError(msg`Could not disconnect`);
    }
  };
}
