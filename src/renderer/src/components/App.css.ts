import {style, styleVariants} from '@vanilla-extract/css';

import {vars} from './themes.css';

export const app = style({
  position: 'relative',
  // its own stacking context, so the backdrop (z-index -1) stays above this background and below the content
  isolation: 'isolate',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  background: vars.colors.background,
  color: vars.colors.text,
  fontFamily: vars.fonts.body
});

/** a column, so a view can grow to the full height */
const contentBase = style({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'auto',
  padding: '24px'
});

export const contentVariants = styleVariants({
  default: [contentBase],
  inSetupMode: [
    contentBase,
    {
      border: `2px solid ${vars.colors.warning}`,
      borderRadius: 6
    }
  ]
});

/**
 * The Show view stays mounted while another view is open, only hidden: an unsaved fixture or scene edit survives a
 * look at Settings or Channels, and opening another project from there still asks before it drops it
 */
export const showViewVariants = styleVariants({
  shown: {flex: 1, display: 'flex', flexDirection: 'column'},
  hidden: {display: 'none'}
});

/** the mascot, faint in the bottom left corner, behind everything and never in the way of a click */
export const backdrop = style({
  position: 'absolute',
  left: '24px',
  bottom: '24px',
  zIndex: -1,
  width: '280px',
  maxWidth: '40%',
  // black (the picture's corners and its dark parts) disappears, only the glowing parts show
  mixBlendMode: 'screen',
  opacity: 0.25,
  pointerEvents: 'none'
});
