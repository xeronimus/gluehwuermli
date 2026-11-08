import {channelValueOf} from '@/data/channelValues';

import {ChannelsState} from './ChannelsState';

/** per fader, so moving one fader re-renders only that one */
export const selectChannelValue = (state: ChannelsState, channel: number): number =>
  channelValueOf(state.channelValues, channel);
