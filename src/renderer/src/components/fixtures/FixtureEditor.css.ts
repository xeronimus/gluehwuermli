import {style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

export const fixtureEditor = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  padding: '16px',
  background: vars.colors.surface,
  border: `1px solid ${vars.colors.focusBorder}`,
  borderRadius: vars.constants.radiusMd
});

/** the form, and the help beside it (below it when the window is narrow) */
export const editorBody = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  gap: '24px'
});

export const editorForm = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '14px'
});

export const editorTitle = style({
  margin: 0,
  fontSize: '1em',
  fontWeight: 600
});

export const fields = style({
  display: 'flex',
  gap: '12px'
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

export const hintInput = style({
  width: '100%',
  boxSizing: 'border-box'
});

export const descriptionInput = style({
  width: '100%',
  boxSizing: 'border-box',
  resize: 'vertical'
});

export const addressInput = style({
  width: '90px'
});

const messageList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  margin: 0,
  padding: 0,
  listStyle: 'none'
});

export const errorList = style([messageList, {color: vars.colors.danger}]);

export const warningList = style([messageList, {color: vars.colors.warning}]);

export const actions = style({
  display: 'flex',
  gap: '8px'
});
