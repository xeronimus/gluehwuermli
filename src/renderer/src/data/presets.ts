import {channelValueRules, nearestStop} from '@shared/channelValueRules';
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

/**
 * every channel of the fixture at the value it has now, by offset, fitted to the nearest value the channel can have:
 * a value set on the raw channels between two steps is captured as the nearest step, not as a preset or scene that
 * can't be saved
 */
export const currentFixtureValues = (fixture: Fixture, channelValues: readonly number[]): FixturePresetValue[] =>
  fixture.channels.map((channel) => ({
    offset: channel.offset,
    value: nearestStop(channelValueRules(channel), channelValueOf(channelValues, channelAddress(fixture, channel)))
  }));

/**
 * the values (a preset's, a scene's) fitted to the fixture's channels, each to the nearest value its channel can
 * have, after the channel's rules changed; values on an offset the fixture has no channel for stay as they are
 */
export const fittedFixtureValues = (fixture: Fixture, values: readonly FixturePresetValue[]): FixturePresetValue[] =>
  values.map((presetValue) => {
    const channel = fixture.channels.find(({offset}) => offset === presetValue.offset);
    return channel ? {...presetValue, value: nearestStop(channelValueRules(channel), presetValue.value)} : presetValue;
  });

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
