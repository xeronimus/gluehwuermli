import type {FixtureSetup, ProjectError} from '@shared/ipc';

export type ProjectFileRead = {type: 'read'; setup: FixtureSetup} | {type: 'failed'; error: ProjectError};

/** Reads and writes project files (.glp) wherever the user keeps them. Implemented per storage in impl/. */
export interface ProjectFileStore {
  /**
   * never rejects: a missing, unreadable, invalid or too new file is a `failed` read. The file is never changed,
   * renamed or moved, whatever is wrong with it: it is the user's
   */
  read: (path: string) => Promise<ProjectFileRead>;

  /** rejects if the file can't be written; the one there before stays intact. Overlapping writes run in order */
  write: (path: string, setup: FixtureSetup) => Promise<void>;
}
