import {style, styleVariants} from '@vanilla-extract/css';

import {vars} from '../themes.css';

export const tabs = style({
  display: 'flex',
  gap: '4px',
  padding: '0 24px',
  background: vars.colors.surface,
  borderBottom: `1px solid ${vars.colors.border}`
});

const tabBase = style({
  font: 'inherit',
  padding: '10px 14px',
  background: 'none',
  border: 'none',
  borderBottom: '2px solid transparent',
  outline: 'none',
  cursor: 'pointer',
  selectors: {
    '&:focus-visible': {
      color: vars.colors.text
    }
  }
});

export const tabVariants = styleVariants({
  active: [tabBase, {color: vars.colors.primary, borderBottomColor: vars.colors.primary}],
  inactive: [tabBase, {color: vars.colors.textSecondary, ':hover': {color: vars.colors.text}}]
});
