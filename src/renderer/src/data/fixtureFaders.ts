import {channelAddress} from '@shared/fixtures';
import type {Fixture} from '@shared/ipc';

import Fader from '@/domain/Fader';

/** one fader per channel of the fixture, on its absolute DMX channel and labelled with the channel's name */
export const fixtureFaders = (fixture: Fixture): Fader[] =>
  fixture.channels.map((channel) => ({channel: channelAddress(fixture, channel), label: channel.name}));
