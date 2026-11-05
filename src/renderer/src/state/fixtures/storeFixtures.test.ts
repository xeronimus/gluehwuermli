import type {MessageDescriptor} from '@lingui/core';
import {combine} from 'zustand/middleware';
import {createStore} from 'zustand/vanilla';

import {fixtureSetupOf} from '@shared/fixtures';
import type {Fixture, FixtureSetup} from '@shared/ipc';
import {createSerialQueue} from '@shared/serialQueue';

import type ProjectService from '@/data/service/ProjectService';
import {
  IN_MEMORY_PROJECT_PATH,
  inMemoryProjectServiceFactory
} from '@/data/service/impl/inMemory/inMemoryProjectServiceFactory';

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
  (setup: FixtureSetup): FixtureSetup => ({...setup, fixtures: [...setup.fixtures, fixture]});

type SaveFixtures = Pick<ProjectService, 'saveFixtures'>;

const failingProjectService: SaveFixtures = {
  saveFixtures: async () => {
    throw new Error('disk full');
  }
};

const openProjectOf = (setup: FixtureSetup) => ({
  type: 'open' as const,
  project: {path: IN_MEMORY_PROJECT_PATH, setup}
});

const projectServiceWithPar = () => inMemoryProjectServiceFactory(openProjectOf(fixtureSetupOf([par])));

const savedSetupOf = async (projectService: ProjectService) => {
  const status = await projectService.getStatus();
  return status.type === 'open' ? status.project.setup : undefined;
};

const storeWithFixtures = (fixtures: readonly Fixture[]) => {
  const initialState: FixturesState = {
    ...getDefaultFixturesState(),
    project: openProjectOf(fixtureSetupOf(fixtures))
  };
  return createStore(combine(initialState, (set) => getFixturesActions(set)));
};

const setUp = (projectService: SaveFixtures, log = silentLog) => {
  const store = storeWithFixtures([par]);
  const storeFixtures: StoreFixtures = storeFixturesWith({
    getState: store.getState,
    projectService,
    runSerially: createSerialQueue(),
    log
  });
  return {store, storeFixtures};
};

test('a stored change is shown and clears an earlier error', async () => {
  const projectService = projectServiceWithPar();
  const {store, storeFixtures} = setUp(projectService);
  store.getState().setFixturesError(failure('an earlier failure'));

  expect(await storeFixtures(append(smoke), 'saving', failure('Could not save'))).toBe(true);

  expect(store.getState().project).toEqual(openProjectOf(fixtureSetupOf([par, smoke])));
  expect(store.getState().fixturesError).toBeUndefined();
  expect(await savedSetupOf(projectService)).toEqual(fixtureSetupOf([par, smoke]));
});

test('a failed save leaves the shown setup unchanged and sets the error', async () => {
  const {store, storeFixtures} = setUp(failingProjectService);

  expect(await storeFixtures(append(smoke), 'saving', failure('Could not save the fixture Smoke'))).toBe(false);

  expect(store.getState().project).toEqual(openProjectOf(fixtureSetupOf([par])));
  expect(store.getState().fixturesError).toEqual(failure('Could not save the fixture Smoke'));
});

test('a failed save is logged by its action, not by the shown message (a production build keeps only its id)', async () => {
  const logged: unknown[][] = [];
  const {storeFixtures} = setUp(failingProjectService, {error: (...message) => logged.push(message)});

  await storeFixtures(append(smoke), 'saving the fixture Smoke', {id: 'x7aFd2'});

  expect(logged).toEqual([['saving the fixture Smoke failed', new Error('disk full')]]);
});

test('the store is only updated once the save resolved', async () => {
  let resolveSave: (() => void) | undefined;
  const slowProjectService: SaveFixtures = {
    saveFixtures: () =>
      new Promise<void>((resolve) => {
        resolveSave = resolve;
      })
  };
  const {store, storeFixtures} = setUp(slowProjectService);

  const storing = storeFixtures(append(smoke), 'saving', failure('Could not save'));
  await vi.waitFor(() => expect(resolveSave).toBeDefined());
  expect(store.getState().project).toEqual(openProjectOf(fixtureSetupOf([par])));

  resolveSave?.();
  await storing;
  expect(store.getState().project).toEqual(openProjectOf(fixtureSetupOf([par, smoke])));
});

test('overlapping changes are all stored', async () => {
  const saved: FixtureSetup[] = [];
  const recordingProjectService: SaveFixtures = {
    saveFixtures: async (_projectPath, setup) => {
      saved.push(setup);
    }
  };
  const {store, storeFixtures} = setUp(recordingProjectService);
  const fog: Fixture = {id: 'fog', name: 'Fog', startAddress: 3, channels: [{name: 'Fog', offset: 0}]};

  await Promise.all([
    storeFixtures(append(smoke), 'saving', failure('Could not save')),
    storeFixtures(append(fog), 'saving', failure('Could not save'))
  ]);

  expect(store.getState().project).toEqual(openProjectOf(fixtureSetupOf([par, smoke, fog])));
  expect(saved.at(-1)).toEqual(fixtureSetupOf([par, smoke, fog]));
});

test('a change keeps what else the setup holds, e.g. its scenes', async () => {
  const projectService = projectServiceWithPar();
  const scenes = [{id: 'intro', name: 'Intro', fixtures: [{fixtureId: 'par', values: [{offset: 0, value: 255}]}]}];
  const initialState: FixturesState = {
    ...getDefaultFixturesState(),
    project: openProjectOf({...fixtureSetupOf([par]), scenes})
  };
  const store = createStore(combine(initialState, (set) => getFixturesActions(set)));
  const storeFixtures = storeFixturesWith({
    getState: store.getState,
    projectService,
    runSerially: createSerialQueue(),
    log: silentLog
  });

  await storeFixtures(append(smoke), 'saving', failure('Could not save'));

  expect(await savedSetupOf(projectService)).toEqual({...fixtureSetupOf([par, smoke]), scenes});
});

test('without an open project nothing is saved, the error is shown', async () => {
  const saved: FixtureSetup[] = [];
  const store = createStore(combine(getDefaultFixturesState(), (set) => getFixturesActions(set)));
  const storeFixtures = storeFixturesWith({
    getState: store.getState,
    projectService: {
      saveFixtures: async (_projectPath, setup) => {
        saved.push(setup);
      }
    },
    runSerially: createSerialQueue(),
    log: silentLog
  });

  expect(await storeFixtures(append(smoke), 'saving', failure('Could not save'))).toBe(false);
  expect(saved).toEqual([]);
  expect(store.getState().fixturesError).toEqual(failure('Could not save'));
});

test('the setup is saved to the project it belongs to', async () => {
  const paths: string[] = [];
  const {storeFixtures} = setUp({
    saveFixtures: async (projectPath) => {
      paths.push(projectPath);
    }
  });

  await storeFixtures(append(smoke), 'saving', failure('Could not save'));

  expect(paths).toEqual([IN_MEMORY_PROJECT_PATH]);
});
