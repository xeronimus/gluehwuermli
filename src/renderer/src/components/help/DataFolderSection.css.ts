import {style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

export const folderPath = style({
  alignSelf: 'stretch',
  fontFamily: vars.fonts.mono,
  fontSize: '0.85em'
});

export const message = style({
  margin: 0,
  color: vars.colors.textSecondary
});

export const errorMessage = style({
  color: vars.colors.danger
});
