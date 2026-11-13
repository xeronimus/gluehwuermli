import {DMX_MIN_VALUE, DMX_UNIVERSE_SIZE, FIRST_DMX_CHANNEL, isDmxChannel, isDmxValue} from '@shared/dmx';
import type {ChannelLimits} from '@shared/fixtures';
import type {DmxOutputStatus} from '@shared/ipc';
import {createSerialQueue} from '@shared/serialQueue';

import type {DmxConnection, DmxPortConnector} from './DmxPortConnector';
import {enttecProDmxPacket} from './enttecProPacket';

export interface DmxEngineLog {
  debug: (...message: unknown[]) => void;
  info: (...message: unknown[]) => void;
  warn: (...message: unknown[]) => void;
}

/**
 * Owns the universe and the port. Channel changes only touch the buffer; a timer sends the whole universe at most
 * once per refresh interval, and only if it changed, so any number of fader moves between two ticks cost one packet.
 * The same tick drives the chase player (`onTick`).
 * Runs in the main process, which Chromium never throttles (ADR 2).
 */
export interface DmxEngine {
  /** ignored unless channel and value are valid DMX; capped at the channel's limit while the limits are enforced */
  setChannel: (channel: number, value: number) => void;

  /** what the universe holds for a valid channel, after the caps; 0 for anything else */
  channelValue: (channel: number) => number;

  /**
   * the value setChannel would put on the channel now: capped at its limit while the limits are enforced, unchanged
   * otherwise. A chase fade takes its target from it when the step begins (doc/chases.md)
   */
  cappedValue: (channel: number, value: number) => number;

  /** the caps per address (the channel lock); while they are enforced, channels above their new cap drop to it */
  setChannelLimits: (limits: ChannelLimits) => void;

  /**
   * all channels to 0, sent with the next tick (Emergency off, or another project was opened: its fixtures may sit on
   * other addresses). Unlike the blackout of dispose, the output keeps running
   */
  blackout: () => void;

  /** on from the start, so nothing goes out uncapped before the fixtures are loaded; turning it on caps right away */
  setLimitsEnforced: (enforced: boolean) => void;

  /**
   * closes the current port first; a failure ends in the `failed` status, it doesn't throw. Overlapping connect and
   * disconnect calls run one after the other.
   */
  connect: (path: string) => Promise<DmxOutputStatus>;
  disconnect: () => Promise<DmxOutputStatus>;
  status: () => DmxOutputStatus;

  /** returns the function that removes the listener again */
  onStatusChanged: (listener: (status: DmxOutputStatus) => void) => () => void;

  /**
   * called on every refresh tick, connected or not, right before the universe is sent: what a listener sets there
   * (a chase's next step) goes out with this tick. Returns the function that removes the listener again
   */
  onTick: (listener: () => void) => () => void;

  /**
   * on quit: stops the timer, waits for a packet still being written, sends an all-zero universe first with `blackout`
   * (the widget keeps sending the last one it got), then closes the port. Never rejects, a blackout that can't be
   * written is logged and the port closed anyway
   */
  dispose: (options?: DisposeOptions) => Promise<void>;
}

export interface DisposeOptions {
  blackout?: boolean;
}

export interface DmxEngineDependencies {
  connector: DmxPortConnector;
  refreshIntervalMs: number;
  log: DmxEngineLog;
}

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/** the channels above 0 as `channel=value`, e.g. "1=255 17=128"; a whole universe would be unreadable in a log */
export const describeActiveChannels = (universe: Uint8Array): string => {
  const active = Array.from(universe, (value, index) => ({channel: index + FIRST_DMX_CHANNEL, value})).filter(
    ({value}) => value > DMX_MIN_VALUE
  );
  return active.length === 0 ? 'all channels 0' : active.map(({channel, value}) => `${channel}=${value}`).join(' ');
};

