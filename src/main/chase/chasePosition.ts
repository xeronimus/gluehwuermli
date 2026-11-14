import {passCount, stepFadeMs} from '@shared/chases';
import type {Chase, ChaseStep} from '@shared/ipc';

/** a step of a chase and the pass it is in, both counted from 0 */
export interface StepPosition {
  readonly stepIndex: number;
  readonly passIndex: number;
}

/**
 * where a chase is at a given time. `fadeProgress` is how far the step's fade in is, from 0 when the step begins to 1
 * once its hold has begun; always 1 for a step without a fade
 */
export type ChasePosition =
  ({readonly type: 'playing'; readonly fadeProgress: number} & StepPosition) | {readonly type: 'finished'};

const FINISHED: ChasePosition = {type: 'finished'};

/** a step's fade in and then its hold, in milliseconds */
const stepDurationMs = (step: ChaseStep): number => stepFadeMs(step) + step.holdMs;

/** one run through all steps, each fading in and holding, in milliseconds */
export const passDurationMs = (chase: Chase): number =>
  chase.steps.reduce((sum, step) => sum + stepDurationMs(step), 0);

/** how far into its fade a step is after `intoStepMs`; a step without a fade is there at once */
const fadeProgressOf = (step: ChaseStep, intoStepMs: number): number => {
  const fadeMs = stepFadeMs(step);
  return fadeMs > 0 ? Math.min(1, intoStepMs / fadeMs) : 1;
};

/**
 * The step and pass of `chase` after it has played for `elapsedMs` (paused time not counted). Computed from the start
 * every time rather than from the last step, so a tick that sees a step late never shifts the steps after it: a long
 * loop doesn't drift. A step starts at its time, inclusive, with its fade and then its hold; a chase that doesn't repeat
 * is finished once the last step's hold is over.
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
  let stepStartMs = 0;
  const intoPassMs = elapsed - passIndex * passMs;
  for (const [stepIndex, step] of chase.steps.entries()) {
    const stepEndMs = stepStartMs + stepDurationMs(step);
    if (intoPassMs < stepEndMs) {
      return {type: 'playing', stepIndex, passIndex, fadeProgress: fadeProgressOf(step, intoPassMs - stepStartMs)};
    }
    stepStartMs = stepEndMs;
  }
  return FINISHED;
}

/** how many steps lie between two positions of the same chase, counting `to` but not `from` */
export const stepsBetween = (chase: Chase, from: StepPosition, to: StepPosition): number =>
  (to.passIndex - from.passIndex) * chase.steps.length + (to.stepIndex - from.stepIndex);

/** the step before `position`: the last step of the pass before when `position` is a pass's first step */
export const previousOf = (chase: Chase, position: StepPosition): StepPosition =>
  position.stepIndex > 0
    ? {stepIndex: position.stepIndex - 1, passIndex: position.passIndex}
    : {stepIndex: chase.steps.length - 1, passIndex: position.passIndex - 1};

/** the last step of the last pass, where a chase that doesn't loop ends */
export const lastPosition = (chase: Chase): StepPosition => ({
  stepIndex: chase.steps.length - 1,
  passIndex: passCount(chase.repeat) - 1
});
