import {preferredPortPath} from '@/data/outputStatus';
import logger from '@/data/service/Logger';
import {dmxService} from '@/data/service/services';

import {useAppStore} from '../store';

export function useActionLoadPorts() {
  const setAvailablePorts = useAppStore((state) => state.setAvailablePorts);
  const setSelectedPortPath = useAppStore((state) => state.setSelectedPortPath);
  const setOutputError = useAppStore((state) => state.setOutputError);

  return async () => {
    try {
      const ports = await dmxService.listPorts();
      setAvailablePorts(ports);
      setSelectedPortPath(preferredPortPath(ports, useAppStore.getState().selectedPortPath));
      setOutputError(undefined);
    } catch (error) {
      logger.error('listing the serial ports failed', error);
      setOutputError('Could not list the serial ports');
    }
  };
}
