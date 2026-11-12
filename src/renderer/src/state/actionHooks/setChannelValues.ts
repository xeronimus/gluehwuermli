import type {SetChannelRequest} from '@shared/ipc';

import {clampedChannelValues} from '@/data/channelLocks';
import {dmxService} from '@/data/service/services';

import {selectChannelLimits} from '../lock/lockSelectors';
import {useAppStore} from '../store';

/**
 * sets several channels in the store (the faders move) and sends them in one message, no round trip: a preset, a
 * scene, a previewed chase step. Capped like the main process caps them, while the channel lock is on
 */
export function useActionSetChannelValues() {
  const setChannelValues = useAppStore((state) => state.setChannelValues);

  return (values: readonly SetChannelRequest[]) => {
    const capped = clampedChannelValues(values, selectChannelLimits(useAppStore.getState()));
    if (capped.length === 0) {
      return;
    }
    setChannelValues(capped);
    dmxService.setChannelValues(capped);
  };
}
