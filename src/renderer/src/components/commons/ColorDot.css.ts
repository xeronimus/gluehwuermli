import {createVar, style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

export const colorDotColor = createVar();

/** a small glowing dot in a channel's, preset's or scene's color */
export const colorDot = style({
  flexShrink: 0,
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  background: colorDotColor,
  boxShadow: `0 0 0 1px ${vars.colors.border}, 0 0 6px ${colorDotColor}`
});
