import {readFile, rename, writeFile} from 'node:fs/promises';

import {createSerialQueue} from '@shared/serialQueue';

const JSON_INDENT = 2;

/** `content` is undefined if the file holds no JSON at all, which the store's parse guard then rejects */
export type JsonFileContent = {type: 'missing'} | {type: 'read'; content: unknown};

const isMissingFile = (error: unknown) => error instanceof Error && 'code' in error && error.code === 'ENOENT';

function parseJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    return undefined;
  }
}

/** rejects if the file exists but can't be read; what an invalid content means is up to each store */
export async function readJsonFile(filePath: string): Promise<JsonFileContent> {
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch (error) {
    if (isMissingFile(error)) {
      return {type: 'missing'};
    }
    throw error;
  }
  return {type: 'read', content: parseJson(content)};
}

/**
 * Writes to a temporary file first and renames it, so a crash never leaves half a file. Overlapping writes run one
 * after the other, they would share the temporary file.
 */
export function atomicJsonWriter(filePath: string): (value: unknown) => Promise<void> {
  const runSerially = createSerialQueue();
  const temporaryFilePath = `${filePath}.tmp`;

  return (value) =>
    runSerially(async () => {
      await writeFile(temporaryFilePath, JSON.stringify(value, undefined, JSON_INDENT), 'utf-8');
      await rename(temporaryFilePath, filePath);
    });
}
