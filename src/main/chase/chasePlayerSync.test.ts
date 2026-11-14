import type {Chase, ChaseStep, ChaseSyncStatus} from '@shared/ipc';

import {type DmxEngine, dmxEngineFactory} from '@/dmx/dmxEngine';
import {emergencyOffFactory} from '@/dmx/emergencyOff';
import {SIMULATED_PORT_PATH, inMemoryConnectorFactory} from '@/dmx/impl/inMemory/inMemoryConnectorFactory';
import {type TempoClock, tempoClockFactory} from '@/tempo/tempoClock';

import {type ChasePlayer, type ChasePlayerStatus, chasePlayerFactory} from './chasePlayer';

const TICK_MS = 23;
const STROBE = 30;
const silentLog = {debug: () => {}, info: () => {}, warn: () => {}};

const stepOf = (id: string, holdMs: number, value: number, fadeMs?: number): ChaseStep => ({
  id,
  holdMs,
  ...(fadeMs === undefined ? {} : {fadeMs}),
  values: [{channel: STROBE, value}]
});

/** two steps of a beat each at 120 BPM (the default reference tempo) */
const alternation: Chase = {
  id: 'alternation',
  name: 'On / off',
  repeat: {type: 'forever'},
  steps: [stepOf('on', 500, 255), stepOf('off', 500, 0)]
};

/** three steps of 100, 200 and 300 ms */
const threeSteps: Chase = {
  id: 'three',
  name: 'Three',
  repeat: {type: 'forever'},
  steps: [stepOf('a', 100, 1), stepOf('b', 200, 2), stepOf('c', 300, 3)]
};

let engine: DmxEngine;
let tempo: TempoClock;
let player: ChasePlayer;
/** each pushed chase status (`chase`) or sync status (`sync`) with the time it came */
let events: ({type: 'chase'; status: ChasePlayerStatus} | {type: 'sync'; status: ChaseSyncStatus})[];
let stepTimes: {stepIndex: number; passIndex: number; atMs: number}[];

const advance = (ms: number) => vi.advanceTimersByTimeAsync(ms);

/** four taps a beat apart: the tempo is set, its downbeat now */
const tapTempo = async (bpm: number) => {
  for (let tap = 0; tap < 4; tap++) {
    if (tap > 0) {
      await advance(60_000 / bpm);
    }
    tempo.tap();
  }
};

/** when the step came */
const stepTimeOf = (stepIndex: number, passIndex: number) =>
  stepTimes.find((time) => time.stepIndex === stepIndex && time.passIndex === passIndex)?.atMs;

const expectStepWithinATickOf = (stepIndex: number, passIndex: number, dueMs: number) => {
  const atMs = stepTimeOf(stepIndex, passIndex) ?? Number.NaN;
  expect(atMs).toBeGreaterThanOrEqual(dueMs);
  expect(atMs - dueMs).toBeLessThanOrEqual(TICK_MS);
};

beforeEach(async () => {
  vi.useFakeTimers();
  const connector = inMemoryConnectorFactory();
  engine = dmxEngineFactory({connector, refreshIntervalMs: TICK_MS, log: silentLog, logUniverse: false});
  tempo = tempoClockFactory({now: () => Date.now(), log: silentLog});
  player = chasePlayerFactory({engine, tempo, now: () => Date.now(), log: silentLog});
  events = [];
  stepTimes = [];
  player.onStatusChanged((status) => {
    events.push({type: 'chase', status});
    if (status.type !== 'running') {
      return;
    }
    const last = stepTimes.at(-1);
    // a sync change pushes the status of the same step again
    if (last?.stepIndex !== status.stepIndex || last.passIndex !== status.passIndex) {
      stepTimes.push({stepIndex: status.stepIndex, passIndex: status.passIndex, atMs: Date.now()});
    }
  });
  player.onSyncChanged((status) => events.push({type: 'sync', status}));
  await engine.connect(SIMULATED_PORT_PATH);
  await advance(7);
});

afterEach(async () => {
  await engine.dispose();
  vi.useRealTimers();
});

test('turning sync on without a tempo changes nothing and pushes nothing', () => {
  player.setSync('alternation', true);

  expect(player.syncStatus()).toEqual({chases: []});
  expect(events).toEqual([]);
});

test('sync and speed are kept per chase, only those differing from the default', async () => {
  await tapTempo(120);

  player.setSync('alternation', true);
  player.setSpeed('three', 2);
  player.setSpeed('alternation', 4);
  player.setSpeed('three', 1);

  expect(player.syncStatus()).toEqual({chases: [{chaseId: 'alternation', synced: true, speed: 4}]});
});

test('synced at 100 BPM, a chase written at 120 plays its steps 1.2 times as long', async () => {
  await tapTempo(100);
  player.setSync('three', true);
  const startMs = Date.now();

  player.start(threeSteps);
  await advance(800);

  expectStepWithinATickOf(1, 0, startMs + 120);
  expectStepWithinATickOf(2, 0, startMs + 360);
  expectStepWithinATickOf(0, 1, startMs + 720);
  expect(player.status()).toMatchObject({synced: true, speed: 1});
});

