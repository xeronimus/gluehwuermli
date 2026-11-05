import Value from 'typebox/value';

import {FIRST_DMX_CHANNEL, LAST_DMX_CHANNEL, isDmxValue} from './dmx';
import {
  FIXTURE_DESCRIPTION_MAX_LENGTH,
  FIXTURE_HINT_MAX_LENGTH,
  FIXTURE_PRESET_NAME_MAX_LENGTH,
  type Fixture,
  type FixtureChannel,
  type FixturePreset,
  type FixtureSetup,
  FixtureSetupSchema,
  PROJECT_VERSION
} from './ipc';
import {scenesAreValid} from './scenes';
import {duplicatesOf, isBlank} from './validation';

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
  version: PROJECT_VERSION,
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

/**
 * What keeps a fixture from being saved, as a code: the renderer says it in the UI language, main only checks that
 * there is none. A preset is named by its name, `undefined` while it has none yet (still being named in the editor).
 */
export type FixtureError =
  | {readonly type: 'name-missing'}
  | {readonly type: 'start-address-invalid'}
  | {readonly type: 'description-too-long'}
  | {readonly type: 'hint-too-long'}
  | {readonly type: 'channels-missing'}
  | {readonly type: 'channel-name-missing'}
  | {readonly type: 'offset-invalid'}
  | {readonly type: 'offset-used-twice'; readonly offset: number}
  | {readonly type: 'lock-max-invalid'}
  | {readonly type: 'past-universe-end'; readonly lastAddress: number}
  | {readonly type: 'preset-name-missing'}
  | {readonly type: 'preset-name-too-long'}
  | {readonly type: 'preset-id-used-twice'; readonly id: string}
  | {readonly type: 'preset-channels-missing'; readonly presetName: string | undefined}
  | {readonly type: 'preset-channel-unknown'; readonly presetName: string | undefined}
  | {readonly type: 'preset-channel-twice'; readonly presetName: string | undefined}
  | {readonly type: 'preset-value-invalid'; readonly presetName: string | undefined};

const presetNameOf = (preset: FixturePreset): string | undefined => (isBlank(preset.name) ? undefined : preset.name);

/** what is wrong with the fixture's presets: they need a name and values, on channels the fixture has, once each */
function presetErrors(fixture: Fixture): FixtureError[] {
  const errors: FixtureError[] = [];
  const presets = fixturePresets(fixture);
  const offsets = new Set(fixture.channels.map((channel) => channel.offset));
  if (presets.some((preset) => isBlank(preset.name))) {
    errors.push({type: 'preset-name-missing'});
  }
  if (presets.some((preset) => preset.name.length > FIXTURE_PRESET_NAME_MAX_LENGTH)) {
    errors.push({type: 'preset-name-too-long'});
  }
  duplicatesOf(presets.map((preset) => preset.id)).forEach((id) => errors.push({type: 'preset-id-used-twice', id}));
  presets.forEach((preset) => {
    const presetName = presetNameOf(preset);
    const presetOffsets = preset.values.map((presetValue) => presetValue.offset);
    if (presetOffsets.length === 0) {
      errors.push({type: 'preset-channels-missing', presetName});
    }
    if (presetOffsets.some((offset) => !offsets.has(offset))) {
      errors.push({type: 'preset-channel-unknown', presetName});
    }
    if (duplicatesOf(presetOffsets).length > 0) {
      errors.push({type: 'preset-channel-twice', presetName});
    }
    if (preset.values.some((presetValue) => !isDmxValue(presetValue.value))) {
      errors.push({type: 'preset-value-invalid', presetName});
    }
  });
  return errors;
}

/** what keeps the fixture from being saved; empty when it is valid */
export function fixtureErrors(fixture: Fixture): FixtureError[] {
  const errors: FixtureError[] = [];
  if (isBlank(fixture.name)) {
    errors.push({type: 'name-missing'});
  }
  if (!Number.isInteger(fixture.startAddress) || fixture.startAddress < FIRST_DMX_CHANNEL) {
    errors.push({type: 'start-address-invalid'});
  }
  if ((fixture.description?.length ?? 0) > FIXTURE_DESCRIPTION_MAX_LENGTH) {
    errors.push({type: 'description-too-long'});
  }
  if ((fixture.hint?.length ?? 0) > FIXTURE_HINT_MAX_LENGTH) {
    errors.push({type: 'hint-too-long'});
  }
  if (fixture.channels.length === 0) {
    errors.push({type: 'channels-missing'});
  }
  if (fixture.channels.some((channel) => isBlank(channel.name))) {
    errors.push({type: 'channel-name-missing'});
  }
  if (fixture.channels.some((channel) => !Number.isInteger(channel.offset) || channel.offset < 0)) {
    errors.push({type: 'offset-invalid'});
  }
  duplicatesOf(fixture.channels.map((channel) => channel.offset).filter(Number.isInteger)).forEach((offset) =>
    errors.push({type: 'offset-used-twice', offset})
  );
  if (fixture.channels.some((channel) => channel.lock && !isDmxValue(channel.lock.max))) {
    errors.push({type: 'lock-max-invalid'});
  }
  if (errors.length === 0 && !fitsInUniverse(fixture)) {
    errors.push({type: 'past-universe-end', lastAddress: lastAddress(fixture)});
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

/**
 * the payload if it is a setup the app can work with (schema, unique ids, every fixture and every scene valid),
 * otherwise undefined
 */
export const parseFixtureSetup = (payload: unknown): FixtureSetup | undefined =>
  Value.Check(FixtureSetupSchema, payload) &&
  hasUniqueIds(payload.fixtures) &&
  payload.fixtures.every((fixture) => fixtureErrors(fixture).length === 0) &&
  scenesAreValid(payload)
    ? payload
    : undefined;
