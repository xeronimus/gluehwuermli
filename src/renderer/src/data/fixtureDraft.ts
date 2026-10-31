import {FIRST_DMX_CHANNEL} from '@shared/dmx';
import type {Fixture} from '@shared/ipc';

/** a fixture as typed into the editor: the numbers are still text, so a half-typed value doesn't jump */
export interface FixtureDraft {
  readonly name: string;
  readonly startAddress: string;
  readonly channels: readonly FixtureChannelDraft[];
}

export interface FixtureChannelDraft {
  readonly name: string;
  readonly offset: string;
}

const FIRST_OFFSET = 0;

export const newFixtureDraft = (): FixtureDraft => ({
  name: '',
  startAddress: String(FIRST_DMX_CHANNEL),
  channels: [{name: '', offset: String(FIRST_OFFSET)}]
});

export const draftOf = (fixture: Fixture): FixtureDraft => ({
  name: fixture.name,
  startAddress: String(fixture.startAddress),
  channels: fixture.channels.map((channel) => ({name: channel.name, offset: String(channel.offset)}))
});

/** NaN for a blank field, which fixtureErrors reports, rather than the 0 Number('') would make of it */
const numberOf = (text: string): number => (text.trim() === '' ? Number.NaN : Number(text));

/** the fixture the draft describes, valid or not: check it with fixtureErrors */
export const fixtureOfDraft = (id: string, draft: FixtureDraft): Fixture => ({
  id,
  name: draft.name.trim(),
  startAddress: numberOf(draft.startAddress),
  channels: draft.channels.map((channel) => ({name: channel.name.trim(), offset: numberOf(channel.offset)}))
});

/** a new channel after the highest offset typed so far */
export function withNewChannel(draft: FixtureDraft): FixtureDraft {
  const offsets = draft.channels.map((channel) => numberOf(channel.offset)).filter(Number.isInteger);
  const nextOffset = offsets.length > 0 ? Math.max(...offsets) + 1 : FIRST_OFFSET;
  return {...draft, channels: [...draft.channels, {name: '', offset: String(nextOffset)}]};
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
  channels: draft.channels.filter((_, current) => current !== index)
});
