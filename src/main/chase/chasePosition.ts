import {passCount} from '@shared/chases';
import type {Chase} from '@shared/ipc';

/** a step of a chase and the pass it is in, both counted from 0 */
export interface StepPosition {
  readonly stepIndex: number;
  readonly passIndex: number;
}

/** where a chase is at a given time */
export type ChasePosition = ({readonly type: 'playing'} & StepPosition) | {readonly type: 'finished'};

const FINISHED: ChasePosition = {type: 'finished'};

/** one run through all steps, in milliseconds */
export const passDurationMs = (chase: Chase): number => chase.steps.reduce((sum, {holdMs}) => sum + holdMs, 0);

/**
 * The step and pass of `chase` after it has played for `elapsedMs` (paused time not counted). Computed from the start
 * every time rather than from the last step, so a tick that sees a step late never shifts the steps after it: a long
 * loop doesn't drift. A step starts at its time, inclusive; a chase that doesn't repeat is finished once the last
 * step's hold is over.
 */
export function chasePosition(chase: Chase, elapsedMs: number): ChasePosition {
  const passMs = passDurationMs(chase);
  if (passMs <= 0) {
    return FINISHED;
  }
  const elapsed = Math.max(0, elapsedMs);
  const passIndex = Math.floor(elapsed / passMs);
  if (passIndex >= passCount(chase.repeat)) {
    return FINISHED;
  }
  let stepEndMs = 0;
  const intoPassMs = elapsed - passIndex * passMs;
  const stepIndex = chase.steps.findIndex(({holdMs}) => {
    stepEndMs += holdMs;
    return intoPassMs < stepEndMs;
  });
  return stepIndex < 0 ? FINISHED : {type: 'playing', stepIndex, passIndex};
}

/** how many steps lie between two positions of the same chase, counting `to` but not `from` */
export const stepsBetween = (chase: Chase, from: StepPosition, to: StepPosition): number =>
  (to.passIndex - from.passIndex) * chase.steps.length + (to.stepIndex - from.stepIndex);

/** the last step of the last pass, where a chase that doesn't loop ends */
export const lastPosition = (chase: Chase): StepPosition => ({
  stepIndex: chase.steps.length - 1,
  passIndex: passCount(chase.repeat) - 1
});
