import {type FixtureOverlap, addressRuleConflicts, channelAddress} from '@shared/fixtures';
import type {ChannelValues, Fixture, FixtureChannel} from '@shared/ipc';

import {fittedFixtureValues} from './presets';

/**
 * Fixtures sharing an address must stop at the same values there (main refuses a setup where they don't), and the
 * editor changes one fixture at a time. So the saved fixture's value rules are copied to the other fixtures' channels
 * on its addresses, in the same save.
 */

/**
 * the other fixtures and the shared addresses where their channels stop at other values than the fixture's: what
 * saving the fixture replaces. The fixture is always `first`
 */
export const rulesSharedWith = (fixture: Fixture, otherFixtures: readonly Fixture[]): FixtureOverlap[] =>
  addressRuleConflicts([fixture, ...otherFixtures]).filter(({first}) => first.id === fixture.id);

/** the channel with these value rules, or without any (the full range) */
function withValues(channel: FixtureChannel, values: ChannelValues | undefined): FixtureChannel {
  const {values: replaced, ...others} = channel;
  return values ? {...others, values} : others;
}

/** the other fixture of the overlap with the fixture's rules on the shared addresses, its presets fitted to them */
function withRulesOf(fixture: Fixture, {second: other, addresses}: FixtureOverlap): Fixture {
  const channels = other.channels.map((channel) => {
    const address = channelAddress(other, channel);
    const source = fixture.channels.find((candidate) => channelAddress(fixture, candidate) === address);
    return source && addresses.includes(address) ? withValues(channel, source.values) : channel;
  });
  const changed = {...other, channels};
  return other.presets
    ? {
        ...changed,
        presets: other.presets.map((preset) => ({
          ...preset,
          values: fittedFixtureValues(changed, preset.values)
        }))
      }
    : changed;
}

/**
 * the list with the rules of the fixture (already in it) copied to every other fixture's channel on an address they
 * share and where it stops at other values, the other fixture's presets fitted to them. Lock, color and name of
 * those channels stay their own; fixtures not concerned are kept as they are
 */
export function withSharedRules(fixtures: readonly Fixture[], fixture: Fixture): Fixture[] {
  const shared = rulesSharedWith(
    fixture,
    fixtures.filter(({id}) => id !== fixture.id)
  );
  return fixtures.map((other) => {
    const overlap = shared.find(({second}) => second.id === other.id);
    return overlap ? withRulesOf(fixture, overlap) : other;
  });
}
