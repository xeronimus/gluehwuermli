import {style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

export const valuesField = style({
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
});

export const modeSelect = style({
  width: '110px'
});

/** room for three digits next to the spinner */
export const valueInput = style({
  width: 'calc(3ch + 40px)',
  boxSizing: 'border-box'
});

export const rangeSeparator = style({
  color: vars.colors.textSecondary,
  fontSize: '0.9em',
  whiteSpace: 'nowrap'
});

/** takes the separator's room in the header without showing it */
export const hiddenSeparator = style([rangeSeparator, {visibility: 'hidden'}]);
