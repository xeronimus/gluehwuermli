import {channelAddress, fixturePresets} from '@shared/fixtures';
import type {Fixture, FixturePreset, SetChannelRequest} from '@shared/ipc';

import {channelValueOf} from './channelValues';
import {numberOf} from './channelValuesDraft';
import {type ChaseDraft, type ChaseStepDraft, type ChaseStepValueDraft, sortedByChannel} from './chaseDraft';

/**
 * every channel of the checked fixtures, on its absolute address, at the value it has now; as it is, not fitted to the
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

/** a preset to take into a step, with the fixture whose addresses it is set on */
export interface PresetChoice {
  readonly fixture: Fixture;
  readonly preset: FixturePreset;
}

/** every preset of every fixture, in the order of the fixture list and of the fixture's presets */
export const presetChoices = (fixtures: readonly Fixture[]): PresetChoice[] =>
  fixtures.flatMap((fixture) => fixturePresets(fixture).map((preset) => ({fixture, preset})));

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
