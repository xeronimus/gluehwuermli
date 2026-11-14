import {style} from '@vanilla-extract/css';

import {vars} from './themes.css';

/** small in the bottom left corner below the mascot, behind everything like it */
export const versionLabel = style({
  position: 'absolute',
  left: '8px',
  bottom: '4px',
  zIndex: -1,
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  fontFamily: vars.fonts.mono,
  fontSize: '11px',
  color: vars.colors.textMuted,
  pointerEvents: 'none',
  userSelect: 'none'
});

export const madeIn = style({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontFamily: vars.fonts.body,
  fontWeight: 600
});

export const flag = style({
  width: '14px',
  height: '14px'
});
