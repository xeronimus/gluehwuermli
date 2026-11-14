import type {ChaseStatus, ChaseSyncStatus} from '@shared/ipc';

import type ChaseService from '@/data/service/ChaseService';
import {inMemoryChaseServiceFactory} from '@/data/service/impl/inMemory/inMemoryChaseServiceFactory';

import {type ChaseStateSetter, getChaseActions} from '../chase/ChaseActions';
import {type ChaseState, getDefaultChaseState} from '../chase/ChaseState';
import {followChases} from './chaseSubscription';

const RUNNING: ChaseStatus = {type: 'running', chaseId: 'chorus', stepIndex: 2, passIndex: 1, synced: false, speed: 1};

const storeActions = () => {
  let state: ChaseState = getDefaultChaseState();
  const set: ChaseStateSetter = (partial) => {
    state = {...state, ...(typeof partial === 'function' ? partial(state) : partial)};
  };
  return {actions: getChaseActions(set), current: () => state};
};

test('takes the status main answers on load', async () => {
  const chaseService = inMemoryChaseServiceFactory();
  await chaseService.start('chorus');
  const {actions, current} = storeActions();

  followChases({chaseService}, actions);
  await vi.waitFor(() => expect(current().chaseStatus).toMatchObject({type: 'running', chaseId: 'chorus'}));
});

test('follows the status pushes', () => {
  const chaseService = inMemoryChaseServiceFactory();
  const {actions, current} = storeActions();
  followChases({chaseService}, actions);

  chaseService.pushStatus(RUNNING);
  expect(current().chaseStatus).toEqual(RUNNING);

  chaseService.pushStatus({type: 'idle'});
  expect(current().chaseStatus).toEqual({type: 'idle'});
});

test('a push before the first answer is kept: the answer is older', async () => {
  let answer: (status: ChaseStatus) => void = () => {};
  const listeners: ((status: ChaseStatus) => void)[] = [];
  const slowChaseService: Pick<ChaseService, 'getStatus' | 'onStatusChanged' | 'getSync' | 'onSyncChanged'> = {
    getStatus: () => new Promise((resolve) => (answer = resolve)),
    onStatusChanged: (listener) => {
      listeners.push(listener);
      return () => {};
    },
    getSync: async () => ({chases: []}),
    onSyncChanged: () => () => {}
  };
  const {actions, current} = storeActions();
  followChases({chaseService: slowChaseService}, actions);

  listeners.forEach((listener) => listener(RUNNING));
  answer({type: 'idle'});
  await Promise.resolve();

  expect(current().chaseStatus).toEqual(RUNNING);
});

test('a failed status read is kept as an error, the status stays idle', async () => {
  const failingChaseService: Pick<ChaseService, 'getStatus' | 'onStatusChanged' | 'getSync' | 'onSyncChanged'> = {
    getStatus: async () => {
      throw new Error('no main process');
    },
    onStatusChanged: () => () => {},
    getSync: async () => ({chases: []}),
    onSyncChanged: () => () => {}
  };
  const {actions, current} = storeActions();

  followChases({chaseService: failingChaseService}, actions);

  await vi.waitFor(() => expect(current().chaseError).toBeDefined());
  expect(current().chaseStatus).toEqual({type: 'idle'});
});

test('stops following once unsubscribed', () => {
  const chaseService = inMemoryChaseServiceFactory();
  const {actions, current} = storeActions();
  const stopFollowing = followChases({chaseService}, actions);

  stopFollowing();
  chaseService.pushStatus(RUNNING);

  expect(current().chaseStatus).toEqual({type: 'idle'});
});

test('follows the sync of the chases: the answer on load, then the pushes', async () => {
  const chaseService = inMemoryChaseServiceFactory();
  await chaseService.setSync('chorus', true);
  const {actions, current} = storeActions();
  followChases({chaseService}, actions);
  await vi.waitFor(() => expect(current().chaseSync).toEqual({chases: [{chaseId: 'chorus', synced: true, speed: 1}]}));

  await chaseService.setSpeed('laser', 2);

  expect(current().chaseSync.chases).toContainEqual({chaseId: 'laser', synced: false, speed: 2});
});

test('a sync push before the first answer is kept: the answer is older', async () => {
  let answer: (status: ChaseSyncStatus) => void = () => {};
  const listeners: ((status: ChaseSyncStatus) => void)[] = [];
  const pushed: ChaseSyncStatus = {chases: [{chaseId: 'chorus', synced: true, speed: 1}]};
  const slowChaseService: Pick<ChaseService, 'getStatus' | 'onStatusChanged' | 'getSync' | 'onSyncChanged'> = {
    getStatus: async () => ({type: 'idle'}),
    onStatusChanged: () => () => {},
    getSync: () => new Promise((resolve) => (answer = resolve)),
    onSyncChanged: (listener) => {
      listeners.push(listener);
      return () => {};
    }
  };
  const {actions, current} = storeActions();
  followChases({chaseService: slowChaseService}, actions);

  listeners.forEach((listener) => listener(pushed));
  answer({chases: []});
  await Promise.resolve();

  expect(current().chaseSync).toEqual(pushed);
});
