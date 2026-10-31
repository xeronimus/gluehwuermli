import {readFile, rename, writeFile} from 'node:fs/promises';

import {emptyFixtureSetup, parseFixtureSetup} from '@shared/fixtures';
import type {FixtureSetup} from '@shared/ipc';
import {createSerialQueue} from '@shared/serialQueue';

import type {FixtureStore} from '@/fixtures/FixtureStore';

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

const JSON_INDENT = 2;

const isMissingFile = (error: unknown) => error instanceof Error && 'code' in error && error.code === 'ENOENT';

/** undefined if the content is no JSON at all, which parseFixtureSetup then rejects like any other invalid content */
function parseJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    return undefined;
  }
}

/** fixtures.json -> fixtures.invalid-2026-10-31T07-52-16-000Z.json */
const invalidFilePathOf = (filePath: string, moment: Date) =>
  filePath.replace(/(\.json)?$/, `.invalid-${moment.toISOString().replace(/[:.]/g, '-')}.json`);

/** the setup as a JSON file; written to a temporary file first and renamed, so a crash never leaves half a file */
export function fileFixtureStoreFactory({
  filePath,
  log,
  now = () => new Date()
}: FileFixtureStoreDependencies): FixtureStore {
  // overlapping saves would share the temporary file
  const runSerially = createSerialQueue();

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
    let content: string;
    try {
      content = await readFile(filePath, 'utf-8');
    } catch (error) {
      if (!isMissingFile(error)) {
        throw new Error(`reading the fixture file ${filePath} failed`, {cause: error});
      }
      log.warn(`no fixture file at ${filePath} yet, starting with no fixtures`);
      return emptyFixtureSetup();
    }

    const setup = parseFixtureSetup(parseJson(content));
    if (!setup) {
      await setAsideInvalidFile(`the fixture file ${filePath} is not a valid fixture setup`);
      return emptyFixtureSetup();
    }
    return setup;
  }

  const save = (setup: FixtureSetup): Promise<void> =>
    runSerially(async () => {
      const temporaryFilePath = `${filePath}.tmp`;
      await writeFile(temporaryFilePath, JSON.stringify(setup, undefined, JSON_INDENT), 'utf-8');
      await rename(temporaryFilePath, filePath);
    });

  return {load, save};
}
