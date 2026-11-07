import {createTheme, createThemeContract} from '@vanilla-extract/css';

// dark, like a desk at the side of a stage; the accent is the glow of a firefly. Exported for global styles outside the
// theme class (global.css.ts)
export const colors = {
  background: '#121110',
  surface: '#1c1a17',
  surfaceRaised: '#26231f',
  border: '#34302a',
  text: '#ece6da',
  textSecondary: '#9c948a',
  textMuted: '#6b645b',
  primary: '#d9e85a',
  primaryHover: '#e7f27f',
  onPrimary: '#121110',
  success: '#7bd389',
  warning: '#f0a03c',
  danger: '#e0567a',
  focusBorder: '#5a5348'
};

/** the length of a fader's track; a number too, for laying out the labels of a positions fader (FaderTicks) */
export const FADER_HEIGHT_PX = 260;

const constants = {
  radiusSm: '4px',
  radiusMd: '7px',
  faderHeight: `${FADER_HEIGHT_PX}px`,
  faderWidth: '56px',
  /** a row of the fixture editor's channels and of its presets */
  editorRowHeight: '34px'
};

const fonts = {
  body: "'Segoe UI', system-ui, -apple-system, sans-serif",
  mono: "ui-monospace, 'Cascadia Mono', Consolas, monospace"
};

export const vars = createThemeContract({colors, constants, fonts});

export const defaultTheme = createTheme(vars, {colors, constants, fonts});
