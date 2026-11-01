import {globalStyle, style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

export const fixtureHelp = style({
  width: '100%',
  boxSizing: 'border-box',
  padding: '8px 12px',
  background: vars.colors.surfaceRaised,
  border: `1px solid ${vars.colors.border}`,
  borderRadius: vars.constants.radiusMd,
  color: vars.colors.textSecondary,
  fontSize: '0.9em'
});

export const helpSummary = style({
  color: vars.colors.text,
  cursor: 'pointer',
  outline: 'none',
  selectors: {
    '&:focus-visible': {
      color: vars.colors.primary
    }
  }
});

/** the box spans the editor, the text stays short enough to read */
export const helpBody = style({
  maxWidth: '680px',
  lineHeight: 1.45
});

globalStyle(`${helpBody} ol`, {
  margin: '8px 0',
  paddingLeft: '20px'
});

globalStyle(`${helpBody} li + li`, {
  marginTop: '4px'
});

globalStyle(`${helpBody} p`, {
  margin: '8px 0 4px'
});

globalStyle(`${helpBody} strong`, {
  color: vars.colors.text,
  fontWeight: 600
});

export const helpExample = style({
  color: vars.colors.text
});
