import {createSelector} from 'reselect';

import {emptyFixtureSetup, overlappingFixtures} from '@shared/fixtures';
import type {Fixture, FixtureSetup, Scene} from '@shared/ipc';
import {setupScenes} from '@shared/scenes';

import {FixturesState} from './FixturesState';

const NO_SETUP: FixtureSetup = emptyFixtureSetup();

/** the loaded setup; an empty one while loading or after a failed load */
export const selectSetup = (state: FixturesState): FixtureSetup =>
  state.fixtureSetup.type === 'loaded' ? state.fixtureSetup.setup : NO_SETUP;

/** the loaded fixtures; none while loading or after a failed load */
export const selectFixtures = (state: FixturesState): readonly Fixture[] => selectSetup(state).fixtures;

/** the loaded scenes; none while loading, after a failed load or in a setup from before scenes */
export const selectScenes = (state: FixturesState): readonly Scene[] => setupScenes(selectSetup(state));

export const selectFixtureOverlaps = createSelector([selectFixtures], (fixtures) => overlappingFixtures(fixtures));
