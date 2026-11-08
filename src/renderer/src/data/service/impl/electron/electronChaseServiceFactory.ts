import {parseChaseStatus} from '@shared/ipc';
import type {PreloadBridge} from '@shared/preloadBridge';

import type ChaseService from '@/data/service/ChaseService';
import logger from '@/data/service/Logger';

/** the ChaseService over the bridge the preload script exposes; a push that isn't a status is dropped */
export const electronChaseServiceFactory = (bridge: PreloadBridge): ChaseService => ({
  getStatus: () => bridge.getChaseStatus(),
  start: (chaseId) => bridge.startChase(chaseId),
  pause: () => bridge.pauseChase(),
  resume: () => bridge.resumeChase(),
  stop: () => bridge.stopChase(),
  onStatusChanged: (listener) =>
    bridge.onChaseStatusChanged((payload) => {
      const status = parseChaseStatus(payload);
      if (!status) {
        logger.warn('dropped invalid chase status', payload);
        return;
      }
      listener(status);
    })
});
