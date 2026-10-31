import type {DmxConnection, DmxPortConnector} from '@/dmx/DmxPortConnector';

export const SIMULATED_PORT_PATH = 'SIMULATED';

/** what an InMemoryConnector lets a test (or a session without a widget) inspect and break */
export interface InMemoryConnector extends DmxPortConnector {
  readonly writtenPackets: readonly Uint8Array[];
  /** the paths opened and not closed yet */
  readonly openPaths: readonly string[];
  failNextOpen: (error: Error) => void;
  failNextWrite: (error: Error) => void;
  unplug: () => void;
}

/**
 * a widget that isn't there: any path opens, and records every packet; for tests and working without hardware.
 * Like a COM port on Windows, a path that is already open can't be opened a second time.
 */
export function inMemoryConnectorFactory(): InMemoryConnector {
  const writtenPackets: Uint8Array[] = [];
  const openPaths: string[] = [];
  const unexpectedCloseListeners: (() => void)[] = [];
  let nextOpenError: Error | undefined;
  let nextWriteError: Error | undefined;

  const release = (path: string) => {
    const index = openPaths.indexOf(path);
    if (index >= 0) {
      openPaths.splice(index, 1);
    }
  };

  const openConnection = (path: string): DmxConnection => {
    openPaths.push(path);
    return {
      path,
      write: async (packet) => {
        if (nextWriteError) {
          const error = nextWriteError;
          nextWriteError = undefined;
          throw error;
        }
        writtenPackets.push(packet);
      },
      close: async () => release(path),
      onUnexpectedClose: (listener) => {
        unexpectedCloseListeners.push(listener);
      }
    };
  };

  return {
    writtenPackets,
    openPaths,
    listPorts: async () => [{path: SIMULATED_PORT_PATH, manufacturer: 'Glühwürmli', likelyEnttecPro: true}],
    open: async (path) => {
      if (nextOpenError) {
        const error = nextOpenError;
        nextOpenError = undefined;
        throw error;
      }
      if (openPaths.includes(path)) {
        throw new Error(`Opening ${path}: Access denied`);
      }
      return openConnection(path);
    },
    failNextOpen: (error) => {
      nextOpenError = error;
    },
    failNextWrite: (error) => {
      nextWriteError = error;
    },
    unplug: () => {
      openPaths.length = 0;
      unexpectedCloseListeners.forEach((listener) => listener());
    }
  };
}
