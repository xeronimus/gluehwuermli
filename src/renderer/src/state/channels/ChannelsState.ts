import {DMX_MIN_VALUE, DMX_UNIVERSE_SIZE, FIRST_DMX_CHANNEL} from '@shared/dmx';

export interface ChannelsState {
  /** what the faders show, index 0 is channel 1; the main process owns the universe actually sent */
  channelValues: readonly number[];
  /** the first channel of the Channels tab's fader bank; kept here so it survives switching tabs */
  bankStart: number;
}

export const getDefaultChannelsState = (): ChannelsState => ({
  channelValues: Array<number>(DMX_UNIVERSE_SIZE).fill(DMX_MIN_VALUE),
  bankStart: FIRST_DMX_CHANNEL
});
