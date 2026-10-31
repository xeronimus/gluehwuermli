import {getDefaultChannelsState} from './ChannelsState';
import {selectActiveChannelCount, selectChannelValue} from './channelsSelectors';

test('all channels start at 0', () => {
  const state = getDefaultChannelsState();

  expect(selectChannelValue(state, 1)).toBe(0);
  expect(selectChannelValue(state, 512)).toBe(0);
  expect(selectActiveChannelCount(state)).toBe(0);
});

test('counts the channels above 0', () => {
  expect(selectActiveChannelCount({channelValues: [0, 1, 255, 0]})).toBe(2);
});
