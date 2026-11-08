import type {MessageDescriptor} from '@lingui/core';
import {msg} from '@lingui/core/macro';

import type {ChaseStatus} from '@shared/ipc';

import type {ChaseControl} from '@/data/chaseRows';
import type ChaseService from '@/data/service/ChaseService';
import logger from '@/data/service/Logger';
import {chaseService} from '@/data/service/services';

import type {ChaseActions} from '../chase/ChaseActions';
import {useAppStore} from '../store';

const FAILURES: Record<ChaseControl, MessageDescriptor> = {
  start: msg`Could not start the chase`,
  pause: msg`Could not pause the chase`,
  resume: msg`Could not resume the chase`,
  stop: msg`Could not stop the chase`
};

const sendControl = (service: ChaseService, control: ChaseControl, chaseId: string): Promise<ChaseStatus> => {
  switch (control) {
    case 'start':
      return service.start(chaseId);
    case 'pause':
      return service.pause();
    case 'resume':
      return service.resume();
    case 'stop':
      return service.stop();
  }
};

/**
 * sends a row's button to the chase player in main and shows the status it answers (the push follows with the same);
 * Start replaces a chase already running, in the same tick
 */
export async function playChase(
  service: ChaseService,
  actions: Pick<ChaseActions, 'setChaseStatus' | 'setChaseError'>,
  control: ChaseControl,
  chaseId: string
): Promise<void> {
  try {
    actions.setChaseError(undefined);
    actions.setChaseStatus(await sendControl(service, control, chaseId));
  } catch (error) {
    logger.error(`chase ${control} failed`, error);
    actions.setChaseError(FAILURES[control]);
  }
}

/** a chase row's Start, Pause, Resume and Stop; allowed in Show mode, main plays the chase as saved */
export function useActionPlayChase() {
  return (control: ChaseControl, chaseId: string) => playChase(chaseService, useAppStore.getState(), control, chaseId);
}
