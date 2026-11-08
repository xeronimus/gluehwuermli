import {style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

/** below the chase rows, as wide as the view */
export const chaseEditor = style({
  alignSelf: 'stretch',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
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

export const repeatChoices = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '6px 16px',
  margin: 0,
  padding: 0,
  border: 'none'
});

export const repeatTitle = style({
  marginBottom: '4px',
  padding: 0,
  color: vars.colors.textSecondary,
  fontSize: '0.9em'
});

export const repeatChoice = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px'
});

/** room for two digits and the spinner */
export const countInput = style({
  width: '52px'
});

export const steps = style({
  alignSelf: 'stretch',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  margin: 0,
  padding: 0,
  listStyle: 'none'
});

export const stepEditor = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '6px',
  padding: '8px 12px',
  background: vars.colors.surfaceRaised,
  border: `1px solid ${vars.colors.border}`,
  borderRadius: vars.constants.radiusMd
});

export const stepHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
});

export const stepNumber = style({
  minWidth: '24px',
  fontFamily: vars.fonts.mono,
  fontWeight: 600
});

export const holdField = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  marginRight: '8px',
  color: vars.colors.textSecondary,
  fontSize: '0.9em'
});

/** room for `3600.00` */
export const holdInput = style({
  width: '84px'
});

export const stepValues = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  margin: 0,
  padding: 0,
  listStyle: 'none'
});

export const stepValue = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
});

/** room for `512` and the spinner */
export const channelInput = style({
  width: '64px'
});

export const valueArrow = style({
  color: vars.colors.textMuted
});

/** room for `255` and the spinner */
export const valueInput = style({
  width: '64px'
});

export const valueLabel = style({
  minWidth: '160px',
  color: vars.colors.textSecondary,
  fontSize: '0.9em'
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
