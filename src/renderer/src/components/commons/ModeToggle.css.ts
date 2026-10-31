import {style, styleVariants} from '@vanilla-extract/css';

import {vars} from '../themes.css';

export const modeToggle = style({
  display: 'inline-flex'
});

const modeBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  font: 'inherit',
  padding: '6px 12px',
  border: `1px solid ${vars.colors.border}`,
  borderRadius: 0,
  outline: 'none',
  cursor: 'pointer',
  selectors: {
    // the neighbours share one border, only the outer corners are rounded
    '&:not(:first-child)': {
      marginLeft: '-1px'
    },
    '&:first-child': {
      borderTopLeftRadius: vars.constants.radiusMd,
      borderBottomLeftRadius: vars.constants.radiusMd
    },
    '&:last-child': {
      borderTopRightRadius: vars.constants.radiusMd,
      borderBottomRightRadius: vars.constants.radiusMd
    },
    // above its neighbours, so the whole highlighted border shows
    '&:focus-visible': {
      position: 'relative',
      borderColor: vars.colors.focusBorder
    }
  }
});

export const modeVariants = styleVariants({
  active: [
    modeBase,
    {
      position: 'relative',
      color: vars.colors.onPrimary,
      background: vars.colors.primary,
      borderColor: vars.colors.primary,
      cursor: 'default'
    }
  ],
  inactive: [
    modeBase,
    {
      color: vars.colors.textSecondary,
      background: vars.colors.surfaceRaised,
      selectors: {
        '&:hover:not(:disabled)': {color: vars.colors.text},
        '&:disabled': {cursor: 'default', opacity: 0.5}
      }
    }
  ]
});
