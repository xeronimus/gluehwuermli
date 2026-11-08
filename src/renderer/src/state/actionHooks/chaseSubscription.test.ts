import type {ChaseStatus} from '@shared/ipc';

import type ChaseService from '@/data/service/ChaseService';
import {inMemoryChaseServiceFactory} from '@/data/service/impl/inMemory/inMemoryChaseServiceFactory';
import {inMemoryDmxServiceFactory} from '@/data/service/impl/inMemory/inMemoryDmxServiceFactory';

import {type ChannelsStateSetter, getChannelsActions} from '../channels/ChannelsActions';
import {type ChannelsState, getDefaultChannelsState} from '../channels/ChannelsState';
import {type ChaseStateSetter, getChaseActions} from '../chase/ChaseActions';
import {type ChaseState, getDefaultChaseState} from '../chase/ChaseState';
import {followChases} from './chaseSubscription';

const RUNNING: ChaseStatus = {type: 'running', chaseId: 'chorus', stepIndex: 2, passIndex: 1};

const storeActions = () => {
  let state: ChannelsState & ChaseState = {...getDefaultChannelsState(), ...getDefaultChaseState()};
  const set: ChannelsStateSetter & ChaseStateSetter = (partial) => {
    state = {...state, ...(typeof partial === 'function' ? partial(state) : partial)};
  };
  return {actions: {...getChannelsActions(set), ...getChaseActions(set)}, current: () => state};
};

test('takes the status main answers on load', async () => {
  const chaseService = inMemoryChaseServiceFactory();
  await chaseService.start('chorus');
  const {actions, current} = storeActions();

  followChases({chaseService, dmxService: inMemoryDmxServiceFactory()}, actions);
  await vi.waitFor(() => expect(current().chaseStatus).toMatchObject({type: 'running', chaseId: 'chorus'}));
});

test('follows the status pushes', () => {
  const chaseService = inMemoryChaseServiceFactory();
  const {actions, current} = storeActions();
  followChases({chaseService, dmxService: inMemoryDmxServiceFactory()}, actions);

  chaseService.pushStatus(RUNNING);
  expect(current().chaseStatus).toEqual(RUNNING);

  chaseService.pushStatus({type: 'idle'});
  expect(current().chaseStatus).toEqual({type: 'idle'});
});

test('a push before the first answer is kept: the answer is older', async () => {
  let answer: (status: ChaseStatus) => void = () => {};
  const listeners: ((status: ChaseStatus) => void)[] = [];
  const slowChaseService: Pick<ChaseService, 'getStatus' | 'onStatusChanged'> = {
    getStatus: () => new Promise((resolve) => (answer = resolve)),
    onStatusChanged: (listener) => {
      listeners.push(listener);
      return () => {};
    }
  };
  const {actions, current} = storeActions();
  followChases({chaseService: slowChaseService, dmxService: inMemoryDmxServiceFactory()}, actions);

  listeners.forEach((listener) => listener(RUNNING));
  answer({type: 'idle'});
  await Promise.resolve();

  expect(current().chaseStatus).toEqual(RUNNING);
});

test('sets the values a step pushed and leaves the other channels, a fader moved by hand among them', () => {
  const dmxService = inMemoryDmxServiceFactory();
  const {actions, current} = storeActions();
  followChases({chaseService: inMemoryChaseServiceFactory(), dmxService}, actions);
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

test('a failed status read is kept as an error, the status stays idle', async () => {
  const failingChaseService: Pick<ChaseService, 'getStatus' | 'onStatusChanged'> = {
    getStatus: async () => {
      throw new Error('no main process');
    },
    onStatusChanged: () => () => {}
  };
  const {actions, current} = storeActions();

  followChases({chaseService: failingChaseService, dmxService: inMemoryDmxServiceFactory()}, actions);

  await vi.waitFor(() => expect(current().chaseError).toBeDefined());
  expect(current().chaseStatus).toEqual({type: 'idle'});
});

test('stops following once unsubscribed', () => {
  const chaseService = inMemoryChaseServiceFactory();
  const dmxService = inMemoryDmxServiceFactory();
  const {actions, current} = storeActions();
  const stopFollowing = followChases({chaseService, dmxService}, actions);

  stopFollowing();
  chaseService.pushStatus(RUNNING);
  dmxService.pushChannelsChanged({values: [{channel: 1, value: 255}]});

  expect(current().chaseStatus).toEqual({type: 'idle'});
  expect(current().channelValues[0]).toBe(0);
});
