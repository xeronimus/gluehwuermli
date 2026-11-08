import {createVar, style, styleVariants} from '@vanilla-extract/css';

import {vars} from '../themes.css';

/** the color field with a swatch beside it that opens the color picker */
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

/** the swatch: the color picker input lies invisibly on top of it, so a click on the swatch opens the picker */
const colorPickerBase = style({
  position: 'relative',
  flexShrink: 0,
  width: '16px',
  height: '16px',
  boxSizing: 'border-box',
  borderRadius: vars.constants.radiusSm,
  cursor: 'pointer',
  selectors: {
    '&:has(:focus-visible)': {outline: `1px solid ${vars.colors.focusBorder}`, outlineOffset: '2px'}
  }
});

export const colorPicker = styleVariants({
  filled: [colorPickerBase, {background: colorSwatchColor, boxShadow: `0 0 0 1px ${vars.colors.border}`}],
  empty: [colorPickerBase, {border: `1px dashed ${vars.colors.textMuted}`}]
});

export const colorPickerInput = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  margin: 0,
  padding: 0,
  border: 'none',
  opacity: 0,
  cursor: 'pointer'
});
