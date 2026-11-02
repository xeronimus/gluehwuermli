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

/** the fixture icon and the name */
export const groupName = style({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontWeight: 600
});

export const groupAddresses = style({
  fontFamily: vars.fonts.mono,
  fontSize: '0.85em',
  color: vars.colors.textMuted
});

/** as wide as the faders, not wider: a long text wraps instead of widening the group */
export const groupNote = style({
  width: 0,
  minWidth: '100%',
  margin: 0,
  color: vars.colors.textSecondary,
  fontSize: '0.85em',
  overflowWrap: 'anywhere'
});

/** the hint, and the button opening the description at its right */
export const groupFooter = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
});

/** takes the footer's free width, so the button stays at the right, even without a hint */
export const groupHint = style({
  flex: 1,
  width: 0,
  margin: 0,
  color: vars.colors.textSecondary,
  fontSize: '0.85em',
  fontStyle: 'italic',
  whiteSpace: 'pre-line',
  overflowWrap: 'anywhere'
});

export const groupFaders = style({
  display: 'flex',
  gap: '8px'
});
