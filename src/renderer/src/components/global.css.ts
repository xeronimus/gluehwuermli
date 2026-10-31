import {globalStyle} from '@vanilla-extract/css';

import {colors, vars} from './themes.css';

globalStyle('body', {
  margin: 0,
  // `vars.colors.*` isn't in scope here: the theme class is applied to a div inside <body> (App.tsx). The plain colour,
  // so the window doesn't flash white before React renders
  background: colors.background,
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
  padding: '6px 8px',
  // the focus shows as a border, like on the buttons, not as Chromium's white outline
  outline: 'none'
});

globalStyle('input, textarea', {
  // the body is not selectable (a desk, not a document), typed text is
  userSelect: 'text'
});

globalStyle('select:focus-visible, input:focus-visible, textarea:focus-visible', {
  borderColor: vars.colors.focusBorder
});
