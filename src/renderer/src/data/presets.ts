import {channelAddress, fixturePresets} from '@shared/fixtures';
import type {Fixture, FixturePreset, SetChannelRequest} from '@shared/ipc';

import {channelValueOf} from './channelValues';

/** the absolute channels and values the preset sets; the fixture's other channels are left out, so they stay as they are */
export const presetChannelValues = (fixture: Fixture, preset: FixturePreset): SetChannelRequest[] =>
  preset.values.flatMap(({offset, value}) => {
    const channel = fixture.channels.find((current) => current.offset === offset);
    return channel ? [{channel: channelAddress(fixture, channel), value}] : [];
  });

/** a preset of every channel of the fixture at the value it has now */
export const capturePreset = (
  fixture: Fixture,
  channelValues: readonly number[],
  id: string,
  name: string
): FixturePreset => ({
  id,
  name: name.trim(),
  values: fixture.channels.map((channel) => ({
    offset: channel.offset,
    value: channelValueOf(channelValues, channelAddress(fixture, channel))
  }))
});

/** the list with `preset` added to the fixture with `fixtureId`; the others unchanged */
export const withPreset = (fixtures: readonly Fixture[], fixtureId: string, preset: FixturePreset): Fixture[] =>
  fixtures.map((fixture) =>
    fixture.id === fixtureId ? {...fixture, presets: [...fixturePresets(fixture), preset]} : fixture
  );
