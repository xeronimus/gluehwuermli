import {style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

/** the inputs and buttons in a row, wrapping when narrow; also the rows of changing the password */
export const passwordForm = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '6px'
});

export const passwordInput = style({
  width: '160px'
});

export const errorMessage = style({
  color: vars.colors.danger
});
