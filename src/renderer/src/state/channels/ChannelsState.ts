import {DMX_MIN_VALUE, DMX_UNIVERSE_SIZE} from '@shared/dmx';

export interface ChannelsState {
  /** what the faders show, index 0 is channel 1; the main process owns the universe actually sent */
  channelValues: readonly number[];
}

export const getDefaultChannelsState = (): ChannelsState => ({
  channelValues: Array<number>(DMX_UNIVERSE_SIZE).fill(DMX_MIN_VALUE)
});
