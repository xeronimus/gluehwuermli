import {DmxEngine, describeActiveChannels, dmxEngineFactory} from './dmxEngine';
import {
  InMemoryConnector,
  SIMULATED_PORT_PATH,
  inMemoryConnectorFactory
} from './impl/inMemory/inMemoryConnectorFactory';

const REFRESH_INTERVAL_MS = 25;
const silentLog = {debug: () => {}, info: () => {}, warn: () => {}};

/** the value of `channel` in a label 6 packet: 4 header bytes and the start code come before channel 1 */
const channelValueIn = (packet: Uint8Array | undefined, channel: number) => packet?.[4 + channel];

let connector: InMemoryConnector;
let engine: DmxEngine;

beforeEach(() => {
  vi.useFakeTimers();
  connector = inMemoryConnectorFactory();
  engine = dmxEngineFactory({connector, refreshIntervalMs: REFRESH_INTERVAL_MS, log: silentLog, logUniverse: false});
});

afterEach(async () => {
  await engine.dispose();
  vi.useRealTimers();
});

const nextTick = () => vi.advanceTimersByTimeAsync(REFRESH_INTERVAL_MS);

test('sends the current universe right after connecting', async () => {
  engine.setChannel(1, 128);

  expect(await engine.connect(SIMULATED_PORT_PATH)).toEqual({type: 'connected', path: SIMULATED_PORT_PATH});
  await nextTick();

  expect(connector.writtenPackets).toHaveLength(1);
  expect(channelValueIn(connector.writtenPackets[0], 1)).toBe(128);
});

test('coalesces all changes between two ticks into one packet', async () => {
  await engine.connect(SIMULATED_PORT_PATH);
  await nextTick();

  engine.setChannel(1, 10);
  engine.setChannel(1, 20);
  engine.setChannel(512, 255);
  await nextTick();

  expect(connector.writtenPackets).toHaveLength(2);
  expect(channelValueIn(connector.writtenPackets[1], 1)).toBe(20);
  expect(channelValueIn(connector.writtenPackets[1], 512)).toBe(255);
});

describe('the universe in the log', () => {
  const engineLogging = async (logUniverse: boolean) => {
    const debug = vi.fn();
    const loggingEngine = dmxEngineFactory({
      connector,
      refreshIntervalMs: REFRESH_INTERVAL_MS,
      log: {...silentLog, debug},
      logUniverse
    });
    loggingEngine.setChannel(1, 255);
    await loggingEngine.connect(SIMULATED_PORT_PATH);
    await nextTick();
    await loggingEngine.dispose();
    return debug;
  };

  test('is a debug line per universe sent when asked for', async () => {
    const debug = await engineLogging(true);

    expect(debug).toHaveBeenCalledWith(`sending universe to ${SIMULATED_PORT_PATH}: 1=255`);
  });

  test('is left out otherwise', async () => {
    const debug = await engineLogging(false);

    expect(debug).not.toHaveBeenCalled();
  });
});

test('sends nothing while nothing changes', async () => {
  await engine.connect(SIMULATED_PORT_PATH);
  await nextTick();
  await nextTick();
  await nextTick();

  expect(connector.writtenPackets).toHaveLength(1);
});

test('setting a channel to the value it already has sends nothing', async () => {
  engine.setChannel(1, 128);
  await engine.connect(SIMULATED_PORT_PATH);
  await nextTick();

  engine.setChannel(1, 128);
  engine.setChannel(2, 0);
  await nextTick();

  expect(connector.writtenPackets).toHaveLength(1);
});

test("a tick listener that throws doesn't stop the tick: the others run and the universe goes out", async () => {
  await engine.connect(SIMULATED_PORT_PATH);
  await nextTick();
  engine.onTick(() => {
    throw new Error('listener failed');
  });
  engine.onTick(() => engine.setChannel(1, 42));

  await nextTick();

  expect(connector.writtenPackets).toHaveLength(2);
  expect(channelValueIn(connector.writtenPackets[1], 1)).toBe(42);
});

test('ignores invalid channels and values', async () => {
  await engine.connect(SIMULATED_PORT_PATH);
  await nextTick();

  engine.setChannel(0, 10);
  engine.setChannel(1, 256);
  await nextTick();

  expect(connector.writtenPackets).toHaveLength(1);
});

test('a port that cannot be opened ends in the failed status', async () => {
  connector.failNextOpen(new Error('Access denied'));

  expect(await engine.connect('COM9')).toEqual({
    type: 'failed',
    path: 'COM9',
    reason: 'port-error',
    message: 'Access denied'
  });
});

