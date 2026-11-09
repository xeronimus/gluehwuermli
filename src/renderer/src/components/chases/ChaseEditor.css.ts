import {style} from '@vanilla-extract/css';

import {vars} from '../themes.css';
import {
  NARROW_STEP_EDITOR,
  STEP_EDITOR_COLUMNS,
  STEP_EDITOR_COLUMN_GAP,
  STEP_EDITOR_INSET
} from './ChaseStepEditor.css';

/** below the chase rows, as wide as the view */
export const chaseEditor = style({
  alignSelf: 'stretch',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '12px',
  padding: '16px',
  background: vars.colors.surface,
  border: `1px solid ${vars.colors.focusBorder}`,
  borderRadius: vars.constants.radiusMd
});

/**
 * title, name and repeat on the left, the All steps panel on the right: the step editor's columns, inset by its padding
 * and border, so the panel has the fill panel's width and right edge. Below the step editor's breakpoint the panel goes
 * under the repeat field
 */
export const editorTop = style({
  alignSelf: 'stretch',
  display: 'grid',
  gridTemplateColumns: STEP_EDITOR_COLUMNS,
  gridTemplateAreas: '"fields allSteps"',
  alignItems: 'start',
  gap: `12px ${STEP_EDITOR_COLUMN_GAP}`,
  paddingRight: STEP_EDITOR_INSET,
  '@media': {
    [NARROW_STEP_EDITOR]: {
      gridTemplateColumns: 'minmax(0, 1fr)',
      gridTemplateAreas: '"fields" "allSteps"',
      paddingRight: 0
    }
  }
});

export const editorFields = style({
  gridArea: 'fields',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '12px'
});

export const editorTitle = style({
  margin: 0,
  fontSize: '1em',
  fontWeight: 600
});

export const field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  color: vars.colors.textSecondary,
  fontSize: '0.9em'
});

export const nameInput = style({
  width: '240px'
});

export const repeatChoices = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '6px 16px',
  margin: 0,
  padding: 0,
  border: 'none'
});

export const repeatTitle = style({
  marginBottom: '4px',
  padding: 0,
  color: vars.colors.textSecondary,
  fontSize: '0.9em'
});

export const repeatChoice = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px'
});

/** room for two digits and the spinner */
export const countInput = style({
  width: '52px'
});

/** the step tabs, as wide as the editor */
export const steps = style({
  alignSelf: 'stretch',
  display: 'flex',
  flexDirection: 'column'
});

export const errorList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  margin: 0,
  padding: 0,
  listStyle: 'none',
  color: vars.colors.danger
});

/** stuck to the bottom of the view while the editor is in it, so a long step needn't be scrolled to its end */
export const actions = style({
  position: 'sticky',
  bottom: 0,
  zIndex: 1,
  alignSelf: 'stretch',
  display: 'flex',
  gap: '8px',
  margin: '0 -16px -16px',
  padding: '10px 16px',
  background: vars.colors.surface,
  borderTop: `1px solid ${vars.colors.border}`,
  borderRadius: `0 0 ${vars.constants.radiusMd} ${vars.constants.radiusMd}`
});
