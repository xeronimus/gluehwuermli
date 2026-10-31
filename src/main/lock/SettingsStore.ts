import type {Settings} from './settings';

/** Keeps the app's settings between sessions. Implemented per storage in impl/. */
export interface SettingsStore {
  /** undefined if nothing usable is stored (logged as a warning): the app then has no password yet. Never rejects */
  load: () => Promise<Settings | undefined>;

  /** rejects if the settings can't be written; the previously stored ones stay intact. Overlapping saves run in order */
  save: (settings: Settings) => Promise<void>;
}
