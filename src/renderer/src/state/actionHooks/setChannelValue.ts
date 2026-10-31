import {isChannelChange, toDmxValue} from '@/data/channelValues';
import {dmxService} from '@/data/service/services';

import {useAppStore} from '../store';

/**
 * sets a channel in the store (what the fader shows) and sends it to the main process, no round trip; a position
 * giving the value the channel already has does neither
 */
export function useActionSetChannelValue() {
  const setChannelValue = useAppStore((state) => state.setChannelValue);

  return (channel: number, position: number) => {
    const value = toDmxValue(position);
    if (!isChannelChange(useAppStore.getState().channelValues, channel, value)) {
      return;
    }
    setChannelValue(channel, value);
    dmxService.setChannel(channel, value);
  };
}
