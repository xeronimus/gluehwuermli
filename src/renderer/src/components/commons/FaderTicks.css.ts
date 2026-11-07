import {createVar, style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

/** the lines from a tick to its label, between the track and the labels */
export const TICK_CONNECTOR_WIDTH_PX = 10;

/** where the track ends on the right: it is 6px wide, the ticks reach a little past it */
const TRACK_EDGE_PX = 6;

export const tickMarkBottom = createVar();

export const tickLabelBottom = createVar();

/** a short line across the track at the position's value */
export const tickMark = style({
  position: 'absolute',
  left: '-3px',
  bottom: tickMarkBottom,
  width: '12px',
  height: '2px',
  transform: 'translateY(50%)',
  background: vars.colors.textSecondary,
  pointerEvents: 'none'
});

export const tickConnectors = style({
  position: 'absolute',
  left: `${TRACK_EDGE_PX}px`,
  top: 0,
  overflow: 'visible',
  stroke: vars.colors.textMuted,
  strokeWidth: 1,
  pointerEvents: 'none'
});

/** the position's name beside the track, vertically centered on its offset */
export const tickLabel = style({
  position: 'absolute',
  left: `${TRACK_EDGE_PX + TICK_CONNECTOR_WIDTH_PX + 2}px`,
  bottom: tickLabelBottom,
  transform: 'translateY(50%)',
  maxWidth: '76px',
  padding: '0 3px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  font: 'inherit',
  fontSize: '0.72em',
  lineHeight: 1.2,
  color: vars.colors.textSecondary,
  background: 'none',
  border: 'none',
  borderRadius: vars.constants.radiusSm,
  cursor: 'pointer',
  selectors: {
    '&:hover:not(:disabled)': {color: vars.colors.text, background: vars.colors.surfaceRaised},
    '&:disabled': {cursor: 'default', opacity: 0.5},
    '&:focus-visible': {outline: `2px solid ${vars.colors.primaryHover}`}
  }
});
