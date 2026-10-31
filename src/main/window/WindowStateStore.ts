import type {WindowState} from './windowState';

/** Keeps the main window's state between sessions. Implemented per storage in impl/. */
export interface WindowStateStore {
  /** undefined if nothing usable is stored (logged as a warning): the window then opens with the defaults. Never rejects */
  load: () => Promise<WindowState | undefined>;

  /** rejects if the state can't be written; the previously stored one stays intact. Overlapping saves run in order */
  save: (state: WindowState) => Promise<void>;
}
