import {style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

/** above the fixtures, so the faders below stay in view while the look is set */
export const sceneEditor = style({
  alignSelf: 'stretch',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  padding: '16px',
  background: vars.colors.surface,
  border: `1px solid ${vars.colors.focusBorder}`,
  borderRadius: vars.constants.radiusMd
});

export const editorTitle = style({
  margin: 0,
  fontSize: '1em',
  fontWeight: 600
});

export const field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  color: vars.colors.textSecondary,
  fontSize: '0.9em'
});

export const nameInput = style({
  width: '240px'
});

export const fixtureChoices = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px 16px',
  margin: 0,
  padding: 0,
  border: 'none'
});

export const fixtureChoicesTitle = style({
  marginBottom: '4px',
  padding: 0,
  color: vars.colors.textSecondary,
  fontSize: '0.9em'
});

export const checkboxLabel = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px'
});

export const errorList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  margin: 0,
  padding: 0,
  listStyle: 'none',
  color: vars.colors.danger
});

export const actions = style({
  display: 'flex',
  gap: '8px'
});
