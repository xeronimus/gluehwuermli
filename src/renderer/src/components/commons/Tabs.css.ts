import {style, styleVariants} from '@vanilla-extract/css';

import {vars} from '../themes.css';

/** minWidth 0, so a wide panel (the preset columns) scrolls inside it instead of widening it */
export const tabs = style({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  gap: '14px'
});

export const tabList = style({
  display: 'flex',
  gap: '4px',
  borderBottom: `1px solid ${vars.colors.border}`
});

const tabBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  font: 'inherit',
  padding: '6px 12px',
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

export const tabVariants = styleVariants({
  active: [tabBase, {color: vars.colors.text, borderBottomColor: vars.colors.primary, cursor: 'default'}],
  inactive: [tabBase, {color: vars.colors.textSecondary, selectors: {'&:hover': {color: vars.colors.text}}}]
});

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
