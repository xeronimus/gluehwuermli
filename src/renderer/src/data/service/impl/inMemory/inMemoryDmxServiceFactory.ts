import type {ChannelsChanged, DmxOutputStatus} from '@shared/ipc';

import type DmxService from '@/data/service/DmxService';

const SIMULATED_PORT_PATH = 'SIMULATED';

/** a DmxService that can push channel values like main does for a chase step */
export interface InMemoryDmxService extends DmxService {
  pushChannelsChanged: (change: ChannelsChanged) => void;
}

/** a DmxService without the main process: the renderer opened in a plain browser, or a test */
export function inMemoryDmxServiceFactory(): InMemoryDmxService {
  const listeners = new Set<(status: DmxOutputStatus) => void>();
  const channelsListeners = new Set<(change: ChannelsChanged) => void>();
  let status: DmxOutputStatus = {type: 'disconnected'};

  const setStatus = (next: DmxOutputStatus) => {
    status = next;
    listeners.forEach((listener) => listener(next));
    return next;
  };

  return {
    setChannel: () => {},
    setChannelValues: () => {},
    blackout: () => {},
    listPorts: async () => [{path: SIMULATED_PORT_PATH, likelyEnttecPro: true}],
    connect: async (path) => setStatus({type: 'connected', path}),
    disconnect: async () => setStatus({type: 'disconnected'}),
    getStatus: async () => status,
    getRememberedPort: async () => ({type: 'none'}),
    onStatusChanged: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    onChannelsChanged: (listener) => {
      channelsListeners.add(listener);
      return () => {
        channelsListeners.delete(listener);
      };
    },
    pushChannelsChanged: (change) => channelsListeners.forEach((listener) => listener(change))
  };
}
