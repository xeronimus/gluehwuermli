import {isValidFade, isValidHold} from '@shared/chases';
import {CHASE_FADE_MAX_MS, CHASE_HOLD_MAX_MS, CHASE_HOLD_MIN_MS} from '@shared/ipc';
import {MS_PER_SECOND} from '@shared/time';

import {numberOf} from './channelValuesDraft';

/**
 * A step's hold and fade in as the editor and the chase rows show them: seconds with two decimals. Typing and storing
 * use the same precision, so a time reads back as it was stored and saving a chase unchanged doesn't change it.
 */

const TIME_DECIMALS = 2;

/** a hundredth of a second: what a typed time is rounded to */
const TIME_RESOLUTION_MS = MS_PER_SECOND / 10 ** TIME_DECIMALS;

/** the step of the hold and fade fields, in seconds */
export const TIME_INPUT_STEP_SECONDS = TIME_RESOLUTION_MS / MS_PER_SECOND;

/** the hold field's min and max, in seconds */
export const HOLD_MIN_SECONDS = CHASE_HOLD_MIN_MS / MS_PER_SECOND;
export const HOLD_MAX_SECONDS = CHASE_HOLD_MAX_MS / MS_PER_SECOND;

/** the fade field's min and max, in seconds: a step may set its values at once */
export const FADE_MIN_SECONDS = 0;
export const FADE_MAX_SECONDS = CHASE_FADE_MAX_MS / MS_PER_SECOND;

/** a time in seconds with two decimals: 500 → `0.50` */
export const secondsText = (ms: number): string => (ms / MS_PER_SECOND).toFixed(TIME_DECIMALS);

/**
 * a time typed in seconds as stored, in milliseconds, rounded to a hundredth of a second (`0.055` → 60, the field
 * doesn't stop a third decimal); NaN for a blank field, which the validation reports
 */
export const msOfSecondsText = (secondsTyped: string): number =>
  Math.round((numberOf(secondsTyped) * MS_PER_SECOND) / TIME_RESOLUTION_MS) * TIME_RESOLUTION_MS;

/** a step's hold in seconds with two decimals */
export const holdSeconds = secondsText;

/** the hold typed in seconds, in milliseconds */
export const holdMsOf = msOfSecondsText;

/** whether the hold typed would be a valid step hold once stored; a blank field isn't */
export const isValidHoldText = (holdText: string): boolean => isValidHold(msOfSecondsText(holdText));

/** whether the fade typed would be a valid fade in once stored; 0 is, a blank field isn't */
export const isValidFadeText = (fadeText: string): boolean => isValidFade(msOfSecondsText(fadeText));
