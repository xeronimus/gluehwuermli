import type {BlackoutOnQuit, ChosenLocale, DataFolder, Locale, OpenDataFolderResult} from '@shared/ipc';

/**
 * The renderer's access to the app itself, in the main process: where it keeps its files, the chosen language, what
 * happens to the rig on quit.
 */
export default interface AppService {
  getDataFolder: () => Promise<DataFolder>;
  /** a folder that can't be opened is a `failed` result, refused in Show mode; not a rejection */
  openDataFolder: () => Promise<OpenDataFolderResult>;
  getLocale: () => Promise<ChosenLocale>;
  /** remembers the language for the next start; rejects if it can't be stored */
  setLocale: (locale: Locale) => Promise<void>;
  getBlackoutOnQuit: () => Promise<BlackoutOnQuit>;
  /** Setup mode only: rejects in Show mode, or if it can't be stored */
  setBlackoutOnQuit: (enabled: boolean) => Promise<void>;
}
