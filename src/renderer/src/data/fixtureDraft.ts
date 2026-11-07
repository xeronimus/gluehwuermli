import {DMX_MIN_VALUE, FIRST_DMX_CHANNEL, isDmxChannel} from '@shared/dmx';
import {fixturePresets, normalizedChannelColor} from '@shared/fixtures';
import type {Fixture, FixtureChannel, FixturePreset} from '@shared/ipc';

import {type MoveDirection, moved} from './listOrder';

/** a fixture as typed into the editor: the numbers are still text, so a half-typed value doesn't jump */
export interface FixtureDraft {
  readonly name: string;
  readonly startAddress: string;
  readonly channels: readonly FixtureChannelDraft[];
  readonly description: string;
  readonly hint: string;
  readonly presets: readonly FixturePresetDraft[];
}

export interface FixtureChannelDraft {
  readonly name: string;
  readonly offset: string;
  /** the channel's cap while the channel lock is on; blank for none */
  readonly lockMax: string;
  /** the color its fader glows in, as typed (`ff00ff`, `#FF00FF`); blank for none */
  readonly color: string;
}

/**
 * a preset as edited: one entry per channel of the draft, at the same index, so a preset follows when a channel is
 * removed or its offset changes
 */
export interface FixturePresetDraft {
  readonly id: string;
  readonly name: string;
  readonly values: readonly PresetValueDraft[];
}

export interface PresetValueDraft {
  /** whether the preset sets this channel; the others stay as they are when it is applied */
  readonly included: boolean;
  readonly value: string;
}

const UNSET_PRESET_VALUE: PresetValueDraft = {included: false, value: String(DMX_MIN_VALUE)};

const FIRST_OFFSET = 0;

const NO_LOCK = '';

const NO_COLOR = '';

const channelDraftAt = (offset: number): FixtureChannelDraft => ({
  name: '',
  offset: String(offset),
  lockMax: NO_LOCK,
  color: NO_COLOR
});

export const newFixtureDraft = (): FixtureDraft => ({
  name: '',
  startAddress: String(FIRST_DMX_CHANNEL),
  channels: [channelDraftAt(FIRST_OFFSET)],
  description: '',
  hint: '',
  presets: []
});

const presetDraftOf = (fixture: Fixture, preset: FixturePreset): FixturePresetDraft => ({
  id: preset.id,
  name: preset.name,
  values: fixture.channels.map((channel) => {
    const presetValue = preset.values.find(({offset}) => offset === channel.offset);
    return presetValue ? {included: true, value: String(presetValue.value)} : UNSET_PRESET_VALUE;
  })
});

export const draftOf = (fixture: Fixture): FixtureDraft => ({
  name: fixture.name,
  startAddress: String(fixture.startAddress),
  channels: fixture.channels.map((channel) => ({
    name: channel.name,
    offset: String(channel.offset),
    lockMax: channel.lock ? String(channel.lock.max) : NO_LOCK,
    color: channel.color ?? NO_COLOR
  })),
  description: fixture.description ?? '',
  hint: fixture.hint ?? '',
  presets: fixturePresets(fixture).map((preset) => presetDraftOf(fixture, preset))
});

/** a copy of `items` with the one at `index` replaced */
const replacedAt = <T>(items: readonly T[], index: number, replace: (item: T) => T): T[] =>
  items.map((item, current) => (current === index ? replace(item) : item));

/** NaN for a blank field, which fixtureErrors reports, rather than the 0 Number('') would make of it */
const numberOf = (text: string): number => (text.trim() === '' ? Number.NaN : Number(text));

/** the color as stored; one that isn't a color stays as typed, which fixtureErrors reports */
const colorOf = (text: string): string => normalizedChannelColor(text) ?? text.trim();

const channelOfDraft = (channel: FixtureChannelDraft): FixtureChannel => ({
  name: channel.name.trim(),
  offset: numberOf(channel.offset),
  ...(channel.lockMax.trim() !== NO_LOCK && {lock: {max: numberOf(channel.lockMax)}}),
  ...(channel.color.trim() !== NO_COLOR && {color: colorOf(channel.color)})
});

