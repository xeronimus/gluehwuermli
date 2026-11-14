import {useEffect} from 'react';

import {msg} from '@lingui/core/macro';

import logger from '@/data/service/Logger';
import type TempoService from '@/data/service/TempoService';
import {tempoService} from '@/data/service/services';

import {useAppStore} from '../store';
import type {TempoActions} from '../tempo/TempoActions';

/**
 * Follows main's tempo clock: asks for its status once, then follows the pushes, each kept with the time it arrived
 * on `now`; returns the function that stops following
 */
export function followTempo(
  service: Pick<TempoService, 'getStatus' | 'onStatusChanged'>,
  actions: Pick<TempoActions, 'setTempoStatus' | 'setTempoError'>,
  now: () => number
): () => void {
  // a tempo pushed while the first answer is on its way is newer than that answer
  let pushed = false;
  const stopFollowing = service.onStatusChanged((status) => {
    pushed = true;
    actions.setTempoStatus(status, now());
  });
  service
    .getStatus()
    .then((status) => {
      if (!pushed) {
        actions.setTempoStatus(status, now());
      }
    })
    .catch((error: unknown) => {
      logger.error('reading the tempo failed', error);
      actions.setTempoError(msg`Could not read the tempo`);
    });
  return stopFollowing;
}

/** keeps the store's tempo in sync with main (external sync, so useEffect is right here) */
export function useTempoSubscription(): void {
  useEffect(() => followTempo(tempoService, useAppStore.getState(), () => performance.now()), []);
}
