import type {ChaseError, ChaseValueError} from '@shared/chases';
import {channelAddress} from '@shared/fixtures';
import type {Fixture, FixtureChannel} from '@shared/ipc';

import {numberOf} from './channelValuesDraft';
import type {ChaseStepValueDraft} from './chaseDraft';

/** one of a step's values in the table, under a fixture or under Unassigned */
export interface ChaseStepRow {
  /** where the value is in the step */
  readonly valueIndex: number;
  readonly value: ChaseStepValueDraft;
  /** the group's fixture channel on the row's address; none under Unassigned, or while the channel is typed away */
  readonly channel?: FixtureChannel;
}

/** the rows of a step under one heading: a fixture using their addresses, or Unassigned for addresses of no fixture */
export type ChaseStepGroup =
  | {readonly kind: 'fixture'; readonly fixture: Fixture; readonly rows: readonly ChaseStepRow[]}
  | {readonly kind: 'unassigned'; readonly rows: readonly ChaseStepRow[]};

/** a row whose channel is being typed: it stays under the heading of the channel it had when its field got the focus */
export interface ChannelBeingTyped {
  readonly id: string;
  readonly channel: string;
}

const channelAt = (fixture: Fixture, address: number): FixtureChannel | undefined =>
  fixture.channels.find((channel) => channelAddress(fixture, channel) === address);

/**
 * The step's values grouped by the fixtures using their addresses, in the order of the fixture list, then the addresses
 * of no fixture (and channels that aren't a number) under Unassigned. A shared address is shown under every fixture
 * using it. The rows keep the order of the step. A row whose channel is being typed stays where it was, so its field
 * keeps the focus while the number is half typed; the step only stores addresses, the groups are just for showing them
 */
export function chaseStepGroups(
  fixtures: readonly Fixture[],
  values: readonly ChaseStepValueDraft[],
  beingTyped?: ChannelBeingTyped
): ChaseStepGroup[] {
  const placedAt = (value: ChaseStepValueDraft) =>
    numberOf(value.id === beingTyped?.id ? beingTyped.channel : value.channel);
  const rowsOf = (fixture: Fixture): ChaseStepRow[] =>
    values.flatMap((value, valueIndex) => {
      if (!channelAt(fixture, placedAt(value))) {
        return [];
      }
      const channel = channelAt(fixture, numberOf(value.channel));
      return [{valueIndex, value, ...(channel && {channel})}];
    });
  const fixtureGroups = fixtures.flatMap((fixture): ChaseStepGroup[] => {
    const rows = rowsOf(fixture);
    return rows.length > 0 ? [{kind: 'fixture', fixture, rows}] : [];
  });
  const unassigned = values.flatMap((value, valueIndex) =>
    fixtures.some((fixture) => channelAt(fixture, placedAt(value))) ? [] : [{valueIndex, value}]
  );
  return unassigned.length > 0 ? [...fixtureGroups, {kind: 'unassigned', rows: unassigned}] : fixtureGroups;
}

/** where the group's rows are in the step: removing a group removes them all */
export const groupValueIndexes = (group: ChaseStepGroup): number[] => group.rows.map(({valueIndex}) => valueIndex);

/** the name of the value on a channel with named positions; none for another value or channel */
export function positionNameOf(channel: FixtureChannel | undefined, valueText: string): string | undefined {
  if (channel?.values?.mode !== 'positions') {
    return undefined;
  }
  const value = numberOf(valueText);
  return channel.values.positions.find((position) => position.value === value)?.name;
}

const isValueError = (error: ChaseError): error is ChaseValueError => 'valueIndexes' in error;

/** the step's problems of the row at `valueIndex`, shown on that row */
export const rowErrors = (errors: readonly ChaseError[], valueIndex: number): ChaseValueError[] =>
  errors.filter(isValueError).filter(({valueIndexes}) => valueIndexes.includes(valueIndex));

/**
 * the step's problems not on a row, shown below the table; an empty step's missing values aren't among them, the
 * table shows a hint instead
 */
export const stepWideErrors = (errors: readonly ChaseError[]): ChaseError[] =>
  errors.filter((error) => !isValueError(error) && error.type !== 'chase-step-values-missing');
