import type {DmxConnection, DmxPortConnector} from '@/dmx/DmxPortConnector';

export const SIMULATED_PORT_PATH = 'SIMULATED';

/** what an InMemoryConnector lets a test (or a session without a widget) inspect and break */
export interface InMemoryConnector extends DmxPortConnector {
  readonly writtenPackets: readonly Uint8Array[];
  failNextOpen: (error: Error) => void;
  failNextWrite: (error: Error) => void;
  unplug: () => void;
}

/** a widget that isn't there: one simulated port that records every packet; for tests and working without hardware */
export function inMemoryConnectorFactory(): InMemoryConnector {
  const writtenPackets: Uint8Array[] = [];
  const unexpectedCloseListeners: (() => void)[] = [];
  let nextOpenError: Error | undefined;
  let nextWriteError: Error | undefined;

  const connection: DmxConnection = {
    path: SIMULATED_PORT_PATH,
    write: async (packet) => {
      if (nextWriteError) {
        const error = nextWriteError;
        nextWriteError = undefined;
        throw error;
      }
      writtenPackets.push(packet);
    },
    close: async () => {},
    onUnexpectedClose: (listener) => {
      unexpectedCloseListeners.push(listener);
    }
  };

  return {
    writtenPackets,
    listPorts: async () => [{path: SIMULATED_PORT_PATH, manufacturer: 'Glühwürmli', likelyEnttecPro: true}],
    open: async () => {
      if (nextOpenError) {
        const error = nextOpenError;
        nextOpenError = undefined;
        throw error;
      }
      return connection;
    },
    failNextOpen: (error) => {
      nextOpenError = error;
    },
    failNextWrite: (error) => {
      nextWriteError = error;
    },
    unplug: () => unexpectedCloseListeners.forEach((listener) => listener())
  };
}
