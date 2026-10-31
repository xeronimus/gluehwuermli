import {style} from '@vanilla-extract/css';

import {vars} from '../themes.css';

export const presetRows = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '10px'
});

export const sectionTitle = style({
  color: vars.colors.textSecondary,
  fontSize: '0.9em'
});

export const presetRow = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  padding: '8px',
  border: `1px solid ${vars.colors.border}`,
  borderRadius: vars.constants.radiusMd
});

export const presetHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
});

export const presetNameInput = style({
  width: '200px'
});

export const presetValues = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px 14px'
});

export const presetValue = style({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '0.9em'
});

export const valueInput = style({
  width: '64px'
});
