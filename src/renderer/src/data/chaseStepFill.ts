import {channelAddress} from '@shared/fixtures';
import type {Fixture, SetChannelRequest} from '@shared/ipc';

import {channelValueOf} from './channelValues';
import {numberOf} from './channelValuesDraft';
import {type ChaseDraft, type ChaseStepDraft, type ChaseStepValueDraft, sortedByChannel} from './chaseDraft';

/**
 * every channel of the fixtures picked, on its absolute address, at the value it has now; as it is, not fitted to the
 * channel's value rules: a step isn't checked against them. Fixtures in the order of the fixture list
 */
export const currentFixturesChannelValues = (
  fixtures: readonly Fixture[],
  fixtureIds: readonly string[],
  channelValues: readonly number[]
): SetChannelRequest[] =>
  fixtures
    .filter(({id}) => fixtureIds.includes(id))
    .flatMap((fixture) =>
      fixture.channels.map((channel) => {
        const address = channelAddress(fixture, channel);
        return {channel: address, value: channelValueOf(channelValues, address)};
      })
    );

/** the step's rows with the values merged in: a channel a row already sets takes the new value, a new one gets a row */
function mergedValues(
  values: readonly ChaseStepValueDraft[],
  taken: readonly SetChannelRequest[],
  newId: () => string
): ChaseStepValueDraft[] {
  // the last value taken for a channel wins, as when the source is played
  const takenByChannel = new Map(taken.map(({channel, value}) => [channel, value]));
  const kept = values.map((row) => {
    const value = takenByChannel.get(numberOf(row.channel));
    return value === undefined ? row : {...row, value: String(value)};
  });
  const setChannels = new Set(values.map(({channel}) => numberOf(channel)));
  const added = [...takenByChannel]
    .filter(([channel]) => !setChannels.has(channel))
    .map(([channel, value]) => ({id: newId(), channel: String(channel), value: String(value)}));
  return sortedByChannel([...kept, ...added]);
}

/**
 * The step with the values taken (from the current values, a scene, a preset) merged in, sorted by channel: a channel
 * it already sets takes the new value, a new channel is added, the others stay. Only the channels and values are
 * kept, nothing about where they came from, so changing the source later doesn't change the chase
 */
export const withStepValuesTaken = (
  draft: ChaseDraft,
  stepIndex: number,
  taken: readonly SetChannelRequest[],
  newId: () => string
): ChaseDraft => ({
  ...draft,
  steps: draft.steps.map((step, index): ChaseStepDraft =>
    index === stepIndex ? {...step, values: mergedValues(step.values, taken, newId)} : step
  )
});

/** what taking values would do to a step: shown while a fill button is hovered, flashed once it is clicked */
export interface StepFillEffect {
  /** the rows whose value would change, by their id */
  readonly changedIds: readonly string[];
  /** the channels that would get a new row */
  readonly addedCount: number;
}

/** what withStepValuesTaken would change; a row taking the value it has is no change */
export function stepFillEffect(
  values: readonly ChaseStepValueDraft[],
  taken: readonly SetChannelRequest[]
): StepFillEffect {
  const takenByChannel = new Map(taken.map(({channel, value}) => [channel, value]));
  const changedIds = values
    .filter((row) => {
      const value = takenByChannel.get(numberOf(row.channel));
      return value !== undefined && value !== numberOf(row.value);
    })
    .map(({id}) => id);
  const setChannels = new Set(values.map(({channel}) => numberOf(channel)));
  const addedCount = [...takenByChannel.keys()].filter((channel) => !setChannels.has(channel)).length;
  return {changedIds, addedCount};
}
