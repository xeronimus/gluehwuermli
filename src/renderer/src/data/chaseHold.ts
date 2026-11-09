import {isValidHold} from '@shared/chases';
import {CHASE_HOLD_MAX_MS, CHASE_HOLD_MIN_MS} from '@shared/ipc';
import {MS_PER_SECOND} from '@shared/time';

import {numberOf} from './channelValuesDraft';

/**
 * A step's hold as the editor and the chase rows show it: seconds with two decimals. Typing and storing use the same
 * precision, so a hold reads back as it was stored and saving a chase unchanged doesn't change it.
 */

const HOLD_DECIMALS = 2;

/** a hundredth of a second: what a typed hold is rounded to */
const HOLD_RESOLUTION_MS = MS_PER_SECOND / 10 ** HOLD_DECIMALS;

/** the hold field's step, min and max, in seconds */
export const HOLD_INPUT_STEP_SECONDS = HOLD_RESOLUTION_MS / MS_PER_SECOND;
export const HOLD_MIN_SECONDS = CHASE_HOLD_MIN_MS / MS_PER_SECOND;
export const HOLD_MAX_SECONDS = CHASE_HOLD_MAX_MS / MS_PER_SECOND;

/** a step's hold in seconds with two decimals: 500 → `0.50` */
export const holdSeconds = (holdMs: number): string => (holdMs / MS_PER_SECOND).toFixed(HOLD_DECIMALS);

/**
 * the hold typed in seconds as stored, in milliseconds, rounded to a hundredth of a second (`0.055` → 60, the field
 * doesn't stop a third decimal); NaN for a blank field, which the validation reports
 */
export const holdMsOf = (holdText: string): number =>
  Math.round((numberOf(holdText) * MS_PER_SECOND) / HOLD_RESOLUTION_MS) * HOLD_RESOLUTION_MS;

/** whether the hold typed would be a valid step hold once stored; a blank field isn't */
export const isValidHoldText = (holdText: string): boolean => isValidHold(holdMsOf(holdText));
