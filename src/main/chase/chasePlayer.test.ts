import type {Chase, ChaseRepeat, ChaseStep, SetChannelRequest} from '@shared/ipc';

import {type DmxEngine, dmxEngineFactory} from '@/dmx/dmxEngine';
import {emergencyOffFactory} from '@/dmx/emergencyOff';
import {
  type InMemoryConnector,
  SIMULATED_PORT_PATH,
  inMemoryConnectorFactory
} from '@/dmx/impl/inMemory/inMemoryConnectorFactory';

import {type ChasePlayer, type ChasePlayerStatus, chasePlayerFactory} from './chasePlayer';

const TICK_MS = 23;
const HOLD_MS = 500;
const LASER = 29;
const STROBE = 30;
const DIMMER = 1;
const silentLog = {debug: () => {}, info: () => {}, warn: () => {}};

/** the value of `channel` in a label 6 packet: 4 header bytes and the start code come before channel 1 */
const channelValueIn = (packet: Uint8Array | undefined, channel: number) => packet?.[4 + channel];
const isAllZero = (packet: Uint8Array | undefined) =>
  packet?.subarray(5, 5 + 512).every((value) => value === 0) ?? false;

const stepOf = (id: string, values: ChaseStep['values'], holdMs = HOLD_MS): ChaseStep => ({id, holdMs, values});

/** a laser and a strobe taking turns, the dimmer up in both */
const alternationOf = (repeat: ChaseRepeat, id = 'alternation'): Chase => ({
  id,
  name: 'Laser / strobe',
  repeat,
  steps: [
    stepOf('laser', [
      {channel: LASER, value: 255},
      {channel: STROBE, value: 0},
      {channel: DIMMER, value: 200}
    ]),
    stepOf('strobe', [
      {channel: LASER, value: 0},
      {channel: STROBE, value: 255}
    ])
  ]
});

let connector: InMemoryConnector;
let engine: DmxEngine;
let player: ChasePlayer;
let statuses: ChasePlayerStatus[];
let appliedValues: (readonly SetChannelRequest[])[];

const lastPacket = () => connector.writtenPackets.at(-1);
const advance = (ms: number) => vi.advanceTimersByTimeAsync(ms);
const nextTick = () => advance(TICK_MS);
/** step 2 is due after the first hold, and seen by the tick at most one tick later */
const untilSecondStep = () => advance(HOLD_MS + TICK_MS);
const stepStatuses = () => statuses.filter((status) => status.type === 'running');

beforeEach(async () => {
  vi.useFakeTimers();
  connector = inMemoryConnectorFactory();
  engine = dmxEngineFactory({connector, refreshIntervalMs: TICK_MS, log: silentLog});
  player = chasePlayerFactory({engine, now: () => Date.now(), log: silentLog});
  statuses = [];
  player.onStatusChanged((status) => statuses.push(status));
  appliedValues = [];
  player.onValuesApplied((values) => appliedValues.push(values));
  await engine.connect(SIMULATED_PORT_PATH);
  await nextTick();
});

afterEach(async () => {
  await engine.dispose();
  vi.useRealTimers();
});

test('starts with no chase running', () => {
  expect(player.status()).toEqual({type: 'idle'});
});

describe('start', () => {
  test('sends step 1 with the next tick, all its values in one packet', async () => {
    const packetsBefore = connector.writtenPackets.length;

    player.start(alternationOf({type: 'forever'}));
    await nextTick();

    expect(connector.writtenPackets).toHaveLength(packetsBefore + 1);
    expect(channelValueIn(lastPacket(), LASER)).toBe(255);
    expect(channelValueIn(lastPacket(), STROBE)).toBe(0);
    expect(channelValueIn(lastPacket(), DIMMER)).toBe(200);
    expect(player.status()).toEqual({type: 'running', chaseId: 'alternation', stepIndex: 0, passIndex: 0});
  });

  test('only changes the channels of the step, the others keep their value', async () => {
    engine.setChannel(5, 77);
    engine.setChannel(DIMMER, 10);

    player.start(alternationOf({type: 'forever'}));
    await untilSecondStep();

    expect(channelValueIn(lastPacket(), 5)).toBe(77);
    expect(channelValueIn(lastPacket(), STROBE)).toBe(255);
    // step 2 doesn't name the dimmer: it stays at step 1's value, not at the one before the chase
    expect(channelValueIn(lastPacket(), DIMMER)).toBe(200);
  });

  test('another chase stops the running one and starts at its step 1 in the same tick', async () => {
    const other: Chase = {
      id: 'other',
      name: 'Dimmer',
      repeat: {type: 'once'},
      steps: [stepOf('half', [{channel: DIMMER, value: 128}])]
    };
    player.start(alternationOf({type: 'forever'}));
    await untilSecondStep();

    player.start(other);
    await nextTick();

    expect(player.status()).toEqual({type: 'running', chaseId: 'other', stepIndex: 0, passIndex: 0});
    expect(channelValueIn(lastPacket(), DIMMER)).toBe(128);
    expect(channelValueIn(lastPacket(), STROBE)).toBe(255);
  });

  test('a stopped chase starts again from step 1', async () => {
    player.start(alternationOf({type: 'forever'}));
    await untilSecondStep();
    player.stop();

    player.start(alternationOf({type: 'forever'}));
    await nextTick();

    expect(player.status()).toEqual({type: 'running', chaseId: 'alternation', stepIndex: 0, passIndex: 0});
    expect(channelValueIn(lastPacket(), LASER)).toBe(255);
  });
});

