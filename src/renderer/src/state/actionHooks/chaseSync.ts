import {msg} from '@lingui/core/macro';

import type {ChaseSpeed} from '@shared/ipc';

import type ChaseService from '@/data/service/ChaseService';
import logger from '@/data/service/Logger';
import {chaseService} from '@/data/service/services';

import type {ChaseActions} from '../chase/ChaseActions';
import {useAppStore} from '../store';

type SyncActions = Pick<ChaseActions, 'setChaseSync' | 'setChaseError'>;

const COULD_NOT_CHANGE = msg`Could not change the chase's sync`;

/** sends the change to main and shows the sync status it answers; a failure keeps the shown one */
async function changeChaseSync(
  actions: SyncActions,
  description: string,
  send: () => ReturnType<ChaseService['setSync']>
): Promise<void> {
  try {
    actions.setChaseError(undefined);
    actions.setChaseSync(await send());
  } catch (error) {
    logger.error(`${description} failed`, error);
    actions.setChaseError(COULD_NOT_CHANGE);
  }
}

/** a chase row's sync switch */
export const setChaseSync = (
  service: Pick<ChaseService, 'setSync'>,
  actions: SyncActions,
  chaseId: string,
  synced: boolean
): Promise<void> => changeChaseSync(actions, 'setting the chase sync', () => service.setSync(chaseId, synced));

/** a chase row's speed buttons */
export const setChaseSpeed = (
  service: Pick<ChaseService, 'setSpeed'>,
  actions: SyncActions,
  chaseId: string,
  speed: ChaseSpeed
): Promise<void> => changeChaseSync(actions, 'setting the chase speed', () => service.setSpeed(chaseId, speed));

/** the sync switch and speed of the chase rows; allowed in Show mode, they only change how a chase plays */
export function useActionChaseSync() {
  return {
    setSync: (chaseId: string, synced: boolean) => setChaseSync(chaseService, useAppStore.getState(), chaseId, synced),
    setSpeed: (chaseId: string, speed: ChaseSpeed) =>
      setChaseSpeed(chaseService, useAppStore.getState(), chaseId, speed)
  };
}
