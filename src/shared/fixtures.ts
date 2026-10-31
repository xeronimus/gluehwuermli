import Value from 'typebox/value';

import {FIRST_DMX_CHANNEL, LAST_DMX_CHANNEL} from './dmx';
import {FIXTURE_SETUP_VERSION, type Fixture, type FixtureChannel, type FixtureSetup, FixtureSetupSchema} from './ipc';

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

export const emptyFixtureSetup = (): FixtureSetup => ({version: FIXTURE_SETUP_VERSION, fixtures: []});

/** the absolute DMX channel of one of the fixture's channels */
export const channelAddress = (fixture: Pick<Fixture, 'startAddress'>, channel: FixtureChannel): number =>
  fixture.startAddress + channel.offset;

export const fixtureAddresses = (fixture: Fixture): number[] =>
  fixture.channels.map((channel) => channelAddress(fixture, channel));

/** the highest address the fixture uses */
export const lastAddress = (fixture: Fixture): number => Math.max(fixture.startAddress, ...fixtureAddresses(fixture));

export const fitsInUniverse = (fixture: Fixture): boolean =>
  fixture.startAddress >= FIRST_DMX_CHANNEL && lastAddress(fixture) <= LAST_DMX_CHANNEL;

const isBlank = (text: string) => text.trim().length === 0;

const duplicatesOf = (values: readonly number[]): number[] => [
  ...new Set(values.filter((value, index) => values.indexOf(value) !== index))
];

/** what keeps the fixture from being saved; empty when it is valid */
export function fixtureErrors(fixture: Fixture): string[] {
  const errors: string[] = [];
  if (isBlank(fixture.name)) {
    errors.push('The fixture needs a name');
  }
  if (!Number.isInteger(fixture.startAddress) || fixture.startAddress < FIRST_DMX_CHANNEL) {
    errors.push(`The start address must be a whole number from ${FIRST_DMX_CHANNEL} to ${LAST_DMX_CHANNEL}`);
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
  duplicatesOf(fixture.channels.map((channel) => channel.offset)).forEach((offset) =>
    errors.push(`Offset ${offset} is used by more than one channel`)
  );
  if (errors.length === 0 && !fitsInUniverse(fixture)) {
    errors.push(`The fixture ends at address ${lastAddress(fixture)}, after the last one (${LAST_DMX_CHANNEL})`);
  }
  return errors;
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

const hasUniqueIds = (fixtures: readonly Fixture[]) => new Set(fixtures.map(({id}) => id)).size === fixtures.length;

/** the payload if it is a setup the app can work with (schema, unique ids, every fixture valid), otherwise undefined */
export const parseFixtureSetup = (payload: unknown): FixtureSetup | undefined =>
  Value.Check(FixtureSetupSchema, payload) &&
  hasUniqueIds(payload.fixtures) &&
  payload.fixtures.every((fixture) => fixtureErrors(fixture).length === 0)
    ? payload
    : undefined;
