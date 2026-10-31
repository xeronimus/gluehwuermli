import {style} from '@vanilla-extract/css';

/** a text button: one line plus its vertical padding (2 × 6px) and border (2 × 1px), see Button.css.ts */
const TEXT_BUTTON_HEIGHT = 'calc(1lh + 14px)';

/**
 * As wide as the faders, not wider: more presets wrap onto the next line instead of widening the group.
 * As high as a preset button even when there are none, so the faders of all fixtures start at the same height.
 */
export const presetButtons = style({
  width: 0,
  minWidth: '100%',
  minHeight: TEXT_BUTTON_HEIGHT,
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '6px'
});

export const presetNameInput = style({
  flex: 1,
  minWidth: '80px'
});
