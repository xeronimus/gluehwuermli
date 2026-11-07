import {
  type ValueRange,
  channelValueRules,
  nearestStop,
  nextStop,
  previousStop,
  valueRange
} from '@shared/channelValueRules';
import type {ChannelPosition, ChannelValueMode} from '@shared/ipc';

import Fader from '@/domain/Fader';

import {toDmxValue} from './channelValues';

/**
 * Where a fader stops: a raw channel's and a fixture channel's without rules on every value from 0 to 255, a fixture
 * channel's with rules only on its values. The value shown is always the real one, also off the stops (after a
 * blackout, from the raw channels); the next move snaps it.
 */

const faderRules = (fader: Fader) => channelValueRules(fader);

/** the value the fader sends for a slider position: the nearest stop */
export const snappedFaderValue = (fader: Fader, position: number): number =>
  nearestStop(faderRules(fader), toDmxValue(position));

/** the value the step button above the fader goes to; undefined at its max (the button is disabled) */
export const raisedFaderValue = (fader: Fader, value: number): number | undefined => nextStop(faderRules(fader), value);

/** the value the step button below the fader goes to; undefined at its min (the button is disabled) */
export const loweredFaderValue = (fader: Fader, value: number): number | undefined =>
  previousStop(faderRules(fader), value);

export const faderRange = (fader: Fader): ValueRange => valueRange(faderRules(fader));

export const faderMode = (fader: Fader): ChannelValueMode => faderRules(fader).mode;

const NO_POSITIONS: readonly ChannelPosition[] = [];

/** the positions of a positions fader, lowest first; none for the others */
export const faderPositions = (fader: Fader): readonly ChannelPosition[] =>
  fader.values?.mode === 'positions'
    ? [...fader.values.positions].sort((first, second) => first.value - second.value)
    : NO_POSITIONS;
