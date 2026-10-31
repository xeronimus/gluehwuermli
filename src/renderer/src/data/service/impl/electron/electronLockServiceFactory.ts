import type {DmxBridge} from '@shared/dmxBridge';

import type LockService from '@/data/service/LockService';

/** the LockService over the bridge the preload script exposes */
export const electronLockServiceFactory = (bridge: DmxBridge): LockService => ({
  getStatus: () => bridge.getLockStatus(),
  unlock: (password) => bridge.unlock(password),
  lock: () => bridge.lock(),
  liftChannelLock: (password) => bridge.liftChannelLock(password),
  lockChannels: () => bridge.lockChannels(),
  reportActivity: () => bridge.reportActivity(),
  onChanged: (listener) => bridge.onLockChanged(listener)
});
