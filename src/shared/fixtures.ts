import Value from 'typebox/value';

import {DMX_MAX_VALUE, DMX_MIN_VALUE, FIRST_DMX_CHANNEL, LAST_DMX_CHANNEL, isDmxValue} from './dmx';
import {
  FIXTURE_DESCRIPTION_MAX_LENGTH,
  FIXTURE_HINT_MAX_LENGTH,
  FIXTURE_PRESET_NAME_MAX_LENGTH,
  FIXTURE_SETUP_VERSION,
  type Fixture,
  type FixtureChannel,
  type FixturePreset,
  type FixtureSetup,
  FixtureSetupSchema
} from './ipc';

/**
 * Addressing and validation of fixtures, used by both processes: the renderer shows the problems while editing, the
 * main process refuses to store or load a setup that has any.
 */

/** two fixtures sharing at least one DMX address: allowed (e.g. two PARs moving together), but worth a warning */
export interface FixtureOverlap {
  readonly first: Fixture;
  readonly second: Fixture;
  readonly addresses: readonly number[];
}

export const fixtureSetupOf = (fixtures: readonly Fixture[]): FixtureSetup => ({
  version: FIXTURE_SETUP_VERSION,
  fixtures: [...fixtures]
});

export const emptyFixtureSetup = (): FixtureSetup => fixtureSetupOf([]);

/** the absolute DMX channel of one of the fixture's channels */
export const channelAddress = (fixture: Pick<Fixture, 'startAddress'>, channel: FixtureChannel): number =>
  fixture.startAddress + channel.offset;

export const fixtureAddresses = (fixture: Fixture): number[] =>
  fixture.channels.map((channel) => channelAddress(fixture, channel));

/** the highest address the fixture uses */
export const lastAddress = (fixture: Fixture): number => Math.max(fixture.startAddress, ...fixtureAddresses(fixture));

export const fitsInUniverse = (fixture: Fixture): boolean =>
  fixture.startAddress >= FIRST_DMX_CHANNEL && lastAddress(fixture) <= LAST_DMX_CHANNEL;

/** the fixture's presets; none in a file from before presets existed */
export const fixturePresets = (fixture: Fixture): readonly FixturePreset[] => fixture.presets ?? [];

const isBlank = (text: string) => text.trim().length === 0;

const duplicatesOf = <T>(values: readonly T[]): T[] => [
  ...new Set(values.filter((value, index) => values.indexOf(value) !== index))
];

/** the preset as named in an error message; one still being named in the editor has no name yet */
const presetLabel = (preset: FixturePreset): string => (isBlank(preset.name) ? 'without a name' : preset.name);

/** what is wrong with the fixture's presets: they need a name and values, on channels the fixture has, once each */
function presetErrors(fixture: Fixture): string[] {
  const errors: string[] = [];
  const presets = fixturePresets(fixture);
  const offsets = new Set(fixture.channels.map((channel) => channel.offset));
  if (presets.some((preset) => isBlank(preset.name))) {
    errors.push('Every preset needs a name');
  }
  if (presets.some((preset) => preset.name.length > FIXTURE_PRESET_NAME_MAX_LENGTH)) {
    errors.push(`A preset name can have at most ${FIXTURE_PRESET_NAME_MAX_LENGTH} characters`);
  }
  duplicatesOf(presets.map((preset) => preset.id)).forEach((id) => errors.push(`Preset id ${id} is used twice`));
  presets.forEach((preset) => {
    const label = presetLabel(preset);
    const presetOffsets = preset.values.map((presetValue) => presetValue.offset);
    if (presetOffsets.length === 0) {
      errors.push(`The preset ${label} needs at least one channel`);
    }
    if (presetOffsets.some((offset) => !offsets.has(offset))) {
      errors.push(`The preset ${label} sets a channel the fixture doesn't have`);
    }
    if (duplicatesOf(presetOffsets).length > 0) {
      errors.push(`The preset ${label} sets a channel more than once`);
    }
    if (preset.values.some((presetValue) => !isDmxValue(presetValue.value))) {
      errors.push(`The values of the preset ${label} must be whole numbers from ${DMX_MIN_VALUE} to ${DMX_MAX_VALUE}`);
    }
  });
  return errors;
}

