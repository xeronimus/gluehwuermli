import {DMX_MAX_VALUE, DMX_MIN_VALUE, FIRST_DMX_CHANNEL} from '@shared/dmx';
import type {SetChannelRequest} from '@shared/ipc';

import Fader from '@/domain/Fader';

const PERCENT = 100;

/** a slider position (possibly fractional or out of range) as a DMX value */
export const toDmxValue = (position: number): number =>
  Math.min(DMX_MAX_VALUE, Math.max(DMX_MIN_VALUE, Math.round(position)));

export const toPercent = (value: number): number => Math.round((value / DMX_MAX_VALUE) * PERCENT);

/** how strongly a colored fader glows at `value`: 0 (none) at the lowest value, 1 (full) at the highest */
export const glowLevel = (value: number): number =>
  Math.min(1, Math.max(0, (value - DMX_MIN_VALUE) / (DMX_MAX_VALUE - DMX_MIN_VALUE)));

/** a copy of `channelValues` (index 0 is channel 1) with `channel` set to `value` */
export const withChannelValue = (channelValues: readonly number[], channel: number, value: number): number[] =>
  channelValues.map((current, index) => (index === channel - FIRST_DMX_CHANNEL ? value : current));

/** a copy of `channelValues` with every one of `values` set */
export function withChannelValues(channelValues: readonly number[], values: readonly SetChannelRequest[]): number[] {
  const changed = new Map(values.map(({channel, value}) => [channel - FIRST_DMX_CHANNEL, value]));
  return channelValues.map((current, index) => changed.get(index) ?? current);
}

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
