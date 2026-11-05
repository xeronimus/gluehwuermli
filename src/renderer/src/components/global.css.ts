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

// -- checkboxes: a dark box like the other inputs, filled with the firefly accent when checked, instead of Chromium's
// white and blue. The tick is a background image: a data URI can't read the theme vars, so it takes the plain colour
const checkboxTick = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="${colors.onPrimary}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
)}")`;

globalStyle('input[type="checkbox"]', {
  appearance: 'none',
  flexShrink: 0,
  width: '16px',
  height: '16px',
  margin: 0,
  padding: 0,
  borderRadius: vars.constants.radiusSm,
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '100%',
  cursor: 'pointer'
});

globalStyle('input[type="checkbox"]:hover:not(:disabled)', {
  borderColor: vars.colors.focusBorder
});

globalStyle('input[type="checkbox"]:checked', {
  backgroundColor: vars.colors.primary,
  backgroundImage: checkboxTick,
  borderColor: vars.colors.primary
});

globalStyle('input[type="checkbox"]:checked:hover:not(:disabled), input[type="checkbox"]:checked:focus-visible', {
  backgroundColor: vars.colors.primaryHover,
  borderColor: vars.colors.primaryHover
});

globalStyle('input[type="checkbox"]:disabled', {
  cursor: 'default',
  opacity: 0.5
});

// -- scrollbars: thin, a rounded thumb on no track, like the rest of the desk. Chromium's own pseudo-elements: the
// standard `scrollbar-color` / `scrollbar-width` would override them and can't round the thumb
globalStyle('::-webkit-scrollbar', {
  width: '10px',
  height: '10px'
});

globalStyle('::-webkit-scrollbar-track, ::-webkit-scrollbar-corner', {
  background: 'transparent'
});

globalStyle('::-webkit-scrollbar-thumb', {
  background: vars.colors.border,
  // the transparent border keeps the thumb clear of the edges, background-clip draws it inside the border only
  border: '2px solid transparent',
  backgroundClip: 'padding-box',
  borderRadius: '5px'
});

globalStyle('::-webkit-scrollbar-thumb:hover', {
  background: vars.colors.focusBorder,
  backgroundClip: 'padding-box'
});