test('a failing write closes the port and reports it', async () => {
  const statuses: string[] = [];
  engine.onStatusChanged((status) => statuses.push(status.type));
  await engine.connect(SIMULATED_PORT_PATH);
  connector.failNextWrite(new Error('Device not ready'));

  await nextTick();
  engine.setChannel(1, 1);
  await nextTick();

  expect(engine.status()).toEqual({
    type: 'failed',
    path: SIMULATED_PORT_PATH,
    reason: 'port-error',
    message: 'Device not ready'
  });
  expect(statuses).toEqual(['connecting', 'connected', 'failed']);
  expect(connector.writtenPackets).toHaveLength(0);
});

test('unplugging the widget ends in the failed status', async () => {
  await engine.connect(SIMULATED_PORT_PATH);

  connector.unplug();
  await vi.waitFor(() =>
    expect(engine.status()).toEqual({type: 'failed', path: SIMULATED_PORT_PATH, reason: 'port-closed'})
  );
});

test('after disconnecting nothing is sent', async () => {
  await engine.connect(SIMULATED_PORT_PATH);
  await nextTick();

  expect(await engine.disconnect()).toEqual({type: 'disconnected'});
  engine.setChannel(1, 255);
  await nextTick();

  expect(connector.writtenPackets).toHaveLength(1);
});

describe('blackout while running (another project opened)', () => {
  beforeEach(async () => {
    await engine.connect(SIMULATED_PORT_PATH);
    await nextTick();
  });

  test('with new limits in the same step: one all-zero packet, and the next values are capped', async () => {
    engine.setChannel(1, 255);
    engine.setChannel(29, 200);
    await nextTick();

    engine.blackout();
    engine.setChannelLimits(new Map([[29, 0]]));
    await nextTick();

    expect(connector.writtenPackets).toHaveLength(3);
    expect(connector.writtenPackets[2]?.slice(5, 5 + 512).every((value) => value === 0)).toBe(true);

    engine.setChannel(29, 255);
    await nextTick();
    expect(connector.writtenPackets).toHaveLength(3);
  });

  test('is sent even if all channels were 0 already', async () => {
    engine.blackout();
    await nextTick();

    expect(connector.writtenPackets).toHaveLength(2);
  });
});

describe('channel limits', () => {
  const LASER = 29;
  const MACRO = 37;
  const limits = new Map([
    [LASER, 0],
    [MACRO, 50]
  ]);

  beforeEach(async () => {
    await engine.connect(SIMULATED_PORT_PATH);
    await nextTick();
  });

  const lastPacket = () => connector.writtenPackets.at(-1);

  test('caps a channel while the limits are enforced, which they are from the start', async () => {
    engine.setChannelLimits(limits);

    engine.setChannel(LASER, 255);
    engine.setChannel(MACRO, 200);
    engine.setChannel(1, 255);
    await nextTick();

    expect(channelValueIn(lastPacket(), LASER)).toBe(0);
    expect(channelValueIn(lastPacket(), MACRO)).toBe(50);
    expect(channelValueIn(lastPacket(), 1)).toBe(255);
  });

  test('a lifted limit lets the value through', async () => {
    engine.setChannelLimits(limits);
    engine.setLimitsEnforced(false);

    engine.setChannel(LASER, 255);
    await nextTick();

    expect(channelValueIn(lastPacket(), LASER)).toBe(255);
  });

  test('enforcing the limits again caps the channels already above them right away', async () => {
    engine.setChannelLimits(limits);
    engine.setLimitsEnforced(false);
    engine.setChannel(LASER, 255);
    engine.setChannel(MACRO, 30);
    await nextTick();

    engine.setLimitsEnforced(true);
    await nextTick();

    expect(connector.writtenPackets).toHaveLength(3);
    expect(channelValueIn(lastPacket(), LASER)).toBe(0);
    expect(channelValueIn(lastPacket(), MACRO)).toBe(30);
  });

  test('the capped value is what setChannel would put on the channel now', () => {
    engine.setChannelLimits(limits);

    expect(engine.cappedValue(LASER, 255)).toBe(0);
    expect(engine.cappedValue(MACRO, 30)).toBe(30);
    expect(engine.cappedValue(MACRO, 200)).toBe(50);
    expect(engine.cappedValue(1, 255)).toBe(255);

    engine.setLimitsEnforced(false);

    expect(engine.cappedValue(LASER, 255)).toBe(255);
  });

  test('new limits while enforced cap the channels already above them', async () => {
    engine.setChannel(MACRO, 200);
    await nextTick();

    engine.setChannelLimits(limits);
    await nextTick();

    expect(channelValueIn(lastPacket(), MACRO)).toBe(50);
  });
});

