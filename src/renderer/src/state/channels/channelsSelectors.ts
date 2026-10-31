import {createSelector} from 'reselect';

import {DMX_MIN_VALUE} from '@shared/dmx';

import {channelValueOf} from '@/data/channelValues';

import {ChannelsState} from './ChannelsState';

/** per fader, so moving one fader re-renders only that one */
export const selectChannelValue = (state: ChannelsState, channel: number): number =>
  channelValueOf(state.channelValues, channel);

export const selectActiveChannelCount = createSelector(
  [(state: ChannelsState) => state.channelValues],
  (channelValues) => channelValues.filter((value) => value > DMX_MIN_VALUE).length
);
