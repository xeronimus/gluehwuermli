import {globalStyle, style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

/** wide enough for all tab labels on one line */
export const manual = style({
  width: '800px',
  maxWidth: '100%',
  color: vars.colors.textSecondary,
  lineHeight: 1.5
});

/**
 * narrower than the tabs, so a line of text stays easy to read; selectable, unlike the rest of the app (global.css.ts),
 * so a passage can be copied
 */
export const manualSection = style({
  maxWidth: '640px',
  userSelect: 'text'
});

globalStyle(`${manualSection} h2`, {
  margin: '0 0 6px',
  color: vars.colors.text,
  fontSize: '1.1em',
  fontWeight: 600
});

globalStyle(`${manualSection} ol`, {
  margin: '6px 0',
  paddingLeft: '20px'
});

globalStyle(`${manualSection} li + li`, {
  marginTop: '4px'
});

globalStyle(`${manualSection} p`, {
  margin: '6px 0'
});

globalStyle(`${manualSection} strong`, {
  color: vars.colors.text,
  fontWeight: 600
});
