import {style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

/** the whole width of the view, below the fixture groups */
export const chaseList = style({
  alignSelf: 'stretch',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
});

export const chaseRows = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  margin: 0,
  padding: 0,
  listStyle: 'none'
});

export const errorMessage = style({
  color: vars.colors.danger
});

/** below the last row, where the new one will be */
export const addChase = style({
  alignSelf: 'flex-start'
});
