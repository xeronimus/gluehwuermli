import {useEffect} from 'react';

import type {SetChannelRequest} from '@shared/ipc';

import {clampedChannelValues} from '@/data/channelLocks';
import type ChaseService from '@/data/service/ChaseService';
import {chaseService} from '@/data/service/services';

import type {ChaseActions} from '../chase/ChaseActions';
import type {ChaseState} from '../chase/ChaseState';
import {selectChannelLimits} from '../lock/lockSelectors';
import {useAppStore} from '../store';
import {playChase} from './playChase';
import {useActionSetChannelValues} from './setChannelValues';

/** counts the requests to turn the preview on or off, so one waiting for a chase to stop is dropped by any later one */
let latestRequest = 0;

/**
 * turns the chase editor's "Preview on rig" on or off. On stops a chase playing or paused first, as its next step would
 * overwrite the preview, and turns it on only once the chase is stopped: main's pushes and its reply share one ordered
 * IPC link, so no step pushed before the stop arrives after it. A failed stop shows the error and leaves it off, as does
 * a later request (toggled again, the editor closed) coming in while the stop is awaited
 */
export async function turnStepOnRig(
  service: ChaseService,
  store: {
    getState: () => Pick<ChaseState, 'chaseStatus'> &
      Pick<ChaseActions, 'setChaseStatus' | 'setChaseError' | 'setStepOnRig'>;
  },
  on: boolean
): Promise<void> {
  latestRequest += 1;
  const request = latestRequest;
  const actions = store.getState();
  if (!on) {
    actions.setStepOnRig(false);
    return;
  }
  if (actions.chaseStatus.type !== 'idle') {
    await playChase(service, actions, 'stop', actions.chaseStatus.chaseId);
  }
  if (request === latestRequest && store.getState().chaseStatus.type === 'idle') {
    actions.setStepOnRig(true);
  }
}

const toggleStepOnRig = (on: boolean) => turnStepOnRig(chaseService, useAppStore, on);

/** the same function on every render, so it can be an effect's dependency */
export function useActionToggleStepOnRig() {
  return toggleStepOnRig;
}

const keyOf = (values: readonly SetChannelRequest[]): string =>
  values.map(({channel, value}) => `${channel}:${value}`).join(',');

/**
 * while the preview is on, sends the values (the shown step's) whenever they change: when it is turned on, when another
 * step is shown (its panel mounts), on every edit. Keyed on the capped values, so lifting the channel lock sends the
 * full values again; one turned on needs nothing, main and the faders cap already
 */
export function useStepOnRig(values: readonly SetChannelRequest[]): void {
  const stepOnRig = useAppStore((state) => state.stepOnRig);
  const limits = useAppStore(selectChannelLimits);
  const setChannelValues = useActionSetChannelValues();
  const capped = clampedChannelValues(values, limits);
  const key = keyOf(capped);

  // external sync: sending to the output. Keyed on what is sent, not on the new array of each render; the values sent
  // are those of the render that changed the key
  useEffect(() => {
    if (stepOnRig) {
      setChannelValues(capped);
    }
  }, [stepOnRig, key]);
}
