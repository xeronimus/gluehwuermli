import {DMX_MAX_VALUE, DMX_MIN_VALUE, FIRST_DMX_CHANNEL} from '@shared/dmx';

import Fader from '@/domain/Fader';

const PERCENT = 100;

/** a slider position (possibly fractional or out of range) as a DMX value */
export const toDmxValue = (position: number): number =>
  Math.min(DMX_MAX_VALUE, Math.max(DMX_MIN_VALUE, Math.round(position)));

export const toPercent = (value: number): number => Math.round((value / DMX_MAX_VALUE) * PERCENT);

/** a copy of `channelValues` (index 0 is channel 1) with `channel` set to `value` */
export const withChannelValue = (channelValues: readonly number[], channel: number, value: number): number[] =>
  channelValues.map((current, index) => (index === channel - FIRST_DMX_CHANNEL ? value : current));

export const channelValueOf = (channelValues: readonly number[], channel: number): number =>
  channelValues[channel - FIRST_DMX_CHANNEL] ?? DMX_MIN_VALUE;

/** `count` faders for consecutive channels from `firstChannel` */
export const fadersFor = (firstChannel: number, count: number): Fader[] =>
  Array.from({length: count}, (_, offset) => ({
    channel: firstChannel + offset,
    label: String(firstChannel + offset)
  }));
