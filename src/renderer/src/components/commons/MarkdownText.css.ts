import {globalStyle, style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

export const markdownText = style({
  overflowWrap: 'anywhere'
});

globalStyle(`${markdownText} > :first-child`, {marginTop: 0});
globalStyle(`${markdownText} > :last-child`, {marginBottom: 0});

globalStyle(`${markdownText} p, ${markdownText} ul, ${markdownText} ol, ${markdownText} table, ${markdownText} pre`, {
  margin: '0 0 0.6em'
});

globalStyle(`${markdownText} ul, ${markdownText} ol`, {
  paddingLeft: '1.4em'
});

globalStyle(`${markdownText} li + li`, {
  marginTop: '0.15em'
});

// compact reference text: headings only a little larger than the body
globalStyle(`${markdownText} h1, ${markdownText} h2, ${markdownText} h3, ${markdownText} h4`, {
  margin: '0.8em 0 0.4em',
  color: vars.colors.text,
  fontWeight: 600
});
globalStyle(`${markdownText} h1`, {fontSize: '1.1em'});
globalStyle(`${markdownText} h2`, {fontSize: '1.05em'});
globalStyle(`${markdownText} h3, ${markdownText} h4`, {fontSize: '1em'});

globalStyle(`${markdownText} code`, {
  padding: '0 0.3em',
  fontFamily: vars.fonts.mono,
  fontSize: '0.95em',
  background: vars.colors.surfaceRaised,
  borderRadius: vars.constants.radiusSm
});

globalStyle(`${markdownText} pre`, {
  padding: '8px',
  overflowX: 'auto',
  background: vars.colors.surfaceRaised,
  borderRadius: vars.constants.radiusSm
});

globalStyle(`${markdownText} pre code`, {
  padding: 0,
  background: 'none'
});

globalStyle(`${markdownText} table`, {
  borderCollapse: 'collapse'
});

globalStyle(`${markdownText} th, ${markdownText} td`, {
  padding: '2px 8px',
  border: `1px solid ${vars.colors.border}`,
  textAlign: 'left'
});

globalStyle(`${markdownText} a`, {
  color: vars.colors.primary
});

globalStyle(`${markdownText} blockquote`, {
  margin: '0 0 0.6em',
  paddingLeft: '10px',
  borderLeft: `3px solid ${vars.colors.border}`
});

globalStyle(`${markdownText} hr`, {
  border: 'none',
  borderTop: `1px solid ${vars.colors.border}`
});
