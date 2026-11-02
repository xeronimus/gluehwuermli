import {style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

export const fixtureView = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '16px',
  flex: 1
});

/** at the bottom of the view, or below the fixtures once they fill more than the window */
export const footer = style({
  marginTop: 'auto',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  alignSelf: 'stretch'
});

export const message = style({
  color: vars.colors.textSecondary
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
