import type {PreloadBridge} from '@shared/preloadBridge';

import type ProjectService from '@/data/service/ProjectService';

/** the ProjectService over the bridge the preload script exposes */
export const electronProjectServiceFactory = (bridge: PreloadBridge): ProjectService => ({
  getStatus: () => bridge.getProjectStatus(),
  create: () => bridge.createProject(),
  openWithDialog: () => bridge.openProject(),
  openRecent: (path) => bridge.openRecentProject(path),
  listRecent: () => bridge.listRecentProjects(),
  removeRecent: (path) => bridge.removeRecentProject(path),
  saveFixtures: (projectPath, setup) => bridge.saveFixtures(projectPath, setup),
  onChanged: (listener) => bridge.onProjectChanged(listener),
  onOpenRequested: (listener) => bridge.onProjectOpenRequested(listener)
});
