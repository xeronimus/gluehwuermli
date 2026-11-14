import {NO_TAPS, type TapSequence, beatPosition, bpmOf, tempoOf, withTap} from './tapTempo';

const tapped = (tapsMs: readonly number[], sequence: TapSequence = NO_TAPS): TapSequence =>
  tapsMs.reduce(withTap, sequence);

/** taps starting at `fromMs`, one after each interval */
const tapsAfter = (fromMs: number, intervalsMs: readonly number[]): number[] =>
  intervalsMs.reduce((taps, intervalMs) => [...taps, (taps.at(-1) ?? fromMs) + intervalMs], [fromMs]);

describe('tempoOf', () => {
  test('no tempo before the fourth tap; the fourth sets it, the downbeat on it', () => {
    expect(tempoOf(tapped([0, 500, 1000]))).toBeUndefined();

    const tempo = tempoOf(tapped([0, 500, 1000, 1500]));

    expect(tempo).toEqual({beatMs: 500, downbeatMs: 1500});
    expect(tempo && bpmOf(tempo)).toBe(120);
  });

  test('the average of the intervals', () => {
    expect(tempoOf(tapped(tapsAfter(0, [500, 510, 490])))).toEqual({beatMs: 500, downbeatMs: 1500});
  });

  test('a tap more than 2 s after the last starts a new sequence, without a tempo until its fourth tap', () => {
    const sequence = tapped([0, 500, 1000, 1500, 3501]);

    expect(sequence.tapsMs).toEqual([3501]);
    expect(tempoOf(tapped([3901, 4301], sequence))).toBeUndefined();
    expect(tempoOf(tapped([3901, 4301, 4701], sequence))).toEqual({beatMs: 400, downbeatMs: 4701});
  });

  test('a tap far off the average is ignored, the next one measures from the last accepted one', () => {
    const sequence = tapped([0, 500, 1000, 1260, 1500]);

    expect(sequence.tapsMs).toEqual([0, 500, 1000, 1500]);
    expect(tempoOf(sequence)).toEqual({beatMs: 500, downbeatMs: 1500});
  });

  test('a bounce under 200 ms is ignored', () => {
    expect(tapped([0, 500, 650, 1000]).tapsMs).toEqual([0, 500, 1000]);
  });

  test('after a stray first interval, the second ignored tap starts a new sequence', () => {
    const sequence = tapped([0, 1500, 2000, 2500]);

    expect(sequence.tapsMs).toEqual([2500]);
    expect(tempoOf(tapped([3000, 3500, 4000], sequence))).toEqual({beatMs: 500, downbeatMs: 4000});
  });

  test('only the last 8 intervals count', () => {
    const tempo = tempoOf(tapped(tapsAfter(0, [500, 500, 500, 500, 550, 550, 550, 550, 550, 550, 550, 550])));

    expect(tempo?.beatMs).toBe(550);
  });
});

describe('beatPosition', () => {
  const tempo = {beatMs: 500, downbeatMs: 1500};

  test('0 on the downbeat, 1 a beat later, -0.5 half a beat before', () => {
    expect(beatPosition(tempo, 1500)).toBe(0);
    expect(beatPosition(tempo, 2000)).toBe(1);
    expect(beatPosition(tempo, 1250)).toBe(-0.5);
  });
});
