import type {FixtureSetup, ProjectOpenResult, ProjectStatus, RecentProject} from '@shared/ipc';

/** The renderer's access to the open project, in the main process, which opens, switches and writes the files. */
export default interface ProjectService {
  getStatus: () => Promise<ProjectStatus>;
  /** rejects in Show mode */
  create: () => Promise<ProjectOpenResult>;
  openWithDialog: () => Promise<ProjectOpenResult>;
  /** rejects for a path that is neither recent nor double-clicked */
  openRecent: (path: string) => Promise<ProjectOpenResult>;
  listRecent: () => Promise<readonly RecentProject[]>;
  /** rejects if the list can't be stored */
  removeRecent: (path: string) => Promise<void>;
  /** rejects if the setup is refused (Show mode, another project) or can't be written */
  saveFixtures: (projectPath: string, setup: FixtureSetup) => Promise<void>;
  /** another project was opened; returns the function that removes the listener again */
  onChanged: (listener: (status: ProjectStatus) => void) => () => void;
  /** a .glp was double-clicked while the app runs; returns the function that removes the listener again */
  onOpenRequested: (listener: (path: string) => void) => () => void;
}
