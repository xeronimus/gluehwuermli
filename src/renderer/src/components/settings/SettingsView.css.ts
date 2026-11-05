import {globalStyle, style, styleVariants} from '@vanilla-extract/css';

import {vars} from '../themes.css';

/** two columns, the second wraps below the first when the window is too narrow for both */
export const settingsView = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  gap: '16px'
});

/** the project and the output on the left, the locks and the password on the right */
export const settingsColumn = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '16px'
});

/** a box per setting (the output, each lock), like the Help view's side sections */
export const settingsSection = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '8px',
  width: '560px',
  maxWidth: '100%',
  boxSizing: 'border-box',
  padding: '12px',
  background: vars.colors.surfaceRaised,
  border: `1px solid ${vars.colors.border}`,
  borderRadius: vars.constants.radiusMd,
  fontSize: '0.9em'
});

globalStyle(`${settingsSection} h2`, {
  margin: 0,
  fontSize: '1.1em',
  fontWeight: 600
});

const statusBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontWeight: 600
});

/** the safe state is calm; Setup mode should not be left open by accident, a lifted channel lock stands out most */
export const statusVariants = styleVariants({
  calm: [statusBase, {color: vars.colors.success}],
  attention: [statusBase, {color: vars.colors.warning}],
  danger: [statusBase, {color: vars.colors.danger}]
});

export const message = style({
  margin: 0,
  color: vars.colors.textSecondary
});

export const errorMessage = style({
  color: vars.colors.danger
});

/** changing the password: a row each for the current password, the new one twice, and the buttons */
export const changePasswordForm = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '6px'
});

export const checkboxLabel = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
});

export const portControls = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '6px'
});
