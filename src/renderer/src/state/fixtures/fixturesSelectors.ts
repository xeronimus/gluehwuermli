import {createSelector} from 'reselect';

import {overlappingFixtures} from '@shared/fixtures';
import type {Fixture} from '@shared/ipc';

import {FixturesState} from './FixturesState';

const NO_FIXTURES: readonly Fixture[] = [];

/** the loaded fixtures; none while loading or after a failed load */
export const selectFixtures = (state: FixturesState): readonly Fixture[] =>
  state.fixtureSetup.type === 'loaded' ? state.fixtureSetup.fixtures : NO_FIXTURES;

export const selectFixtureOverlaps = createSelector([selectFixtures], (fixtures) => overlappingFixtures(fixtures));
