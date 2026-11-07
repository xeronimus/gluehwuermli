import Value from 'typebox/value';

import {
  type ValueRulesError,
  channelValueRules,
  isValidValueOf,
  sameValueRules,
  valueRulesErrors
} from './channelValueRules';
import {FIRST_DMX_CHANNEL, LAST_DMX_CHANNEL, isDmxValue} from './dmx';
import {
  CHANNEL_COLOR_PATTERN,
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

const STORED_COLOR = new RegExp(CHANNEL_COLOR_PATTERN);

/** a color as typed: six hex digits, with or without the `#`, in any case */
const TYPED_COLOR = /^#?([0-9a-f]{6})$/i;

/** the color as stored (`#rrggbb`, lower case) for what the user typed, e.g. `FF00FF`; undefined if it is none */
export function normalizedChannelColor(text: string): string | undefined {
  const hexDigits = TYPED_COLOR.exec(text.trim())?.[1];
  return hexDigits === undefined ? undefined : `#${hexDigits.toLowerCase()}`;
}

const hasValidColor = (channel: FixtureChannel): boolean =>
  channel.color === undefined || STORED_COLOR.test(channel.color);

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
  | {readonly type: 'color-invalid'}
  | {readonly type: ValueRulesError}
  | {readonly type: 'past-universe-end'; readonly lastAddress: number}
  | {readonly type: 'preset-name-missing'}
  | {readonly type: 'preset-name-too-long'}
  | {readonly type: 'preset-id-used-twice'; readonly id: string}
  | {readonly type: 'preset-channels-missing'; readonly presetName: string | undefined}
  | {readonly type: 'preset-channel-unknown'; readonly presetName: string | undefined}
  | {readonly type: 'preset-channel-twice'; readonly presetName: string | undefined}
  | {readonly type: 'preset-value-invalid'; readonly presetName: string | undefined}
  | SharedAddressError;

/** a shared address where the other fixture's channel has different value rules: their faders would disagree */
export interface SharedAddressError {
  readonly type: 'shared-address-rules-differ';
  readonly otherFixtureId: string;
  readonly otherFixtureName: string;
  readonly addresses: readonly number[];
}

const presetNameOf = (preset: FixturePreset): string | undefined => (isBlank(preset.name) ? undefined : preset.name);

/** the order the rule errors are listed in, whichever channel has them */
const VALUE_RULES_ERRORS: readonly ValueRulesError[] = [
  'values-invalid',
  'values-min-above-max',
  'values-step-invalid',
  'values-positions-too-few',
  'values-position-twice',
  'values-position-name-too-long'
];

/** each problem of the channels' value rules once, like the other channel errors */
function valueRulesErrorsOf(fixture: Fixture): FixtureError[] {
  const found = new Set(fixture.channels.flatMap((channel) => valueRulesErrors(channelValueRules(channel))));
  return VALUE_RULES_ERRORS.filter((type) => found.has(type)).map((type) => ({type}));
}

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
    if (preset.values.some(({offset, value}) => !isValidValueOf(fixture, offset, value))) {
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
  if (!fixture.channels.every(hasValidColor)) {
    errors.push({type: 'color-invalid'});
  }
  errors.push(...valueRulesErrorsOf(fixture));
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

/** the channel of the fixture on this address, if it has one there */
const channelAt = (fixture: Fixture, address: number): FixtureChannel | undefined =>
  fixture.channels.find((channel) => channelAddress(fixture, channel) === address);

/** the addresses the two fixtures share where their channels stop at different values */
function addressesWithOtherRules({first, second, addresses}: FixtureOverlap): number[] {
  return addresses.filter((address) => {
    const firstChannel = channelAt(first, address);
    const secondChannel = channelAt(second, address);
    return (
      firstChannel !== undefined &&
      secondChannel !== undefined &&
      !sameValueRules(channelValueRules(firstChannel), channelValueRules(secondChannel))
    );
  });
}

/**
 * every pair of fixtures sharing an address where their channels have different value rules: their faders would
 * stop at different values on the same address, so such a setup can't be saved. Only the addresses in question
 */
export const addressRuleConflicts = (fixtures: readonly Fixture[]): FixtureOverlap[] =>
  overlappingFixtures(fixtures).flatMap((overlap) => {
    const addresses = addressesWithOtherRules(overlap);
    return addresses.length > 0 ? [{...overlap, addresses}] : [];
  });

/** the fixture's shared addresses where another fixture's channel has different value rules, as errors */
export const sharedAddressErrors = (fixture: Fixture, otherFixtures: readonly Fixture[]): SharedAddressError[] =>
  addressRuleConflicts([fixture, ...otherFixtures])
    .filter(({first}) => first.id === fixture.id)
    .map(({second, addresses}) => ({
      type: 'shared-address-rules-differ',
      otherFixtureId: second.id,
      otherFixtureName: second.name,
      addresses
    }));

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
 * the payload if it is a setup the app can work with (schema, unique ids, every fixture and every scene valid, no
 * shared address with different value rules), otherwise undefined
 */
export const parseFixtureSetup = (payload: unknown): FixtureSetup | undefined =>
  Value.Check(FixtureSetupSchema, payload) &&
  hasUniqueIds(payload.fixtures) &&
  payload.fixtures.every((fixture) => fixtureErrors(fixture).length === 0) &&
  addressRuleConflicts(payload.fixtures).length === 0 &&
  scenesAreValid(payload)
    ? payload
    : undefined;
