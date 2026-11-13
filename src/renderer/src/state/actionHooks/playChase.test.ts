import {inMemoryChaseServiceFactory} from '@/data/service/impl/inMemory/inMemoryChaseServiceFactory';

import {type ChaseStateSetter, getChaseActions} from '../chase/ChaseActions';
import {type ChaseState, getDefaultChaseState} from '../chase/ChaseState';
import {playChase} from './playChase';

const storeActions = () => {
  let state: ChaseState = getDefaultChaseState();
  const set: ChaseStateSetter = (partial) => {
    state = {...state, ...(typeof partial === 'function' ? partial(state) : partial)};
  };
  return {actions: getChaseActions(set), current: () => state};
};

test('start, pause, resume and stop show the status main answers', async () => {
  const service = inMemoryChaseServiceFactory();
  const {actions, current} = storeActions();

  await playChase(service, actions, 'start', 'chorus');
  expect(current().chaseStatus).toMatchObject({type: 'running', chaseId: 'chorus'});
  await playChase(service, actions, 'pause', 'chorus');
  expect(current().chaseStatus).toMatchObject({type: 'paused', chaseId: 'chorus'});
  await playChase(service, actions, 'resume', 'chorus');
  expect(current().chaseStatus).toMatchObject({type: 'running', chaseId: 'chorus'});
  await playChase(service, actions, 'stop', 'chorus');
  expect(current().chaseStatus).toEqual({type: 'idle'});
});

test('Start of another chase replaces the running one', async () => {
  const service = inMemoryChaseServiceFactory();
  const {actions, current} = storeActions();

  await playChase(service, actions, 'start', 'chorus');
  await playChase(service, actions, 'start', 'laser');
  expect(current().chaseStatus).toMatchObject({type: 'running', chaseId: 'laser', stepIndex: 0, passIndex: 0});
});

test('a failing call keeps the status and shows the error until the next call works', async () => {
  const service = inMemoryChaseServiceFactory();
  const {actions, current} = storeActions();
  await playChase(service, actions, 'start', 'chorus');

  await playChase({...service, pause: () => Promise.reject(new Error('gone'))}, actions, 'pause', 'chorus');
  expect(current().chaseStatus).toMatchObject({type: 'running', chaseId: 'chorus'});
  expect(current().chaseError).toBeDefined();

  await playChase(service, actions, 'stop', 'chorus');
  expect(current().chaseError).toBeUndefined();
});

test('start and resume turn the preview on rig off, pause and stop keep it', async () => {
  const service = inMemoryChaseServiceFactory();
  const {actions, current} = storeActions();

  actions.setStepOnRig(true);
  await playChase(service, actions, 'start', 'chorus');
  expect(current().stepOnRig).toBe(false);

  actions.setStepOnRig(true);
  await playChase(service, actions, 'pause', 'chorus');
  expect(current().stepOnRig).toBe(true);
  await playChase(service, actions, 'resume', 'chorus');
  expect(current().stepOnRig).toBe(false);

  actions.setStepOnRig(true);
  await playChase(service, actions, 'stop', 'chorus');
  expect(current().stepOnRig).toBe(true);
});
