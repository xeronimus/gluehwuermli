import {style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

/** as wide as the view and no wider (FixtureView aligns its children to their content), so the presets scroll inside */
export const fixtureEditor = style({
  alignSelf: 'stretch',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  padding: '16px',
  background: vars.colors.surface,
  border: `1px solid ${vars.colors.focusBorder}`,
  borderRadius: vars.constants.radiusMd
});

/** minWidth 0, so the preset columns scroll inside it instead of widening the editor */
export const editorForm = style({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  gap: '14px'
});

/** the channels, and the preset columns beside them */
export const channelsAndPresets = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '16px'
});

/** the title of the channels and of the presets section, the same height so their rows line up */
export const sectionTitle = style({
  display: 'flex',
  alignItems: 'center',
  height: vars.constants.editorRowHeight,
  margin: '0 0 6px',
  color: vars.colors.textSecondary,
  fontSize: '0.9em',
  fontWeight: 600
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

/** the description's label, and the edit/preview toggle at its right */
export const descriptionHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px'
});

/**
 * About as high as the textarea's 6 rows, so the form doesn't jump on the toggle. The fixture's background, so code
 * stands out as it does on the fixture.
 */
export const descriptionPreview = style({
  boxSizing: 'border-box',
  width: '100%',
  minHeight: '9.2em',
  padding: '6px 8px',
  color: vars.colors.text,
  background: vars.colors.surface,
  border: `1px solid ${vars.colors.border}`,
  borderRadius: vars.constants.radiusMd
});

export const previewPlaceholder = style({
  color: vars.colors.textMuted,
  fontStyle: 'italic'
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
