import type {Chase, ChaseSpeed, ChaseStep} from '@shared/ipc';
import type {Tempo} from '@shared/tapTempo';

import {chaseMsAt, freeClock, resyncedClock, startedSyncedClock, syncedRate} from './chaseClock';
import {passDurationMs, stepEndMs} from './chasePosition';

const stepsOf = (count: number, holdMs: number, prefix: string): ChaseStep[] =>
  Array.from({length: count}, (_, index) => ({id: `${prefix}-${index}`, holdMs, values: [{channel: 1, value: 255}]}));

/**
 * shaped like "Disco Fever v2" at 120 BPM (beat = 500 ms): 4 steps of 4 beats, 4 of 1, 8 of ½, 2 of 2 and 7 hit/decay
 * pairs of 300 + 200 ms; 32 steps, 35 beats, 17 500 ms
 */
const discoFever: Chase = {
  id: 'disco',
  name: 'Disco Fever v2',
  repeat: {type: 'forever'},
  steps: [
    ...stepsOf(4, 2000, 'intro'),
    ...stepsOf(4, 500, 'beat'),
    ...stepsOf(8, 250, 'run'),
    ...stepsOf(2, 1000, 'flash'),
    ...Array.from({length: 7}, (_, index) => [
      ...stepsOf(1, 300, `hit-${index}`),
      ...stepsOf(1, 200, `decay-${index}`)
    ]).flat()
  ]
};

/** the chase time at which each step starts, in its first pass */
const stepStartsMs = (chase: Chase): number[] =>
  chase.steps.reduce<number[]>((starts, step) => [...starts, (starts.at(-1) ?? 0) + step.holdMs], [0]).slice(0, -1);

const tempoAt = (bpm: number, downbeatMs = 0): Tempo => ({beatMs: 60_000 / bpm, downbeatMs});

/** the wall time at which a synced clock reaches `chaseMs`, by the last segment */
const wallMsAtChaseMs = (clock: ReturnType<typeof freeClock>, chaseMs: number): number => {
  const segment = clock.at(-1);
  return segment === undefined ? Number.NaN : segment.fromWallMs + (chaseMs - segment.fromChaseMs) / segment.rate;
};

/** the tapped beats (grid beats at 1×) since the downbeat at `wallMs` */
const gridAt = (tempo: Tempo, speed: ChaseSpeed, wallMs: number) =>
  ((wallMs - tempo.downbeatMs) / tempo.beatMs) * speed;

const isWhole = (value: number) => Math.abs(value - Math.round(value)) < 1e-9;

test('the fixture adds up to 35 beats at 120 BPM', () => {
  expect(discoFever.steps).toHaveLength(32);
  expect(passDurationMs(discoFever)).toBe(17_500);
});

test('a free clock plays chase time as wall time since its anchor', () => {
  const clock = freeClock(1000, 250);

  expect(chaseMsAt(clock, 1000)).toBe(250);
  expect(chaseMsAt(clock, 1600)).toBe(850);
});

describe('a synced start on a beat', () => {
  test.each([
    [100, 21_000],
    [120, 17_500],
    [140, 15_000]
  ])('at %i BPM a pass lasts %i ms, every step in proportion', (bpm, passMs) => {
    const tempo = tempoAt(bpm);
    const clock = startedSyncedClock(discoFever, tempo, 1, 0);

    expect(wallMsAtChaseMs(clock, 17_500)).toBeCloseTo(passMs, 6);
    stepStartsMs(discoFever).forEach((startMs) => {
      expect(wallMsAtChaseMs(clock, startMs)).toBeCloseTo((startMs * 120) / bpm, 6);
    });
  });

  test.each([100, 120, 140])('at %i BPM a step starting on a chase beat starts on a tapped beat', (bpm) => {
    const tempo = tempoAt(bpm);
    const clock = startedSyncedClock(discoFever, tempo, 1, 0);

    stepStartsMs(discoFever)
      .filter((startMs) => startMs % 500 === 0)
      .forEach((startMs) => expect(isWhole(gridAt(tempo, 1, wallMsAtChaseMs(clock, startMs)))).toBe(true));
    // the end of the first ½-beat step of the run, at 20.5 chase beats
    expect(gridAt(tempo, 1, wallMsAtChaseMs(clock, 10_250)) % 1).toBeCloseTo(0.5, 9);
  });

  test.each([
    [2, 8750],
    [0.5, 35_000]
  ] as const)('at speed %d and 120 BPM a pass takes %i ms', (speed, passMs) => {
    const clock = startedSyncedClock(discoFever, tempoAt(120), speed, 0);

    expect(wallMsAtChaseMs(clock, 17_500)).toBeCloseTo(passMs, 6);
  });
});

