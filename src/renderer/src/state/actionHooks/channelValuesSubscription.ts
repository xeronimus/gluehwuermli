import {useEffect} from 'react';

import {msg} from '@lingui/core/macro';

import {channelValuesExcept} from '@/data/channelValues';
import type DmxService from '@/data/service/DmxService';
import logger from '@/data/service/Logger';
import {dmxService} from '@/data/service/services';

import type {ChannelsActions} from '../channels/ChannelsActions';
import type {OutputActions} from '../output/OutputActions';
import {useAppStore} from '../store';

/**
 * Shows what main sends: asks for the whole universe once (after a window reload a chase may run, or values were set
 * before), then follows the values main sets on its own (a chase step, already capped in main). A fader moved by hand
 * keeps its value until a step sets that channel again, since main only pushes the channels a step names. Returns the
 * function that stops following
 */
export function followChannelValues(
  services: {dmxService: Pick<DmxService, 'getChannelValues' | 'onChannelsChanged'>},
  actions: Pick<ChannelsActions, 'setChannelValues'> & Pick<OutputActions, 'setOutputError'>
): () => void {
  // a step pushed while the answer is on its way is newer than the answer for its channels
  const pushedChannels = new Set<number>();
  let following = true;
  const stopFollowingValues = services.dmxService.onChannelsChanged(({values}) => {
    values.forEach(({channel}) => pushedChannels.add(channel));
    actions.setChannelValues(values);
  });
  services.dmxService
    .getChannelValues()
    .then((channelValues) => {
      if (following) {
        actions.setChannelValues(channelValuesExcept(channelValues, pushedChannels));
      }
    })
    .catch((error: unknown) => {
      // the faders would show 0 where main may send more
      logger.error('reading the channel values failed', error);
      actions.setOutputError(msg`Could not read the channel values the output sends`);
    });
  return () => {
    following = false;
    stopFollowingValues();
  };
}

/** keeps the store's channel values in sync with main (external sync, so useEffect is right here) */
export function useChannelValuesSubscription(): void {
  useEffect(() => followChannelValues({dmxService}, useAppStore.getState()), []);
}
