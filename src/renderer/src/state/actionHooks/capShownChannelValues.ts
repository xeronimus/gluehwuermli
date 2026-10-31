import {channelsAboveLimits} from '@/data/channelLocks';

import {selectChannelLimits} from '../lock/lockSelectors';
import {useAppStore} from '../store';

/**
 * Drops the faders above their cap to it, once the caps apply (the lock turned on, fixtures loaded or saved): the main
 * process capped the universe already, the faders show what it actually sends.
 */
export function capShownChannelValues(): void {
  const state = useAppStore.getState();
  const capped = channelsAboveLimits(state.channelValues, selectChannelLimits(state));
  if (capped.length > 0) {
    state.setChannelValues(capped);
  }
}