describe('a synced start off the beat', () => {
  const tempo = tempoAt(120);

  test('clicked 0.2 beat after a beat: beat 0 on that beat, the chase already 100 ms in', () => {
    const clock = startedSyncedClock(discoFever, tempo, 1, 1100);

    expect(chaseMsAt(clock, 1100)).toBeCloseTo(100, 9);
  });

  test('clicked 0.3 beat before a beat: beat 0 on the coming beat, the chase still before its start', () => {
    const clock = startedSyncedClock(discoFever, tempo, 1, 1350);

    expect(chaseMsAt(clock, 1350)).toBeCloseTo(-150, 9);
    expect(chaseMsAt(clock, 1500)).toBeCloseTo(0, 9);
  });
});

describe('resyncedClock', () => {
  test('continuous at now, the step ends on a grid point near its natural end, then synced', () => {
    const tempo = tempoAt(100, 37);
    // 700 ms into the first 4-beat intro step (ends at 2000)
    const clock = resyncedClock(discoFever, tempo, 1, 10_000, 700);
    const naturalEndMs = 10_000 + (2000 - 700) / syncedRate(discoFever, tempo, 1);
    const endWallMs = clock[1]?.fromWallMs ?? Number.NaN;

    expect(chaseMsAt(clock, 10_000)).toBeCloseTo(700, 9);
    expect(chaseMsAt(clock, endWallMs)).toBeCloseTo(2000, 6);
    expect(isWhole(gridAt(tempo, 1, endWallMs))).toBe(true);
    expect(Math.abs(endWallMs - naturalEndMs)).toBeLessThanOrEqual(tempo.beatMs / 2);
    expect(clock[1]?.rate).toBeCloseTo(syncedRate(discoFever, tempo, 1), 12);
  });

  test('a grid point leaving less than half of the rest is skipped: the rest plays at most 2× faster', () => {
    const tempo = tempoAt(120);
    // at 120 BPM and 1× the step's rest of 200 ms (0.4 beat) would end 0.01 beat after a beat at 1505 ms
    const chaseNowMs = 1800;
    const wallNowMs = 1305;
    const clock = resyncedClock(discoFever, tempo, 1, wallNowMs, chaseNowMs);
    const endWallMs = clock[1]?.fromWallMs ?? Number.NaN;

    expect(endWallMs).toBeCloseTo(1500, 9);
    expect((clock[0]?.rate ?? 0) / syncedRate(discoFever, tempo, 1)).toBeLessThanOrEqual(2);

    const nearEnd = resyncedClock(discoFever, tempo, 1, 1495, chaseNowMs);
    // the rest of 200 ms would end at 1695, the beat at 1500 leaves only 5 ms of it: the step ends on the next beat
    expect(nearEnd[1]?.fromWallMs).toBeCloseTo(2000, 9);
  });

  test('a step whose natural end is right at now ends on the next grid point, never in the past', () => {
    const tempo = tempoAt(120);
    const clock = resyncedClock(discoFever, tempo, 1, 1000, 1999.999);
    const endWallMs = clock[1]?.fromWallMs ?? Number.NaN;

    expect(endWallMs).toBeGreaterThan(1000);
    expect(endWallMs).toBeCloseTo(1500, 9);
  });

  test('a new downbeat half a beat off: the steps after the transition fall on the new grid', () => {
    const before = startedSyncedClock(discoFever, tempoAt(120), 1, 0);
    const shifted = tempoAt(120, 250);
    const chaseNowMs = chaseMsAt(before, 3100);
    const clock = resyncedClock(discoFever, shifted, 1, 3100, chaseNowMs);

    expect(chaseMsAt(clock, 3100)).toBeCloseTo(chaseNowMs, 9);
    expect(isWhole(gridAt(shifted, 1, wallMsAtChaseMs(clock, 4000)))).toBe(true);
    expect(isWhole(gridAt(shifted, 1, wallMsAtChaseMs(clock, 6000)))).toBe(true);
  });

  test('the ½-beat run ends a step on a half grid point', () => {
    const tempo = tempoAt(110, 13);
    // inside the first ½-beat step of the run (20 to 20.5 chase beats)
    const clock = resyncedClock(discoFever, tempo, 1, 50_000, 10_100);

    expect(gridAt(tempo, 1, clock[1]?.fromWallMs ?? Number.NaN) % 1).toBeCloseTo(0.5, 9);
  });
});

test('sync off mid-step: continuous, rate 1 from there', () => {
  const synced = startedSyncedClock(discoFever, tempoAt(100), 1, 0);
  const chaseNowMs = chaseMsAt(synced, 1234);
  const clock = freeClock(1234, chaseNowMs);

  expect(chaseMsAt(clock, 1234)).toBe(chaseNowMs);
  expect(chaseMsAt(clock, 2234)).toBeCloseTo(chaseNowMs + 1000, 9);
});

test('no drift: 10 000 synced beats later the chase is 10 000 chase beats on', () => {
  const tempo = tempoAt(127.3, 41);
  const clock = resyncedClock(discoFever, tempo, 1, 5000, 700);
  const endWallMs = clock[1]?.fromWallMs ?? Number.NaN;

  expect(Math.abs(chaseMsAt(clock, endWallMs + 10_000 * tempo.beatMs) - (2000 + 10_000 * 500))).toBeLessThan(1e-6);
  expect(stepEndMs(discoFever, 700)).toBe(2000);
});
