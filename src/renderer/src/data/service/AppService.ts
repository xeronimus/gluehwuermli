import type {DataFolder, OpenDataFolderResult} from '@shared/ipc';

/** The renderer's access to the app itself, in the main process: where it keeps its files. */
export default interface AppService {
  getDataFolder: () => Promise<DataFolder>;
  /** a folder that can't be opened is a `failed` result, not a rejection */
  openDataFolder: () => Promise<OpenDataFolderResult>;
}
