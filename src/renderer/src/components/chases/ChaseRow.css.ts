import {globalStyle, style, styleVariants} from '@vanilla-extract/css';

import {vars} from '../themes.css';

/** low and full width: the chase list reads like a cue list below the fixtures */
const chaseRowBase = style({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '4px 12px 4px 6px',
  background: vars.colors.surface,
  border: `1px solid ${vars.colors.border}`,
  borderRadius: vars.constants.radiusMd
});

export const chaseRow = styleVariants({
  idle: [chaseRowBase],
  running: [chaseRowBase, {borderColor: vars.colors.primary, background: vars.colors.surfaceRaised}],
  // the same highlight, but a dashed edge and no glow: the clock stands still
  paused: [chaseRowBase, {borderColor: vars.colors.primary, borderStyle: 'dashed'}],
  dimmed: [chaseRowBase]
});

// another chase plays; the row's Start still works, so it is dimmed, not disabled. Its contents only: the row's
// background stays opaque over the mascot
globalStyle(`${chaseRow.dimmed} > *`, {opacity: 0.5});

/** as wide as two icon buttons in every row, so the names line up */
export const rowControls = style({
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  width: '52px',
  flexShrink: 0
});

export const rowName = style({
  width: '200px',
  flexShrink: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontWeight: 600
});

export const rowPass = style({
  minWidth: '80px',
  textAlign: 'right',
  fontSize: '0.9em',
  color: vars.colors.textSecondary,
  whiteSpace: 'nowrap'
});

export const rowRepeat = style({
  width: '32px',
  textAlign: 'right',
  fontFamily: vars.fonts.mono,
  color: vars.colors.textSecondary
});

/** Setup mode's buttons at the end of the row, after the repeat */
export const rowActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  flexShrink: 0
});
