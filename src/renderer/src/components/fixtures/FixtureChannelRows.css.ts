import {keyframes, style, styleVariants} from '@vanilla-extract/css';

import {vars} from '../themes.css';

/** how far a hovered row's border lies outside its cells */
const ROW_BORDER_OFFSET = '3px';

/** the border's offset and its width: kept free around the rows, so the scrolling doesn't cut the border off */
const ROW_BORDER_ROOM = '4px';

/** scrolls sideways inside the editor in a narrow window, like the preset columns, rather than crossing its border */
export const channelsSection = style({
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  minWidth: 0,
  overflowX: 'auto',
  padding: `${ROW_BORDER_ROOM} ${ROW_BORDER_ROOM} 6px`
});

export const startAddressLine = style({
  marginBottom: '8px',
  color: vars.colors.textSecondary,
  fontSize: '0.9em'
});

/** like the addresses in the rows below */
export const startAddressValue = style({
  fontFamily: vars.fonts.mono
});

export const channelRows = style({
  display: 'grid',
  gridTemplateColumns: '200px auto 64px auto auto auto auto',
  // a channel's positions list is taller than a row
  gridAutoRows: `minmax(${vars.constants.editorRowHeight}, auto)`,
  gap: '6px 8px',
  alignItems: 'center',
  justifyItems: 'start',
  // the columns keep their width in a wide window instead of sharing the room left: a channel's name, offset and
  // address stay together
  justifyContent: 'start'
});

/**
 * a channel's cells, laid out in the table's columns (a subgrid), so the whole row can glow and be framed while
 * hovered; its positions list is a row of its own inside it
 */
const channelRowBase = style({
  gridColumn: '1 / -1',
  display: 'grid',
  gridTemplateColumns: 'subgrid',
  gridAutoRows: `minmax(${vars.constants.editorRowHeight}, auto)`,
  rowGap: '6px',
  alignItems: 'center',
  justifyItems: 'start',
  borderRadius: vars.constants.radiusMd,
  // an outline, not a border: it takes no room, so the row's cells stay in line with the headers
  outline: '1px solid transparent',
  outlineOffset: ROW_BORDER_OFFSET,
  selectors: {
    '&:hover': {outlineColor: vars.colors.focusBorder}
  }
});

/** a glow around the row fading away: where a moved channel went */
const glowFrames = () =>
  keyframes({
    from: {boxShadow: `0 0 10px 3px ${vars.colors.focusBorder}`},
    to: {boxShadow: '0 0 10px 3px transparent'}
  });

const GLOW_DURATION = '1.2s';

/** two glows alike, alternated on each move: see glowOf in FixtureChannelRows */
export const channelRow = styleVariants({
  none: [channelRowBase],
  even: [channelRowBase, {animation: `${glowFrames()} ${GLOW_DURATION} ease-out`}],
  odd: [channelRowBase, {animation: `${glowFrames()} ${GLOW_DURATION} ease-out`}]
});

export type ChannelRowGlow = keyof typeof channelRow;

export const columnHeader = style({
  color: vars.colors.textSecondary,
  fontSize: '0.9em'
});

export const channelNameInput = style({
  width: '100%',
  boxSizing: 'border-box'
});

/** room for three digits next to the spinner: offsets go up to 511, values up to 255 */
const threeDigitInput = style({
  width: 'calc(3ch + 40px)',
  boxSizing: 'border-box'
});

export const offsetInput = threeDigitInput;

export const lockMaxInput = threeDigitInput;

export const channelAddress = style({
  justifySelf: 'center',
  fontFamily: vars.fonts.mono,
  color: vars.colors.textSecondary
});

/**
 * the row's arrows and its Remove button, together in the last column; set apart from the color field, whose swatch
 * would otherwise read as one more button of the group
 */
export const rowActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  marginLeft: '12px'
});

export const addChannel = style({
  marginTop: '6px'
});
