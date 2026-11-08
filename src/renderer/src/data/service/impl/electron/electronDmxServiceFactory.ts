import {parseChannelsChanged} from '@shared/ipc';
import type {PreloadBridge} from '@shared/preloadBridge';

import type DmxService from '@/data/service/DmxService';
import logger from '@/data/service/Logger';

/** the DmxService over the bridge the preload script exposes */
export const electronDmxServiceFactory = (bridge: PreloadBridge): DmxService => ({
  setChannel: (channel, value) => bridge.setChannel(channel, value),
  setChannelValues: (values) => bridge.setChannelValues(values),
  blackout: () => bridge.blackout(),
  listPorts: () => bridge.listPorts(),
  connect: (path) => bridge.connect(path),
  disconnect: () => bridge.disconnect(),
  getStatus: () => bridge.getStatus(),
  getRememberedPort: () => bridge.getRememberedPort(),
  onStatusChanged: (listener) => bridge.onStatusChanged(listener),
  onChannelsChanged: (listener) =>
    bridge.onChannelsChanged((payload) => {
      const change = parseChannelsChanged(payload);
      if (!change) {
        logger.warn('dropped invalid channels change', payload);
        return;
      }
      listener(change);
    })
});
