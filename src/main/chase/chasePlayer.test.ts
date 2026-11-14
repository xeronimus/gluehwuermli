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
  engine = dmxEngineFactory({connector, refreshIntervalMs: TICK_MS, log: silentLog, logUniverse: false});
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

describe('fades', () => {
  const FADE_MS = 1000;
  let clockMs: number;
  let fadePlayer: ChasePlayer;
  let fadeValues: (readonly SetChannelRequest[])[];

  const fadingStepOf = (id: string, values: ChaseStep['values'], fadeMs = FADE_MS): ChaseStep => ({
    id,
    fadeMs,
    holdMs: HOLD_MS,
    values
  });
  const chaseOf = (repeat: ChaseRepeat, steps: ChaseStep[]): Chase => ({id: 'fading', name: 'Sunrise', repeat, steps});
  /** the dimmer fades up to 200 in a second and holds, then drops to 50 at once: a pass takes 2 s */
  const sunriseOf = (repeat: ChaseRepeat) =>
    chaseOf(repeat, [
      fadingStepOf('up', [{channel: DIMMER, value: 200}]),
      stepOf('down', [{channel: DIMMER, value: 50}])
    ]);
  /** a tick that sees the clock at `ms` after the start */
  const tickAt = async (ms: number) => {
    clockMs = ms;
    await nextTick();
  };
  const valueOf = (channel: number) => engine.channelValue(channel);

  beforeEach(() => {
    clockMs = 0;
    fadePlayer = chasePlayerFactory({engine, now: () => clockMs, log: silentLog});
    fadeValues = [];
    fadePlayer.onValuesApplied((values) => fadeValues.push(values));
  });

  describe('the fade itself', () => {
    test('moves in a straight line from the clock and ends exactly at the step value', async () => {
      fadePlayer.start(sunriseOf({type: 'once'}));

      await tickAt(250);
      expect(valueOf(DIMMER)).toBe(50);
      await tickAt(333);
      expect(valueOf(DIMMER)).toBe(67);
      await tickAt(FADE_MS);
      expect(valueOf(DIMMER)).toBe(200);
      expect(channelValueIn(lastPacket(), DIMMER)).toBe(200);
    });

    test("a late tick lands where the clock is, it doesn't stretch the fade", async () => {
      fadePlayer.start(sunriseOf({type: 'once'}));
      await tickAt(100);

      await tickAt(900);

      expect(valueOf(DIMMER)).toBe(180);
    });

    test('once the fade is done, the hold leaves a fader moved by hand alone', async () => {
      fadePlayer.start(sunriseOf({type: 'once'}));
      await tickAt(FADE_MS);

      engine.setChannel(DIMMER, 30);
      await tickAt(FADE_MS + 200);

      expect(valueOf(DIMMER)).toBe(30);
    });

    test('a fade of 0 sets the values at Start, as without a fade', () => {
      fadePlayer.start(chaseOf({type: 'once'}, [fadingStepOf('at once', [{channel: DIMMER, value: 200}], 0)]));

      expect(valueOf(DIMMER)).toBe(200);
      expect(fadeValues).toEqual([[{channel: DIMMER, value: 200}]]);
    });
  });

  describe('where a fade starts', () => {
    test('step 1 fades from what the channel held at Start, set by hand', async () => {
      engine.setChannel(DIMMER, 100);
      fadePlayer.start(sunriseOf({type: 'once'}));

      await tickAt(500);

      expect(valueOf(DIMMER)).toBe(150);
    });

    test('a loop fades from the last step', async () => {
      fadePlayer.start(sunriseOf({type: 'forever'}));
      await tickAt(1600);
      expect(valueOf(DIMMER)).toBe(50);

      await tickAt(2000 + 500);

      expect(fadePlayer.status()).toMatchObject({stepIndex: 0, passIndex: 1});
      expect(valueOf(DIMMER)).toBe(125);
    });

    test('a looping chase of one step fades only in its first pass', async () => {
      fadePlayer.start(chaseOf({type: 'forever'}, [fadingStepOf('up', [{channel: DIMMER, value: 200}])]));
      await tickAt(500);
      expect(valueOf(DIMMER)).toBe(100);

      // the next pass: the step before (itself) ends at its value, the new fade starts there
      await tickAt(1500);
      expect(valueOf(DIMMER)).toBe(200);
      await tickAt(2000);
      expect(valueOf(DIMMER)).toBe(200);
    });
  });

  describe('pause and resume', () => {
    test('pause freezes the values; resume plays the rest of the fade, then the full hold', async () => {
      fadePlayer.start(sunriseOf({type: 'once'}));
      await tickAt(500);

      fadePlayer.pause();
      await tickAt(5000);
      expect(valueOf(DIMMER)).toBe(100);

      fadePlayer.resume();
      await tickAt(5250);
      expect(valueOf(DIMMER)).toBe(150);
      await tickAt(5000 + 500 + HOLD_MS - 1);
      expect(fadePlayer.status()).toMatchObject({type: 'running', stepIndex: 0});
      await tickAt(5000 + 500 + HOLD_MS);
      expect(fadePlayer.status()).toMatchObject({type: 'running', stepIndex: 1});
    });

    test('a fader moved during the pause jumps back onto the fade', async () => {
      fadePlayer.start(sunriseOf({type: 'once'}));
      await tickAt(500);
      fadePlayer.pause();
      engine.setChannel(DIMMER, 10);

      fadePlayer.resume();
      await tickAt(600);

      expect(valueOf(DIMMER)).toBe(120);
      expect(fadeValues.at(-1)).toEqual([{channel: DIMMER, value: 120}]);
    });
  });

  describe('channel lock', () => {
    /** the laser and the dimmer fade up, then the laser is set to full at once */
    const laserFade = () =>
      chaseOf({type: 'once'}, [
        fadingStepOf('up', [
          {channel: LASER, value: 255},
          {channel: DIMMER, value: 200}
        ]),
        stepOf('full', [{channel: LASER, value: 255}])
      ]);

    test('lifting the lock mid-fade keeps the capped channel at its cap until the next step', async () => {
      engine.setChannelLimits(new Map([[LASER, 0]]));
      fadePlayer.start(laserFade());
      await tickAt(500);

      engine.setLimitsEnforced(false);
      await tickAt(900);
      expect(valueOf(LASER)).toBe(0);
      expect(valueOf(DIMMER)).toBe(180);

      await tickAt(FADE_MS + HOLD_MS);
      expect(valueOf(LASER)).toBe(255);
    });

    test('turning the lock on mid-fade caps the channel right away', async () => {
      engine.setChannelLimits(new Map([[LASER, 0]]));
      engine.setLimitsEnforced(false);
      fadePlayer.start(laserFade());
      await tickAt(500);
      expect(valueOf(LASER)).toBe(128);

      engine.setLimitsEnforced(true);
      await tickAt(600);

      expect(valueOf(LASER)).toBe(0);
      expect(channelValueIn(lastPacket(), LASER)).toBe(0);
    });

    test('new limits mid-fade (a fixture saved): a cap removed raises nothing, a cap added caps', async () => {
      engine.setChannelLimits(new Map([[LASER, 0]]));
      fadePlayer.start(laserFade());
      await tickAt(500);

      engine.setChannelLimits(new Map([[DIMMER, 50]]));
      await tickAt(900);

      expect(valueOf(LASER)).toBe(0);
      expect(valueOf(DIMMER)).toBe(50);
    });
  });

  describe('a stalled tick', () => {
    /** two fading steps and one set at once that takes channel 2 back to 0: a pass takes 3.5 s */
    const threeSteps = () =>
      chaseOf({type: 'forever'}, [
        fadingStepOf('a', [{channel: 1, value: 200}]),
        fadingStepOf('b', [{channel: 2, value: 200}]),
        stepOf('c', [
          {channel: 2, value: 0},
          {channel: 3, value: 3}
        ])
      ]);
    const values = () => [1, 2, 3].map(valueOf);

    test('applies a fading step it skipped in full', async () => {
      fadePlayer.start(threeSteps());

      await tickAt(1500 + 300);

      expect(fadePlayer.status()).toMatchObject({stepIndex: 1, passIndex: 0});
      // a in full, b 30% of its fade from 0
      expect(values()).toEqual([200, 60, 0]);
    });

    test('across a loop wrap, the new step fades from where the skipped steps left it', async () => {
      fadePlayer.start(threeSteps());
      await tickAt(3200);
      expect(values()).toEqual([200, 0, 3]);

      await tickAt(3500 + 1500 + 250);

      expect(fadePlayer.status()).toMatchObject({stepIndex: 1, passIndex: 1});
      expect(values()).toEqual([200, 50, 3]);
    });

    test('longer than a pass: the steps of the pass before land, then the current one fades', async () => {
      fadePlayer.start(threeSteps());

      await tickAt(2 * 3500 + 1500 + 250);

      expect(fadePlayer.status()).toMatchObject({stepIndex: 1, passIndex: 2});
      expect(values()).toEqual([200, 50, 3]);
    });
  });

  describe('the end', () => {
    test('finishing while a fade is active ends it at its value', async () => {
      fadePlayer.start(chaseOf({type: 'once'}, [fadingStepOf('up', [{channel: DIMMER, value: 200}])]));
      await tickAt(400);

      await tickAt(FADE_MS + HOLD_MS);

      expect(fadePlayer.status()).toEqual({type: 'idle'});
      expect(valueOf(DIMMER)).toBe(200);
    });

    test('stopping mid-fade leaves the values where they are', async () => {
      fadePlayer.start(sunriseOf({type: 'once'}));
      await tickAt(400);

      fadePlayer.stop();
      await tickAt(800);

      expect(valueOf(DIMMER)).toBe(80);
    });
  });

  describe('reports', () => {
    test('one per tick with each faded channel once; nothing on a tick where nothing moved', async () => {
      fadePlayer.start(
        chaseOf({type: 'once'}, [
          fadingStepOf('up', [
            {channel: LASER, value: 255},
            {channel: DIMMER, value: 200}
          ])
        ])
      );
      expect(fadeValues).toEqual([]);

      await tickAt(500);
      expect(fadeValues).toEqual([
        [
          {channel: LASER, value: 128},
          {channel: DIMMER, value: 100}
        ]
      ]);

      await tickAt(500);
      expect(fadeValues).toHaveLength(1);
    });

    test('a fader moved by hand on a fading channel is reported back at the fade value', async () => {
      fadePlayer.start(sunriseOf({type: 'once'}));
      await tickAt(500);

      engine.setChannel(DIMMER, 10);
      await tickAt(500);

      expect(fadeValues.at(-1)).toEqual([{channel: DIMMER, value: 100}]);
    });

    test('the status changes per step, not per tick', async () => {
      const fadeStatuses: ChasePlayerStatus[] = [];
      fadePlayer.onStatusChanged((status) => fadeStatuses.push(status));
      fadePlayer.start(sunriseOf({type: 'once'}));

      for (let ms = 0; ms <= FADE_MS; ms += 100) {
        await tickAt(ms);
      }

      expect(fadeStatuses).toEqual([{type: 'running', chaseId: 'fading', stepIndex: 0, passIndex: 0}]);
    });
  });
});
