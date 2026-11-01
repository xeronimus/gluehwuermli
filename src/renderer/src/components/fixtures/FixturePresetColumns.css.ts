import {style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

/** takes the width left beside the channels, scrolls sideways when the presets need more */
export const presetsSection = style({
  display: 'flex',
  flexDirection: 'column',
  flex: '1 1 0',
  minWidth: 0
});

export const presetColumns = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px',
  overflowX: 'auto',
  paddingBottom: '6px'
});

/** a column per preset; its rows line up with the channel rows beside it */
export const presetColumn = style({
  display: 'grid',
  gridTemplateColumns: 'auto auto auto',
  gridAutoRows: vars.constants.editorRowHeight,
  gap: '6px 6px',
  alignItems: 'center',
  flexShrink: 0,
  padding: '0 8px',
  borderLeft: `1px solid ${vars.colors.border}`
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

export const presetChannelName = style({
  maxWidth: '120px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
});

/** room for three digits and the spin buttons */
export const valueInput = style({
  width: '52px',
  boxSizing: 'border-box',
  paddingRight: '2px'
});

export const addPreset = style({
  flexShrink: 0
});
