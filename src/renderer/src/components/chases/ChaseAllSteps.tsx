import {useState} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import type {AllStepsLine} from '@/data/chaseAllSteps';
import type {ChaseDraft, ChaseStepDraft} from '@/data/chaseDraft';
import {allStepsLineMessage} from '@/i18n/messages/chaseMessages';

import ChaseAddToAllSteps from './ChaseAddToAllSteps';
import {allStepsActions, allStepsFieldset, allStepsPanel} from './ChaseAllSteps.css';
import {toolPanelLine, toolPanelTitle} from './ChaseFillPanel.css';
import ChaseHoldOfAllSteps from './ChaseHoldOfAllSteps';
import ChaseRemoveFromAllSteps from './ChaseRemoveFromAllSteps';
import type {AllStepsActionEffect, AllStepsActionProps} from './allStepsAction';
import type {StepRowMarks} from './useStepRowMarks';

interface ChaseAllStepsProps {
  steps: readonly ChaseStepDraft[];
  /** the step whose tab is shown: its rows are marked; none without steps */
  shownStep: ChaseStepDraft | undefined;
  rowMarks: StepRowMarks;
  onChange: (change: (draft: ChaseDraft) => ChaseDraft) => void;
}

/**
 * Changes every step of the chase at once: adds a channel, removes one, sets the hold. Like any edit it changes the
 * draft only, Cancel undoes it. Says what the hovered action would do and what the clicked one did, and marks the shown
 * step's rows it changes; disabled without steps
 */
const ChaseAllSteps = ({steps, shownStep, rowMarks, onChange}: ChaseAllStepsProps) => {
  const {t, i18n} = useLingui();
  const [line, setLine] = useState<AllStepsLine | undefined>(undefined);

  const onPreview = (effect: AllStepsActionEffect | undefined) => {
    if (!shownStep) {
      return;
    }
    // what was done is said until the next hover, not only while the clicked button still is
    setLine((current) => effect?.line ?? (current?.done ? current : undefined));
    rowMarks.preview(effect && {stepId: shownStep.id, valueIds: effect.valueIds});
  };
  const onApply = (change: (draft: ChaseDraft) => ChaseDraft, {line: done, valueIds}: AllStepsActionEffect) => {
    onChange(change);
    setLine({...done, done: true});
    if (shownStep) {
      rowMarks.took({stepId: shownStep.id, valueIds});
    }
  };
  const actionProps: AllStepsActionProps = {steps, shownStep, onPreview, onApply};

  return (
    <section className={allStepsPanel} aria-label={t`Change all steps`}>
      <h3 className={toolPanelTitle}>
        <Trans>All steps</Trans>
      </h3>
      <fieldset className={allStepsFieldset} disabled={steps.length === 0}>
        <div className={allStepsActions}>
          <ChaseHoldOfAllSteps {...actionProps} />
          <ChaseAddToAllSteps {...actionProps} />
          <ChaseRemoveFromAllSteps {...actionProps} />
        </div>
      </fieldset>
      <p className={toolPanelLine} aria-live="polite">
        {line && i18n._(allStepsLineMessage(line))}
      </p>
    </section>
  );
};

export default ChaseAllSteps;