describe('repeat', () => {
  test('once plays every step once and ends after the last hold, the values stay', async () => {
    player.start(alternationOf({type: 'once'}));
    await advance(2 * HOLD_MS - 1);
    expect(player.status()).toMatchObject({type: 'running', stepIndex: 1});

    await advance(TICK_MS + 1);

    expect(player.status()).toEqual({type: 'idle'});
    expect(stepStatuses().map(({type}) => type)).toEqual(['running', 'running']);
    expect(channelValueIn(lastPacket(), STROBE)).toBe(255);
    const packetsAfterFinish = connector.writtenPackets.length;
    await advance(10 * HOLD_MS);
    expect(connector.writtenPackets).toHaveLength(packetsAfterFinish);
  });

  test('N times plays exactly N passes', async () => {
    player.start(alternationOf({type: 'times', count: 3}));
    await advance(10 * HOLD_MS);

    expect(stepStatuses()).toHaveLength(3 * 2);
    expect(stepStatuses().at(-1)).toEqual({type: 'running', chaseId: 'alternation', stepIndex: 1, passIndex: 2});
    expect(player.status()).toEqual({type: 'idle'});
  });

  test('until stopped keeps looping', async () => {
    player.start(alternationOf({type: 'forever'}));
    await advance(100 * 2 * HOLD_MS + TICK_MS);

    expect(player.status()).toEqual({type: 'running', chaseId: 'alternation', stepIndex: 0, passIndex: 100});
  });
});

describe('timing', () => {
  test('each step goes out at most one tick after its time, without drifting over a long loop', async () => {
    // not on a tick: the lateness differs from step to step, and must not add up
    await advance(7);
    const startedAtMs = Date.now();
    const firstPacket = connector.writtenPackets.length;
    const steps = 200;

    player.start(alternationOf({type: 'forever'}));
    await advance(steps * HOLD_MS + TICK_MS);

    const writeTimes = connector.writeTimesMs.slice(firstPacket);
    expect(writeTimes).toHaveLength(steps + 1);
    writeTimes.forEach((writtenAtMs, step) => {
      const dueAtMs = startedAtMs + step * HOLD_MS;
      expect(writtenAtMs).toBeGreaterThanOrEqual(dueAtMs);
      expect(writtenAtMs - dueAtMs).toBeLessThanOrEqual(TICK_MS);
    });
  });

  test('a stalled tick still lands the values of the steps it missed', async () => {
    let clockMs = 0;
    const stalledPlayer = chasePlayerFactory({engine, now: () => clockMs, log: silentLog});
    const chase: Chase = {
      id: 'three',
      name: 'Three',
      repeat: {type: 'forever'},
      steps: [
        stepOf('a', [{channel: 1, value: 1}]),
        stepOf('b', [{channel: 2, value: 2}]),
        stepOf('c', [{channel: 3, value: 3}])
      ]
    };
    stalledPlayer.start(chase);

    clockMs = 2 * HOLD_MS;
    await nextTick();

    expect(stalledPlayer.status()).toMatchObject({stepIndex: 2, passIndex: 0});
    expect([1, 2, 3].map((channel) => channelValueIn(lastPacket(), channel))).toEqual([1, 2, 3]);
  });
});

