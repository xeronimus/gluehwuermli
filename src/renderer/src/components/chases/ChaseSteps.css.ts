import {style, styleVariants} from '@vanilla-extract/css';

import {STEP_BOX_GAP_PX, STEP_BOX_MIN_WIDTH_PX} from '@/data/chaseRows';

import {vars} from '../themes.css';

/** the widest a step box gets, so a chase of a few steps doesn't show long bars */
const STEP_BOX_MAX_WIDTH_PX = 18;

export const chaseSteps = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: `${STEP_BOX_GAP_PX}px`,
  overflow: 'hidden'
});

const stepBoxBase = style({
  flex: '1 1 0',
  minWidth: `${STEP_BOX_MIN_WIDTH_PX}px`,
  maxWidth: `${STEP_BOX_MAX_WIDTH_PX}px`,
  height: '12px',
  boxSizing: 'border-box',
  border: `1px solid ${vars.colors.textMuted}`,
  borderRadius: '2px'
});

export const stepBox = styleVariants({
  other: [stepBoxBase],
  current: [stepBoxBase, {background: vars.colors.primary, borderColor: vars.colors.primary}]
});

export const stepCountText = style({
  fontSize: '0.9em',
  color: vars.colors.textSecondary,
  whiteSpace: 'nowrap'
});
