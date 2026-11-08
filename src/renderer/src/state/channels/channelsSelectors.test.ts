import {getDefaultChannelsState} from './ChannelsState';
import {selectChannelValue} from './channelsSelectors';

test('all channels start at 0', () => {
  const state = getDefaultChannelsState();

  expect(selectChannelValue(state, 1)).toBe(0);
  expect(selectChannelValue(state, 512)).toBe(0);
});
