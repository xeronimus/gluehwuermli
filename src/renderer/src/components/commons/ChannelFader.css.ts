import {createVar, style} from '@vanilla-extract/css';

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

/** a channel whose cap is lifted with the channel lock, e.g. a laser that can be switched on now */
export const channelFaderCapLifted = style([channelFader, {borderColor: vars.colors.danger}]);

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

/** the lock icon inside the thumb of a capped channel, dark on the light thumb */
export const faderLock = style({
  width: '14px',
  height: '14px',
  color: vars.colors.onPrimary
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
  // the ticks of a positions fader are placed in it
  position: 'relative',
  width: '6px',
  height: vars.constants.faderHeight,
  borderRadius: '3px',
  background: vars.colors.surfaceRaised,
  // the whole column catches the pointer, not only the 6px of the track
  boxShadow: `0 0 0 1px ${vars.colors.border}`
});

/** the color of a colored fader, `#rrggbb` */
export const faderColor = createVar();

/** how far a colored fader is up, 0..1: the height of its fill and the strength of its glow */
export const faderLevel = createVar();

/** blur and spread of the glow at full level; none at 0 */
const GLOW_BLUR = '16px';
const GLOW_SPREAD = '4px';

/** how much of the color the track keeps above the handle, so the color shows at 0, too */
const TINT_STRENGTH = '28%';

/**
 * a fixture channel with a color: the track is filled with it below the handle, tinted with it above, and glows with
 * the value
 */
export const faderTrackColored = style([
  faderTrack,
  {
    background: `linear-gradient(to top, ${faderColor} calc(${faderLevel} * 100%), color-mix(in srgb, ${faderColor} ${TINT_STRENGTH}, ${vars.colors.surfaceRaised}) 0)`,
    // the border ring stays first, so the track keeps its outline on a color close to the theme's background
    boxShadow: [
      `0 0 0 1px ${vars.colors.border}`,
      `0 0 calc(${faderLevel} * ${GLOW_BLUR}) calc(${faderLevel} * ${GLOW_SPREAD}) ${faderColor}`
    ].join(', ')
  }
]);

export const faderThumb = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
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