describe('pause and resume', () => {
  test('pause keeps the step; resume continues it with the hold that was left', async () => {
    player.start(alternationOf({type: 'forever'}));
    await advance(299);

    player.pause();
    expect(player.status()).toEqual({type: 'paused', chaseId: 'alternation', stepIndex: 0, passIndex: 0});
    await advance(10_000);
    expect(player.status()).toMatchObject({type: 'paused', stepIndex: 0});

    player.resume();
    await advance(200);
    expect(player.status()).toMatchObject({type: 'running', stepIndex: 0});
    await advance(TICK_MS);
    expect(player.status()).toMatchObject({type: 'running', stepIndex: 1});
  });

  test("resume doesn't send the step again: a fader moved during the pause keeps its value", async () => {
    player.start(alternationOf({type: 'forever'}));
    await nextTick();
    player.pause();

    engine.setChannel(LASER, 40);
    await nextTick();
    const packetsBefore = connector.writtenPackets.length;
    player.resume();
    await nextTick();

    expect(connector.writtenPackets).toHaveLength(packetsBefore);
    expect(channelValueIn(lastPacket(), LASER)).toBe(40);
  });

  test('pause after a step came due, before the tick saw it, plays that step first and keeps it', async () => {
    player.start(alternationOf({type: 'forever'}));
    await nextTick();
    // step 2 is due now; the clock moves on without a tick running
    vi.setSystemTime(Date.now() + HOLD_MS);

    player.pause();
    expect(player.status()).toMatchObject({type: 'paused', stepIndex: 1, passIndex: 0});
    expect(appliedValues.at(-1)).toContainEqual({channel: STROBE, value: 255});
    await nextTick();
    expect(channelValueIn(lastPacket(), STROBE)).toBe(255);

    // step 2 was due a tick before the pause: that tick counts, the rest of its hold follows the resume
    player.resume();
    await advance(HOLD_MS - 2 * TICK_MS);
    expect(player.status()).toMatchObject({type: 'running', stepIndex: 1});
    await advance(2 * TICK_MS);
    expect(player.status()).toMatchObject({type: 'running', stepIndex: 0, passIndex: 1});
  });

  test('pause after the last hold of a chase played once finishes it', async () => {
    player.start(alternationOf({type: 'once'}));
    await nextTick();
    vi.setSystemTime(Date.now() + 2 * HOLD_MS);

    player.pause();

    expect(player.status()).toEqual({type: 'idle'});
    expect(appliedValues.at(-1)).toContainEqual({channel: STROBE, value: 255});
  });

  test('pause and resume do nothing without a chase', () => {
    player.pause();
    player.resume();

    expect(statuses).toEqual([]);
  });
});

describe('stop', () => {
  test('ends the chase, the values stay and no step follows', async () => {
    player.start(alternationOf({type: 'forever'}));
    await untilSecondStep();

    player.stop();
    const packetsAfterStop = connector.writtenPackets.length;
    await advance(10 * HOLD_MS);

    expect(player.status()).toEqual({type: 'idle'});
    expect(connector.writtenPackets).toHaveLength(packetsAfterStop);
    expect(channelValueIn(lastPacket(), STROBE)).toBe(255);
  });

  test('a paused chase can be stopped', () => {
    player.start(alternationOf({type: 'forever'}));
    player.pause();

    player.stop();

    expect(player.status()).toEqual({type: 'idle'});
  });

  test('Emergency off stops the chase before the blackout: the zeros are the last packet', async () => {
    player.start(alternationOf({type: 'forever'}));
    await advance(HOLD_MS - TICK_MS);

    emergencyOffFactory(player, engine)();
    await advance(10 * HOLD_MS);

    expect(player.status()).toEqual({type: 'idle'});
    expect(isAllZero(lastPacket())).toBe(true);
  });
});

