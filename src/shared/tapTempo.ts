import {MS_PER_MINUTE} from './time';

/**
 * Tap tempo: the taps of a tempo pad to a tempo and a downbeat. Pure, so main's tempo clock and the renderer's
 * in-memory tempo service share it. Times are milliseconds on whatever monotonic clock the caller timestamps with.
 */

/** a tap later than this after the last accepted one starts a new sequence; also the slowest tempo, 30 BPM */
export const NEW_SEQUENCE_GAP_MS = 2000;

/** an interval shorter than this (over 300 BPM) is a bounced key, not a beat */
export const MIN_TAP_INTERVAL_MS = 200;

/** how far an interval may be off the sequence's average before the tap is ignored, as a fraction of the average */
export const TAP_OUTLIER_TOLERANCE = 0.25;

/** the taps it takes to set a tempo: three intervals */
export const TAPS_FOR_TEMPO = 4;

/** the tempo is the average of at most this many of the latest intervals */
export const TAP_INTERVALS_AVERAGED = 8;

/** the ignored taps in a row that start a new sequence at the last of them, so a stray first interval can't lock out */
const IGNORED_TAPS_FOR_RESTART = 2;

/** the accepted taps of the current sequence, oldest first, and how many taps were ignored since the last accepted one */
export interface TapSequence {
  readonly tapsMs: readonly number[];
  readonly ignoredInARow: number;
}

export const NO_TAPS: TapSequence = {tapsMs: [], ignoredInARow: 0};

/** a tempo: how long a beat lasts and when one fell (the last accepted tap) */
export interface Tempo {
  readonly beatMs: number;
  readonly downbeatMs: number;
}

const intervalsOf = (tapsMs: readonly number[]): number[] =>
  tapsMs.slice(1).map((tapMs, index) => tapMs - (tapsMs[index] ?? tapMs));

const averageOf = (values: readonly number[]): number => values.reduce((sum, value) => sum + value, 0) / values.length;

const isOutlier = (intervalMs: number, averageMs: number): boolean =>
  Math.abs(intervalMs - averageMs) > averageMs * TAP_OUTLIER_TOLERANCE;

const startedAt = (tapMs: number): TapSequence => ({tapsMs: [tapMs], ignoredInARow: 0});

/** the sequence after a tap: accepted, ignored (a bounce or far off the average), or the start of a new sequence */
export function withTap(sequence: TapSequence, tapMs: number): TapSequence {
  const lastTapMs = sequence.tapsMs.at(-1);
  if (lastTapMs === undefined || tapMs - lastTapMs > NEW_SEQUENCE_GAP_MS) {
    return startedAt(tapMs);
  }
  const intervalMs = tapMs - lastTapMs;
  if (intervalMs < MIN_TAP_INTERVAL_MS) {
    return sequence;
  }
  const intervals = intervalsOf(sequence.tapsMs);
  if (intervals.length > 0 && isOutlier(intervalMs, averageOf(intervals))) {
    const ignoredInARow = sequence.ignoredInARow + 1;
    return ignoredInARow >= IGNORED_TAPS_FOR_RESTART ? startedAt(tapMs) : {...sequence, ignoredInARow};
  }
  return {tapsMs: [...sequence.tapsMs, tapMs].slice(-(TAP_INTERVALS_AVERAGED + 1)), ignoredInARow: 0};
}

/** the sequence's tempo, from its fourth tap on: the average interval, the downbeat on the last tap */
export function tempoOf(sequence: TapSequence): Tempo | undefined {
  const downbeatMs = sequence.tapsMs.at(-1);
  if (downbeatMs === undefined || sequence.tapsMs.length < TAPS_FOR_TEMPO) {
    return undefined;
  }
  return {beatMs: averageOf(intervalsOf(sequence.tapsMs)), downbeatMs};
}

/** the beats since the downbeat at this time, fractions included; negative before it */
export const beatPosition = (tempo: Tempo, ms: number): number => (ms - tempo.downbeatMs) / tempo.beatMs;

export const bpmOf = (tempo: Tempo): number => MS_PER_MINUTE / tempo.beatMs;
