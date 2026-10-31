import type {DmxOutputStatus} from '@shared/ipc';

import type DmxService from '@/data/service/DmxService';

const SIMULATED_PORT_PATH = 'SIMULATED';

/** a DmxService without the main process: the renderer opened in a plain browser, or a test */
export function inMemoryDmxServiceFactory(): DmxService {
  const listeners = new Set<(status: DmxOutputStatus) => void>();
  let status: DmxOutputStatus = {type: 'disconnected'};

  const setStatus = (next: DmxOutputStatus) => {
    status = next;
    listeners.forEach((listener) => listener(next));
    return next;
  };

  return {
    setChannel: () => {},
    listPorts: async () => [{path: SIMULATED_PORT_PATH, likelyEnttecPro: true}],
    connect: async (path) => setStatus({type: 'connected', path}),
    disconnect: async () => setStatus({type: 'disconnected'}),
    getStatus: async () => status,
    onStatusChanged: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };
}
