import type {MessageDescriptor} from '@lingui/core';

import type {OpenProject, ProjectError, RecentProject} from '@shared/ipc';

/** a project file that couldn't be opened or created, or a call to the main process that failed */
export type ProjectFailure =
  | {readonly type: 'file'; readonly path: string; readonly error: ProjectError}
  | {readonly type: 'call'; readonly message: MessageDescriptor};

/**
 * The main process's project status, mirrored: `none` before the first project, `failed` when the last one couldn't
 * be opened on start, `unreachable` when the main process couldn't be asked
 */
export type ProjectState =
  | {readonly type: 'loading'}
  | {readonly type: 'none'}
  | {readonly type: 'open'; readonly project: OpenProject}
  | {readonly type: 'failed'; readonly path: string; readonly error: ProjectError}
  | {readonly type: 'unreachable'; readonly message: MessageDescriptor};

export interface FixturesState {
  project: ProjectState;
  /** the last save or delete that failed */
  fixturesError: MessageDescriptor | undefined;
  /** the last create, open or recent list change that failed; the project open before stays open */
  projectError: ProjectFailure | undefined;
  recentProjects: readonly RecentProject[];
  /** a fixture or scene editor is open: switching the project asks before it drops the draft */
  hasOpenDraft: boolean;
  /** counts the projects opened, so the Show view starts afresh (no editor open) even if the same file is opened again */
  projectSwitches: number;
}

export const getDefaultFixturesState = (): FixturesState => ({
  project: {type: 'loading'},
  fixturesError: undefined,
  projectError: undefined,
  recentProjects: [],
  hasOpenDraft: false,
  projectSwitches: 0
});
