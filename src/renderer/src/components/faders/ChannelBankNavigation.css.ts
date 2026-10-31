import {style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

export const bankNavigation = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
});

export const bankRange = style({
  minWidth: '80px',
  textAlign: 'center',
  fontFamily: vars.fonts.mono
});

export const jumpField = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginLeft: '16px',
  color: vars.colors.textSecondary,
  fontSize: '0.9em'
});

export const jumpInput = style({
  width: '70px'
});
