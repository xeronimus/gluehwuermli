import {globalStyle} from '@vanilla-extract/css';

import {vars} from './themes.css';

globalStyle('body', {
  margin: 0,
  // `vars.colors.*` isn't in scope here: the theme class is applied to a div inside <body> (App.tsx). Kept in sync with
  // `colors.background` in themes.css.ts by hand, so the window doesn't flash white before React renders
  background: '#121110',
  overflow: 'hidden',
  userSelect: 'none'
});

globalStyle('#root', {
  position: 'fixed',
  inset: 0
});

// -- icons (commons/icons.ts): sized and aligned like a glyph of the text around them
globalStyle(':where(.tabler-icon)', {
  width: '1.1em',
  height: '1.1em',
  verticalAlign: '-0.15em',
  flexShrink: 0
});

globalStyle('select, input, textarea', {
  font: 'inherit',
  color: vars.colors.text,
  background: vars.colors.surfaceRaised,
  border: `1px solid ${vars.colors.border}`,
  borderRadius: vars.constants.radiusMd,
  padding: '6px 8px'
});

globalStyle('input, textarea', {
  // the body is not selectable (a desk, not a document), typed text is
  userSelect: 'text',
  outline: 'none'
});

globalStyle('input:focus-visible, textarea:focus-visible', {
  borderColor: vars.colors.focusBorder
});
