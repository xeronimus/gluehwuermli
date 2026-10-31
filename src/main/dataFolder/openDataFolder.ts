import type {OpenDataFolderResult} from '@shared/ipc';

/** Electron's shell.openPath: resolves with an error message, or an empty string once the folder is open */
export type OpenPath = (path: string) => Promise<string>;

export interface OpenDataFolderLog {
  warn: (...message: unknown[]) => void;
}

/** opens the folder in the file explorer; a failure is a value for the renderer to show, never a rejection */
export async function openDataFolder(
  openPath: OpenPath,
  folder: string,
  log: OpenDataFolderLog
): Promise<OpenDataFolderResult> {
  try {
    const errorMessage = await openPath(folder);
    if (!errorMessage) {
      return {type: 'opened'};
    }
    log.warn(`opening ${folder} failed:`, errorMessage);
    return {type: 'failed', message: errorMessage};
  } catch (error) {
    log.warn(`opening ${folder} failed`, error);
    return {type: 'failed', message: error instanceof Error ? error.message : String(error)};
  }
}
