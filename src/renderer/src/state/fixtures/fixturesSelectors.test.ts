import type {Fixture} from '@shared/ipc';

import {FixturesState, getDefaultFixturesState} from './FixturesState';
import {selectFixtureOverlaps, selectFixtures} from './fixturesSelectors';

const par: Fixture = {id: 'par', name: 'PAR', startAddress: 1, channels: [{name: 'Dimmer', offset: 0}]};
const smoke: Fixture = {id: 'smoke', name: 'Smoke', startAddress: 1, channels: [{name: 'Smoke', offset: 0}]};

test('no fixtures while loading or after a failed load', () => {
  expect(selectFixtures(getDefaultFixturesState())).toEqual([]);
  expect(selectFixtures({fixtureSetup: {type: 'failed', message: {id: 'down'}}, fixturesError: undefined})).toEqual([]);
});

test('the overlaps of the loaded fixtures', () => {
  const state: FixturesState = {fixtureSetup: {type: 'loaded', fixtures: [par, smoke]}, fixturesError: undefined};

  expect(selectFixtures(state)).toEqual([par, smoke]);
  expect(selectFixtureOverlaps(state)).toEqual([{first: par, second: smoke, addresses: [1]}]);
});
