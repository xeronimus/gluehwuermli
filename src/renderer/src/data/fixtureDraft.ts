import {nearestStop, valueRulesErrors} from '@shared/channelValueRules';
import {colorToStore} from '@shared/colors';
import {DMX_MIN_VALUE, FIRST_DMX_CHANNEL, isDmxChannel, isDmxValue} from '@shared/dmx';
import {fixturePresets} from '@shared/fixtures';
import type {Fixture, FixtureChannel, FixturePreset} from '@shared/ipc';

import {
  type ChannelValuesDraft,
  channelValuesDraftOf,
  channelValuesOfDraft,
  newChannelValuesDraft,
  numberOf
} from './channelValuesDraft';
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
  /** the row's identity while it is edited, so a moved row keeps its focus */
  readonly id: string;
  /**
   * the offset the channel has in the saved fixture, undefined for a channel added in this editor: the scenes, which
   * live outside the draft, follow the channel when its offset is changed
   */
  readonly storedOffset?: number;
  readonly name: string;
  readonly offset: string;
  /** the channel's cap while the channel lock is on; blank for none */
  readonly lockMax: string;
  /** the color its fader glows in, as typed (`ff00ff`, `#FF00FF`); blank for none */
  readonly color: string;
  /** the values its fader stops at */
  readonly values: ChannelValuesDraft;
}

/**
 * a preset as edited: one entry per channel of the draft, at the same index, so a preset follows when a channel is
 * removed, moved or its offset changes
 */
export interface FixturePresetDraft {
  readonly id: string;
  readonly name: string;
  /** the color of its button's dot, as typed; blank for none */
  readonly color: string;
  readonly values: readonly PresetValueDraft[];
}

export interface PresetValueDraft {
  /** whether the preset sets this channel; the others stay as they are when it is applied */
  readonly included: boolean;
  readonly value: string;
  /**
   * whether the value was entered in this editor: it is checked as it is. One that wasn't (stored, or a new preset's
   * 0) is fitted to the channel's value rules, so changing them never makes the presets unsavable
   */
  readonly entered: boolean;
}

const UNSET_PRESET_VALUE: PresetValueDraft = {included: false, value: String(DMX_MIN_VALUE), entered: false};

const FIRST_OFFSET = 0;

const NO_LOCK = '';

const NO_COLOR = '';

const channelDraftAt = (id: string, offset: number): FixtureChannelDraft => ({
  id,
  name: '',
  offset: String(offset),
  lockMax: NO_LOCK,
  color: NO_COLOR,
  values: newChannelValuesDraft()
});

/** `channelId` is the id of its first channel */
export const newFixtureDraft = (channelId: string): FixtureDraft => ({
  name: '',
  startAddress: String(FIRST_DMX_CHANNEL),
  channels: [channelDraftAt(channelId, FIRST_OFFSET)],
  description: '',
  hint: '',
  presets: []
});

const presetDraftOf = (fixture: Fixture, preset: FixturePreset): FixturePresetDraft => ({
  id: preset.id,
  name: preset.name,
  color: preset.color ?? NO_COLOR,
  values: fixture.channels.map((channel) => {
    const presetValue = preset.values.find(({offset}) => offset === channel.offset);
    return presetValue ? {included: true, value: String(presetValue.value), entered: false} : UNSET_PRESET_VALUE;
  })
});

/** the id of a saved channel's row: offsets are unique within a saved fixture, new rows get a random id */
const storedChannelId = (offset: number): string => `stored-${offset}`;

export const draftOf = (fixture: Fixture): FixtureDraft => ({
  name: fixture.name,
  startAddress: String(fixture.startAddress),
  channels: fixture.channels.map((channel) => ({
    id: storedChannelId(channel.offset),
    storedOffset: channel.offset,
    name: channel.name,
    offset: String(channel.offset),
    lockMax: channel.lock ? String(channel.lock.max) : NO_LOCK,
    color: channel.color ?? NO_COLOR,
    values: channelValuesDraftOf(channel.values)
  })),
  description: fixture.description ?? '',
  hint: fixture.hint ?? '',
  presets: fixturePresets(fixture).map((preset) => presetDraftOf(fixture, preset))
});

/** a copy of `items` with the one at `index` replaced */
const replacedAt = <T>(items: readonly T[], index: number, replace: (item: T) => T): T[] =>
  items.map((item, current) => (current === index ? replace(item) : item));

/** the color as stored, none for a blank field; one that isn't a color stays as typed, which fixtureErrors reports */
const colorOfDraft = (text: string): {color?: string} => {
  const color = colorToStore(text);
  return color === undefined ? {} : {color};
};

