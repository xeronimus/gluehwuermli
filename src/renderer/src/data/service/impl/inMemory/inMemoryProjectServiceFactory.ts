import {emptyFixtureSetup} from '@shared/fixtures';
import type {ProjectStatus} from '@shared/ipc';

import type ProjectService from '@/data/service/ProjectService';

/** the one project of a plain browser, kept in memory */
export const IN_MEMORY_PROJECT_PATH = 'In memory.glp';

const NO_LISTENER = () => () => {};

/**
 * a ProjectService without the main process, forgetting everything on reload: a plain browser, or a test. There are
 * no files and no dialogs: creating starts the one in-memory project afresh (pushed to onChanged, as main does),
 * opening is always cancelled
 */
export function inMemoryProjectServiceFactory(
  initialStatus: ProjectStatus = {type: 'open', project: {path: IN_MEMORY_PROJECT_PATH, setup: emptyFixtureSetup()}}
): ProjectService {
  let status = initialStatus;
  const changeListeners = new Set<(status: ProjectStatus) => void>();

  return {
    getStatus: async () => status,
    create: async () => {
      const project = {path: IN_MEMORY_PROJECT_PATH, setup: emptyFixtureSetup()};
      status = {type: 'open', project};
      changeListeners.forEach((listener) => listener(status));
      return {type: 'opened', project};
    },
    openWithDialog: async () => ({type: 'cancelled'}),
    openRecent: async (path) => ({type: 'failed', path, error: {reason: 'missing'}}),
    listRecent: async () => [],
    removeRecent: async () => {},
    saveFixtures: async (projectPath, setup) => {
      if (status.type !== 'open' || status.project.path !== projectPath) {
        throw new Error(`no open project ${projectPath}`);
      }
      status = {type: 'open', project: {path: projectPath, setup}};
    },
    onChanged: (listener) => {
      changeListeners.add(listener);
      return () => changeListeners.delete(listener);
    },
    onOpenRequested: NO_LISTENER
  };
}
