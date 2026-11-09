/**
 * The marks on the rows of the shown step: tinted while a hovered button (of the fill panel or the All steps panel)
 * would change them, flashing once a click did. Kept above the step tabs, so both panels mark the same rows; a row id is
 * only unique within its step (a loaded chase numbers each step's rows from 0), so every mark names its step
 */

/** a row a hovered button would change is `affected`; one the last click changed flashes */
export type StepRowMark = 'none' | 'affected' | 'flashEven' | 'flashOdd';

/** some rows of one step, by their id */
export interface StepRows {
  readonly stepId: string;
  readonly valueIds: readonly string[];
}

export interface StepRowMarksState {
  /** the rows the hovered button would change; none while no button is hovered */
  readonly preview: StepRows | undefined;
  /** the rows the last click changed or added; none once a preview started after it */
  readonly lastTake: StepRows | undefined;
  /** how many clicks so far: each one starts its rows' flash again */
  readonly takeCount: number;
}

export const NO_STEP_ROW_MARKS: StepRowMarksState = {preview: undefined, lastTake: undefined, takeCount: 0};

/**
 * a hovered button's rows, or none once it is left; the last click's rows are forgotten once a preview starts, so
 * leaving it doesn't flash them again
 */
export const withRowsPreviewed = (state: StepRowMarksState, rows: StepRows | undefined): StepRowMarksState =>
  rows ? {...state, preview: rows, lastTake: undefined} : {...state, preview: undefined};

/** the rows a click changed, flashing; the preview ends with the click */
export const withRowsTaken = (state: StepRowMarksState, rows: StepRows): StepRowMarksState => ({
  preview: undefined,
  lastTake: rows,
  takeCount: state.takeCount + 1
});

/**
 * the last click's rows forgotten once another step is shown: the rows of a step shown again are rendered anew, and
 * would flash once more
 */
export const withTakeForgotten = (state: StepRowMarksState): StepRowMarksState =>
  state.lastTake ? {...state, lastTake: undefined} : state;

const isAmong = (rows: StepRows | undefined, stepId: string, valueId: string): boolean =>
  rows?.stepId === stepId && rows.valueIds.includes(valueId);

/**
 * a row a hovered button would change is marked; else it flashes if the last click changed it. Two flashes alike,
 * alternated on each click: a class that stays on the row doesn't start its animation again
 */
export function rowMarkOf(state: StepRowMarksState, stepId: string, valueId: string): StepRowMark {
  if (state.preview) {
    return isAmong(state.preview, stepId, valueId) ? 'affected' : 'none';
  }
  if (!isAmong(state.lastTake, stepId, valueId)) {
    return 'none';
  }
  return state.takeCount % 2 === 0 ? 'flashEven' : 'flashOdd';
}
