import {CHANNEL_COLOR_PATTERN} from './ipc';

/**
 * The colors of channels, presets and scenes: stored as `#rrggbb` in lower case, typed in any case, with or without
 * the `#`.
 */

const STORED_COLOR = new RegExp(CHANNEL_COLOR_PATTERN);

/** a color as typed: six hex digits, with or without the `#`, in any case */
const TYPED_COLOR = /^#?([0-9a-f]{6})$/i;

/** true for no color and for one as stored; anything else is refused when saving */
export const isValidColor = (color: string | undefined): boolean => color === undefined || STORED_COLOR.test(color);

/** the color as stored (`#rrggbb`, lower case) for what the user typed, e.g. `FF00FF`; undefined if it is none */
export function normalizedColor(text: string): string | undefined {
  const hexDigits = TYPED_COLOR.exec(text.trim())?.[1];
  return hexDigits === undefined ? undefined : `#${hexDigits.toLowerCase()}`;
}

/**
 * what to store for a color field: nothing when it is blank, the normalized color, or the text as typed when it isn't
 * a color (which the validation then reports)
 */
export function colorToStore(text: string): string | undefined {
  const trimmed = text.trim();
  return trimmed === '' ? undefined : (normalizedColor(trimmed) ?? trimmed);
}
