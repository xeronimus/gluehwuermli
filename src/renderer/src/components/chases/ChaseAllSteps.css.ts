import {style, styleVariants} from '@vanilla-extract/css';

import {vars} from '../themes.css';
import {toolPanel} from './ChaseFillPanel.css';
import {NARROW_STEP_EDITOR, holdInput} from './ChaseStepEditor.css';

/** at the top right of the chase editor, beside name and repeat; not sticky: it is used before the steps are */
export const allStepsPanel = style([toolPanel, {gridArea: 'allSteps', gap: '8px'}]);

/** without a border or room of its own: it only disables the actions together */
export const allStepsFieldset = style({
  minWidth: 0,
  margin: 0,
  padding: 0,
  border: 'none'
});

/** label, field and button of each action in columns; one row that wraps below the step editor's breakpoint */
export const allStepsActions = style({
  display: 'grid',
  gridTemplateColumns: 'auto minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: '6px 8px',
  '@media': {
    [NARROW_STEP_EDITOR]: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px 20px'
    }
  }
});

/** its three parts are cells of the actions' grid; a group of its own in the narrow row */
export const allStepsAction = style({
  display: 'contents',
  '@media': {
    [NARROW_STEP_EDITOR]: {
      display: 'inline-flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '6px'
    }
  }
});

export const actionLabel = style({
  color: vars.colors.textSecondary,
  fontSize: '0.9em'
});

/** the field and what goes with it: the unit, or the fixture channels on a typed channel */
export const actionField = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '4px 6px',
  minWidth: 0,
  color: vars.colors.textSecondary,
  fontSize: '0.9em'
});

/** around an action's button, for its hover: a disabled button gets no mouse events */
export const actionButton = style({
  display: 'inline-flex'
});

export const holdOfAllInput = styleVariants({
  valid: [holdInput],
  invalid: [holdInput, {borderColor: vars.colors.danger}]
});

export const removeChoice = style({
  minWidth: 0,
  maxWidth: '100%'
});

export const fixtureChannelLabel = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  whiteSpace: 'nowrap'
});

/** below its action, across the panel */
export const fieldErrors = style({
  gridColumn: '1 / -1',
  flexBasis: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  margin: 0,
  padding: 0,
  listStyle: 'none',
  color: vars.colors.danger,
  fontSize: '0.85em'
});
