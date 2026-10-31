import {style} from '@vanilla-extract/css';

import {vars} from './themes.css';

export const app = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  background: vars.colors.background,
  color: vars.colors.text,
  fontFamily: vars.fonts.body
});

export const content = style({
  flex: 1,
  overflow: 'auto',
  padding: '24px'
});
