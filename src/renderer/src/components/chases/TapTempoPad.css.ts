import {createVar, keyframes, style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

/** one beat, and how far into it the blink starts: set inline from the tempo (data/tempoPad.ts) */
export const beatDuration = createVar();
export const beatDelay = createVar();

/** a flash at the start of each beat, fading out well before the next */
const blink = keyframes({
  '0%': {opacity: 1},
  '30%': {opacity: 0.15},
  '100%': {opacity: 0.15}
});

/** above the chase rows, on the left like their controls */
export const tapTempo = style({
  alignSelf: 'flex-start',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
});

export const bpm = style({
  minWidth: '64px',
  fontFamily: vars.fonts.mono
});

const beatMarkBase = style({
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  flexShrink: 0
});

export const beatMarkIdle = style([beatMarkBase, {background: vars.colors.border}]);

export const beatMarkBlinking = style([
  beatMarkBase,
  {
    background: vars.colors.primary,
    animationName: blink,
    animationDuration: beatDuration,
    animationDelay: beatDelay,
    animationTimingFunction: 'ease-out',
    animationIterationCount: 'infinite'
  }
]);