test('a late synced start on a chase with a short step 1 lands on step 2 without skipping it', async () => {
  await tapTempo(120);
  player.setSync('three', true);
  // 0.4 beat late: beat 0 is the tapped beat 200 ms ago, step 1 (100 ms) is already over
  await advance(200);

  player.start(threeSteps);
  await advance(TICK_MS);

  expect(player.status()).toMatchObject({stepIndex: 1, passIndex: 0});
  expect(engine.channelValue(STROBE)).toBe(2);
});

test('sync on mid-step: the step ends on the next beat, then the steps play scaled', async () => {
  await tapTempo(100);
  const downbeatMs = Date.now();
  player.start(alternation);
  await advance(200);

  player.setSync('alternation', true);
  await advance(1300);

  expectStepWithinATickOf(1, 0, downbeatMs + 600);
  expectStepWithinATickOf(0, 1, downbeatMs + 1200);
  expect(stepTimes.map(({stepIndex}) => stepIndex)).toEqual([0, 1, 0]);
});

test('sync off mid-step: the chase goes on from where it is with its own milliseconds', async () => {
  await tapTempo(100);
  const downbeatMs = Date.now();
  player.setSync('alternation', true);
  player.start(alternation);
  // 300 ms at 100 BPM is 250 ms of the chase
  await advance(300);

  player.setSync('alternation', false);
  await advance(800);

  expectStepWithinATickOf(1, 0, downbeatMs + 550);
  expectStepWithinATickOf(0, 1, downbeatMs + 1050);
  expect(player.status()).toMatchObject({synced: false});
});

test("a fade under way doesn't jump when sync goes on", async () => {
  await tapTempo(90);
  const fading: Chase = {...alternation, id: 'fading', steps: [stepOf('up', 100, 200, 400), stepOf('down', 500, 0)]};
  player.start(fading);
  await advance(200);
  const before = engine.channelValue(STROBE);

  player.setSync('fading', true);
  await advance(TICK_MS);

  expect(before).toBeGreaterThan(50);
  expect(Math.abs(engine.channelValue(STROBE) - before)).toBeLessThanOrEqual(20);
});

test('a new tempo while synced: no step pushed by the tap, the next step on the new beat', async () => {
  await tapTempo(100);
  const downbeatMs = Date.now();
  player.setSync('alternation', true);
  player.start(alternation);
  await advance(700);
  const pushedBefore = events.length;

  // 700 ms after the last tap: 16.7 % off the 600 ms beat, accepted. A beat of 625 ms, the downbeat now
  tempo.tap();

  expect(events).toHaveLength(pushedBefore);
  await advance(1300);
  expectStepWithinATickOf(0, 1, downbeatMs + 1325);
  expectStepWithinATickOf(1, 1, downbeatMs + 1950);
});

test('a new speed while synced: the step ends on the grid, then at the new rate', async () => {
  await tapTempo(120);
  const downbeatMs = Date.now();
  player.setSync('alternation', true);
  player.start(alternation);
  await advance(100);

  player.setSpeed('alternation', 2);
  await advance(500);

  expectStepWithinATickOf(1, 0, downbeatMs + 250);
  expectStepWithinATickOf(0, 1, downbeatMs + 500);
  expect(player.status()).toMatchObject({synced: true, speed: 2});
});

test('pause and resume keep the sync, the paused step ends on the beat', async () => {
  await tapTempo(120);
  const downbeatMs = Date.now();
  player.setSync('alternation', true);
  player.start(alternation);
  await advance(100);

  player.pause();
  expect(player.status()).toMatchObject({type: 'paused', synced: true});
  await advance(1030);
  player.resume();
  await advance(500);

  expectStepWithinATickOf(1, 0, downbeatMs + 1500);
});

test('stop and Emergency off keep the switch and the speed for the next start', async () => {
  await tapTempo(120);
  player.setSync('alternation', true);
  player.setSpeed('alternation', 2);
  player.start(alternation);

  player.stop();
  player.start(alternation);
  emergencyOffFactory(player, engine)();
  player.start(alternation);

  expect(player.status()).toMatchObject({type: 'running', synced: true, speed: 2});
});

test('a sync change pushes the sync status, then the status of the chase it belongs to', async () => {
  await tapTempo(120);
  player.start(alternation);
  events = [];

  player.setSync('alternation', true);

  expect(events.map(({type}) => type)).toEqual(['sync', 'chase']);
  expect(events[1]?.status).toMatchObject({type: 'running', synced: true});
});

test("another chase's sync doesn't touch the running one", async () => {
  await tapTempo(100);
  const startMs = Date.now();
  player.start(alternation);
  events = [];

  player.setSync('three', true);
  await advance(600);

  expect(events.map(({type}) => type)).toEqual(['sync', 'chase']);
  expectStepWithinATickOf(1, 0, startMs + 500);
  expect(player.status()).toMatchObject({synced: false});
});
