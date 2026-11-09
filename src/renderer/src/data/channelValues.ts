import type {ValueRange} from '@shared/channelValueRules';
import {DMX_MAX_VALUE, DMX_MIN_VALUE, FIRST_DMX_CHANNEL} from '@shared/dmx';
import type {SetChannelRequest} from '@shared/ipc';

import Fader from '@/domain/Fader';

const PERCENT = 100;

/** a slider position (possibly fractional or out of range) as a DMX value */
export const toDmxValue = (position: number): number =>
  Math.min(DMX_MAX_VALUE, Math.max(DMX_MIN_VALUE, Math.round(position)));

export const toPercent = (value: number): number => Math.round((value / DMX_MAX_VALUE) * PERCENT);

const DMX_RANGE: ValueRange = {min: DMX_MIN_VALUE, max: DMX_MAX_VALUE};

/**
 * how strongly a colored fader glows at `value`: 0 (none) at the lowest value of its range or below (0 after a
 * blackout), 1 (full) at its highest
 */
export function glowLevel(value: number, {min, max}: ValueRange = DMX_RANGE): number {
  if (max <= min) {
    return value >= max ? 1 : 0;
  }
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

/** a copy of `channelValues` (index 0 is channel 1) with `channel` set to `value` */
export const withChannelValue = (channelValues: readonly number[], channel: number, value: number): number[] =>
  channelValues.map((current, index) => (index === channel - FIRST_DMX_CHANNEL ? value : current));

/** a copy of `channelValues` with every one of `values` set */
export function withChannelValues(channelValues: readonly number[], values: readonly SetChannelRequest[]): number[] {
  const changed = new Map(values.map(({channel, value}) => [channel - FIRST_DMX_CHANNEL, value]));
  return channelValues.map((current, index) => changed.get(index) ?? current);
}

/** `channelValues` (index 0 is channel 1) as one value per channel, leaving out the channels in `skipped` */
export const channelValuesExcept = (
  channelValues: readonly number[],
  skipped: ReadonlySet<number>
): SetChannelRequest[] =>
  channelValues
    .map((value, index) => ({channel: index + FIRST_DMX_CHANNEL, value}))
    .filter(({channel}) => !skipped.has(channel));

export const channelValueOf = (channelValues: readonly number[], channel: number): number =>
  channelValues[channel - FIRST_DMX_CHANNEL] ?? DMX_MIN_VALUE;

/** whether setting `channel` to `value` changes anything; a slider reports every pointer move, also within one step */
export const isChannelChange = (channelValues: readonly number[], channel: number, value: number): boolean =>
  channelValueOf(channelValues, channel) !== value;

/** `count` faders for consecutive channels from `firstChannel` */
export const fadersFor = (firstChannel: number, count: number): Fader[] =>
  Array.from({length: count}, (_, offset) => ({
    channel: firstChannel + offset,
    label: String(firstChannel + offset)
  }));
