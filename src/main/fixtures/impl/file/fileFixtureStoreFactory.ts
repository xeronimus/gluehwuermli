import {rename} from 'node:fs/promises';

import {emptyFixtureSetup, parseFixtureSetup} from '@shared/fixtures';
import type {FixtureSetup} from '@shared/ipc';

import type {FixtureStore} from '@/fixtures/FixtureStore';
import {atomicJsonWriter, readJsonFile} from '@/storage/jsonFile';

export interface FixtureStoreLog {
  warn: (...message: unknown[]) => void;
}

export interface FileFixtureStoreDependencies {
  /** the JSON file, e.g. fixtures.json in Electron's userData folder */
  filePath: string;
  log: FixtureStoreLog;
  /** the moment an invalid file is set aside, part of its new name */
  now?: () => Date;
}

/** fixtures.json -> fixtures.invalid-2026-10-31T07-52-16-000Z.json */
const invalidFilePathOf = (filePath: string, moment: Date) =>
  filePath.replace(/(\.json)?$/, `.invalid-${moment.toISOString().replace(/[:.]/g, '-')}.json`);

/** the setup as a JSON file, written atomically */
export function fileFixtureStoreFactory({
  filePath,
  log,
  now = () => new Date()
}: FileFixtureStoreDependencies): FixtureStore {
  const save = atomicJsonWriter(filePath);

  /**
   * Keeps an unreadable file for the user to repair instead of overwriting it with the next save. Rejects if it
   * can't be moved: starting empty would let the next save overwrite it.
   */
  async function setAsideInvalidFile(reason: string) {
    const invalidFilePath = invalidFilePathOf(filePath, now());
    try {
      await rename(filePath, invalidFilePath);
    } catch (error) {
      throw new Error(`${reason}, and moving it aside failed`, {cause: error});
    }
    log.warn(`${reason}: starting with no fixtures, the file was moved to ${invalidFilePath}`);
  }

  async function load(): Promise<FixtureSetup> {
    const file = await readJsonFile(filePath).catch((error: unknown) => {
      throw new Error(`reading the fixture file ${filePath} failed`, {cause: error});
    });
    if (file.type === 'missing') {
      log.warn(`no fixture file at ${filePath} yet, starting with no fixtures`);
      return emptyFixtureSetup();
    }

    const setup = parseFixtureSetup(file.content);
    if (!setup) {
      await setAsideInvalidFile(`the fixture file ${filePath} is not a valid fixture setup`);
      return emptyFixtureSetup();
    }
    return setup;
  }

  return {load, save};
}
