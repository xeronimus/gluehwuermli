import {parseChaseStatus, parseChaseSyncStatus} from '@shared/ipc';
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
    }),
  getSync: () => bridge.getChaseSync(),
  setSync: (chaseId, synced) => bridge.setChaseSync(chaseId, synced),
  setSpeed: (chaseId, speed) => bridge.setChaseSpeed(chaseId, speed),
  onSyncChanged: (listener) =>
    bridge.onChaseSyncChanged((payload) => {
      const status = parseChaseSyncStatus(payload);
      if (!status) {
        logger.warn('dropped invalid chase sync status', payload);
        return;
      }
      listener(status);
    })
});
