import type {Fixture} from '@shared/ipc';

/** `failed` only when the main process can't be reached; a missing or invalid file loads as an empty setup */
export type FixtureSetupState =
  | {readonly type: 'loading'}
  | {readonly type: 'loaded'; readonly fixtures: readonly Fixture[]}
  | {readonly type: 'failed'; readonly message: string};

export interface FixturesState {
  fixtureSetup: FixtureSetupState;
  /** the last save or delete that failed */
  fixturesError: string | undefined;
}

export const getDefaultFixturesState = (): FixturesState => ({
  fixtureSetup: {type: 'loading'},
  fixturesError: undefined
});
