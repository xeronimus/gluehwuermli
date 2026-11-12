import {DMX_MAX_VALUE, DMX_MIN_VALUE, isDmxValue} from '@shared/dmx';
import type {ChannelPosition, ChannelValueMode, ChannelValues} from '@shared/ipc';

/**
 * A channel's value rules as typed into the fixture editor: the numbers are still text, and every mode keeps its
 * fields, so switching the mode back and forth loses nothing. Only the chosen mode ends up in the fixture.
 */
export interface ChannelValuesDraft {
  readonly mode: ChannelValueMode;
  /** blank for 0 */
  readonly min: string;
  /** blank for 255 */
  readonly max: string;
  readonly step: string;
  readonly positions: readonly PositionDraft[];
  /** how a positions channel is shown in the Show view: as a fader or as a button per position */
  readonly display: PositionsDisplay;
}

export type PositionsDisplay = 'fader' | 'buttons';

export interface PositionDraft {
  readonly value: string;
  /** blank for none: the position is shown by its value */
  readonly name: string;
  /**
   * its button sets the value only while held; kept while the display is a fader, so switching back loses nothing,
   * but only stored with buttons
   */
  readonly momentary: boolean;
}

export const CHANNEL_VALUE_MODES: readonly ChannelValueMode[] = ['continuous', 'steps', 'positions'];

const NEW_POSITION: PositionDraft = {value: '', name: '', momentary: false};

/** a positions channel needs two, so it starts with two empty ones */
const NEW_POSITIONS: readonly PositionDraft[] = [NEW_POSITION, NEW_POSITION];

export const newChannelValuesDraft = (): ChannelValuesDraft => ({
  mode: 'continuous',
  min: '',
  max: '',
  step: '',
  positions: [],
  display: 'fader'
});

/** NaN for a blank field, which the validation reports, rather than the 0 Number('') would make of it */
export const numberOf = (text: string): number => (text.trim() === '' ? Number.NaN : Number(text));

/** a blank min or max is the end of the DMX range */
const boundOf = (text: string, blank: number): number => (text.trim() === '' ? blank : Number(text));

const textOf = (value: number, blank: number): string => (value === blank ? '' : String(value));

export function channelValuesDraftOf(values: ChannelValues | undefined): ChannelValuesDraft {
  const draft = newChannelValuesDraft();
  switch (values?.mode) {
    case undefined:
      return draft;
    case 'continuous':
      return {
        ...draft,
        mode: 'continuous',
        min: textOf(values.min, DMX_MIN_VALUE),
        max: textOf(values.max, DMX_MAX_VALUE)
      };
    case 'steps':
      return {
        ...draft,
        mode: 'steps',
        min: textOf(values.min, DMX_MIN_VALUE),
        max: textOf(values.max, DMX_MAX_VALUE),
        step: String(values.step)
      };
    case 'positions':
      return {
        ...draft,
        mode: 'positions',
        positions: values.positions.map(({value, name, momentary}) => ({
          value: String(value),
          name: name ?? '',
          momentary: momentary ?? false
        })),
        display: values.display ?? 'fader'
      };
  }
}

/** the momentary flag only on a channel shown as buttons, so a fader channel never stores it */
const positionOf =
  (display: PositionsDisplay) =>
  ({value, name, momentary}: PositionDraft): ChannelPosition => {
    const trimmed = name.trim();
    return {
      value: numberOf(value),
      ...(trimmed && {name: trimmed}),
      ...(display === 'buttons' && momentary && {momentary: true as const})
    };
  };

/** lowest value first; a blank one (NaN, reported by the validation) last */
const byValue = (first: ChannelPosition, second: ChannelPosition): number =>
  Number.isNaN(first.value) || Number.isNaN(second.value)
    ? Number(Number.isNaN(first.value)) - Number(Number.isNaN(second.value))
    : first.value - second.value;

/**
 * the rules the draft describes, valid or not (fixtureErrors checks them); none for every value from 0 to 255, so a
 * fixture without rules is stored as before. Positions are stored lowest value first, whatever order they were added
 * in; only buttons are stored for the display, a fader is stored as before, and only with buttons a position is
 * stored as momentary
 */
export function channelValuesOfDraft(draft: ChannelValuesDraft): ChannelValues | undefined {
  const min = boundOf(draft.min, DMX_MIN_VALUE);
  const max = boundOf(draft.max, DMX_MAX_VALUE);
  switch (draft.mode) {
    case 'continuous':
      return min === DMX_MIN_VALUE && max === DMX_MAX_VALUE ? undefined : {mode: 'continuous', min, max};
    case 'steps':
      return {mode: 'steps', min, max, step: numberOf(draft.step)};
    case 'positions':
      return {
        mode: 'positions',
        positions: draft.positions.map(positionOf(draft.display)).sort(byValue),
        ...(draft.display === 'buttons' && {display: 'buttons' as const})
      };
  }
}

/** another mode; a positions channel without positions yet gets two empty ones to fill in */
export const withValueMode = (draft: ChannelValuesDraft, mode: ChannelValueMode): ChannelValuesDraft => ({
  ...draft,
  mode,
  positions: mode === 'positions' && draft.positions.length === 0 ? NEW_POSITIONS : draft.positions
});

export const withNewPosition = (draft: ChannelValuesDraft): ChannelValuesDraft => ({
  ...draft,
  positions: [...draft.positions, NEW_POSITION]
});

export const withPositionChange = (
  draft: ChannelValuesDraft,
  index: number,
  change: Partial<PositionDraft>
): ChannelValuesDraft => ({
  ...draft,
  positions: draft.positions.map((position, current) => (current === index ? {...position, ...change} : position))
});

export interface PositionChoice {
  readonly value: string;
  /** the position's name, or its value without one */
  readonly label: string;
}

/** what a preset can pick on a positions channel: its positions with a valid value, lowest first, each value once */
export function positionChoices(draft: ChannelValuesDraft): PositionChoice[] {
  const valid = draft.positions
    .map((position) => ({value: numberOf(position.value), name: position.name.trim()}))
    .filter(({value}) => isDmxValue(value))
    .sort((first, second) => first.value - second.value);
  return valid
    .filter(({value}, index) => valid.findIndex((other) => other.value === value) === index)
    .map(({value, name}) => ({value: String(value), label: name || String(value)}));
}

export const withoutPosition = (draft: ChannelValuesDraft, index: number): ChannelValuesDraft => ({
  ...draft,
  positions: draft.positions.filter((_, current) => current !== index)
});
