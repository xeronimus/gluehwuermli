import {globalStyle, style, styleVariants} from '@vanilla-extract/css';

import {vars} from '../themes.css';

export const settingsView = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '16px'
});

/** a box per lock, like the Help view's side sections */
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

export const passwordForm = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '6px'
});

export const passwordInput = style({
  width: '160px'
});

export const portControls = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
});
