import {style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

export const channelRows = style({
  display: 'grid',
  gridTemplateColumns: '200px 90px 64px auto',
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

export const channelAddress = style({
  justifySelf: 'center',
  fontFamily: vars.fonts.mono,
  color: vars.colors.textSecondary
});

export const addChannel = style({
  gridColumn: '1 / -1'
});
