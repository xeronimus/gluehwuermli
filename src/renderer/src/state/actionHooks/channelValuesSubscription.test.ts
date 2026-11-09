import {DMX_UNIVERSE_SIZE, FIRST_DMX_CHANNEL} from '@shared/dmx';
import type {ChannelsChanged} from '@shared/ipc';

import type DmxService from '@/data/service/DmxService';
import {inMemoryDmxServiceFactory} from '@/data/service/impl/inMemory/inMemoryDmxServiceFactory';

import {type ChannelsStateSetter, getChannelsActions} from '../channels/ChannelsActions';
import {type ChannelsState, getDefaultChannelsState} from '../channels/ChannelsState';
import {type OutputStateSetter, getOutputActions} from '../output/OutputActions';
import {type OutputState, getDefaultOutputState} from '../output/OutputState';
import {followChannelValues} from './channelValuesSubscription';

const storeActions = () => {
  let state: ChannelsState & OutputState = {...getDefaultChannelsState(), ...getDefaultOutputState()};
  const set: ChannelsStateSetter & OutputStateSetter = (partial) => {
    state = {...state, ...(typeof partial === 'function' ? partial(state) : partial)};
  };
  return {actions: {...getChannelsActions(set), ...getOutputActions(set)}, current: () => state};
};

/** a DmxService that answers only when the test says so, so a push can come first */
const slowDmxService = () => {
  let answer: (values: readonly number[]) => void = () => {};
  const listeners = new Set<(change: ChannelsChanged) => void>();
  const service: Pick<DmxService, 'getChannelValues' | 'onChannelsChanged'> = {
    getChannelValues: () => new Promise((resolve) => (answer = resolve)),
    onChannelsChanged: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };
  return {
    service,
    answer: (values: readonly number[]) => answer(values),
    push: (change: ChannelsChanged) => listeners.forEach((listener) => listener(change))
  };
};

/** a whole universe, 0 except for the channels given */
const universeWith = (values: ReadonlyMap<number, number>) =>
  Array.from({length: DMX_UNIVERSE_SIZE}, (_unused, index) => values.get(index + FIRST_DMX_CHANNEL) ?? 0);

test('takes the values main holds on load', async () => {
  const dmxService = inMemoryDmxServiceFactory();
  dmxService.setChannelValues([
    {channel: 1, value: 255},
    {channel: 512, value: 40}
  ]);
  const {actions, current} = storeActions();

  followChannelValues({dmxService}, actions);

  await vi.waitFor(() => expect(current().channelValues[0]).toBe(255));
  expect(current().channelValues[511]).toBe(40);
  expect(current().channelValues[1]).toBe(0);
});

test('a step pushed before the answer is kept for its channels, the answer fills the others', async () => {
  const dmxService = slowDmxService();
  const {actions, current} = storeActions();
  followChannelValues({dmxService: dmxService.service}, actions);

  dmxService.push({values: [{channel: 29, value: 255}]});
  dmxService.answer(
    universeWith(
      new Map([
        [29, 10],
        [30, 128]
      ])
    )
  );
  await Promise.resolve();

  expect(current().channelValues[28]).toBe(255);
  expect(current().channelValues[29]).toBe(128);
});

test('sets the values a step pushed and leaves the other channels, a fader moved by hand among them', () => {
  const dmxService = inMemoryDmxServiceFactory();
  const {actions, current} = storeActions();
  followChannelValues({dmxService}, actions);
  actions.setChannelValue(5, 77);

  dmxService.pushChannelsChanged({
    values: [
      {channel: 29, value: 255},
      {channel: 30, value: 0}
    ]
  });

  expect(current().channelValues[28]).toBe(255);
  expect(current().channelValues[29]).toBe(0);
  expect(current().channelValues[4]).toBe(77);
});

test('a failed read is kept as an output error, the faders stay as they are', async () => {
  const failingDmxService: Pick<DmxService, 'getChannelValues' | 'onChannelsChanged'> = {
    getChannelValues: async () => {
      throw new Error('invalid channel values');
    },
    onChannelsChanged: () => () => {}
  };
  const {actions, current} = storeActions();

  followChannelValues({dmxService: failingDmxService}, actions);

  await vi.waitFor(() => expect(current().outputError).toBeDefined());
  expect(current().channelValues).toEqual(getDefaultChannelsState().channelValues);
});

test('stops following once unsubscribed, an answer arriving late included', async () => {
  const dmxService = slowDmxService();
  const {actions, current} = storeActions();
  const stopFollowing = followChannelValues({dmxService: dmxService.service}, actions);

  stopFollowing();
  dmxService.push({values: [{channel: 1, value: 255}]});
  dmxService.answer(universeWith(new Map([[2, 99]])));
  await Promise.resolve();

  expect(current().channelValues.slice(0, 2)).toEqual([0, 0]);
});
