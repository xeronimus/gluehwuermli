import type {KeyboardEvent} from 'react';

import type {AllStepsLine} from '@/data/chaseAllSteps';
import type {ChaseDraft, ChaseStepDraft} from '@/data/chaseDraft';

/** what an action of the All steps panel would do or did: the line it says, and the shown step's rows it changes */
export interface AllStepsActionEffect {
  readonly line: AllStepsLine;
  readonly valueIds: readonly string[];
}

/** what the panel gives each of its actions */
export interface AllStepsActionProps {
  steps: readonly ChaseStepDraft[];
  /** the step whose tab is shown; none without steps */
  shownStep: ChaseStepDraft | undefined;
  /** while the action's button is hovered or focused, undefined once it no longer is */
  onPreview: (effect: AllStepsActionEffect | undefined) => void;
  onApply: (change: (draft: ChaseDraft) => ChaseDraft, effect: AllStepsActionEffect) => void;
}

/** Enter in an action's field runs it, not the editor's Save */
export const applyOnEnter = (apply: () => void) => (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    apply();
  }
};
