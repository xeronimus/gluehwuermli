import {style, styleVariants} from '@vanilla-extract/css';

import {vars} from '../themes.css';

/** how far a hovered preset's border lies outside its column, like a hovered channel row's (FixtureChannelRows) */
const COLUMN_BORDER_OFFSET = '3px';

/** the border's offset and its width: kept free around the columns, so the scrolling doesn't cut the border off */
const COLUMN_BORDER_ROOM = '4px';

/** as wide as the tab, scrolls sideways when the presets need more */
export const presetsSection = style({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0
});

export const presetColumns = style({
  display: 'flex',
  alignItems: 'flex-start',
  // wide enough that a hovered preset's border stays clear of the next one
  gap: '24px',
  overflowX: 'auto',
  padding: `${COLUMN_BORDER_ROOM} ${COLUMN_BORDER_ROOM} 6px`
});

/** a column per preset, a row per channel */
export const presetColumn = style({
  display: 'grid',
  gridTemplateColumns: 'auto auto auto',
  gridAutoRows: vars.constants.editorRowHeight,
  gap: '6px 6px',
  alignItems: 'center',
  flexShrink: 0,
  padding: '0 8px',
  borderLeft: `1px solid ${vars.colors.border}`,
  borderRadius: vars.constants.radiusMd,
  // an outline, not a border: it takes no room, so the columns don't shift while hovered
  outline: '1px solid transparent',
  outlineOffset: COLUMN_BORDER_OFFSET,
  selectors: {
    '&:hover': {outlineColor: vars.colors.focusBorder}
  }
});

export const presetHeader = style({
  gridColumn: '1 / -1',
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
});

export const presetNameInput = style({
  width: '160px'
});

/** checkbox, channel name and value of one channel, in the column's grid */
export const presetValue = style({
  gridColumn: '1 / -1',
  display: 'grid',
  gridTemplateColumns: 'subgrid',
  alignItems: 'center',
  fontSize: '0.9em'
});

/** room for `#` and six hex digits, and the swatch */
export const presetColorField = style({
  width: '100px'
});

/** the channel's color dot, if it has a color, and its name */
export const presetChannelLabel = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  minWidth: 0
});

export const presetChannelName = style({
  maxWidth: '120px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
});

/** room for three digits and the spin buttons */
const valueInput = style({
  width: '52px',
  boxSizing: 'border-box',
  paddingRight: '2px'
});

/** a channel the preset leaves out still takes a value (which ticks it), but looks unused until then */
const leftOut = {opacity: 0.45, selectors: {'&:focus, &:hover': {opacity: 1}}};

export const valueInputVariants = styleVariants({
  included: [valueInput],
  leftOut: [valueInput, leftOut]
});

/** the picker of a positions channel, wide enough for a short name */
const valueSelect = style({
  maxWidth: '110px'
});

export const valueSelectVariants = styleVariants({
  included: [valueSelect],
  leftOut: [valueSelect, leftOut]
});

export const addPreset = style({
  flexShrink: 0
});
