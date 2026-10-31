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

/** a column, so a view can grow to the full height (FixtureView keeps its Add button at the bottom) */
export const content = style({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'auto',
  padding: '24px'
});
