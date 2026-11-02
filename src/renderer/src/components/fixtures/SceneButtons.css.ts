import {style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

export const sceneButtons = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '8px'
});

/** in Setup mode: the scene's button and its edit and delete buttons, framed as one */
export const sceneEntry = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  paddingRight: '4px',
  border: `1px solid ${vars.colors.border}`,
  borderRadius: vars.constants.radiusMd
});
