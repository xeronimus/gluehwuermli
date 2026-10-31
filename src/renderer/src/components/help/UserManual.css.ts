import {globalStyle, style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

export const manual = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  maxWidth: '640px',
  color: vars.colors.textSecondary,
  lineHeight: 1.5
});

export const manualSection = style({});

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
