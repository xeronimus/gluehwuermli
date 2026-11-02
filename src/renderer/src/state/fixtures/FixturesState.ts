import type {MessageDescriptor} from '@lingui/core';

import type {Fixture} from '@shared/ipc';

/**
 * `failed` when the stored setup can't be read (e.g. a file locked by another program) or the main process can't be
 * reached; a missing or invalid file loads as an empty setup
 */
export type FixtureSetupState =
  | {readonly type: 'loading'}
  | {readonly type: 'loaded'; readonly fixtures: readonly Fixture[]}
  | {readonly type: 'failed'; readonly message: MessageDescriptor};

export interface FixturesState {
  fixtureSetup: FixtureSetupState;
  /** the last save or delete that failed */
  fixturesError: MessageDescriptor | undefined;
}

export const getDefaultFixturesState = (): FixturesState => ({
  fixtureSetup: {type: 'loading'},
  fixturesError: undefined
});
