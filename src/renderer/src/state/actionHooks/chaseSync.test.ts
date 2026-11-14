import type ChaseService from '@/data/service/ChaseService';
import {inMemoryChaseServiceFactory} from '@/data/service/impl/inMemory/inMemoryChaseServiceFactory';

import {type ChaseStateSetter, getChaseActions} from '../chase/ChaseActions';
import {type ChaseState, getDefaultChaseState} from '../chase/ChaseState';
import {setChaseSpeed, setChaseSync} from './chaseSync';

const storeActions = () => {
  let state: ChaseState = getDefaultChaseState();
  const set: ChaseStateSetter = (partial) => {
    state = {...state, ...(typeof partial === 'function' ? partial(state) : partial)};
  };
  return {actions: getChaseActions(set), current: () => state};
};

test('the switch and the speed show the sync status main answers', async () => {
  const service = inMemoryChaseServiceFactory();
  const {actions, current} = storeActions();

  await setChaseSync(service, actions, 'chorus', true);
  expect(current().chaseSync).toEqual({chases: [{chaseId: 'chorus', synced: true, speed: 1}]});

  await setChaseSpeed(service, actions, 'chorus', 4);
  expect(current().chaseSync).toEqual({chases: [{chaseId: 'chorus', synced: true, speed: 4}]});
  expect(current().chaseError).toBeUndefined();
});

test('a failure keeps the shown sync and sets the error', async () => {
  const failing: Pick<ChaseService, 'setSync' | 'setSpeed'> = {
    setSync: async () => {
      throw new Error('no main process');
    },
    setSpeed: async () => {
      throw new Error('no main process');
    }
  };
  const {actions, current} = storeActions();

  await setChaseSync(failing, actions, 'chorus', true);
  expect(current().chaseError).toBeDefined();

  actions.setChaseError(undefined);
  await setChaseSpeed(failing, actions, 'chorus', 2);
  expect(current().chaseError).toBeDefined();
  expect(current().chaseSync).toEqual({chases: []});
});
