import {parseProjectPathRequest, parseProjectStatus} from '@shared/ipc';
import type {PreloadBridge} from '@shared/preloadBridge';

import logger from '@/data/service/Logger';
import type ProjectService from '@/data/service/ProjectService';

/** the ProjectService over the bridge the preload script exposes; a push that isn't valid is dropped */
export const electronProjectServiceFactory = (bridge: PreloadBridge): ProjectService => ({
  getStatus: () => bridge.getProjectStatus(),
  create: () => bridge.createProject(),
  openWithDialog: () => bridge.openProject(),
  openRecent: (path) => bridge.openRecentProject(path),
  listRecent: () => bridge.listRecentProjects(),
  removeRecent: (path) => bridge.removeRecentProject(path),
  saveFixtures: (projectPath, setup) => bridge.saveFixtures(projectPath, setup),
  onChanged: (listener) =>
    bridge.onProjectChanged((payload) => {
      const status = parseProjectStatus(payload);
      if (!status) {
        logger.warn('dropped invalid project status', payload);
        return;
      }
      listener(status);
    }),
  onOpenRequested: (listener) =>
    bridge.onProjectOpenRequested((payload) => {
      const request = parseProjectPathRequest(payload);
      if (!request) {
        logger.warn('dropped invalid project open request', payload);
        return;
      }
      listener(request.path);
    })
});
