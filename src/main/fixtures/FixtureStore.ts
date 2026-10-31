import type {FixtureSetup} from '@shared/ipc';

/** Keeps the fixture setup between sessions. Implemented per storage in impl/. */
export interface FixtureStore {
  /** never rejects: no stored setup, or one that can't be read, ends in an empty setup */
  load: () => Promise<FixtureSetup>;

  /** rejects if the setup can't be written; the previously stored one stays intact */
  save: (setup: FixtureSetup) => Promise<void>;
}
