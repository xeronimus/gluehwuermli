import {style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

export const errorFallback = style({
  padding: '24px',
  color: vars.colors.text
});

export const errorMessage = style({
  fontFamily: vars.fonts.mono,
  color: vars.colors.danger
});
