import {style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

/** the Show view without a project: what a project is, and how to get one */
export const projectStartView = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '16px',
  maxWidth: '640px'
});

export const projectHeading = style({
  margin: 0,
  fontSize: '1.3em',
  fontWeight: 600
});

export const buttonRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '8px'
});

export const message = style({
  margin: 0,
  color: vars.colors.textSecondary
});

export const errorMessage = style({
  margin: 0,
  color: vars.colors.danger
});

export const projectPath = style({
  fontFamily: vars.fonts.mono,
  fontSize: '0.85em',
  overflowWrap: 'anywhere'
});

export const currentProject = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontWeight: 600
});

export const recentList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  alignSelf: 'stretch',
  margin: 0,
  padding: 0,
  listStyle: 'none'
});

export const recentEntry = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
});

/** a recent project: its name, the path below it */
export const recentLabel = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '2px',
  textAlign: 'left'
});

export const missingMarker = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  color: vars.colors.warning
});