describe('overlapping calls', () => {
  test('connecting to the same port twice keeps it connected', async () => {
    const [first, second] = await Promise.all([
      engine.connect(SIMULATED_PORT_PATH),
      engine.connect(SIMULATED_PORT_PATH)
    ]);

    expect(first).toEqual({type: 'connected', path: SIMULATED_PORT_PATH});
    expect(second).toEqual({type: 'connected', path: SIMULATED_PORT_PATH});
    expect(connector.openPaths).toEqual([SIMULATED_PORT_PATH]);
  });

  test('connecting to another port while the first opens closes the first', async () => {
    await Promise.all([engine.connect('COM3'), engine.connect('COM4')]);

    expect(engine.status()).toEqual({type: 'connected', path: 'COM4'});
    expect(connector.openPaths).toEqual(['COM4']);
  });

  test('disconnecting while the port opens ends disconnected', async () => {
    await Promise.all([engine.connect('COM3'), engine.disconnect()]);

    expect(engine.status()).toEqual({type: 'disconnected'});
    expect(connector.openPaths).toEqual([]);
  });

  test('disposing while the port opens closes it', async () => {
    const connecting = engine.connect('COM3');
    await engine.dispose();
    await connecting;

    expect(connector.openPaths).toEqual([]);
  });
});

describe('dispose on quit', () => {
  /** channel 1 is at byte 5, after the 4 header bytes and the start code */
  const isAllZero = (packet: Uint8Array | undefined) =>
    packet?.subarray(5, 5 + 512).every((value) => value === 0) ?? false;

  test('with blackout, sends an all-zero universe and then closes the port', async () => {
    engine.setChannel(1, 255);
    await engine.connect(SIMULATED_PORT_PATH);
    await nextTick();

    await engine.dispose({blackout: true});

    expect(connector.writtenPackets).toHaveLength(2);
    expect(isAllZero(connector.writtenPackets[1])).toBe(true);
    expect(connector.openPaths).toEqual([]);
  });

  test('the blackout goes out even if the channels are capped', async () => {
    engine.setChannelLimits(new Map([[1, 0]]));
    engine.setChannel(2, 255);
    await engine.connect(SIMULATED_PORT_PATH);
    await nextTick();

    await engine.dispose({blackout: true});

    expect(isAllZero(connector.writtenPackets.at(-1))).toBe(true);
  });

  test('without blackout, closes the port and sends nothing more', async () => {
    engine.setChannel(1, 255);
    await engine.connect(SIMULATED_PORT_PATH);
    await nextTick();

    await engine.dispose();

    expect(connector.writtenPackets).toHaveLength(1);
    expect(connector.openPaths).toEqual([]);
  });

  test('a blackout that fails to write is logged and the port closed anyway', async () => {
    await engine.connect(SIMULATED_PORT_PATH);
    await nextTick();
    connector.failNextWrite(new Error('write failed'));

    await expect(engine.dispose({blackout: true})).resolves.toBeUndefined();

    expect(connector.openPaths).toEqual([]);
  });

  test('without a port, a blackout writes nothing', async () => {
    await engine.dispose({blackout: true});

    expect(connector.writtenPackets).toEqual([]);
  });

  test('waits for a packet still being written, so the zeros go out last', async () => {
    let releaseWrite = () => {};
    const heldWrite = new Promise<void>((resolve) => {
      releaseWrite = resolve;
    });
    const heldConnector: InMemoryConnector = {
      ...connector,
      open: async (path) => {
        const connection = await connector.open(path);
        let held = true;
        return {
          ...connection,
          write: async (packet) => {
            if (held) {
              held = false;
              await heldWrite;
            }
            await connection.write(packet);
          }
        };
      }
    };
    const heldEngine = dmxEngineFactory({
      connector: heldConnector,
      refreshIntervalMs: REFRESH_INTERVAL_MS,
      log: silentLog,
      logUniverse: false
    });
    heldEngine.setChannel(1, 255);
    await heldEngine.connect(SIMULATED_PORT_PATH);
    await nextTick();

    const disposing = heldEngine.dispose({blackout: true});
    await vi.advanceTimersByTimeAsync(0);
    expect(connector.openPaths).toEqual([SIMULATED_PORT_PATH]);

    releaseWrite();
    await disposing;

    expect(connector.writtenPackets).toHaveLength(2);
    expect(channelValueIn(connector.writtenPackets[0], 1)).toBe(255);
    expect(isAllZero(connector.writtenPackets[1])).toBe(true);
    expect(connector.openPaths).toEqual([]);
  });
});

describe('describeActiveChannels', () => {
  test('lists the channels above 0, numbered from 1', () => {
    const universe = new Uint8Array(512);
    universe[0] = 255;
    universe[16] = 128;

    expect(describeActiveChannels(universe)).toBe('1=255 17=128');
  });

  test('says so when every channel is 0', () => {
    expect(describeActiveChannels(new Uint8Array(512))).toBe('all channels 0');
  });
});
