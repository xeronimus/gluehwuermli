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

/** a key moves by stops, not by values like react-range: by one it would often snap back to where it was */
const STOPS_PER_KEY: ReadonlyMap<string, number> = new Map([
  ['ArrowUp', 1],
  ['ArrowRight', 1],
  ['k', 1],
  ['PageUp', 10],
  ['ArrowDown', -1],
  ['ArrowLeft', -1],
  ['j', -1],
  ['PageDown', -10]
]);

/** how many stops a key on the slider handle moves the fader (the keys react-range moves it with), negative down */
export const faderKeyStops = (key: string): number | undefined => STOPS_PER_KEY.get(key);

/** the value that many stops above the value (below for negative), at most up to the last stop; undefined if none */
export const steppedFaderValue = (fader: Fader, value: number, stops: number): number | undefined => {
  const step = stops > 0 ? raisedFaderValue : loweredFaderValue;
  let reached: number | undefined;
  for (let count = 0; count < Math.abs(stops); count++) {
    const next = step(fader, reached ?? value);
    if (next === undefined) {
      break;
    }
    reached = next;
  }
  return reached;
};

export const faderRange = (fader: Fader): ValueRange => valueRange(faderRules(fader));

export const faderMode = (fader: Fader): ChannelValueMode => faderRules(fader).mode;

const NO_POSITIONS: readonly ChannelPosition[] = [];

/** the positions of a positions fader, lowest first; none for the others */
export const faderPositions = (fader: Fader): readonly ChannelPosition[] =>
  fader.values?.mode === 'positions'
    ? [...fader.values.positions].sort((first, second) => first.value - second.value)
    : NO_POSITIONS;

/** a positions channel set to buttons in the fixture editor: the Show view has a button per position, not a fader */
export const showsAsButtons = (fader: Fader): boolean =>
  fader.values?.mode === 'positions' && fader.values.display === 'buttons';

export interface PositionButton {
  readonly value: number;
  /** the position's name, or its value without one */
  readonly label: string;
  /** sets the value only while held, then puts back the one from before */
  readonly momentary: boolean;
}

/**
 * the buttons of a channel shown as buttons, one per position, the highest value on top like on the fader; none for
 * the other channels
 */
export const positionButtons = (fader: Fader): PositionButton[] =>
  [...faderPositions(fader)]
    .reverse()
    .map(({value, name, momentary}) => ({value, label: name ?? String(value), momentary: momentary === true}));
