import {parseUniverseValues} from '@shared/ipc';

import {type DmxEngine, dmxEngineFactory} from '@/dmx/dmxEngine';
import {inMemoryConnectorFactory} from '@/dmx/impl/inMemory/inMemoryConnectorFactory';

import {universeValuesOf} from './dmxIpcHandlers';

const LASER = 40;
const silentLog = {debug: () => {}, info: () => {}, warn: () => {}};

let engine: DmxEngine;

beforeEach(() => {
  vi.useFakeTimers();
  engine = dmxEngineFactory({
    connector: inMemoryConnectorFactory(),
    refreshIntervalMs: 25,
    log: silentLog,
    logUniverse: false
  });
});

afterEach(async () => {
  await engine.dispose();
  vi.useRealTimers();
});

test('answers every channel of the universe, index 0 is channel 1', () => {
  engine.setChannel(1, 128);
  engine.setChannel(512, 255);

  const {values} = universeValuesOf(engine);

  expect(values).toHaveLength(512);
  expect(values[0]).toBe(128);
  expect(values[1]).toBe(0);
  expect(values[511]).toBe(255);
});

test('answers the values after the caps, not the ones asked for', () => {
  engine.setChannelLimits(new Map([[LASER, 0]]));

  engine.setChannel(LASER, 255);

  expect(universeValuesOf(engine).values[LASER - 1]).toBe(0);
});

test('the answer passes its own guard', () => {
  engine.setChannel(7, 99);

  expect(parseUniverseValues(universeValuesOf(engine))).toBeDefined();
});
