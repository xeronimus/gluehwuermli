import {createVar, style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

export const valueBarColor = createVar();
/** how far the bar is filled, 0 to 1 */
export const valueBarFill = createVar();

/** a thin track, filled from the left in the channel's color; neutral for a channel without one */
export const valueBar = style({
  vars: {[valueBarColor]: vars.colors.textSecondary},
  position: 'relative',
  flexShrink: 0,
  width: '96px',
  height: '6px',
  overflow: 'hidden',
  background: vars.colors.background,
  border: `1px solid ${vars.colors.border}`,
  borderRadius: '3px',
  '::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background: valueBarColor,
    transform: `scaleX(${valueBarFill})`,
    transformOrigin: 'left'
  }
});
