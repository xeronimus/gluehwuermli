import {globalStyle, keyframes, style, styleVariants} from '@vanilla-extract/css';

import {vars} from '../themes.css';

export const stepTable = style({
  borderCollapse: 'collapse'
});

const cellBase = style({
  padding: '2px 6px',
  verticalAlign: 'middle'
});

export const headerCell = style([
  cellBase,
  {
    paddingBottom: '4px',
    textAlign: 'left',
    fontWeight: 'normal',
    color: vars.colors.textMuted,
    fontSize: '0.85em',
    borderBottom: `1px solid ${vars.colors.border}`
  }
]);

export const cell = cellBase;

/** a fixture's name above its rows, or Unassigned */
export const groupHeading = style([
  cellBase,
  {
    paddingTop: '10px',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: '0.9em'
  }
]);

/** framed, so removing a whole group isn't mistaken for a row's ✕ */
export const groupRemove = style({
  display: 'inline-flex',
  // the ✕'s own colors (Button's icon variant), its hover and focus too, so frame and ✕ read as one button
  border: `1px solid ${vars.colors.textSecondary}`,
  borderRadius: vars.constants.radiusSm,
  selectors: {
    '&:hover, &:has(:focus-visible)': {borderColor: vars.colors.text}
  }
});

/** the frame is the button's edge: no room between it and the ✕ */
globalStyle(`${groupRemove} button`, {
  padding: 0
});

/** the dot's slot is there without a color too, so every channel name starts at the same x */
export const channelName = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  minWidth: '120px',
  color: vars.colors.textSecondary,
  fontSize: '0.9em'
});

export const dotSlot = style({
  display: 'inline-flex',
  flexShrink: 0,
  width: '10px'
});

export const valueCell = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
});

export const positionName = style({
  color: vars.colors.textSecondary,
  fontSize: '0.85em',
  whiteSpace: 'nowrap'
});

/** room for three digits next to the spinner: channels go up to 512, values up to 255 */
const threeDigitInput = style({
  width: 'calc(3ch + 40px)',
  boxSizing: 'border-box'
});

export const numberInput = styleVariants({
  valid: [threeDigitInput],
  invalid: [threeDigitInput, {borderColor: vars.colors.danger}]
});

export const rowErrors = style([
  cellBase,
  {
    paddingTop: 0,
    paddingBottom: '6px',
    color: vars.colors.danger,
    fontSize: '0.85em'
  }
]);

const ROW_TINT = `color-mix(in srgb, ${vars.colors.primary} 16%, transparent)`;

/** the background of a changed row fading away */
const flashFrames = () =>
  keyframes({
    from: {background: `color-mix(in srgb, ${vars.colors.primary} 35%, transparent)`},
    to: {background: 'transparent'}
  });

const FLASH_DURATION = '1.2s';

/**
 * a row a hovered fill button would change is tinted; the rows a click changed flash. Two flashes alike, alternated on
 * each take: a class that stays on the row doesn't start its animation again (see rowMarkOf in ChaseStepTable)
 */
export const stepRow = styleVariants({
  none: {},
  affected: {background: ROW_TINT},
  flashEven: {animation: `${flashFrames()} ${FLASH_DURATION} ease-out`},
  flashOdd: {animation: `${flashFrames()} ${FLASH_DURATION} ease-out`}
});

export type StepRowMark = keyof typeof stepRow;
