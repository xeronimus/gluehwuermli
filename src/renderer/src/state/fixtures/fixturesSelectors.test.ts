import {fixtureSetupOf} from '@shared/fixtures';
import type {Chase, Fixture} from '@shared/ipc';

import {FixturesState, getDefaultFixturesState} from './FixturesState';
import {selectChases, selectFixtureOverlaps, selectFixtures, selectOpenProject, selectSetup} from './fixturesSelectors';

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
  expect(selectChases(failed)).toEqual([]);
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

test('the chases of the open project, none in a setup from before chases', () => {
  const chorus: Chase = {
    id: 'chorus',
    name: 'Chorus flash',
    repeat: {type: 'once'},
    steps: [{id: 'one', holdMs: 500, values: [{channel: 1, value: 255}]}]
  };
  const stateOf = (chases?: Chase[]): FixturesState => ({
    ...getDefaultFixturesState(),
    project: {type: 'open', project: {path: 'D:\\Waldfest.glp', setup: {...fixtureSetupOf([par]), chases}}}
  });

  expect(selectChases(stateOf([chorus]))).toEqual([chorus]);
  expect(selectChases(stateOf())).toEqual([]);
});
