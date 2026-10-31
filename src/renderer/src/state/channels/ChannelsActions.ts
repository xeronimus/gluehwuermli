import {withChannelValue} from '@/data/channelValues';

import {ChannelsState} from './ChannelsState';

export type ChannelsStateSetter = (
  partial: ChannelsState | Partial<ChannelsState> | ((state: ChannelsState) => ChannelsState | Partial<ChannelsState>),
  replace?: false,
  action?: string
) => void;

export interface ChannelsActions {
  setChannelValue: (channel: number, value: number) => void;
}

export const getChannelsActions = (set: ChannelsStateSetter): ChannelsActions => ({
  setChannelValue: (channel, value) =>
    set(
      (state) => ({channelValues: withChannelValue(state.channelValues, channel, value)}),
      undefined,
      'channels/setChannelValue'
    )
});
