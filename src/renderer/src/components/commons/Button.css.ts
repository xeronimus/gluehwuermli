import {style, styleVariants} from '@vanilla-extract/css';

import {vars} from '../themes.css';

const buttonBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  font: 'inherit',
  color: vars.colors.text,
  border: `1px solid ${vars.colors.border}`,
  borderRadius: vars.constants.radiusMd,
  outline: 'none',
  padding: '6px 12px',
  background: vars.colors.surfaceRaised,
  cursor: 'pointer',
  selectors: {
    '&:hover:not(:disabled), &:focus-visible:not(:disabled)': {
      borderColor: vars.colors.focusBorder
    },
    '&:disabled': {
      cursor: 'default',
      opacity: 0.5
    }
  }
});

export const buttonVariants = styleVariants({
  default: [buttonBase],
  primary: [
    buttonBase,
    {
      color: vars.colors.onPrimary,
      background: vars.colors.primary,
      borderColor: vars.colors.primary,
      selectors: {
        '&:hover:not(:disabled), &:focus-visible:not(:disabled)': {
          background: vars.colors.primaryHover,
          borderColor: vars.colors.primaryHover
        }
      }
    }
  ],
  /** a preset or scene that goes above a cap the channel lock no longer holds, e.g. one switching a laser on */
  capLifted: [
    buttonBase,
    {
      borderColor: vars.colors.danger,
      selectors: {
        '&:hover:not(:disabled), &:focus-visible:not(:disabled)': {
          borderColor: vars.colors.danger
        }
      }
    }
  ],
  /** just the icon, for small secondary actions */
  icon: [
    buttonBase,
    {
      padding: '2px',
      color: vars.colors.textSecondary,
      background: 'none',
      borderColor: 'transparent',
      selectors: {
        '&:hover:not(:disabled), &:focus-visible:not(:disabled)': {
          color: vars.colors.text,
          borderColor: 'transparent'
        }
      }
    }
  ]
});

export type ButtonVariant = keyof typeof buttonVariants;
