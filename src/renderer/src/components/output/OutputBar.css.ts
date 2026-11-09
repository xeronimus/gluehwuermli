import {style, styleVariants} from '@vanilla-extract/css';

import {vars} from '../themes.css';

/** three groups: the title and open project, the view toggle in the middle of the bar, the output controls */
export const outputBar = style({
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  alignItems: 'center',
  background: vars.colors.surface,
  borderBottom: `1px solid ${vars.colors.border}`
});

export const barGroup = style({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  minWidth: 0,
  padding: '12px 24px'
});

/** the output controls, at the right edge */
export const barEnd = style([barGroup, {justifyContent: 'flex-end'}]);

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

/** the open project's name, cut off with an ellipsis when the bar is narrow */
export const openProjectName = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: vars.colors.textSecondary
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

/** the selected port and Connect / Disconnect */
export const outputConnection = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px'
});

export const selectedPort = style({
  fontFamily: vars.fonts.mono,
  fontSize: '0.9em',
  color: vars.colors.textSecondary,
  whiteSpace: 'nowrap'
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