describe('the values a step set', () => {
  test('are reported once per step, before the status that goes with it', async () => {
    const events: string[] = [];
    player.onValuesApplied(() => events.push('values'));
    player.onStatusChanged((status) => events.push(status.type));

    player.start(alternationOf({type: 'forever'}));
    await nextTick();
    expect(appliedValues).toEqual([
      [
        {channel: LASER, value: 255},
        {channel: STROBE, value: 0},
        {channel: DIMMER, value: 200}
      ]
    ]);

    await untilSecondStep();
    expect(appliedValues).toHaveLength(2);
    expect(appliedValues[1]).toEqual([
      {channel: LASER, value: 0},
      {channel: STROBE, value: 255}
    ]);
    expect(events).toEqual(['values', 'running', 'values', 'running']);
  });

  test('a stalled tick reports each channel once, with the value it ends at', async () => {
    player.start(alternationOf({type: 'forever'}));
    appliedValues.length = 0;
    // a whole pass and a step later, as one tick would see it after a stall
    vi.setSystemTime(Date.now() + 3 * HOLD_MS);
    await nextTick();

    expect(appliedValues).toHaveLength(1);
    expect(appliedValues[0]).toHaveLength(3);
    expect(appliedValues[0]).toEqual(expect.arrayContaining([{channel: STROBE, value: 255}]));
  });

  test('are reported at their cap', async () => {
    engine.setChannelLimits(new Map([[LASER, 0]]));

    player.start(alternationOf({type: 'forever'}));

    expect(appliedValues[0]).toContainEqual({channel: LASER, value: 0});
  });

  test('a listener that throws neither fails the start nor keeps the player from moving on', async () => {
    player.onValuesApplied(() => {
      throw new Error('Object has been destroyed');
    });
    player.onStatusChanged(() => {
      throw new Error('Object has been destroyed');
    });

    expect(() => player.start(alternationOf({type: 'forever'}))).not.toThrow();
    expect(player.status()).toMatchObject({type: 'running', stepIndex: 0});
    await untilSecondStep();
    await advance(10 * TICK_MS);

    expect(player.status()).toMatchObject({type: 'running', stepIndex: 1});
    // each step reported once to the listeners that work: the second step isn't played again on every tick
    expect(appliedValues).toHaveLength(2);
    expect(stepStatuses()).toHaveLength(2);
  });

  test('pause, resume and stop report none', async () => {
    player.start(alternationOf({type: 'forever'}));
    appliedValues.length = 0;

    player.pause();
    player.resume();
    player.stop();
    await nextTick();

    expect(appliedValues).toEqual([]);
  });
});

test('a channel set by hand keeps its value until a step sets it again', async () => {
  const laserOnly: Chase = {
    id: 'laser',
    name: 'Laser',
    repeat: {type: 'forever'},
    steps: [stepOf('on', [{channel: LASER, value: 255}]), stepOf('dimmer', [{channel: DIMMER, value: 50}])]
  };
  player.start(laserOnly);
  await nextTick();

  engine.setChannel(LASER, 30);
  await untilSecondStep();
  expect(channelValueIn(lastPacket(), LASER)).toBe(30);

  await untilSecondStep();
  expect(channelValueIn(lastPacket(), LASER)).toBe(255);
});

describe('channel lock', () => {
  beforeEach(() => {
    engine.setChannelLimits(new Map([[LASER, 0]]));
  });

  test('a locked channel stays at its cap whatever the step says', async () => {
    player.start(alternationOf({type: 'forever'}));
    await nextTick();

    expect(channelValueIn(lastPacket(), LASER)).toBe(0);
    expect(channelValueIn(lastPacket(), DIMMER)).toBe(200);
  });

  test("lifting the lock mid-step doesn't raise the value; the next step setting it does", async () => {
    const laserTwice: Chase = {
      id: 'laser',
      name: 'Laser',
      repeat: {type: 'forever'},
      steps: [stepOf('on', [{channel: LASER, value: 255}]), stepOf('on again', [{channel: LASER, value: 255}])]
    };
    player.start(laserTwice);
    await nextTick();

    engine.setLimitsEnforced(false);
    await nextTick();
    expect(channelValueIn(lastPacket(), LASER)).toBe(0);
    expect(player.status()).toMatchObject({type: 'running'});

    await untilSecondStep();
    expect(channelValueIn(lastPacket(), LASER)).toBe(255);
  });

  test('turning the lock on caps the running chase right away and keeps it running', async () => {
    engine.setLimitsEnforced(false);
    player.start(alternationOf({type: 'forever'}));
    await nextTick();

    engine.setLimitsEnforced(true);
    await nextTick();

    expect(channelValueIn(lastPacket(), LASER)).toBe(0);
    expect(player.status()).toMatchObject({type: 'running'});
  });
});

test('keeps playing while the port is disconnected; the current step goes out once it is back', async () => {
  player.start(alternationOf({type: 'forever'}));
  await nextTick();

  await engine.disconnect();
  await untilSecondStep();
  expect(player.status()).toMatchObject({type: 'running', stepIndex: 1});

  await engine.connect(SIMULATED_PORT_PATH);
  await nextTick();
  expect(channelValueIn(lastPacket(), STROBE)).toBe(255);
});
