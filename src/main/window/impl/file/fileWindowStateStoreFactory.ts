import {readFile, rename, writeFile} from 'node:fs/promises';

import {createSerialQueue} from '@shared/serialQueue';

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

const JSON_INDENT = 2;

const isMissingFile = (error: unknown) => error instanceof Error && 'code' in error && error.code === 'ENOENT';

/** undefined if the content is no JSON at all, which parseWindowState then rejects like any other invalid content */
function parseJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    return undefined;
  }
}

/**
 * The window state as a JSON file; written to a temporary file first and renamed, so a crash never leaves half a file.
 * Unlike the fixture file, an unreadable one isn't kept: the next save just replaces it.
 */
export function fileWindowStateStoreFactory({filePath, log}: FileWindowStateStoreDependencies): WindowStateStore {
  // overlapping saves would share the temporary file
  const runSerially = createSerialQueue();

  async function load(): Promise<WindowState | undefined> {
    let content: string;
    try {
      content = await readFile(filePath, 'utf-8');
    } catch (error) {
      if (isMissingFile(error)) {
        log.warn(`no window state file at ${filePath} yet, opening the window with the defaults`);
      } else {
        log.warn(`reading the window state file ${filePath} failed, opening the window with the defaults`, error);
      }
      return undefined;
    }

    const state = parseWindowState(parseJson(content));
    if (!state) {
      log.warn(`the window state file ${filePath} is not a valid window state, opening the window with the defaults`);
    }
    return state;
  }

  const save = (state: WindowState): Promise<void> =>
    runSerially(async () => {
      const temporaryFilePath = `${filePath}.tmp`;
      await writeFile(temporaryFilePath, JSON.stringify(state, undefined, JSON_INDENT), 'utf-8');
      await rename(temporaryFilePath, filePath);
    });

  return {load, save};
}
