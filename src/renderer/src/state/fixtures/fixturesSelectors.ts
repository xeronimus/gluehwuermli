import {createSelector} from 'reselect';

import {setupChases} from '@shared/chases';
import {emptyFixtureSetup, overlappingFixtures} from '@shared/fixtures';
import type {Chase, Fixture, FixtureSetup, OpenProject, Scene} from '@shared/ipc';
import {setupScenes} from '@shared/scenes';

import {FixturesState} from './FixturesState';

const NO_SETUP: FixtureSetup = emptyFixtureSetup();

/** the open project; none while loading, before the first one or when it couldn't be opened */
export const selectOpenProject = (state: FixturesState): OpenProject | undefined =>
  state.project.type === 'open' ? state.project.project : undefined;

/** the open project's setup; an empty one without an open project */
export const selectSetup = (state: FixturesState): FixtureSetup => selectOpenProject(state)?.setup ?? NO_SETUP;

/** the open project's fixtures; none without an open project */
export const selectFixtures = (state: FixturesState): readonly Fixture[] => selectSetup(state).fixtures;

/** the open project's scenes; none without an open project or in a setup from before scenes */
export const selectScenes = (state: FixturesState): readonly Scene[] => setupScenes(selectSetup(state));

/** the open project's chases, in their saved order; none without an open project or in a setup from before chases */
export const selectChases = (state: FixturesState): readonly Chase[] => setupChases(selectSetup(state));

export const selectFixtureOverlaps = createSelector([selectFixtures], (fixtures) => overlappingFixtures(fixtures));
