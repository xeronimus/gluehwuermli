import type {SettingsStore} from '@/settings/SettingsStore';
import {type Settings, parseSettings} from '@/settings/settings';
import {type JsonFileContent, atomicJsonWriter, readJsonFile} from '@/storage/jsonFile';

export interface SettingsStoreLog {
  warn: (...message: unknown[]) => void;
}

export interface FileSettingsStoreDependencies {
  /** the JSON file, e.g. settings.json in Electron's userData folder */
  filePath: string;
  log: SettingsStoreLog;
}

/**
 * The settings as a JSON file, written atomically. An unreadable one isn't kept: it only holds the password hash and the
 * last port, and deleting the file is how a forgotten password is reset.
 */
export function fileSettingsStoreFactory({filePath, log}: FileSettingsStoreDependencies): SettingsStore {
  const save = atomicJsonWriter(filePath);

  async function load(): Promise<Settings | undefined> {
    let file: JsonFileContent;
    try {
      file = await readJsonFile(filePath);
    } catch (error) {
      log.warn(`reading the settings file ${filePath} failed, starting without a password`, error);
      return undefined;
    }
    if (file.type === 'missing') {
      log.warn(`no settings file at ${filePath} yet, starting without a password`);
      return undefined;
    }

    const settings = parseSettings(file.content);
    if (!settings) {
      log.warn(`the settings file ${filePath} is not valid, starting without a password`);
    }
    return settings;
  }

  return {load, save};
}
