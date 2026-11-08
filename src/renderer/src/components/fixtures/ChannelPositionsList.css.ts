import {style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

/**
 * a row of its own below the channel, under the mode dropdown of the channel's values column (the 4th of
 * FixtureChannelRows: name, offset, address, values) and marked as belonging to it
 */
export const positionsList = style({
  gridColumn: '4 / -1',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  margin: '0 0 6px',
  padding: '6px 0 6px 12px',
  borderLeft: `2px solid ${vars.colors.border}`
});

export const positionRows = style({
  display: 'grid',
  gridTemplateColumns: 'auto 220px auto',
  gap: '6px 8px',
  alignItems: 'center',
  justifyItems: 'start'
});

/** room for three digits next to the spinner */
export const positionValueInput = style({
  width: 'calc(3ch + 40px)',
  boxSizing: 'border-box'
});

export const positionNameInput = style({
  width: '100%',
  boxSizing: 'border-box'
});

/** Add position, and the toggle between a fader and buttons right next to it */
export const positionActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
});
