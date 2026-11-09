import {useState} from 'react';

import {
  NO_STEP_ROW_MARKS,
  type StepRowMark,
  type StepRows,
  rowMarkOf,
  withRowsPreviewed,
  withRowsTaken,
  withTakeForgotten
} from '@/data/chaseStepMarks';

/** the marks on the shown step's rows, set by the fill panel and the All steps panel */
export interface StepRowMarks {
  markOf: (stepId: string, valueId: string) => StepRowMark;
  /** the rows a hovered button would change, undefined once it is left */
  preview: (rows: StepRows | undefined) => void;
  /** the rows a click changed or added */
  took: (rows: StepRows) => void;
  /** another step is shown */
  stepShown: () => void;
}

/** kept by the chase editor, above the step tabs: a panel outside the shown step marks its rows too */
export function useStepRowMarks(): StepRowMarks {
  const [state, setState] = useState(NO_STEP_ROW_MARKS);
  return {
    markOf: (stepId, valueId) => rowMarkOf(state, stepId, valueId),
    preview: (rows) => setState((current) => withRowsPreviewed(current, rows)),
    took: (rows) => setState((current) => withRowsTaken(current, rows)),
    stepShown: () => setState(withTakeForgotten)
  };
}
