import {style} from '@vanilla-extract/css';

/** as wide as the faders, not wider: more presets wrap onto the next line instead of widening the group */
export const presetButtons = style({
  width: 0,
  minWidth: '100%',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '6px'
});

export const presetNameInput = style({
  flex: 1,
  minWidth: '80px'
});
