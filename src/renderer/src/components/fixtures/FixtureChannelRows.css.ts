import {style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

export const channelsSection = style({
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0
});

/** its rows line up with the preset columns beside it */
export const channelRows = style({
  display: 'grid',
  gridTemplateColumns: '200px 90px 64px 120px auto',
  gridAutoRows: vars.constants.editorRowHeight,
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

export const offsetInput = style({
  width: '100%',
  boxSizing: 'border-box'
});

export const lockMaxInput = style({
  width: '100%',
  boxSizing: 'border-box'
});

export const channelAddress = style({
  justifySelf: 'center',
  fontFamily: vars.fonts.mono,
  color: vars.colors.textSecondary
});

export const addChannel = style({
  marginTop: '6px'
});
