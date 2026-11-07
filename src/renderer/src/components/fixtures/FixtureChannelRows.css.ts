import {style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

export const channelsSection = style({
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0
});

export const channelRows = style({
  display: 'grid',
  gridTemplateColumns: '200px auto 64px auto auto 110px auto',
  // a channel's positions list is taller than a row
  gridAutoRows: `minmax(${vars.constants.editorRowHeight}, auto)`,
  gap: '6px 8px',
  alignItems: 'center',
  justifyItems: 'start'
});

export const columnHeader = style({
  color: vars.colors.textSecondary,
  fontSize: '0.9em'
});

export const channelNameInput = style({
  width: '100%',
  boxSizing: 'border-box'
});

/** room for three digits next to the spinner: offsets go up to 511, values up to 255 */
const threeDigitInput = style({
  width: 'calc(3ch + 40px)',
  boxSizing: 'border-box'
});

export const offsetInput = threeDigitInput;

export const lockMaxInput = threeDigitInput;

export const channelAddress = style({
  justifySelf: 'center',
  fontFamily: vars.fonts.mono,
  color: vars.colors.textSecondary
});

export const addChannel = style({
  marginTop: '6px'
});
