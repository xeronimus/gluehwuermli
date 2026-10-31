import {type ChannelLimits, emptyFixtureSetup, fixtureSetupOf} from '@shared/fixtures';
import type {Fixture, FixtureSetup} from '@shared/ipc';

import type {FixtureStore} from '@/fixtures/FixtureStore';

import {type FixtureIpcHandlers, fixtureIpcHandlers} from './fixtureIpcHandlers';

const laserBox: Fixture = {
  id: 'box',
  name: 'LightBox',
  startAddress: 20,
  channels: [
    {name: 'Dimmer', offset: 0},
    {name: 'Laser', offset: 1, lock: {max: 0}}
  ]
};

let stored: FixtureSetup;
let limits: ChannelLimits[];
let setupMode: boolean;
let handlers: FixtureIpcHandlers;

const store: FixtureStore = {
  load: async () => stored,
  save: async (setup) => {
    stored = setup;
  }
};

beforeEach(() => {
  stored = emptyFixtureSetup();
  limits = [];
  setupMode = false;
  handlers = fixtureIpcHandlers({
    store,
    engine: {setChannelLimits: (next) => limits.push(next)},
    isSetupMode: () => setupMode
  });
});

test('loading hands the stored setup to the renderer and its locks to the engine', async () => {
  stored = fixtureSetupOf([laserBox]);

  expect(await handlers.load()).toEqual(stored);
  expect(limits).toEqual([new Map([[21, 0]])]);
});

test('saving is refused in Show mode, nothing is stored', async () => {
  await expect(handlers.save(fixtureSetupOf([laserBox]))).rejects.toThrow('only be changed in Setup mode');

  expect(stored).toEqual(emptyFixtureSetup());
  expect(limits).toEqual([]);
});

test('saving in Setup mode stores the setup, then updates the limits', async () => {
  setupMode = true;

  await handlers.save(fixtureSetupOf([laserBox]));

  expect(stored).toEqual(fixtureSetupOf([laserBox]));
  expect(limits).toEqual([new Map([[21, 0]])]);
});

test('an invalid setup is refused in Setup mode, too', async () => {
  setupMode = true;

  await expect(handlers.save({version: 1, fixtures: [{...laserBox, startAddress: 0}]})).rejects.toThrow(
    'invalid fixture setup'
  );
  expect(limits).toEqual([]);
});
