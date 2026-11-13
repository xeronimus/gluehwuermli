import {isDmxChannel} from '@shared/dmx';
import type {Fixture, FixtureChannel} from '@shared/ipc';

import {numberOf} from './channelValuesDraft';
import {type ChaseStepDraft, type ChaseStepValueDraft, setsChannel} from './chaseDraft';
import {holdMsOf, msOfSecondsText} from './chaseHold';
import {channelAt} from './chaseStepTable';

/**
 * The chase editor's All steps panel: what it offers to remove, and what each of its actions would do, said while its
 * button is hovered. The changes themselves are in chaseDraft.ts
 */

/** a channel the steps set, offered for removal */
export interface RemovableChannel {
  readonly channel: number;
  /** how many steps set it */
  readonly stepCount: number;
  /** the group's fixture channel on the address; none under Unassigned */
  readonly fixtureChannel?: FixtureChannel;
}

/** the channels to remove under one heading, as the step table groups a step's rows */
export type RemovableChannelGroup =
  | {readonly kind: 'fixture'; readonly fixture: Fixture; readonly channels: readonly RemovableChannel[]}
  | {readonly kind: 'unassigned'; readonly channels: readonly RemovableChannel[]};

/** every valid channel the steps set, lowest first, with how many steps set it (a step setting one twice counts once) */
function stepCountsByChannel(steps: readonly ChaseStepDraft[]): Map<number, number> {
  const channels = new Set(
    steps.flatMap((step) => step.values.map((row) => numberOf(row.channel))).filter(isDmxChannel)
  );
  return new Map(
    [...channels]
      .toSorted((first, second) => first - second)
      .map((channel) => [channel, steps.filter((step) => setsChannel(step, channel)).length])
  );
}

/**
 * The channels the steps set, grouped by the fixtures using them in the order of the fixture list, then the addresses
 * of no fixture under Unassigned; a shared address under every fixture using it, as in the step table. A channel that
 * isn't a valid number is left out: it can't be picked, and its row's error says what is wrong with it
 */
export function removableChannels(
  fixtures: readonly Fixture[],
  steps: readonly ChaseStepDraft[]
): RemovableChannelGroup[] {
  const counts = [...stepCountsByChannel(steps)];
  const fixtureGroups = fixtures.flatMap((fixture): RemovableChannelGroup[] => {
    const channels = counts.flatMap(([channel, stepCount]) => {
      const fixtureChannel = channelAt(fixture, channel);
      return fixtureChannel ? [{channel, stepCount, fixtureChannel}] : [];
    });
    return channels.length > 0 ? [{kind: 'fixture', fixture, channels}] : [];
  });
  const unassigned = counts
    .filter(([channel]) => !fixtures.some((fixture) => channelAt(fixture, channel)))
    .map(([channel, stepCount]) => ({channel, stepCount}));
  return unassigned.length > 0 ? [...fixtureGroups, {kind: 'unassigned', channels: unassigned}] : fixtureGroups;
}

/**
 * the channel Remove would remove: the one picked, while the steps still set it. Nothing at first and once it is gone,
 * never another one, so a second click after a removal can't remove a channel that wasn't picked
 */
export const pickedRemovableChannel = (
  groups: readonly RemovableChannelGroup[],
  picked: number | undefined
): number | undefined =>
  groups.some(({channels}) => channels.some(({channel}) => channel === picked)) ? picked : undefined;

/** what setting the hold of all steps would do: how many steps would hold for another time, and the hold set */
export interface HoldOfAllStepsEffect {
  readonly changedCount: number;
  readonly holdMs: number;
}

export const holdOfAllStepsEffect = (steps: readonly ChaseStepDraft[], holdMs: number): HoldOfAllStepsEffect => ({
  changedCount: steps.filter((step) => holdMsOf(step.hold) !== holdMs).length,
  holdMs
});

/** what setting the fade in of all steps would do: how many steps would fade for another time, and the fade set */
export interface FadeOfAllStepsEffect {
  readonly changedCount: number;
  readonly fadeMs: number;
}

export const fadeOfAllStepsEffect = (steps: readonly ChaseStepDraft[], fadeMs: number): FadeOfAllStepsEffect => ({
  changedCount: steps.filter((step) => msOfSecondsText(step.fade) !== fadeMs).length,
  fadeMs
});

/** what adding a channel to all steps would do: the steps that don't set it get it, of all the chase's steps */
export interface ChannelInAllStepsEffect {
  readonly addedCount: number;
  readonly stepCount: number;
}

/** the steps that would get the channel, by their id: the caller makes their new rows' ids from these */
export const stepIdsWithoutChannel = (steps: readonly ChaseStepDraft[], channel: number): string[] =>
  steps.filter((step) => !setsChannel(step, channel)).map(({id}) => id);

export const channelInAllStepsEffect = (
  steps: readonly ChaseStepDraft[],
  channel: number
): ChannelInAllStepsEffect => ({
  addedCount: stepIdsWithoutChannel(steps, channel).length,
  stepCount: steps.length
});

/** what removing a channel from all steps would do */
export interface WithoutChannelInAllStepsEffect {
  /** the steps that set it */
  readonly removedCount: number;
  /** where the steps left without any channel are in the chase */
  readonly emptiedStepIndexes: readonly number[];
  /** the shown step's rows that would go, by their id */
  readonly shownChangedIds: readonly string[];
}

export function withoutChannelInAllStepsEffect(
  steps: readonly ChaseStepDraft[],
  channel: number,
  shownStepId: string | undefined
): WithoutChannelInAllStepsEffect {
  const isOnChannel = (row: ChaseStepValueDraft) => numberOf(row.channel) === channel;
  const shownStep = steps.find(({id}) => id === shownStepId);
  return {
    removedCount: steps.filter((step) => setsChannel(step, channel)).length,
    emptiedStepIndexes: steps.flatMap((step, index) =>
      step.values.length > 0 && step.values.every(isOnChannel) ? [index] : []
    ),
    shownChangedIds: shownStep ? shownStep.values.filter(isOnChannel).map(({id}) => id) : []
  };
}

/**
 * what the All steps panel says below its actions: what the hovered action would do, or, after a click, what it did
 * (until the next hover)
 */
export type AllStepsLine =
  | {readonly action: 'fade'; readonly done: boolean; readonly effect: FadeOfAllStepsEffect}
  | {readonly action: 'hold'; readonly done: boolean; readonly effect: HoldOfAllStepsEffect}
  | {readonly action: 'add'; readonly done: boolean; readonly channel: number; readonly effect: ChannelInAllStepsEffect}
  | {
      readonly action: 'remove';
      readonly done: boolean;
      readonly channel: number;
      readonly effect: WithoutChannelInAllStepsEffect;
    };
