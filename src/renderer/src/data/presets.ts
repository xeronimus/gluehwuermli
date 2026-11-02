import {channelAddress, fixturePresets} from '@shared/fixtures';
import type {Fixture, FixturePreset, FixturePresetValue, SetChannelRequest} from '@shared/ipc';

import {channelValueOf} from './channelValues';

/**
 * values keyed by the fixture's offsets (a preset's, a scene's) as absolute channels; an offset the fixture has no
 * channel for is skipped, the fixture's other channels are left out, so they stay as they are
 */
export const fixtureChannelValues = (fixture: Fixture, values: readonly FixturePresetValue[]): SetChannelRequest[] =>
  values.flatMap(({offset, value}) => {
    const channel = fixture.channels.find((current) => current.offset === offset);
    return channel ? [{channel: channelAddress(fixture, channel), value}] : [];
  });

/** every channel of the fixture at the value it has now, by offset */
export const currentFixtureValues = (fixture: Fixture, channelValues: readonly number[]): FixturePresetValue[] =>
  fixture.channels.map((channel) => ({
    offset: channel.offset,
    value: channelValueOf(channelValues, channelAddress(fixture, channel))
  }));

/** the absolute channels and values the preset sets */
export const presetChannelValues = (fixture: Fixture, preset: FixturePreset): SetChannelRequest[] =>
  fixtureChannelValues(fixture, preset.values);

/** a preset of every channel of the fixture at the value it has now */
export const capturePreset = (
  fixture: Fixture,
  channelValues: readonly number[],
  id: string,
  name: string
): FixturePreset => ({
  id,
  name: name.trim(),
  values: currentFixtureValues(fixture, channelValues)
});

/** the list with `preset` added to the fixture with `fixtureId`; the others unchanged */
export const withPreset = (fixtures: readonly Fixture[], fixtureId: string, preset: FixturePreset): Fixture[] =>
  fixtures.map((fixture) =>
    fixture.id === fixtureId ? {...fixture, presets: [...fixturePresets(fixture), preset]} : fixture
  );
