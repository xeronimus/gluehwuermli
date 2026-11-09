import {style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

/** below it the fill panel goes above the table: beside it, the table would be too narrow for its columns */
export const NARROW_STEP_EDITOR = 'screen and (max-width: 900px)';

/** the step's header across, its table on the left, the fill panel on the right */
export const stepEditor = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(240px, 340px)',
  gridTemplateAreas: '"header header" "table fill"',
  alignItems: 'start',
  gap: '12px 20px',
  padding: '8px 12px 12px',
  // the chase editor's background, as in the fixture editor: the fields stand out on it
  background: vars.colors.surface,
  border: `1px solid ${vars.colors.border}`,
  borderRadius: vars.constants.radiusMd,
  '@media': {
    [NARROW_STEP_EDITOR]: {
      gridTemplateColumns: 'minmax(0, 1fr)',
      gridTemplateAreas: '"header" "fill" "table"'
    }
  }
});

/** Hold on the left, the step's actions on the right */
export const stepHeader = style({
  gridArea: 'header',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '6px'
});

export const stepActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  marginLeft: 'auto'
});

/** set apart from moving and duplicating, so it isn't hit instead of them */
export const deleteAction = style({
  display: 'flex',
  marginLeft: '10px',
  paddingLeft: '10px',
  borderLeft: `1px solid ${vars.colors.border}`
});

export const holdField = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  color: vars.colors.textSecondary,
  fontSize: '0.9em'
});

/** room for `3600.00` */
export const holdInput = style({
  width: '84px'
});

/** the table, Add channel and the step's own problems */
export const stepMain = style({
  gridArea: 'table',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '8px',
  minWidth: 0
});

export const emptyStepHint = style({
  margin: 0,
  color: vars.colors.textSecondary,
  fontSize: '0.9em'
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
