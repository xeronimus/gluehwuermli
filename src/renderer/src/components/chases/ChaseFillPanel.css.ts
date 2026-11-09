import {style} from '@vanilla-extract/css';

import {vars} from '../themes.css';
import {NARROW_STEP_EDITOR} from './ChaseStepEditor.css';

/**
 * the frame of the chase editor's tool panels: Fill from beside a step's table, All steps above the tabs, so the two
 * read as one column of tools
 */
export const toolPanel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  padding: '10px 12px',
  // the editor's background behind it: a sticky panel without one would show the rows scrolling under it
  background: vars.colors.surface,
  border: `1px solid ${vars.colors.border}`,
  borderRadius: vars.constants.radiusMd
});

export const toolPanelTitle = style({
  margin: 0,
  fontSize: '0.95em',
  fontWeight: 600
});

/**
 * Beside the table, it stays in view while a long step is scrolled; as high as the window at most, scrolling itself
 * with many presets. Above the table on a narrow window, where it scrolls away with it
 */
export const fillPanel = style([
  toolPanel,
  {
    gridArea: 'fill',
    position: 'sticky',
    top: 0,
    maxHeight: '80vh',
    overflowY: 'auto',
    '@media': {
      [NARROW_STEP_EDITOR]: {
        position: 'static',
        maxHeight: 'none',
        gap: '8px',
        padding: '6px 10px'
      }
    }
  }
]);

export const fillSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  '@media': {
    [NARROW_STEP_EDITOR]: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center'
    }
  }
});

export const fillSectionTitle = style({
  margin: 0,
  color: vars.colors.textSecondary,
  fontSize: '0.85em',
  fontWeight: 'normal'
});

export const fillButtons = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '6px'
});

/** a fixture's presets after its name */
export const fixturePresets = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '6px'
});

export const fixturePresetsName = style({
  color: vars.colors.textMuted,
  fontSize: '0.85em'
});

/** around a fill button, for its hover */
export const fillButton = style({
  display: 'inline-flex'
});

/** what the hovered button would do */
export const fillPreview = style({
  minHeight: '1lh',
  margin: 0,
  color: vars.colors.textSecondary,
  fontSize: '0.85em'
});

export const fillHint = style({
  margin: 0,
  color: vars.colors.textSecondary,
  fontSize: '0.9em'
});
