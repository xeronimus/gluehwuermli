import {useEffect} from 'react';

import logger from '@/data/service/Logger';
import {dmxService} from '@/data/service/services';

import {useAppStore} from '../store';

/** keeps the store's outputStatus in sync with the main process (external sync, so useEffect is right here) */
export function useOutputStatusSubscription(): void {
  const setOutputStatus = useAppStore((state) => state.setOutputStatus);
  const setOutputError = useAppStore((state) => state.setOutputError);

  useEffect(() => {
    const unsubscribe = dmxService.onStatusChanged(setOutputStatus);
    dmxService
      .getStatus()
      .then(setOutputStatus)
      .catch((error: unknown) => {
        // the bar would keep showing "Not connected", which may be wrong
        logger.error('reading the output status failed', error);
        setOutputError('Could not read the output status');
      });
    return unsubscribe;
  }, [setOutputStatus, setOutputError]);
}
