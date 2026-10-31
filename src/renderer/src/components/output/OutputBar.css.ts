import {style, styleVariants} from '@vanilla-extract/css';

import {vars} from '../themes.css';

export const outputBar = style({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 24px',
  background: vars.colors.surface,
  borderBottom: `1px solid ${vars.colors.border}`
});

export const appLogo = style({
  width: '32px',
  height: '32px',
  borderRadius: vars.constants.radiusMd
});

export const appTitle = style({
  fontWeight: 600,
  color: vars.colors.primary,
  marginRight: '12px'
});

/** pushes the output controls to the right edge, away from the view toggle */
export const spacer = style({
  flex: 1
});

const statusBase = style({
  fontFamily: vars.fonts.mono,
  fontSize: '0.9em'
});

export const statusVariants = styleVariants({
  disconnected: [statusBase, {color: vars.colors.textSecondary}],
  connecting: [statusBase, {color: vars.colors.warning}],
  connected: [statusBase, {color: vars.colors.success}],
  failed: [statusBase, {color: vars.colors.danger}]
});

export const activeChannels = style({
  color: vars.colors.textMuted,
  fontSize: '0.9em'
});

export const outputError = style({
  color: vars.colors.danger
});
