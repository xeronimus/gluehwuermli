import {type ChaseError, chaseOwnErrors, chaseStepErrors} from '@shared/chases';
import {DMX_MIN_VALUE, FIRST_DMX_CHANNEL, LAST_DMX_CHANNEL} from '@shared/dmx';
import {channelAddress} from '@shared/fixtures';
import {CHASE_REPEAT_MIN, type Chase, type ChaseRepeat, type ChaseStep, type Fixture} from '@shared/ipc';

import {numberOf} from './channelValuesDraft';
import {holdSeconds} from './chaseRows';
import {type MoveDirection, moved} from './listOrder';

/** a chase as typed into the editor: the numbers are still text, so a half-typed value doesn't jump */
export interface ChaseDraft {
  readonly name: string;
  readonly repeatType: ChaseRepeat['type'];
  /** the number of passes of a `times` repeat; kept while another repeat is chosen, so switching back loses nothing */
  readonly repeatCount: string;
  readonly steps: readonly ChaseStepDraft[];
}

export interface ChaseStepDraft {
  /** the step's identity, stored with it; a moved step keeps its focus */
  readonly id: string;
  /** in seconds, two decimals */
  readonly hold: string;
  readonly values: readonly ChaseStepValueDraft[];
}

export interface ChaseStepValueDraft {
  readonly channel: string;
  readonly value: string;
}

export const CHASE_REPEAT_TYPES: readonly ChaseRepeat['type'][] = ['once', 'times', 'forever'];

const MS_PER_SECOND = 1000;
/** the hold of the first step added; later ones take the hold of the step before them */
const FIRST_STEP_HOLD_MS = 1000;

export const newChaseDraft = (): ChaseDraft => ({
  name: '',
  repeatType: 'once',
  repeatCount: String(CHASE_REPEAT_MIN),
  steps: []
});

const stepDraftOf = (step: ChaseStep): ChaseStepDraft => ({
  id: step.id,
  hold: holdSeconds(step.holdMs),
  values: step.values.map(({channel, value}) => ({channel: String(channel), value: String(value)}))
});

export const chaseDraftOf = (chase: Chase): ChaseDraft => ({
  name: chase.name,
  repeatType: chase.repeat.type,
  repeatCount: chase.repeat.type === 'times' ? String(chase.repeat.count) : String(CHASE_REPEAT_MIN),
  steps: chase.steps.map(stepDraftOf)
});

/** the hold typed in seconds as stored, in whole milliseconds; NaN for a blank field, which the validation reports */
export const holdMsOf = (holdText: string): number => Math.round(numberOf(holdText) * MS_PER_SECOND);

function repeatOf({repeatType, repeatCount}: ChaseDraft): ChaseRepeat {
  switch (repeatType) {
    case 'once':
      return {type: 'once'};
    case 'times':
      return {type: 'times', count: numberOf(repeatCount)};
    case 'forever':
      return {type: 'forever'};
  }
}

const stepOf = (step: ChaseStepDraft): ChaseStep => ({
  id: step.id,
  holdMs: holdMsOf(step.hold),
  values: step.values.map((value) => ({channel: numberOf(value.channel), value: numberOf(value.value)}))
});

/** the chase as it is saved, with a trimmed name; it may be invalid, chaseEditErrors says why */
export const chaseOfDraft = (id: string, draft: ChaseDraft): Chase => ({
  id,
  name: draft.name.trim(),
  repeat: repeatOf(draft),
  steps: draft.steps.map(stepOf)
});

/** what the editor shows: the chase's own problems below the steps, each step's at the step */
export interface ChaseEditErrors {
  readonly chase: readonly ChaseError[];
  /** at the same index as the draft's steps */
  readonly steps: readonly (readonly ChaseError[])[];
}

export function chaseEditErrors(draft: ChaseDraft): ChaseEditErrors {
  const chase = chaseOfDraft('draft', draft);
  return {chase: chaseOwnErrors(chase), steps: chase.steps.map(chaseStepErrors)};
}

export const canSaveChase = (errors: ChaseEditErrors): boolean =>
  errors.chase.length === 0 && errors.steps.every((stepErrors) => stepErrors.length === 0);

