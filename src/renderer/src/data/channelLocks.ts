import {DMX_MIN_VALUE} from '@shared/dmx';
import {type ChannelLimits, channelLimits} from '@shared/fixtures';
import type {Fixture, FixturePreset, LockStatus, SetChannelRequest} from '@shared/ipc';

import {channelValueOf} from './channelValues';
import {presetChannelValues} from './presets';

const NO_LIMITS: ChannelLimits = new Map();

/** on until it is lifted with the password; also while the status isn't known yet */
export const isChannelLockOn = (lockStatus: LockStatus | undefined): boolean => lockStatus?.channelLocked ?? true;

/** the caps that apply now: the fixtures' ones while the channel lock is on, none once it is lifted */
export const activeLimits = (fixtures: readonly Fixture[], lockStatus: LockStatus | undefined): ChannelLimits =>
  isChannelLockOn(lockStatus) ? channelLimits(fixtures) : NO_LIMITS;

/** the value the main process sends for it: capped at the channel's limit, if it has one */
export const cappedValue = (value: number, limit: number | undefined): number =>
  limit === undefined ? value : Math.min(value, limit);

/** a cap of 0 (e.g. a laser) leaves nothing to move; a higher one (e.g. a macro at 50) only limits the fader */
export const isFaderLocked = (limit: number | undefined): boolean => limit === DMX_MIN_VALUE;

/** the channel lock lets the fader go no higher */
export const isAtCap = (value: number, limit: number | undefined): boolean => limit !== undefined && value >= limit;

export const clampedChannelValues = (
  values: readonly SetChannelRequest[],
  limits: ChannelLimits
): SetChannelRequest[] => values.map(({channel, value}) => ({channel, value: cappedValue(value, limits.get(channel))}));

/** the channels above their cap, at their cap: what the faders must show after the channel lock turned on */
export const channelsAboveLimits = (channelValues: readonly number[], limits: ChannelLimits): SetChannelRequest[] =>
  Array.from(limits).flatMap(([channel, limit]) =>
    channelValueOf(channelValues, channel) > limit ? [{channel, value: limit}] : []
  );

/** a preset that would set a channel above its cap, e.g. "Laser on"; one setting the laser to 0 stays usable */
export const isPresetLocked = (fixture: Fixture, preset: FixturePreset, limits: ChannelLimits): boolean =>
  presetChannelValues(fixture, preset).some(({channel, value}) => value > cappedValue(value, limits.get(channel)));
