import {toDmxValue} from '@/data/channelValues';
import {dmxService} from '@/data/service/services';

import {useAppStore} from '../store';

/** sets a channel in the store (what the fader shows) and sends it to the main process, no round trip */
export function useActionSetChannelValue() {
  const setChannelValue = useAppStore((state) => state.setChannelValue);

  return (channel: number, position: number) => {
    const value = toDmxValue(position);
    setChannelValue(channel, value);
    dmxService.setChannel(channel, value);
  };
}
