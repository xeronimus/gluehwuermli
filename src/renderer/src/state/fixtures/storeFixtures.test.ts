import type {MessageDescriptor} from '@lingui/core';
import {combine} from 'zustand/middleware';
import {createStore} from 'zustand/vanilla';

import {fixtureSetupOf} from '@shared/fixtures';
import type {Fixture, FixtureSetup} from '@shared/ipc';
import {createSerialQueue} from '@shared/serialQueue';

import type FixtureService from '@/data/service/FixtureService';
import {inMemoryFixtureServiceFactory} from '@/data/service/impl/inMemory/inMemoryFixtureServiceFactory';

import {getFixturesActions} from './FixturesActions';
import {FixturesState, getDefaultFixturesState} from './FixturesState';
import {StoreFixtures, storeFixturesWith} from './storeFixtures';

const par: Fixture = {id: 'par', name: 'PAR', startAddress: 1, channels: [{name: 'Dimmer', offset: 0}]};
const smoke: Fixture = {id: 'smoke', name: 'Smoke', startAddress: 2, channels: [{name: 'Smoke', offset: 0}]};

const silentLog = {error: () => {}};
/** a message as the action hooks pass it, without the macro */
const failure = (message: string): MessageDescriptor => ({id: message, message});
const append =
  (fixture: Fixture) =>
  (fixtures: readonly Fixture[]): Fixture[] => [...fixtures, fixture];

const failingFixtureService: FixtureService = {
  load: async () => fixtureSetupOf([]),
  save: async () => {
    throw new Error('disk full');
  }
};

const storeWithFixtures = (fixtures: readonly Fixture[]) => {
  const initialState: FixturesState = {...getDefaultFixturesState(), fixtureSetup: {type: 'loaded', fixtures}};
  return createStore(combine(initialState, (set) => getFixturesActions(set)));
};

const setUp = (fixtureService: FixtureService) => {
  const store = storeWithFixtures([par]);
  const storeFixtures: StoreFixtures = storeFixturesWith({
    getState: store.getState,
    fixtureService,
    runSerially: createSerialQueue(),
    log: silentLog
  });
  return {store, storeFixtures};
};

test('a stored change is shown and clears an earlier error', async () => {
  const fixtureService = inMemoryFixtureServiceFactory();
  const {store, storeFixtures} = setUp(fixtureService);
  store.getState().setFixturesError(failure('an earlier failure'));

  expect(await storeFixtures(append(smoke), failure('Could not save'))).toBe(true);

  expect(store.getState().fixtureSetup).toEqual({type: 'loaded', fixtures: [par, smoke]});
  expect(store.getState().fixturesError).toBeUndefined();
  expect(await fixtureService.load()).toEqual(fixtureSetupOf([par, smoke]));
});

test('a failed save leaves the shown setup unchanged and sets the error', async () => {
  const {store, storeFixtures} = setUp(failingFixtureService);

  expect(await storeFixtures(append(smoke), failure('Could not save the fixture Smoke'))).toBe(false);

  expect(store.getState().fixtureSetup).toEqual({type: 'loaded', fixtures: [par]});
  expect(store.getState().fixturesError).toEqual(failure('Could not save the fixture Smoke'));
});

test('the store is only updated once the save resolved', async () => {
  let resolveSave: (() => void) | undefined;
  const slowFixtureService: FixtureService = {
    load: async () => fixtureSetupOf([]),
    save: () =>
      new Promise<void>((resolve) => {
        resolveSave = resolve;
      })
  };
  const {store, storeFixtures} = setUp(slowFixtureService);

  const storing = storeFixtures(append(smoke), failure('Could not save'));
  await vi.waitFor(() => expect(resolveSave).toBeDefined());
  expect(store.getState().fixtureSetup).toEqual({type: 'loaded', fixtures: [par]});

  resolveSave?.();
  await storing;
  expect(store.getState().fixtureSetup).toEqual({type: 'loaded', fixtures: [par, smoke]});
});

test('overlapping changes are all stored', async () => {
  const saved: FixtureSetup[] = [];
  const recordingFixtureService: FixtureService = {
    load: async () => fixtureSetupOf([]),
    save: async (setup) => {
      saved.push(setup);
    }
  };
  const {store, storeFixtures} = setUp(recordingFixtureService);
  const fog: Fixture = {id: 'fog', name: 'Fog', startAddress: 3, channels: [{name: 'Fog', offset: 0}]};

  await Promise.all([
    storeFixtures(append(smoke), failure('Could not save')),
    storeFixtures(append(fog), failure('Could not save'))
  ]);

  expect(store.getState().fixtureSetup).toEqual({type: 'loaded', fixtures: [par, smoke, fog]});
  expect(saved.at(-1)).toEqual(fixtureSetupOf([par, smoke, fog]));
});
