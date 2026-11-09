import {useEffect} from 'react';

import {msg} from '@lingui/core/macro';

import type ChaseService from '@/data/service/ChaseService';
import logger from '@/data/service/Logger';
import {chaseService} from '@/data/service/services';

import type {ChaseActions} from '../chase/ChaseActions';
import {useAppStore} from '../store';

/**
 * Follows the chase player in main: asks for its status once, then follows the pushes; returns the function that stops
 * following. The values its steps set are followed by followChannelValues
 */
export function followChases(
  services: {chaseService: Pick<ChaseService, 'getStatus' | 'onStatusChanged'>},
  actions: Pick<ChaseActions, 'setChaseStatus' | 'setChaseError'>
): () => void {
  // a step pushed while the first answer is on its way is newer than that answer
  let pushed = false;
  const stopFollowingStatus = services.chaseService.onStatusChanged((status) => {
    pushed = true;
    actions.setChaseStatus(status);
  });
  services.chaseService
    .getStatus()
    .then((status) => {
      if (!pushed) {
        actions.setChaseStatus(status);
      }
    })
    .catch((error: unknown) => {
      // the rows would show no chase running, which may be wrong
      logger.error('reading the chase status failed', error);
      actions.setChaseError(msg`Could not read whether a chase is playing`);
    });
  return stopFollowingStatus;
}

/** keeps the store's chase status in sync with main (external sync, so useEffect is right here) */
export function useChaseSubscription(): void {
  useEffect(() => followChases({chaseService}, useAppStore.getState()), []);
}
