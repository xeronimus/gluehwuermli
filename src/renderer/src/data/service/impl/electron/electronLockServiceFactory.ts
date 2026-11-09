import {parseLockStatus} from '@shared/ipc';
import type {PreloadBridge} from '@shared/preloadBridge';

import type LockService from '@/data/service/LockService';
import logger from '@/data/service/Logger';

/** the LockService over the bridge the preload script exposes; a push that isn't a status is dropped */
export const electronLockServiceFactory = (bridge: PreloadBridge): LockService => ({
  getStatus: () => bridge.getLockStatus(),
  unlock: (password) => bridge.unlock(password),
  lock: () => bridge.lock(),
  liftChannelLock: (password) => bridge.liftChannelLock(password),
  lockChannels: () => bridge.lockChannels(),
  changePassword: (currentPassword, newPassword) => bridge.changePassword(currentPassword, newPassword),
  reportActivity: () => bridge.reportActivity(),
  onChanged: (listener) =>
    bridge.onLockChanged((payload) => {
      const status = parseLockStatus(payload);
      if (!status) {
        logger.warn('dropped invalid lock status', payload);
        return;
      }
      listener(status);
    })
});
