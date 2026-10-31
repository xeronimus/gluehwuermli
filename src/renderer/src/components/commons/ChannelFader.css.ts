import {style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

export const channelFader = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
  width: vars.constants.faderWidth,
  padding: '10px 0',
  background: vars.colors.surface,
  border: `1px solid ${vars.colors.border}`,
  borderRadius: vars.constants.radiusMd
});

/** the value above the fader and the label below it, clickable to step the value without the look of a button */
export const faderStepButton = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2px',
  padding: '2px 6px',
  border: 'none',
  borderRadius: vars.constants.radiusSm,
  background: 'none',
  font: 'inherit',
  cursor: 'pointer',
  selectors: {
    '&:hover:not(:disabled)': {
      background: vars.colors.surfaceRaised
    },
    '&:disabled': {
      cursor: 'default'
    },
    '&:focus-visible': {
      outline: `2px solid ${vars.colors.primaryHover}`
    }
  }
});

/** the label sits a little further from the track than the column's gap */
export const faderLabelButton = style([faderStepButton, {marginTop: '2px'}]);

export const faderLock = style({
  color: vars.colors.warning
});

export const faderValue = style({
  fontFamily: vars.fonts.mono,
  fontSize: '0.85em',
  color: vars.colors.text
});

export const faderPercent = style({
  fontFamily: vars.fonts.mono,
  fontSize: '0.75em',
  color: vars.colors.textMuted
});

export const faderLabel = style({
  fontWeight: 600,
  color: vars.colors.textSecondary
});

export const faderTrack = style({
  width: '6px',
  height: vars.constants.faderHeight,
  borderRadius: '3px',
  background: vars.colors.surfaceRaised,
  // the whole column catches the pointer, not only the 6px of the track
  boxShadow: `0 0 0 1px ${vars.colors.border}`
});

export const faderThumb = style({
  width: '36px',
  height: '18px',
  borderRadius: vars.constants.radiusSm,
  background: vars.colors.primary,
  outline: 'none',
  selectors: {
    '&:focus-visible': {
      boxShadow: `0 0 0 2px ${vars.colors.primaryHover}`
    }
  }
});

/** the thumb of a channel capped at 0: greyed out, it can't be moved */
export const faderThumbLocked = style([faderThumb, {background: vars.colors.textMuted}]);
