import {DMX_MIN_VALUE} from '@shared/dmx';
import {type ChannelLimits, channelLimits} from '@shared/fixtures';
import type {Fixture, FixturePreset, LockStatus, Scene, SetChannelRequest} from '@shared/ipc';

import {channelValueOf} from './channelValues';
import {presetChannelValues} from './presets';
import {sceneChannelValues} from './scenes';

const NO_LIMITS: ChannelLimits = new Map();

/** on until it is lifted with the password; also while the status isn't known yet */
export const isChannelLockOn = (lockStatus: LockStatus | undefined): boolean => lockStatus?.channelLocked ?? true;

/** the caps that apply now: the fixtures' ones while the channel lock is on, none once it is lifted */
export const activeLimits = (fixtures: readonly Fixture[], lockStatus: LockStatus | undefined): ChannelLimits =>
  isChannelLockOn(lockStatus) ? channelLimits(fixtures) : NO_LIMITS;

/** the caps that don't apply now: the fixtures' ones once the channel lock is lifted, none while it is on */
export const liftedLimits = (fixtures: readonly Fixture[], lockStatus: LockStatus | undefined): ChannelLimits =>
  isChannelLockOn(lockStatus) ? NO_LIMITS : channelLimits(fixtures);

/** the value the main process sends for it: capped at the channel's limit, if it has one */
export const cappedValue = (value: number, limit: number | undefined): number =>
  limit === undefined ? value : Math.min(value, limit);

/** a cap of 0 (e.g. a laser) leaves nothing to move; a higher one (e.g. a macro at 50) only limits the fader */
export const isFaderLocked = (limit: number | undefined): boolean => limit === DMX_MIN_VALUE;

/** the channel lock lets the fader go no higher */
export const isAtCap = (value: number, limit: number | undefined): boolean => limit !== undefined && value >= limit;

/** whether the cap lets the channel go to the value, e.g. a position button; main would cap anything above it */
export const isWithinCap = (value: number, limit: number | undefined): boolean => limit === undefined || value <= limit;

export const clampedChannelValues = (
  values: readonly SetChannelRequest[],
  limits: ChannelLimits
): SetChannelRequest[] => values.map(({channel, value}) => ({channel, value: cappedValue(value, limits.get(channel))}));

/** the channels above their cap, at their cap: what the faders must show after the channel lock turned on */
export const channelsAboveLimits = (channelValues: readonly number[], limits: ChannelLimits): SetChannelRequest[] =>
  Array.from(limits).flatMap(([channel, limit]) =>
    channelValueOf(channelValues, channel) > limit ? [{channel, value: limit}] : []
  );

/** whether any of the values would be capped */
const isAnyAboveLimit = (values: readonly SetChannelRequest[], limits: ChannelLimits): boolean =>
  values.some(({channel, value}) => value > cappedValue(value, limits.get(channel)));

/**
 * whether a preset sets a channel above one of the caps, e.g. "Laser on"; one setting the laser to 0 doesn't. With the
 * active caps the preset is locked, with the lifted ones it goes above a cap only because the channel lock is lifted
 */
export const presetExceedsLimits = (fixture: Fixture, preset: FixturePreset, limits: ChannelLimits): boolean =>
  isAnyAboveLimit(presetChannelValues(fixture, preset), limits);

/**
 * whether a scene sets a channel above one of the caps. With the active caps it can still be played, the capped
 * channels only go up to their cap; with the lifted ones it goes above a cap only because the channel lock is lifted
 */
export const sceneExceedsLimits = (scene: Scene, fixtures: readonly Fixture[], limits: ChannelLimits): boolean =>
  isAnyAboveLimit(sceneChannelValues(scene, fixtures), limits);
