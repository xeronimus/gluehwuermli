import {globalStyle, style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

export const helpView = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  gap: '32px'
});

export const sideColumn = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  width: '440px'
});

/** a box like the fixture help, the manual next to it is plain text; selectable like the manual, e.g. to copy a path */
export const sideSection = style({
  userSelect: 'text',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '8px',
  padding: '12px',
  background: vars.colors.surfaceRaised,
  border: `1px solid ${vars.colors.border}`,
  borderRadius: vars.constants.radiusMd,
  fontSize: '0.9em'
});

globalStyle(`${sideSection} h2`, {
  margin: 0,
  fontSize: '1.1em',
  fontWeight: 600
});

export const repositoryLink = style({
  color: vars.colors.primary,
  textDecoration: 'none',
  outline: 'none',
  selectors: {
    '&:hover, &:focus-visible': {
      color: vars.colors.primaryHover,
      textDecoration: 'underline'
    }
  }
});
