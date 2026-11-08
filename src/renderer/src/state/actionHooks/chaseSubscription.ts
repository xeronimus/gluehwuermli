import {useEffect} from 'react';

import {msg} from '@lingui/core/macro';

import type ChaseService from '@/data/service/ChaseService';
import type DmxService from '@/data/service/DmxService';
import logger from '@/data/service/Logger';
import {chaseService, dmxService} from '@/data/service/services';

import type {ChannelsActions} from '../channels/ChannelsActions';
import type {ChaseActions} from '../chase/ChaseActions';
import {useAppStore} from '../store';

/**
 * Follows the chase player in main: its status, and the values each step set (already capped in main), so fixture and
 * raw faders show what goes out. A fader moved by hand keeps its value until a step sets that channel again, since
 * main only pushes the channels a step names. Asks for the status once, then follows the pushes; returns the function
 * that stops following
 */
export function followChases(
  services: {
    chaseService: Pick<ChaseService, 'getStatus' | 'onStatusChanged'>;
    dmxService: Pick<DmxService, 'onChannelsChanged'>;
  },
  actions: Pick<ChaseActions, 'setChaseStatus' | 'setChaseError'> & Pick<ChannelsActions, 'setChannelValues'>
): () => void {
  // a step pushed while the first answer is on its way is newer than that answer
  let pushed = false;
  const stopFollowingStatus = services.chaseService.onStatusChanged((status) => {
    pushed = true;
    actions.setChaseStatus(status);
  });
  const stopFollowingValues = services.dmxService.onChannelsChanged(({values}) => actions.setChannelValues(values));
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
  return () => {
    stopFollowingStatus();
    stopFollowingValues();
  };
}

/** keeps the store's chase status and channel values in sync with main (external sync, so useEffect is right here) */
export function useChaseSubscription(): void {
  useEffect(() => followChases({chaseService, dmxService}, useAppStore.getState()), []);
}
