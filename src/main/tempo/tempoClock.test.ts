import type {Tempo} from '@shared/tapTempo';

import {type TempoClock, tempoClockFactory} from './tempoClock';

const silentLog = {info: () => {}, warn: () => {}};

let nowMs: number;
let clock: TempoClock;
let changes: Tempo[];

const tapAt = (...tapsMs: number[]) =>
  tapsMs.forEach((tapMs) => {
    nowMs = tapMs;
    clock.tap();
  });

beforeEach(() => {
  nowMs = 0;
  clock = tempoClockFactory({now: () => nowMs, log: silentLog});
  changes = [];
  clock.onTempoChanged((tempo) => changes.push(tempo));
});

test('no tempo before four taps', () => {
  tapAt(1000, 1500, 2000);

  expect(clock.tempo()).toBeUndefined();
  expect(clock.status()).toEqual({type: 'none'});
  expect(changes).toEqual([]);
});

test('four taps set the tempo; the time since the beat is taken from the clock', () => {
  tapAt(1000, 1500, 2000, 2500);
  nowMs = 2620;

  expect(clock.status()).toEqual({type: 'set', bpm: 120, beatMs: 500, sinceBeatMs: 120});
  expect(changes).toEqual([{beatMs: 500, downbeatMs: 2500}]);
});

test('the time since the beat wraps within a beat', () => {
  tapAt(1000, 1500, 2000, 2500);
  nowMs = 3620;

  expect(clock.status()).toMatchObject({sinceBeatMs: 120});
});

test('each accepted tap from the fourth on pushes once, an ignored one pushes nothing', () => {
  tapAt(1000, 1500, 2000, 2500, 3000);
  tapAt(3100 + 160);

  expect(changes).toHaveLength(2);
});

test('the first taps of a new sequence keep the old tempo and push nothing', () => {
  tapAt(1000, 1500, 2000, 2500);
  tapAt(10_000, 10_400, 10_800);

  expect(clock.tempo()).toEqual({beatMs: 500, downbeatMs: 2500});
  expect(changes).toHaveLength(1);

  tapAt(11_200);

  expect(clock.tempo()).toEqual({beatMs: 400, downbeatMs: 11_200});
  expect(changes).toHaveLength(2);
});
