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
  engine = dmxEngineFactory({connector, refreshIntervalMs: REFRESH_INTERVAL_MS, log: silentLog});
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

test('sends nothing while nothing changes', async () => {
  await engine.connect(SIMULATED_PORT_PATH);
  await nextTick();
  await nextTick();
  await nextTick();

  expect(connector.writtenPackets).toHaveLength(1);
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

  expect(await engine.connect('COM9')).toEqual({type: 'failed', path: 'COM9', message: 'Access denied'});
});

test('a failing write closes the port and reports it', async () => {
  const statuses: string[] = [];
  engine.onStatusChanged((status) => statuses.push(status.type));
  await engine.connect(SIMULATED_PORT_PATH);
  connector.failNextWrite(new Error('Device not ready'));

  await nextTick();
  engine.setChannel(1, 1);
  await nextTick();

  expect(engine.status()).toEqual({type: 'failed', path: SIMULATED_PORT_PATH, message: 'Device not ready'});
  expect(statuses).toEqual(['connecting', 'connected', 'failed']);
  expect(connector.writtenPackets).toHaveLength(0);
});

test('unplugging the widget ends in the failed status', async () => {
  await engine.connect(SIMULATED_PORT_PATH);

  connector.unplug();
  await vi.waitFor(() => expect(engine.status().type).toBe('failed'));
});

test('after disconnecting nothing is sent', async () => {
  await engine.connect(SIMULATED_PORT_PATH);
  await nextTick();

  expect(await engine.disconnect()).toEqual({type: 'disconnected'});
  engine.setChannel(1, 255);
  await nextTick();

  expect(connector.writtenPackets).toHaveLength(1);
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
