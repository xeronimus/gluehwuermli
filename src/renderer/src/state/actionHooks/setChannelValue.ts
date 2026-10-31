import {cappedValue} from '@/data/channelLocks';
import {isChannelChange, toDmxValue} from '@/data/channelValues';
import {dmxService} from '@/data/service/services';

import {selectChannelLimit} from '../lock/lockSelectors';
import {useAppStore} from '../store';

/**
 * sets a channel in the store (what the fader shows) and sends it to the main process, no round trip; a position
 * giving the value the channel already has does neither. Capped like the main process caps it, while the channel lock
 * is on.
 */
export function useActionSetChannelValue() {
  const setChannelValue = useAppStore((state) => state.setChannelValue);

  return (channel: number, position: number) => {
    const state = useAppStore.getState();
    const value = cappedValue(toDmxValue(position), selectChannelLimit(state, channel));
    if (!isChannelChange(state.channelValues, channel, value)) {
      return;
    }
    setChannelValue(channel, value);
    dmxService.setChannel(channel, value);
  };
}
