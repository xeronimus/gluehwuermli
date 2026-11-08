import {isDmxChannel, isDmxValue} from './dmx';
import {
  CHASE_HOLD_MAX_MS,
  CHASE_HOLD_MIN_MS,
  CHASE_NAME_MAX_LENGTH,
  CHASE_REPEAT_MAX,
  CHASE_REPEAT_MIN,
  CHASE_STEPS_MAX,
  type Chase,
  type ChaseRepeat,
  type ChaseStep,
  type FixtureSetup
} from './ipc';
import {duplicatesOf, isBlank} from './validation';

/**
 * Validation of chases, used by both processes like the scenes' (scenes.ts): the renderer shows the problems while
 * editing, the main process refuses to store or load a setup that has any. A chase names absolute channels, never a
 * fixture, so it is checked without the fixtures: no fixture change makes a chase invalid, and a step's values aren't
 * held to the value rules of a fixture on that address.
 */

/** one empty list, so a store selector returns the same value every time */
const NO_CHASES: readonly Chase[] = [];

/** the setup's chases; none in a file from before chases existed */
export const setupChases = (setup: FixtureSetup): readonly Chase[] => setup.chases ?? NO_CHASES;

/** how many passes the chase plays; Infinity for one that loops until stopped */
export function passCount(repeat: ChaseRepeat): number {
  switch (repeat.type) {
    case 'once':
      return 1;
    case 'times':
      return repeat.count;
    case 'forever':
      return Number.POSITIVE_INFINITY;
  }
}

/** what keeps a chase from being saved, as a code (said in the UI language by the renderer) */
export type ChaseError =
  | {readonly type: 'chase-name-missing'}
  | {readonly type: 'chase-name-too-long'}
  | {readonly type: 'chase-repeat-invalid'}
  | {readonly type: 'chase-steps-missing'}
  | {readonly type: 'chase-steps-too-many'}
  | {readonly type: 'chase-step-id-twice'}
  | {readonly type: 'chase-step-hold-invalid'}
  | {readonly type: 'chase-step-values-missing'}
  | {readonly type: 'chase-step-channel-invalid'}
  | {readonly type: 'chase-step-channel-twice'}
  | {readonly type: 'chase-step-value-invalid'};

const isValidRepeat = (repeat: ChaseRepeat): boolean =>
  repeat.type !== 'times' ||
  (Number.isInteger(repeat.count) && repeat.count >= CHASE_REPEAT_MIN && repeat.count <= CHASE_REPEAT_MAX);

const isValidHold = (holdMs: number): boolean =>
  Number.isInteger(holdMs) && holdMs >= CHASE_HOLD_MIN_MS && holdMs <= CHASE_HOLD_MAX_MS;

/** what is wrong with one step, each problem once; the editor shows them at the step */
export function chaseStepErrors(step: ChaseStep): ChaseError[] {
  const errors: ChaseError[] = [];
  const channels = step.values.map(({channel}) => channel);
  if (!isValidHold(step.holdMs)) {
    errors.push({type: 'chase-step-hold-invalid'});
  }
  if (channels.length === 0) {
    errors.push({type: 'chase-step-values-missing'});
  }
  if (!channels.every(isDmxChannel)) {
    errors.push({type: 'chase-step-channel-invalid'});
  }
  if (duplicatesOf(channels).length > 0) {
    errors.push({type: 'chase-step-channel-twice'});
  }
  if (!step.values.every(({value}) => isDmxValue(value))) {
    errors.push({type: 'chase-step-value-invalid'});
  }
  return errors;
}

const firstOfEachType = (errors: readonly ChaseError[]): ChaseError[] =>
  errors.filter((error, index) => errors.findIndex(({type}) => type === error.type) === index);

/** what is wrong with the chase apart from its steps' own problems (chaseStepErrors) */
export function chaseOwnErrors(chase: Chase): ChaseError[] {
  const errors: ChaseError[] = [];
  if (isBlank(chase.name)) {
    errors.push({type: 'chase-name-missing'});
  }
  if (chase.name.length > CHASE_NAME_MAX_LENGTH) {
    errors.push({type: 'chase-name-too-long'});
  }
  if (!isValidRepeat(chase.repeat)) {
    errors.push({type: 'chase-repeat-invalid'});
  }
  if (chase.steps.length === 0) {
    errors.push({type: 'chase-steps-missing'});
  }
  if (chase.steps.length > CHASE_STEPS_MAX) {
    errors.push({type: 'chase-steps-too-many'});
  }
  if (duplicatesOf(chase.steps.map(({id}) => id)).length > 0) {
    errors.push({type: 'chase-step-id-twice'});
  }
  return errors;
}

/** what keeps the chase from being saved, each problem once; empty when it is valid */
export const chaseErrors = (chase: Chase): ChaseError[] =>
  firstOfEachType([...chaseOwnErrors(chase), ...chase.steps.flatMap(chaseStepErrors)]);

/** true when every chase is valid and no two share an id */
export function chasesAreValid(setup: FixtureSetup): boolean {
  const chases = setupChases(setup);
  return (
    duplicatesOf(chases.map(({id}) => id)).length === 0 && chases.every((chase) => chaseErrors(chase).length === 0)
  );
}
