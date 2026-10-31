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

/** a button that looks like text until hovered: a click leads to the port controls in the Settings view */
const statusBase = style({
  padding: '2px 6px',
  border: 'none',
  borderRadius: vars.constants.radiusSm,
  fontFamily: vars.fonts.mono,
  fontSize: '0.9em',
  background: 'none',
  outline: 'none',
  cursor: 'pointer',
  selectors: {
    '&:hover, &:focus-visible': {
      background: vars.colors.surfaceRaised
    }
  }
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

const lockIndicatorBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '2px 8px',
  border: '1px solid',
  borderRadius: vars.constants.radiusSm,
  font: 'inherit',
  fontSize: '0.85em',
  whiteSpace: 'nowrap',
  background: 'none',
  outline: 'none',
  cursor: 'pointer',
  selectors: {
    '&:hover, &:focus-visible': {
      background: vars.colors.surfaceRaised
    }
  }
});

export const lockIndicatorVariants = styleVariants({
  setup: [lockIndicatorBase, {color: vars.colors.warning, borderColor: vars.colors.warning}],
  channelLockLifted: [lockIndicatorBase, {color: vars.colors.danger, borderColor: vars.colors.danger}]
});
