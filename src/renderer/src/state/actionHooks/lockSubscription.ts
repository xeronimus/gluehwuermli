import {useEffect} from 'react';

import type {LockStatus} from '@shared/ipc';

import logger from '@/data/service/Logger';
import {lockService} from '@/data/service/services';

import {useAppStore} from '../store';
import {capShownChannelValues} from './capShownChannelValues';

/** shows the main process's mode and channel lock, and the faders capped like the universe it sends */
export function applyLockStatus(lockStatus: LockStatus): void {
  useAppStore.getState().setLockStatus(lockStatus);
  capShownChannelValues();
}

/** keeps the store's lockStatus in sync with the main process (external sync, so useEffect is right here) */
export function useLockSubscription(): void {
  const setLockError = useAppStore((state) => state.setLockError);

  useEffect(() => {
    const unsubscribe = lockService.onChanged(applyLockStatus);
    lockService
      .getStatus()
      .then(applyLockStatus)
      .catch((error: unknown) => {
        // stays in the loading status, shown like Show mode: nothing becomes editable by mistake
        logger.error('reading the lock status failed', error);
        setLockError('Could not read whether the app is locked');
      });
    return unsubscribe;
  }, [setLockError]);
}
