import {type JsonFileContent, atomicJsonWriter, readJsonFile} from '@/storage/jsonFile';
import type {WindowStateStore} from '@/window/WindowStateStore';
import {type WindowState, parseWindowState} from '@/window/windowState';

export interface WindowStateStoreLog {
  warn: (...message: unknown[]) => void;
}

export interface FileWindowStateStoreDependencies {
  /** the JSON file, e.g. window-state.json in Electron's userData folder */
  filePath: string;
  log: WindowStateStoreLog;
}

/**
 * The window state as a JSON file, written atomically. Unlike the fixture file, an unreadable one isn't kept: the next
 * save just replaces it.
 */
export function fileWindowStateStoreFactory({filePath, log}: FileWindowStateStoreDependencies): WindowStateStore {
  const save = atomicJsonWriter(filePath);

  async function load(): Promise<WindowState | undefined> {
    let file: JsonFileContent;
    try {
      file = await readJsonFile(filePath);
    } catch (error) {
      log.warn(`reading the window state file ${filePath} failed, opening the window with the defaults`, error);
      return undefined;
    }
    if (file.type === 'missing') {
      log.warn(`no window state file at ${filePath} yet, opening the window with the defaults`);
      return undefined;
    }

    const state = parseWindowState(file.content);
    if (!state) {
      log.warn(`the window state file ${filePath} is not a valid window state, opening the window with the defaults`);
    }
    return state;
  }

  return {load, save};
}
