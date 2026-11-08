import type {PreloadBridge} from '@shared/preloadBridge';

import type DmxService from '@/data/service/DmxService';

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
  onStatusChanged: (listener) => bridge.onStatusChanged(listener)
});
