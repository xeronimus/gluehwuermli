import {style, styleVariants} from '@vanilla-extract/css';

import {vars} from '../themes.css';

/** minWidth 0, so a wide panel (the preset columns) scrolls inside it instead of widening it */
export const tabs = style({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  gap: '14px'
});

/** the tab list and the add button after it, on one line */
export const tabHeader = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '4px',
  borderBottom: `1px solid ${vars.colors.border}`
});

export const tabList = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px'
});

const tabBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  font: 'inherit',
  padding: '4px 8px 6px 8px',
  // over the tab list's bottom line, so the active tab's line replaces it
  marginBottom: '-1px',
  background: 'none',
  border: 'none',
  borderBottom: '2px solid transparent',
  outline: 'none',
  cursor: 'pointer',
  selectors: {
    '&:focus-visible': {
      borderRadius: vars.constants.radiusSm,
      boxShadow: `0 0 0 1px ${vars.colors.focusBorder}`
    }
  }
});

/** a tab's handle, after tabBase so its background wins over tabBase's none: a light field with rounded top corners, sitting on the tab list's line */
const tabHandle = style({
  background: vars.colors.border,
  borderRadius: `${vars.constants.radiusSm} ${vars.constants.radiusSm} 0 0`
});

export const tabVariants = styleVariants({
  active: [
    tabBase,
    tabHandle,
    {
      // a lighter handle than the others, over the accent bar
      color: vars.colors.text,
      borderBottomColor: vars.colors.primary,
      background: vars.colors.focusBorder,
      cursor: 'default'
    }
  ],
  inactive: [
    tabBase,
    tabHandle,
    {
      color: vars.colors.textSecondary,
      selectors: {'&:hover': {color: vars.colors.text, background: vars.colors.focusBorder}}
    }
  ]
});

/** looks like an inactive tab */
export const tabAdd = style([
  tabBase,
  {
    color: vars.colors.textSecondary,
    selectors: {
      '&:hover:not(:disabled)': {color: vars.colors.text},
      '&:disabled': {color: vars.colors.textMuted, cursor: 'default'}
    }
  }
]);

export const tabWarning = style({
  display: 'inline-flex',
  color: vars.colors.warning
});

export const tabPanel = style({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  gap: '14px',
  selectors: {
    '&[hidden]': {display: 'none'}
  }
});
