import {DMX_MIN_VALUE, FIRST_DMX_CHANNEL, isDmxChannel} from '@shared/dmx';
import {fixturePresets} from '@shared/fixtures';
import type {Fixture, FixturePreset} from '@shared/ipc';

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

export const newFixtureDraft = (): FixtureDraft => ({
  name: '',
  startAddress: String(FIRST_DMX_CHANNEL),
  channels: [{name: '', offset: String(FIRST_OFFSET)}],
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
  channels: fixture.channels.map((channel) => ({name: channel.name, offset: String(channel.offset)})),
  description: fixture.description ?? '',
  hint: fixture.hint ?? '',
  presets: fixturePresets(fixture).map((preset) => presetDraftOf(fixture, preset))
});

/** NaN for a blank field, which fixtureErrors reports, rather than the 0 Number('') would make of it */
const numberOf = (text: string): number => (text.trim() === '' ? Number.NaN : Number(text));

const presetOfDraft = (draft: FixtureDraft, preset: FixturePresetDraft): FixturePreset => ({
  id: preset.id,
  name: preset.name.trim(),
  values: draft.channels.flatMap((channel, index) => {
    const presetValue = preset.values[index] ?? UNSET_PRESET_VALUE;
    return presetValue.included ? [{offset: numberOf(channel.offset), value: numberOf(presetValue.value)}] : [];
  })
});

/**
 * the fixture the draft describes, valid or not: check it with fixtureErrors. A blank description or hint and an empty
 * list of presets are left out.
 */
export function fixtureOfDraft(id: string, draft: FixtureDraft): Fixture {
  const description = draft.description.trim();
  const hint = draft.hint.trim();
  const presets = draft.presets.map((preset) => presetOfDraft(draft, preset));
  return {
    id,
    name: draft.name.trim(),
    startAddress: numberOf(draft.startAddress),
    channels: draft.channels.map((channel) => ({name: channel.name.trim(), offset: numberOf(channel.offset)})),
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
    channels: [...draft.channels, {name: '', offset: String(nextOffset)}],
    presets: draft.presets.map((preset) => ({...preset, values: [...preset.values, UNSET_PRESET_VALUE]}))
  };
}

export const withChannelChange = (
  draft: FixtureDraft,
  index: number,
  change: Partial<FixtureChannelDraft>
): FixtureDraft => ({
  ...draft,
  channels: draft.channels.map((channel, current) => (current === index ? {...channel, ...change} : channel))
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
  presets: draft.presets.map((preset, current) => (current === presetIndex ? {...preset, name} : preset))
});

export const withPresetValueChange = (
  draft: FixtureDraft,
  presetIndex: number,
  channelIndex: number,
  change: Partial<PresetValueDraft>
): FixtureDraft => ({
  ...draft,
  presets: draft.presets.map((preset, current) =>
    current === presetIndex
      ? {
          ...preset,
          values: preset.values.map((presetValue, index) =>
            index === channelIndex ? {...presetValue, ...change} : presetValue
          )
        }
      : preset
  )
});

export const withoutPreset = (draft: FixtureDraft, presetIndex: number): FixtureDraft => ({
  ...draft,
  presets: draft.presets.filter((_, current) => current !== presetIndex)
});
