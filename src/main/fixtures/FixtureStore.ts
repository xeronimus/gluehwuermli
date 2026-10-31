import type {FixtureSetup} from '@shared/ipc';

/** Keeps the fixture setup between sessions. Implemented per storage in impl/. */
export interface FixtureStore {
  /**
   * No stored setup, or an invalid one that was set aside, ends in an empty setup. Rejects if the stored setup can't
   * be read or set aside, so the next save can't overwrite it.
   */
  load: () => Promise<FixtureSetup>;

  /** rejects if the setup can't be written; the previously stored one stays intact. Overlapping saves run in order */
  save: (setup: FixtureSetup) => Promise<void>;
}
