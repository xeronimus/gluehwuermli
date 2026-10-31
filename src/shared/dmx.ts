/** channels of one DMX universe, numbered from FIRST_DMX_CHANNEL like on every console and fixture */
export const DMX_UNIVERSE_SIZE = 512;
export const FIRST_DMX_CHANNEL = 1;
export const LAST_DMX_CHANNEL = FIRST_DMX_CHANNEL + DMX_UNIVERSE_SIZE - 1;

export const DMX_MIN_VALUE = 0;
export const DMX_MAX_VALUE = 255;

export const isDmxChannel = (channel: number): boolean =>
  Number.isInteger(channel) && channel >= FIRST_DMX_CHANNEL && channel <= LAST_DMX_CHANNEL;

export const isDmxValue = (value: number): boolean =>
  Number.isInteger(value) && value >= DMX_MIN_VALUE && value <= DMX_MAX_VALUE;
