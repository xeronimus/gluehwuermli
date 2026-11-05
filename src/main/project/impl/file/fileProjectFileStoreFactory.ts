import {parseProjectFile} from '@shared/projects';

import type {ProjectFileStore} from '@/project/ProjectFileStore';
import {atomicJsonWriter, readJsonFile} from '@/storage/jsonFile';

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/** project files as JSON, written atomically next to the file (a temporary file in the same folder, then renamed) */
export function fileProjectFileStoreFactory(): ProjectFileStore {
  // one writer per file: its queue keeps overlapping writes to that file in order
  const writers = new Map<string, (value: unknown) => Promise<void>>();

  const writerFor = (path: string) => {
    const existing = writers.get(path);
    if (existing) {
      return existing;
    }
    const writer = atomicJsonWriter(path);
    writers.set(path, writer);
    return writer;
  };

  return {
    read: async (path) => {
      try {
        const file = await readJsonFile(path);
        if (file.type === 'missing') {
          return {type: 'failed', error: {reason: 'missing'}};
        }
        const content = parseProjectFile(file.content);
        return content.type === 'valid' ? {type: 'read', setup: content.setup} : {type: 'failed', error: content.error};
      } catch (error) {
        return {type: 'failed', error: {reason: 'unreadable', message: messageOf(error)}};
      }
    },
    write: (path, setup) => writerFor(path)(setup)
  };
}
