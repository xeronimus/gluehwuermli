import {fixtureSetupOf} from '@shared/fixtures';
import type {Fixture} from '@shared/ipc';

import {FixturesState, getDefaultFixturesState} from './FixturesState';
import {selectFixtureOverlaps, selectFixtures, selectOpenProject, selectSetup} from './fixturesSelectors';

const par: Fixture = {id: 'par', name: 'PAR', startAddress: 1, channels: [{name: 'Dimmer', offset: 0}]};
const smoke: Fixture = {id: 'smoke', name: 'Smoke', startAddress: 1, channels: [{name: 'Smoke', offset: 0}]};

test('an empty setup and no fixtures without an open project', () => {
  const failed: FixturesState = {
    ...getDefaultFixturesState(),
    project: {type: 'failed', path: 'D:\\Gone.glp', error: {reason: 'missing'}}
  };

  expect(selectSetup(getDefaultFixturesState())).toEqual(fixtureSetupOf([]));
  expect(selectFixtures(getDefaultFixturesState())).toEqual([]);
  expect(selectFixtures(failed)).toEqual([]);
  expect(selectOpenProject(failed)).toBeUndefined();
});

test('the overlaps of the open project', () => {
  const state: FixturesState = {
    ...getDefaultFixturesState(),
    project: {type: 'open', project: {path: 'D:\\Waldfest.glp', setup: fixtureSetupOf([par, smoke])}}
  };

  expect(selectOpenProject(state)?.path).toBe('D:\\Waldfest.glp');
  expect(selectFixtures(state)).toEqual([par, smoke]);
  expect(selectFixtureOverlaps(state)).toEqual([{first: par, second: smoke, addresses: [1]}]);
});
