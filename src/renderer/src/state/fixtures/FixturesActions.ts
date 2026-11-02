import type {MessageDescriptor} from '@lingui/core';

import {FixtureSetupState, FixturesState} from './FixturesState';

export type FixturesStateSetter = (
  partial: FixturesState | Partial<FixturesState> | ((state: FixturesState) => FixturesState | Partial<FixturesState>),
  replace?: false,
  action?: string
) => void;

export interface FixturesActions {
  setFixtureSetup: (fixtureSetup: FixtureSetupState) => void;
  setFixturesError: (fixturesError: MessageDescriptor | undefined) => void;
}

export const getFixturesActions = (set: FixturesStateSetter): FixturesActions => ({
  setFixtureSetup: (fixtureSetup) => set({fixtureSetup}, undefined, 'fixtures/setFixtureSetup'),
  setFixturesError: (fixturesError) => set({fixturesError}, undefined, 'fixtures/setFixturesError')
});
