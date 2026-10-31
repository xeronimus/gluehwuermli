import {useEffect} from 'react';

import logger from '@/data/service/Logger';
import {dmxService} from '@/data/service/services';
import {useAppStore} from '@/state/store';

/** keeps the store's outputStatus in sync with the main process (external sync, so useEffect is right here) */
export function useOutputStatusSubscription(): void {
  const setOutputStatus = useAppStore((state) => state.setOutputStatus);

  useEffect(() => {
    const unsubscribe = dmxService.onStatusChanged(setOutputStatus);
    dmxService
      .getStatus()
      .then(setOutputStatus)
      .catch((error: unknown) => logger.error('reading the output status failed', error));
    return unsubscribe;
  }, [setOutputStatus]);
}
