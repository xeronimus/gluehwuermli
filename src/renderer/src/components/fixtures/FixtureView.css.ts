import {style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

export const fixtureView = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '16px',
  flex: 1
});

export const errorMessage = style({
  color: vars.colors.danger
});

export const warnings = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  margin: 0,
  padding: 0,
  listStyle: 'none',
  color: vars.colors.warning
});

export const fixtureGroups = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '16px'
});

/** at the top of the row, not stretched to the height of the fixtures beside it */
export const addFixture = style({
  alignSelf: 'flex-start'
});
