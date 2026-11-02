import type {PreloadBridge} from '@shared/preloadBridge';

import type LockService from '@/data/service/LockService';

/** the LockService over the bridge the preload script exposes */
export const electronLockServiceFactory = (bridge: PreloadBridge): LockService => ({
  getStatus: () => bridge.getLockStatus(),
  unlock: (password) => bridge.unlock(password),
  lock: () => bridge.lock(),
  liftChannelLock: (password) => bridge.liftChannelLock(password),
  lockChannels: () => bridge.lockChannels(),
  changePassword: (currentPassword, newPassword) => bridge.changePassword(currentPassword, newPassword),
  reportActivity: () => bridge.reportActivity(),
  onChanged: (listener) => bridge.onLockChanged(listener)
});