export function dmxEngineFactory({connector, refreshIntervalMs, log}: DmxEngineDependencies): DmxEngine {
  const universe = new Uint8Array(DMX_UNIVERSE_SIZE);
  const statusListeners = new Set<(status: DmxOutputStatus) => void>();
  const tickListeners = new Set<() => void>();
  let currentStatus: DmxOutputStatus = {type: 'disconnected'};
  let connection: DmxConnection | undefined;
  let universeChanged = false;
  /** the tick's write still running, if any: a write is never started before the last one is done */
  let pendingWrite: Promise<void> | undefined;
  let limits: ChannelLimits = new Map();
  let limitsEnforced = true;

  const cappedValue = (channel: number, value: number) => {
    const limit = limitsEnforced ? limits.get(channel) : undefined;
    return limit === undefined ? value : Math.min(value, limit);
  };

  const writeChannel = (channel: number, value: number) => {
    const index = channel - FIRST_DMX_CHANNEL;
    const capped = cappedValue(channel, value);
    // the same value again (a fader held still, a preset re-applied) is no reason for another packet
    if (universe[index] === capped) {
      return;
    }
    universe[index] = capped;
    universeChanged = true;
  };

  /** a channel lock turned on must not wait for the next fader move: the laser goes off now */
  const capUniverse = () => {
    limits.forEach((_limit, channel) => {
      if (isDmxChannel(channel)) {
        writeChannel(channel, universe[channel - FIRST_DMX_CHANNEL] ?? DMX_MIN_VALUE);
      }
    });
  };

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
    setStatus({type: 'failed', path, reason: 'port-error', message: messageOf(error)});
  };

  const reportUnexpectedClose = async (path: string) => {
    log.warn(`DMX output on ${path} failed: the port was closed, is the widget still plugged in?`);
    await closeConnection();
    setStatus({type: 'failed', path, reason: 'port-closed'});
  };

  const writeUniverse = async (target: DmxConnection) => {
    try {
      log.debug(`sending universe to ${target.path}: ${describeActiveChannels(universe)}`);
      await target.write(enttecProDmxPacket(universe));
    } catch (error) {
      // a write to a port that was replaced in the meantime doesn't concern the current one
      if (target === connection) {
        await failConnection(target.path, error);
      }
    }
  };

  const sendUniverseIfChanged = async () => {
    if (!connection || !universeChanged || pendingWrite) {
      return;
    }
    universeChanged = false;
    pendingWrite = writeUniverse(connection);
    try {
      await pendingWrite;
    } finally {
      pendingWrite = undefined;
    }
  };

  /** skips the tick: it is stopped already, and the zeros have to go out even if nothing changed */
  const blackOut = async () => {
    const target = connection;
    if (!target) {
      return;
    }
    universe.fill(DMX_MIN_VALUE);
    try {
      await target.write(enttecProDmxPacket(universe));
      log.info(`blacked out the DMX output on ${target.path}`);
    } catch (error) {
      log.warn(`blacking out the DMX output on ${target.path} failed`, error);
    }
  };

  const shutDown = async ({blackout = false}: DisposeOptions) => {
    // the zeros must be the last packet out, and close() must not cut off a packet being written
    await pendingWrite;
    if (blackout) {
      await blackOut();
    }
    await closeConnection();
  };

  /** a listener that throws only loses its own work: the universe still goes out with this tick */
  const tick = () => {
    tickListeners.forEach((listener) => {
      try {
        listener();
      } catch (error) {
        log.warn('a tick listener failed', error);
      }
    });
    void sendUniverseIfChanged();
  };

  const refreshTimer = setInterval(tick, refreshIntervalMs);

  // a second connect or a disconnect waits until the port being opened is tracked, so it can be closed; otherwise a
  // double click opens the same COM port twice ("Access denied") and another port would stay open untracked
  const runSerially = createSerialQueue();

  const openPort = async (path: string): Promise<DmxOutputStatus> => {
    await closeConnection();
    setStatus({type: 'connecting', path});
    try {
      const opened = await connector.open(path);
      connection = opened;
      opened.onUnexpectedClose(() => {
        if (connection === opened) {
          void reportUnexpectedClose(path);
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

  const closePort = async (): Promise<DmxOutputStatus> => {
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
      writeChannel(channel, value);
    },
    channelValue: (channel) =>
      isDmxChannel(channel) ? (universe[channel - FIRST_DMX_CHANNEL] ?? DMX_MIN_VALUE) : DMX_MIN_VALUE,
    cappedValue,
    blackout: () => {
      universe.fill(DMX_MIN_VALUE);
      universeChanged = true;
    },
    setChannelLimits: (next) => {
      limits = next;
      capUniverse();
    },
    setLimitsEnforced: (enforced) => {
      limitsEnforced = enforced;
      capUniverse();
    },
    connect: (path) => runSerially(() => openPort(path)),
    disconnect: () => runSerially(closePort),
    status: () => currentStatus,
    onStatusChanged: (listener) => {
      statusListeners.add(listener);
      return () => statusListeners.delete(listener);
    },
    onTick: (listener) => {
      tickListeners.add(listener);
      return () => tickListeners.delete(listener);
    },
    dispose: async (options = {}) => {
      clearInterval(refreshTimer);
      await runSerially(() => shutDown(options));
    }
  };
}
