import {style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

/** the hint, and in Setup mode the Add fixture button right after it */
export const noFixturesHint = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '12px'
});

export const message = style({
  color: vars.colors.textSecondary
});