const presetOfDraft = (draft: FixtureDraft, preset: FixturePresetDraft): FixturePreset => ({
  id: preset.id,
  name: preset.name.trim(),
  values: draft.channels.flatMap((channel, index) => {
    const presetValue = preset.values[index] ?? UNSET_PRESET_VALUE;
    return presetValue.included ? [{offset: numberOf(channel.offset), value: numberOf(presetValue.value)}] : [];
  })
});

/**
 * the fixture the draft describes, valid or not: check it with fixtureErrors. A blank description, hint, lock or color
 * and an empty list of presets are left out.
 */
export function fixtureOfDraft(id: string, draft: FixtureDraft): Fixture {
  const description = draft.description.trim();
  const hint = draft.hint.trim();
  const presets = draft.presets.map((preset) => presetOfDraft(draft, preset));
  return {
    id,
    name: draft.name.trim(),
    startAddress: numberOf(draft.startAddress),
    channels: draft.channels.map(channelOfDraft),
    ...(description && {description}),
    ...(hint && {hint}),
    ...(presets.length > 0 && {presets})
  };
}

/** the DMX address the channel lands on, or undefined while the start address or the offset can't give a valid one */
export function draftChannelAddress(draft: FixtureDraft, channel: FixtureChannelDraft): number | undefined {
  const offset = numberOf(channel.offset);
  const address = numberOf(draft.startAddress) + offset;
  return offset >= 0 && isDmxChannel(address) ? address : undefined;
}

/** a new channel after the highest offset typed so far */
export function withNewChannel(draft: FixtureDraft): FixtureDraft {
  const offsets = draft.channels.map((channel) => numberOf(channel.offset)).filter(Number.isInteger);
  const nextOffset = offsets.length > 0 ? Math.max(...offsets) + 1 : FIRST_OFFSET;
  return {
    ...draft,
    channels: [...draft.channels, channelDraftAt(nextOffset)],
    presets: draft.presets.map((preset) => ({...preset, values: [...preset.values, UNSET_PRESET_VALUE]}))
  };
}

export const withChannelChange = (
  draft: FixtureDraft,
  index: number,
  change: Partial<FixtureChannelDraft>
): FixtureDraft => ({
  ...draft,
  channels: replacedAt(draft.channels, index, (channel) => ({...channel, ...change}))
});

export const withoutChannel = (draft: FixtureDraft, index: number): FixtureDraft => ({
  ...draft,
  channels: draft.channels.filter((_, current) => current !== index),
  presets: draft.presets.map((preset) => ({...preset, values: preset.values.filter((_, current) => current !== index)}))
});

/** a new preset setting every channel, at the lowest value */
export const withNewPreset = (draft: FixtureDraft, id: string): FixtureDraft => ({
  ...draft,
  presets: [
    ...draft.presets,
    {id, name: '', values: draft.channels.map(() => ({included: true, value: String(DMX_MIN_VALUE)}))}
  ]
});

export const withPresetName = (draft: FixtureDraft, presetIndex: number, name: string): FixtureDraft => ({
  ...draft,
  presets: replacedAt(draft.presets, presetIndex, (preset) => ({...preset, name}))
});

export const withPresetValueChange = (
  draft: FixtureDraft,
  presetIndex: number,
  channelIndex: number,
  change: Partial<PresetValueDraft>
): FixtureDraft => ({
  ...draft,
  presets: replacedAt(draft.presets, presetIndex, (preset) => ({
    ...preset,
    values: replacedAt(preset.values, channelIndex, (presetValue) => ({...presetValue, ...change}))
  }))
});

/** a value entered for the channel: the preset sets it from then on, whatever the value (0, too) */
export const withPresetValueEntered = (
  draft: FixtureDraft,
  presetIndex: number,
  channelIndex: number,
  value: string
): FixtureDraft => withPresetValueChange(draft, presetIndex, channelIndex, {included: true, value});

export const withoutPreset = (draft: FixtureDraft, presetIndex: number): FixtureDraft => ({
  ...draft,
  presets: draft.presets.filter((_, current) => current !== presetIndex)
});

/** the preset one place earlier or later: the order of the fixture's preset buttons */
export const withPresetMoved = (draft: FixtureDraft, presetIndex: number, direction: MoveDirection): FixtureDraft => ({
  ...draft,
  presets: moved(draft.presets, presetIndex, direction)
});
