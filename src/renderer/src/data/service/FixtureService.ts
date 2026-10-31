import type {FixtureSetup} from '@shared/ipc';

/** The renderer's access to the stored fixture setup, in the main process. */
export default interface FixtureService {
  /** an empty setup when nothing valid is stored yet */
  load: () => Promise<FixtureSetup>;
  /** rejects if the setup is refused or can't be written */
  save: (setup: FixtureSetup) => Promise<void>;
}