const channelOfDraft = (channel: FixtureChannelDraft): FixtureChannel => {
  const values = channelValuesOfDraft(channel.values);
  return {
    name: channel.name.trim(),
    offset: numberOf(channel.offset),
    ...(channel.lockMax.trim() !== NO_LOCK && {lock: {max: numberOf(channel.lockMax)}}),
    ...colorOfDraft(channel.color),
    ...(values && {values})
  };
};

/**
 * the preset's value for the channel as it will be saved and shown: as entered, or, if it wasn't entered in this
 * editor, fitted to the nearest value the channel can have (once its rules are valid)
 */
export function shownPresetValue(channel: FixtureChannelDraft, presetValue: PresetValueDraft): string {
  const value = numberOf(presetValue.value);
  const rules = channelOfDraft(channel).values;
  if (presetValue.entered || !isDmxValue(value) || !rules || valueRulesErrors(rules).length > 0) {
    return presetValue.value;
  }
  return String(nearestStop(rules, value));
}

const presetOfDraft = (draft: FixtureDraft, preset: FixturePresetDraft): FixturePreset => ({
  id: preset.id,
  name: preset.name.trim(),
  values: draft.channels.flatMap((channel, index) => {
    const presetValue = preset.values[index] ?? UNSET_PRESET_VALUE;
    return presetValue.included
      ? [{offset: numberOf(channel.offset), value: numberOf(shownPresetValue(channel, presetValue))}]
      : [];
  }),
  ...colorOfDraft(preset.color)
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

/** a new channel after the highest offset typed so far, its row identified by `id` */
export function withNewChannel(draft: FixtureDraft, id: string): FixtureDraft {
  const offsets = draft.channels.map((channel) => numberOf(channel.offset)).filter(Number.isInteger);
  const nextOffset = offsets.length > 0 ? Math.max(...offsets) + 1 : FIRST_OFFSET;
  return {
    ...draft,
    channels: [...draft.channels, channelDraftAt(id, nextOffset)],
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

/**
 * the channel one place earlier or later in the list: the order of its row and its fader. Its offset stays, so it
 * keeps its address; its preset values move with it
 */
export const withChannelMoved = (draft: FixtureDraft, index: number, direction: MoveDirection): FixtureDraft => ({
  ...draft,
  channels: moved(draft.channels, index, direction),
  presets: draft.presets.map((preset) => ({...preset, values: moved(preset.values, index, direction)}))
});

/**
 * stored offset to offset as typed, for every saved channel still in the draft with a whole-number offset: how the
 * scenes follow the channels when the draft is saved. A removed channel is not in the map
 */
export const channelOffsetChanges = (draft: FixtureDraft): ReadonlyMap<number, number> =>
  new Map(
    draft.channels.flatMap(({storedOffset, offset}) => {
      const newOffset = numberOf(offset);
      return storedOffset !== undefined && Number.isInteger(newOffset) ? [[storedOffset, newOffset] as const] : [];
    })
  );

/** a new preset setting every channel at its lowest value: 0, fitted to the channel's rules */
export const withNewPreset = (draft: FixtureDraft, id: string): FixtureDraft => ({
  ...draft,
  presets: [
    ...draft.presets,
    {
      id,
      name: '',
      color: NO_COLOR,
      values: draft.channels.map(() => ({included: true, value: String(DMX_MIN_VALUE), entered: false}))
    }
  ]
});

export const withPresetName = (draft: FixtureDraft, presetIndex: number, name: string): FixtureDraft => ({
  ...draft,
  presets: replacedAt(draft.presets, presetIndex, (preset) => ({...preset, name}))
});

export const withPresetColor = (draft: FixtureDraft, presetIndex: number, color: string): FixtureDraft => ({
  ...draft,
  presets: replacedAt(draft.presets, presetIndex, (preset) => ({...preset, color}))
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
): FixtureDraft => withPresetValueChange(draft, presetIndex, channelIndex, {included: true, value, entered: true});

export const withoutPreset = (draft: FixtureDraft, presetIndex: number): FixtureDraft => ({
  ...draft,
  presets: draft.presets.filter((_, current) => current !== presetIndex)
});

/** the preset one place earlier or later: the order of the fixture's preset buttons */
export const withPresetMoved = (draft: FixtureDraft, presetIndex: number, direction: MoveDirection): FixtureDraft => ({
  ...draft,
  presets: moved(draft.presets, presetIndex, direction)
});
