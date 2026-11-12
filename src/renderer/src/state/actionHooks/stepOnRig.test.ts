import {inMemoryChaseServiceFactory} from '@/data/service/impl/inMemory/inMemoryChaseServiceFactory';

import {type ChaseStateSetter, getChaseActions} from '../chase/ChaseActions';
import {type ChaseState, getDefaultChaseState} from '../chase/ChaseState';
import {playChase} from './playChase';
import {turnStepOnRig} from './stepOnRig';

const chaseStore = () => {
  let state: ChaseState = getDefaultChaseState();
  const set: ChaseStateSetter = (partial) => {
    state = {...state, ...(typeof partial === 'function' ? partial(state) : partial)};
  };
  const actions = getChaseActions(set);
  return {getState: () => ({...state, ...actions}), actions};
};

test('turned on while no chase plays', async () => {
  const store = chaseStore();

  await turnStepOnRig(inMemoryChaseServiceFactory(), store, true);
  expect(store.getState().stepOnRig).toBe(true);

  await turnStepOnRig(inMemoryChaseServiceFactory(), store, false);
  expect(store.getState().stepOnRig).toBe(false);
});

test.each(['start', 'pause'] as const)('a chase playing or paused (%s) is stopped first', async (control) => {
  const service = inMemoryChaseServiceFactory();
  const store = chaseStore();
  await playChase(service, store.actions, 'start', 'chorus');
  await playChase(service, store.actions, control, 'chorus');

  await turnStepOnRig(service, store, true);
  expect(store.getState().chaseStatus).toEqual({type: 'idle'});
  expect(store.getState().stepOnRig).toBe(true);
});

test('a failed stop leaves it off and shows the error', async () => {
  const service = inMemoryChaseServiceFactory();
  const store = chaseStore();
  await playChase(service, store.actions, 'start', 'chorus');

  await turnStepOnRig({...service, stop: () => Promise.reject(new Error('gone'))}, store, true);
  expect(store.getState().stepOnRig).toBe(false);
  expect(store.getState().chaseError).toBeDefined();
  expect(store.getState().chaseStatus).toMatchObject({type: 'running', chaseId: 'chorus'});
});