const withSteps = (draft: ChaseDraft, steps: readonly ChaseStepDraft[]): ChaseDraft => ({...draft, steps});

const withStepAt = (
  draft: ChaseDraft,
  stepIndex: number,
  change: (step: ChaseStepDraft) => ChaseStepDraft
): ChaseDraft =>
  withSteps(
    draft,
    draft.steps.map((step, index) => (index === stepIndex ? change(step) : step))
  );

/** an empty step at the end, holding as long as the step before it (1 s for the first) */
export function withNewStep(draft: ChaseDraft, id: string): ChaseDraft {
  const previous = draft.steps.at(-1);
  const hold = previous ? previous.hold : holdSeconds(FIRST_STEP_HOLD_MS);
  return withSteps(draft, [...draft.steps, {id, hold, values: []}]);
}

/** a copy of the step with its hold and values, right after it, under a new id */
export function withStepDuplicated(draft: ChaseDraft, stepIndex: number, id: string): ChaseDraft {
  const step = draft.steps[stepIndex];
  if (!step) {
    return draft;
  }
  return withSteps(draft, [...draft.steps.slice(0, stepIndex + 1), {...step, id}, ...draft.steps.slice(stepIndex + 1)]);
}

export const withStepMoved = (draft: ChaseDraft, stepIndex: number, direction: MoveDirection): ChaseDraft =>
  withSteps(draft, moved(draft.steps, stepIndex, direction));

export const withoutStep = (draft: ChaseDraft, stepIndex: number): ChaseDraft =>
  withSteps(
    draft,
    draft.steps.filter((_, index) => index !== stepIndex)
  );

export const withStepHold = (draft: ChaseDraft, stepIndex: number, hold: string): ChaseDraft =>
  withStepAt(draft, stepIndex, (step) => ({...step, hold}));

export const withStepValueChange = (
  draft: ChaseDraft,
  stepIndex: number,
  valueIndex: number,
  change: Partial<ChaseStepValueDraft>
): ChaseDraft =>
  withStepAt(draft, stepIndex, (step) => ({
    ...step,
    values: step.values.map((value, index) => (index === valueIndex ? {...value, ...change} : value))
  }));

export const withoutStepValue = (draft: ChaseDraft, stepIndex: number, valueIndex: number): ChaseDraft =>
  withStepAt(draft, stepIndex, (step) => ({...step, values: step.values.filter((_, index) => index !== valueIndex)}));

/**
 * the channel a channel added by hand starts on: the one after the highest the step sets, so a run of channels is
 * typed quickly; the lowest free one once that is past the last channel
 */
export function nextFreeChannel(values: readonly ChaseStepValueDraft[]): number {
  const used = new Set(values.map(({channel}) => numberOf(channel)));
  const highest = Math.max(FIRST_DMX_CHANNEL - 1, ...[...used].filter(Number.isInteger));
  if (highest < LAST_DMX_CHANNEL) {
    return highest + 1;
  }
  for (let channel = FIRST_DMX_CHANNEL; channel <= LAST_DMX_CHANNEL; channel++) {
    if (!used.has(channel)) {
      return channel;
    }
  }
  return LAST_DMX_CHANNEL;
}

/** a channel added by hand at the end of the step, at 0 */
export const withNewStepValue = (draft: ChaseDraft, stepIndex: number): ChaseDraft =>
  withStepAt(draft, stepIndex, (step) => ({
    ...step,
    values: [...step.values, {channel: String(nextFreeChannel(step.values)), value: String(DMX_MIN_VALUE)}]
  }));

/** a fixture channel on an address, for a step value's label */
export interface FixtureChannelLabel {
  readonly fixtureName: string;
  readonly channelName: string;
}

/**
 * the fixture channels on the address, all of them where fixtures share it, in the order of the fixture list; none
 * for an address without a fixture or a channel that isn't a number. Only a label: a step stores the address alone
 */
export const fixtureChannelsAt = (fixtures: readonly Fixture[], channelText: string): FixtureChannelLabel[] => {
  const address = numberOf(channelText);
  return fixtures.flatMap((fixture) =>
    fixture.channels
      .filter((channel) => channelAddress(fixture, channel) === address)
      .map((channel) => ({fixtureName: fixture.name, channelName: channel.name}))
  );
};
