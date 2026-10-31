import {DMX_UNIVERSE_SIZE, FIRST_DMX_CHANNEL, isDmxChannel, isDmxValue} from '@shared/dmx';
import type {DmxOutputStatus} from '@shared/ipc';

import type {DmxConnection, DmxPortConnector} from './DmxPortConnector';
import {enttecProDmxPacket} from './enttecProPacket';

export interface DmxEngineLog {
  info: (...message: unknown[]) => void;
  warn: (...message: unknown[]) => void;
}

/**
 * Owns the universe and the port. Channel changes only touch the buffer; a timer sends the whole universe at most
 * once per refresh interval, and only if it changed, so any number of fader moves between two ticks cost one packet.
 * Runs in the main process, which Chromium never throttles (ADR 2).
 */
export interface DmxEngine {
  /** ignored unless channel and value are valid DMX */
  setChannel: (channel: number, value: number) => void;

  /** closes the current port first; a failure ends in the `failed` status, it doesn't throw */
  connect: (path: string) => Promise<DmxOutputStatus>;
  disconnect: () => Promise<DmxOutputStatus>;
  status: () => DmxOutputStatus;

  /** returns the function that removes the listener again */
  onStatusChanged: (listener: (status: DmxOutputStatus) => void) => () => void;

  /** stops the timer and closes the port */
  dispose: () => Promise<void>;
}

export interface DmxEngineDependencies {
  connector: DmxPortConnector;
  refreshIntervalMs: number;
  log: DmxEngineLog;
}

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export function dmxEngineFactory({connector, refreshIntervalMs, log}: DmxEngineDependencies): DmxEngine {
  const universe = new Uint8Array(DMX_UNIVERSE_SIZE);
  const statusListeners = new Set<(status: DmxOutputStatus) => void>();
  let currentStatus: DmxOutputStatus = {type: 'disconnected'};
  let connection: DmxConnection | undefined;
  let universeChanged = false;
  let writeInFlight = false;

  const setStatus = (status: DmxOutputStatus) => {
    currentStatus = status;
    statusListeners.forEach((listener) => listener(status));
  };

  const closeConnection = async () => {
    const closing = connection;
    connection = undefined;
    await closing?.close();
  };

  const failConnection = async (path: string, error: unknown) => {
    log.warn(`DMX output on ${path} failed`, error);
    await closeConnection();
    setStatus({type: 'failed', path, message: messageOf(error)});
  };

  const sendUniverseIfChanged = async () => {
    if (!connection || !universeChanged || writeInFlight) {
      return;
    }
    const target = connection;
    universeChanged = false;
    writeInFlight = true;
    try {
      await target.write(enttecProDmxPacket(universe));
    } catch (error) {
      // a write to a port that was replaced in the meantime doesn't concern the current one
      if (target === connection) {
        await failConnection(target.path, error);
      }
    } finally {
      writeInFlight = false;
    }
  };

  const refreshTimer = setInterval(() => void sendUniverseIfChanged(), refreshIntervalMs);

  const connect = async (path: string): Promise<DmxOutputStatus> => {
    await closeConnection();
    setStatus({type: 'connecting', path});
    try {
      const opened = await connector.open(path);
      connection = opened;
      opened.onUnexpectedClose(() => {
        if (connection === opened) {
          void failConnection(path, new Error('The port was closed, is the widget still plugged in?'));
        }
      });
      // the widget gets the current universe with the next tick, not only after the next change
      universeChanged = true;
      log.info(`DMX output connected on ${path}`);
      setStatus({type: 'connected', path});
    } catch (error) {
      await failConnection(path, error);
    }
    return currentStatus;
  };

  const disconnect = async (): Promise<DmxOutputStatus> => {
    await closeConnection();
    setStatus({type: 'disconnected'});
    return currentStatus;
  };

  return {
    setChannel: (channel, value) => {
      if (!isDmxChannel(channel) || !isDmxValue(value)) {
        log.warn(`ignored invalid DMX channel ${channel} / value ${value}`);
        return;
      }
      universe[channel - FIRST_DMX_CHANNEL] = value;
      universeChanged = true;
    },
    connect,
    disconnect,
    status: () => currentStatus,
    onStatusChanged: (listener) => {
      statusListeners.add(listener);
      return () => statusListeners.delete(listener);
    },
    dispose: async () => {
      clearInterval(refreshTimer);
      await closeConnection();
    }
  };
}