/** what keeps the fixture from being saved; empty when it is valid */
export function fixtureErrors(fixture: Fixture): string[] {
  const errors: string[] = [];
  if (isBlank(fixture.name)) {
    errors.push('The fixture needs a name');
  }
  if (!Number.isInteger(fixture.startAddress) || fixture.startAddress < FIRST_DMX_CHANNEL) {
    errors.push(`The start address must be a whole number from ${FIRST_DMX_CHANNEL} to ${LAST_DMX_CHANNEL}`);
  }
  if ((fixture.description?.length ?? 0) > FIXTURE_DESCRIPTION_MAX_LENGTH) {
    errors.push(`The description can have at most ${FIXTURE_DESCRIPTION_MAX_LENGTH} characters`);
  }
  if ((fixture.hint?.length ?? 0) > FIXTURE_HINT_MAX_LENGTH) {
    errors.push(`The hint can have at most ${FIXTURE_HINT_MAX_LENGTH} characters`);
  }
  if (fixture.channels.length === 0) {
    errors.push('The fixture needs at least one channel');
  }
  if (fixture.channels.some((channel) => isBlank(channel.name))) {
    errors.push('Every channel needs a name');
  }
  if (fixture.channels.some((channel) => !Number.isInteger(channel.offset) || channel.offset < 0)) {
    errors.push('Offsets must be whole numbers from 0');
  }
  duplicatesOf(fixture.channels.map((channel) => channel.offset).filter(Number.isInteger)).forEach((offset) =>
    errors.push(`Offset ${offset} is used by more than one channel`)
  );
  if (fixture.channels.some((channel) => channel.lock && !isDmxValue(channel.lock.max))) {
    errors.push(`The maximum while locked must be a whole number from ${DMX_MIN_VALUE} to ${DMX_MAX_VALUE}`);
  }
  if (errors.length === 0 && !fitsInUniverse(fixture)) {
    errors.push(`The fixture ends at address ${lastAddress(fixture)}, after the last one (${LAST_DMX_CHANNEL})`);
  }
  return [...errors, ...presetErrors(fixture)];
}

/** every pair of fixtures sharing an address, in the order of the list */
export function overlappingFixtures(fixtures: readonly Fixture[]): FixtureOverlap[] {
  return fixtures.flatMap((first, index) =>
    fixtures.slice(index + 1).flatMap((second) => {
      const secondAddresses = new Set(fixtureAddresses(second));
      const addresses = fixtureAddresses(first).filter((address) => secondAddresses.has(address));
      return addresses.length > 0 ? [{first, second, addresses}] : [];
    })
  );
}

/** the highest value per DMX address while the channel lock is on; an address missing here is never capped */
export type ChannelLimits = ReadonlyMap<number, number>;

/** the caps the fixtures' channels declare, per address; fixtures sharing an address with different caps: the lowest */
export function channelLimits(fixtures: readonly Fixture[]): ChannelLimits {
  const limits = new Map<number, number>();
  fixtures.forEach((fixture) =>
    fixture.channels.forEach((channel) => {
      if (!channel.lock) {
        return;
      }
      const address = channelAddress(fixture, channel);
      limits.set(address, Math.min(channel.lock.max, limits.get(address) ?? channel.lock.max));
    })
  );
  return limits;
}

const hasUniqueIds = (fixtures: readonly Fixture[]) => new Set(fixtures.map(({id}) => id)).size === fixtures.length;

/** the payload if it is a setup the app can work with (schema, unique ids, every fixture valid), otherwise undefined */
export const parseFixtureSetup = (payload: unknown): FixtureSetup | undefined =>
  Value.Check(FixtureSetupSchema, payload) &&
  hasUniqueIds(payload.fixtures) &&
  payload.fixtures.every((fixture) => fixtureErrors(fixture).length === 0)
    ? payload
    : undefined;
