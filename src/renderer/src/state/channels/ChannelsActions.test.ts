import {ChannelsStateSetter, getChannelsActions} from './ChannelsActions';
import {ChannelsState, getDefaultChannelsState} from './ChannelsState';

const actionsOnState = () => {
  let state: ChannelsState = getDefaultChannelsState();
  const set: ChannelsStateSetter = (partial) => {
    state = {...state, ...(typeof partial === 'function' ? partial(state) : partial)};
  };
  return {actions: getChannelsActions(set), current: () => state};
};

describe('setBankStart', () => {
  test('moves the bank and leaves the channel values alone', () => {
    const {actions, current} = actionsOnState();
    actions.setChannelValue(3, 200);

    actions.setBankStart(17);

    expect(current().bankStart).toBe(17);
    expect(current().channelValues[2]).toBe(200);
  });

  test('stores a clamped start', () => {
    const {actions, current} = actionsOnState();

    actions.setBankStart(600);
    expect(current().bankStart).toBe(497);

    actions.setBankStart(0);
    expect(current().bankStart).toBe(1);
  });
});

describe('setChannelValues', () => {
  test('sets several channels and leaves the others alone', () => {
    const {actions, current} = actionsOnState();
    actions.setChannelValue(2, 50);

    actions.setChannelValues([
      {channel: 1, value: 255},
      {channel: 3, value: 80}
    ]);

    expect(current().channelValues.slice(0, 4)).toEqual([255, 50, 80, 0]);
  });
});
