import type {DmxBridge} from '@shared/dmxBridge';

import type DmxService from '@/data/service/DmxService';

/** the DmxService over the bridge the preload script exposes */
export const electronDmxServiceFactory = (bridge: DmxBridge): DmxService => ({
  setChannel: (channel, value) => bridge.setChannel(channel, value),
  setChannelValues: (values) => bridge.setChannelValues(values),
  listPorts: () => bridge.listPorts(),
  connect: (path) => bridge.connect(path),
  disconnect: () => bridge.disconnect(),
  getStatus: () => bridge.getStatus(),
  onStatusChanged: (listener) => bridge.onStatusChanged(listener)
});
