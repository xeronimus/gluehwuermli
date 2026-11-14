import {referenceBpmOf} from '@shared/chases';
import type {Chase, ChaseSpeed} from '@shared/ipc';
import {type Tempo, beatPosition} from '@shared/tapTempo';
import {MS_PER_MINUTE} from '@shared/time';

import {stepEndMs} from './chasePosition';

/**
 * The chase clock (doc/chases.md): maps main's monotonic time ("wall" ms) to chase time, the chase's own unscaled
 * milliseconds that chasePosition reads. Piecewise linear: from `fromWallMs` on, chase time runs from `fromChaseMs` at
 * `rate`. Unsynced the rate is 1; synced it is the tapped tempo times the speed over the chase's reference tempo.
 * Every change (sync on or off, a new tempo or speed, resume) starts a new clock at the current chase time, so the
 * position never jumps, and a position is always one multiplication away from its anchor: nothing is added up per
 * tick, a synced chase doesn't drift.
 */
export interface ClockSegment {
  readonly fromWallMs: number;
  readonly fromChaseMs: number;
  readonly rate: number;
}

/** one segment, or a transition that ends the current step on the beat followed by the synced segment */
export type ChaseClock = readonly ClockSegment[];

/** the share of a step's rest that a resync must leave at least: the rest plays at most 2× faster, a fade never snaps */
const MIN_REST_SHARE = 0.5;

const chaseMsOn = (segment: ClockSegment, wallMs: number): number =>
  segment.fromChaseMs + (wallMs - segment.fromWallMs) * segment.rate;

/**
 * the chase time at `wallMs`: on the last segment that has begun, or on the first one extrapolated back, so a synced
 * start anchored on a coming beat is negative until then (chasePosition holds step 1 at its start)
 */
export function chaseMsAt(clock: ChaseClock, wallMs: number): number {
  const segment = clock.findLast(({fromWallMs}) => fromWallMs <= wallMs) ?? clock[0];
  return segment === undefined ? 0 : chaseMsOn(segment, wallMs);
}

/** chase time at the rate of the wall: the chase plays its own milliseconds */
export const freeClock = (wallMs: number, chaseMs: number): ChaseClock => [
  {fromWallMs: wallMs, fromChaseMs: chaseMs, rate: 1}
];

/** chase ms per wall ms while synced */
export const syncedRate = (chase: Chase, tempo: Tempo, speed: ChaseSpeed): number =>
  ((MS_PER_MINUTE / tempo.beatMs) * speed) / referenceBpmOf(chase);

/** how long one beat of the chase lasts in chase time: a beat at its reference tempo */
const chaseBeatMs = (chase: Chase): number => MS_PER_MINUTE / referenceBpmOf(chase);

/** how long a grid beat lasts in wall time: a tapped beat at 1×, half of one at 2× */
const gridBeatMs = (tempo: Tempo, speed: ChaseSpeed): number => tempo.beatMs / speed;

/** the grid beats since the downbeat: a chase beat falls where this is a whole number */
const gridPosition = (tempo: Tempo, speed: ChaseSpeed, wallMs: number): number => beatPosition(tempo, wallMs) * speed;

/** the wall time of a grid position */
const wallMsOfGrid = (tempo: Tempo, speed: ChaseSpeed, position: number): number =>
  tempo.downbeatMs + position * gridBeatMs(tempo, speed);

/** a synced start: the chase's beat 0 on the nearest grid beat, up to half a beat before or after now */
export function startedSyncedClock(chase: Chase, tempo: Tempo, speed: ChaseSpeed, wallNowMs: number): ChaseClock {
  const beatZeroMs = wallMsOfGrid(tempo, speed, Math.round(gridPosition(tempo, speed, wallNowMs)));
  return [{fromWallMs: beatZeroMs, fromChaseMs: 0, rate: syncedRate(chase, tempo, speed)}];
}

/**
 * synced from now on, at the chase time `chaseNowMs`: the current step ends on the grid point nearest to where it
 * would end at the synced rate, among those that leave its rest at least half its length, so it never ends at or
 * before now. Its end falls where the grid has the same fraction as the step's end in chase beats, so a step ending
 * on a half chase beat ends on a half grid beat and the grid of the whole chase stays aligned
 */
export function resyncedClock(
  chase: Chase,
  tempo: Tempo,
  speed: ChaseSpeed,
  wallNowMs: number,
  chaseNowMs: number
): ChaseClock {
  const rate = syncedRate(chase, tempo, speed);
  const endChaseMs = stepEndMs(chase, chaseNowMs);
  const restChaseMs = endChaseMs - chaseNowMs;
  const naturalEndMs = wallNowMs + restChaseMs / rate;
  const endBeat = endChaseMs / chaseBeatMs(chase);
  const endFraction = endBeat - Math.floor(endBeat);
  const earliestEndMs = wallNowMs + (naturalEndMs - wallNowMs) * MIN_REST_SHARE;
  let gridIndex = Math.round(gridPosition(tempo, speed, naturalEndMs) - endFraction);
  const endsInTime = (index: number) => {
    const endMs = wallMsOfGrid(tempo, speed, index + endFraction);
    return endMs >= earliestEndMs && endMs > wallNowMs;
  };
  while (!endsInTime(gridIndex)) {
    gridIndex += 1;
  }
  const endWallMs = wallMsOfGrid(tempo, speed, gridIndex + endFraction);
  return [
    {fromWallMs: wallNowMs, fromChaseMs: chaseNowMs, rate: restChaseMs / (endWallMs - wallNowMs)},
    {fromWallMs: endWallMs, fromChaseMs: endChaseMs, rate}
  ];
}
