import {useLayoutEffect, useRef} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import type {ChaseError} from '@shared/chases';
import {CHASE_STEPS_MAX} from '@shared/ipc';

import {
  type ChaseDraft,
  type ChaseStepDraft,
  stepIdAfterRemoval,
  withNewStep,
  withStepDuplicated,
  withoutStep
} from '@/data/chaseDraft';
import {chaseErrorMessage} from '@/i18n/messages/chaseMessages';

import Tabs, {type Tab, type TabsHandle} from '../commons/Tabs';
import {AddIcon} from '../commons/icons';
import ChaseStepEditor from './ChaseStepEditor';
import ChaseStepNavigation from './ChaseStepNavigation';
import type {StepRowMarks} from './useStepRowMarks';

interface ChaseStepTabsProps {
  steps: readonly ChaseStepDraft[];
  /** at the same index as the steps */
  stepErrors: readonly (readonly ChaseError[])[];
  /** the step whose tab is shown; none without steps */
  shownId: string | undefined;
  onSelect: (stepId: string | undefined) => void;
  rowMarks: StepRowMarks;
  onChange: (change: (draft: ChaseDraft) => ChaseDraft) => void;
}

/**
 * a tab per step, labelled with its number and marked when something is wrong with it, its panel editing it; Add step
 * after the last tab, shown even without steps
 */
const ChaseStepTabs = ({steps, stepErrors, shownId, onSelect, rowMarks, onChange}: ChaseStepTabsProps) => {
  const {t, i18n} = useLingui();
  const tabs = useRef<TabsHandle<string>>(null);
  // the tab to focus once it is rendered: a duplicate's tab only exists after the change
  const focusAfterRender = useRef<string | undefined>(undefined);

  useLayoutEffect(() => {
    const stepId = focusAfterRender.current;
    focusAfterRender.current = undefined;
    if (stepId !== undefined) {
      tabs.current?.focus(stepId);
    }
  });

  const tabOf = (step: ChaseStepDraft, index: number): Tab<string> => {
    const errors = stepErrors[index] ?? [];
    return {
      id: step.id,
      label: index + 1,
      warning: errors.length > 0 ? errors.map((error) => i18n._(chaseErrorMessage(error))).join('\n') : undefined,
      panel: (
        <ChaseStepEditor
          step={step}
          index={index}
          count={steps.length}
          errors={errors}
          rowMarks={rowMarks}
          onChange={onChange}
          onDuplicate={() => {
            const copyId = crypto.randomUUID();
            // the Duplicate button is hidden with its panel when the copy is shown: the focus goes to the copy's tab
            focusAfterRender.current = copyId;
            onChange((draft) => withStepDuplicated(draft, index, copyId));
            onSelect(copyId);
          }}
          onDelete={() => {
            const nextId = stepIdAfterRemoval(steps, index);
            // the delete button goes away with the step: the focus moves on to the tab shown next (Add step for none),
            // while that tab still is where it was
            tabs.current?.focus(nextId);
            onSelect(nextId);
            onChange((draft) => withoutStep(draft, index));
          }}
        />
      )
    };
  };

  const onAdd = () => {
    const stepId = crypto.randomUUID();
    onChange((draft) => withNewStep(draft, stepId));
    onSelect(stepId);
  };

  return (
    <Tabs
      ref={tabs}
      label={t`Steps`}
      tabs={steps.map(tabOf)}
      activeId={shownId}
      onSelect={onSelect}
      beforeTabs={<ChaseStepNavigation steps={steps} shownId={shownId} onSelect={onSelect} />}
      // a panel per step, up to 100, all from the editor's draft: only the shown one is rendered
      unmountHiddenPanels
      addTab={{
        label: (
          <>
            <AddIcon />
            <Trans>Add step</Trans>
          </>
        ),
        onAdd,
        disabled: steps.length >= CHASE_STEPS_MAX
      }}
    />
  );
};

export default ChaseStepTabs;
