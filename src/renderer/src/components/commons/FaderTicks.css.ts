import {createVar, style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

/** how far up the track the tick sits, in percent of it */
export const tickBottom = createVar();

/**
 * a short line across the track at a position's value; the button around it is taller than the line, so it is easy
 * to hover and click, also between two close positions
 */
export const tickMark = style({
  position: 'absolute',
  left: '-5px',
  bottom: tickBottom,
  width: '16px',
  height: '7px',
  padding: 0,
  transform: 'translateY(50%)',
  border: 'none',
  borderRadius: '1px',
  background: `linear-gradient(${vars.colors.textSecondary}, ${vars.colors.textSecondary}) center / 100% 2px no-repeat`,
  cursor: 'pointer',
  selectors: {
    '&:hover:not(:disabled)': {
      background: `linear-gradient(${vars.colors.text}, ${vars.colors.text}) center / 100% 3px no-repeat`
    },
    '&:disabled': {cursor: 'default', opacity: 0.5},
    '&:focus-visible': {outline: `2px solid ${vars.colors.primaryHover}`}
  }
});
