import {createVar, style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

/** the color field with a swatch of the color beside it once it is one */
export const colorField = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  width: '100%'
});

export const colorInput = style({
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  fontFamily: vars.fonts.mono
});

export const colorSwatchColor = createVar();

export const colorSwatch = style({
  flexShrink: 0,
  width: '16px',
  height: '16px',
  borderRadius: vars.constants.radiusSm,
  background: colorSwatchColor,
  boxShadow: `0 0 0 1px ${vars.colors.border}`
});
