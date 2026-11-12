import {createVar, fallbackVar, style, styleVariants} from '@vanilla-extract/css';

import {vars} from '../themes.css';

/** the channel's color, `#rrggbb`; a channel without one has the primary color on its active button */
export const buttonColor = createVar();

const activeColor = fallbackVar(buttonColor, vars.colors.primary);

/** how much of the color the active button's background has, so its text stays readable on any color */
const ACTIVE_TINT_STRENGTH = '45%';

/** framed like a fader and at least as wide, so the stack sits among the faders as one of them */
export const channelButtons = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: '6px',
  minWidth: vars.constants.faderWidth,
  padding: '10px 6px',
  boxSizing: 'border-box',
  background: vars.colors.surface,
  border: `1px solid ${vars.colors.border}`,
  borderRadius: vars.constants.radiusMd
});

/** a channel whose cap is lifted with the channel lock, as on its fader */
export const channelButtonsCapLifted = style([channelButtons, {borderColor: vars.colors.danger}]);

/** as wide as `255` and `100%` in the mono font, so a value going 99 → 100 doesn't widen the stack and its fixture */
export const channelValue = style({
  alignSelf: 'center',
  minWidth: '3ch',
  textAlign: 'center',
  fontFamily: vars.fonts.mono,
  fontSize: '0.85em',
  color: vars.colors.text
});

export const channelPercent = style({
  alignSelf: 'center',
  minWidth: '4ch',
  textAlign: 'center',
  marginTop: '-4px',
  fontFamily: vars.fonts.mono,
  fontSize: '0.75em',
  color: vars.colors.textMuted
});

/** takes the column's free height, so the label sits at the bottom like a fader's */
export const positionStack = style({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
});

const positionButtonBase = style({
  font: 'inherit',
  fontSize: '0.9em',
  color: vars.colors.text,
  padding: '4px 8px',
  border: `1px solid ${vars.colors.border}`,
  borderRadius: vars.constants.radiusSm,
  background: vars.colors.surfaceRaised,
  outline: 'none',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  selectors: {
    '&:hover:not(:disabled), &:focus-visible:not(:disabled)': {
      borderColor: vars.colors.focusBorder
    },
    '&:disabled': {
      cursor: 'default',
      opacity: 0.5
    },
    // an invisible bold copy of the label holds the width of the active look, so pressing a button doesn't widen the
    // stack and its fixture
    '&::after': {
      content: 'attr(data-label)',
      display: 'block',
      height: 0,
      overflow: 'hidden',
      visibility: 'hidden',
      fontWeight: 600
    }
  }
});

const activeGlow = `0 0 8px 1px ${activeColor}`;

const activeLook = style({
  fontWeight: 600,
  borderColor: activeColor,
  background: `color-mix(in srgb, ${activeColor} ${ACTIVE_TINT_STRENGTH}, ${vars.colors.surfaceRaised})`,
  boxShadow: activeGlow,
  selectors: {
    '&:hover:not(:disabled), &:focus-visible:not(:disabled)': {
      borderColor: activeColor
    }
  }
});

/** how far a momentary position's button stands out: the height of its edge, and how far it sinks while held */
const KEY_DEPTH = '3px';

/** the edge below a momentary button, so it looks like a key that springs back */
const keyEdge = `0 ${KEY_DEPTH} 0 ${vars.colors.focusBorder}`;

/** a momentary button keeps the room of its edge below it, so the stack's gaps look even and it can sink into it */
const momentaryKey = style({marginBottom: KEY_DEPTH});

/**
 * a button per position; a momentary one (it sets the value only while held) is a raised key, sunk while its value is
 * on
 */
export const positionButton = styleVariants({
  inactive: [positionButtonBase],
  active: [positionButtonBase, activeLook],
  momentaryInactive: [positionButtonBase, momentaryKey, {boxShadow: keyEdge}],
  momentaryActive: [positionButtonBase, momentaryKey, activeLook, {transform: `translateY(${KEY_DEPTH})`}]
});

/** the channel's name, below the buttons like a fader's */
export const channelLabel = style({
  alignSelf: 'center',
  marginTop: '2px',
  padding: '2px 6px',
  fontWeight: 600,
  color: vars.colors.textSecondary
});
