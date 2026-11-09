import {parseChannelsChanged, parseDmxOutputStatus, parseUniverseValues} from '@shared/ipc';
import type {PreloadBridge} from '@shared/preloadBridge';

import type DmxService from '@/data/service/DmxService';
import logger from '@/data/service/Logger';

/** the DmxService over the bridge the preload script exposes; a push that isn't valid is dropped */
export const electronDmxServiceFactory = (bridge: PreloadBridge): DmxService => ({
  setChannel: (channel, value) => bridge.setChannel(channel, value),
  setChannelValues: (values) => bridge.setChannelValues(values),
  blackout: () => bridge.blackout(),
  listPorts: () => bridge.listPorts(),
  connect: (path) => bridge.connect(path),
  disconnect: () => bridge.disconnect(),
  getStatus: () => bridge.getStatus(),
  getRememberedPort: () => bridge.getRememberedPort(),
  getChannelValues: async () => {
    const answer = parseUniverseValues(await bridge.getChannelValues());
    if (!answer) {
      throw new Error('invalid channel values');
    }
    return answer.values;
  },
  onStatusChanged: (listener) =>
    bridge.onStatusChanged((payload) => {
      const status = parseDmxOutputStatus(payload);
      if (!status) {
        logger.warn('dropped invalid output status', payload);
        return;
      }
      listener(status);
    }),
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
