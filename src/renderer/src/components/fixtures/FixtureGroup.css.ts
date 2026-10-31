import {style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

export const fixtureGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  padding: '12px',
  background: vars.colors.surface,
  border: `1px solid ${vars.colors.border}`,
  borderRadius: vars.constants.radiusMd
});

export const groupHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
});

export const groupName = style({
  flex: 1,
  fontWeight: 600
});

export const groupAddresses = style({
  fontFamily: vars.fonts.mono,
  fontSize: '0.85em',
  color: vars.colors.textMuted
});

/** as wide as the faders, not wider: a long description wraps and is cut after a few lines (all of it on hover) */
export const groupDescription = style({
  width: 0,
  minWidth: '100%',
  margin: 0,
  color: vars.colors.textSecondary,
  fontSize: '0.85em',
  whiteSpace: 'pre-line',
  overflowWrap: 'anywhere',
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 3,
  overflow: 'hidden'
});

export const groupFaders = style({
  display: 'flex',
  gap: '8px'
});
