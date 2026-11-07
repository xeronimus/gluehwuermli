import {channelAddress, lastAddress} from '@shared/fixtures';
import type {Fixture} from '@shared/ipc';

import Fader from '@/domain/Fader';

/**
 * one fader per channel of the fixture, on its absolute DMX channel, labelled with the channel's name, in the
 * channel's color and stopping at the channel's values if it has them
 */
export const fixtureFaders = (fixture: Fixture): Fader[] =>
  fixture.channels.map((channel) => ({
    channel: channelAddress(fixture, channel),
    label: channel.name,
    ...(channel.color !== undefined && {color: channel.color}),
    ...(channel.values !== undefined && {values: channel.values})
  }));

/** the addresses the fixture uses, e.g. "10–12", or "12" for a single channel */
export function addressRangeOf(fixture: Fixture): string {
  const last = lastAddress(fixture);
  return last === fixture.startAddress ? String(last) : `${fixture.startAddress}–${last}`;
}
