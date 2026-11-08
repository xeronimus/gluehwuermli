import {globalStyle, style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

/** stays in sight while the manual next to it scrolls */
export const tocNav = style({
  position: 'sticky',
  top: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  width: '200px',
  fontSize: '0.9em'
});

globalStyle(`${tocNav} h2`, {
  margin: '0 0 2px',
  color: vars.colors.text,
  fontSize: '1.1em',
  fontWeight: 600
});

export const tocList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  margin: 0,
  padding: 0,
  listStyle: 'none'
});

/** looks like a link, is a button */
export const tocEntry = style({
  padding: '2px 0',
  border: 'none',
  background: 'none',
  font: 'inherit',
  color: vars.colors.textSecondary,
  textAlign: 'left',
  cursor: 'pointer',
  outline: 'none',
  selectors: {
    '&:hover, &:focus-visible': {
      color: vars.colors.primaryHover,
      textDecoration: 'underline'
    }
  }
});
