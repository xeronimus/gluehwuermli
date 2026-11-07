import {DMX_MAX_VALUE, DMX_MIN_VALUE, isDmxValue} from './dmx';
import {CHANNEL_POSITION_NAME_MAX_LENGTH, type ChannelValues, type Fixture, type FixtureChannel} from './ipc';
import {duplicatesOf} from './validation';

/**
 * The values a fixture channel's fader stops at, used by both processes: the renderer snaps the fader to them, both
 * check presets and scenes against them. The raw channels have no rules, they always go from 0 to 255.
 */

/** what a channel without rules has, and what a file from before the rules had */
export const FULL_RANGE: ChannelValues = {mode: 'continuous', min: DMX_MIN_VALUE, max: DMX_MAX_VALUE};

export const channelValueRules = (channel: Pick<FixtureChannel, 'values'>): ChannelValues =>
  channel.values ?? FULL_RANGE;

/** what is wrong with a channel's rules, as codes (fixtures.ts turns them into FixtureErrors) */
export type ValueRulesError =
  | 'values-invalid'
  | 'values-min-above-max'
  | 'values-step-invalid'
  | 'values-positions-too-few'
  | 'values-position-twice'
  | 'values-position-name-too-long';

const MIN_POSITIONS = 2;

function rangeErrors(min: number, max: number): ValueRulesError[] {
  if (!isDmxValue(min) || !isDmxValue(max)) {
    return ['values-invalid'];
  }
  return min > max ? ['values-min-above-max'] : [];
}

function positionErrors(rules: Extract<ChannelValues, {mode: 'positions'}>): ValueRulesError[] {
  const values = rules.positions.map(({value}) => value);
  const errors: ValueRulesError[] = [];
  if (!values.every(isDmxValue)) {
    errors.push('values-invalid');
  }
  if (values.length < MIN_POSITIONS) {
    errors.push('values-positions-too-few');
  }
  if (duplicatesOf(values).length > 0) {
    errors.push('values-position-twice');
  }
  if (rules.positions.some(({name}) => (name?.length ?? 0) > CHANNEL_POSITION_NAME_MAX_LENGTH)) {
    errors.push('values-position-name-too-long');
  }
  return errors;
}

/** what keeps the rules from being saved; empty when they are valid */
export function valueRulesErrors(rules: ChannelValues): ValueRulesError[] {
  switch (rules.mode) {
    case 'continuous':
      return rangeErrors(rules.min, rules.max);
    case 'steps': {
      const stepValid = Number.isInteger(rules.step) && rules.step >= 1;
      return [...rangeErrors(rules.min, rules.max), ...(stepValid ? [] : ['values-step-invalid' as const])];
    }
    case 'positions':
      return positionErrors(rules);
  }
}

const valuesFromTo = (min: number, max: number, step: number): number[] => {
  const values: number[] = [];
  for (let value = min; value < max; value += step) {
    values.push(value);
  }
  return [...values, max];
};

const FULL_RANGE_STOPS = valuesFromTo(DMX_MIN_VALUE, DMX_MAX_VALUE, 1);

/**
 * every value the fader stops at, lowest first: from min to max (steps: min, min + step, … and always max) or the
 * positions. Rules with errors (while being typed) stop everywhere from 0 to 255, so nothing here loops or breaks
 */
export function channelStops(rules: ChannelValues): readonly number[] {
  if (valueRulesErrors(rules).length > 0) {
    return FULL_RANGE_STOPS;
  }
  switch (rules.mode) {
    case 'continuous':
      return valuesFromTo(rules.min, rules.max, 1);
    case 'steps':
      return valuesFromTo(rules.min, rules.max, rules.step);
    case 'positions':
      return rules.positions.map(({value}) => value).sort((first, second) => first - second);
  }
}

export interface ValueRange {
  readonly min: number;
  readonly max: number;
}

/** the lowest and the highest value the fader stops at */
export function valueRange(rules: ChannelValues): ValueRange {
  const stops = channelStops(rules);
  return {min: stops[0] ?? DMX_MIN_VALUE, max: stops[stops.length - 1] ?? DMX_MAX_VALUE};
}

export const isValidChannelValue = (rules: ChannelValues, value: number): boolean =>
  channelStops(rules).includes(value);

/** the stop closest to the value; halfway between two, the lower one (the safer for a strobe or a laser) */
export function nearestStop(rules: ChannelValues, value: number): number {
  return channelStops(rules).reduce((nearest, stop) =>
    Math.abs(stop - value) < Math.abs(nearest - value) ? stop : nearest
  );
}

/** the first stop above the value, also from a value between stops or below min; undefined at or above max */
export const nextStop = (rules: ChannelValues, value: number): number | undefined =>
  channelStops(rules).find((stop) => stop > value);

/** the last stop below the value, also from a value between stops or above max; undefined at or below min */
export const previousStop = (rules: ChannelValues, value: number): number | undefined =>
  channelStops(rules).findLast((stop) => stop < value);

/**
 * whether a preset's or a scene's value is one the channel with this offset can have: a DMX value, and one its fader
 * stops at. A channel the fixture doesn't have is reported on its own, its value isn't checked here
 */
export function isValidValueOf(fixture: Fixture, offset: number, value: number): boolean {
  const channel = fixture.channels.find((candidate) => candidate.offset === offset);
  return isDmxValue(value) && (!channel || isValidChannelValue(channelValueRules(channel), value));
}

/** whether two channels stop at the same values; their position names don't matter, only what is sent */
export function sameValueRules(first: ChannelValues, second: ChannelValues): boolean {
  const firstStops = channelStops(first);
  const secondStops = channelStops(second);
  return firstStops.length === secondStops.length && firstStops.every((stop, index) => stop === secondStops[index]);
}
