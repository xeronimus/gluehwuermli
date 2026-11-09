import {DMX_MIN_VALUE, DMX_UNIVERSE_SIZE, FIRST_DMX_CHANNEL} from '@shared/dmx';
import type {ChannelsChanged, DmxOutputStatus} from '@shared/ipc';

import type DmxService from '@/data/service/DmxService';

const SIMULATED_PORT_PATH = 'SIMULATED';

/** a DmxService that can push channel values like main does for a chase step */
export interface InMemoryDmxService extends DmxService {
  pushChannelsChanged: (change: ChannelsChanged) => void;
}

/**
 * a DmxService without the main process: the renderer opened in a plain browser, or a test. Keeps the values it is
 * sent and answers them like main (without caps); a pushed change doesn't touch them, like a reload doesn't in main
 */
export function inMemoryDmxServiceFactory(): InMemoryDmxService {
  const listeners = new Set<(status: DmxOutputStatus) => void>();
  const channelsListeners = new Set<(change: ChannelsChanged) => void>();
  const universe = Array<number>(DMX_UNIVERSE_SIZE).fill(DMX_MIN_VALUE);
  let status: DmxOutputStatus = {type: 'disconnected'};

  const setStatus = (next: DmxOutputStatus) => {
    status = next;
    listeners.forEach((listener) => listener(next));
    return next;
  };

  const setChannel = (channel: number, value: number) => {
    universe[channel - FIRST_DMX_CHANNEL] = value;
  };

  return {
    setChannel,
    setChannelValues: (values) => values.forEach(({channel, value}) => setChannel(channel, value)),
    blackout: () => universe.fill(DMX_MIN_VALUE),
    listPorts: async () => [{path: SIMULATED_PORT_PATH, likelyEnttecPro: true}],
    connect: async (path) => setStatus({type: 'connected', path}),
    disconnect: async () => setStatus({type: 'disconnected'}),
    getStatus: async () => status,
    getRememberedPort: async () => ({type: 'none'}),
    getChannelValues: async () => [...universe],
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
