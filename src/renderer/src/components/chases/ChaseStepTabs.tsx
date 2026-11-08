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

import Tabs, {type Tab} from '../commons/Tabs';
import {AddIcon} from '../commons/icons';
import ChaseStepEditor from './ChaseStepEditor';

interface ChaseStepTabsProps {
  steps: readonly ChaseStepDraft[];
  /** at the same index as the steps */
  stepErrors: readonly (readonly ChaseError[])[];
  /** the step whose tab is shown; none without steps */
  shownId: string | undefined;
  onSelect: (stepId: string | undefined) => void;
  onChange: (change: (draft: ChaseDraft) => ChaseDraft) => void;
}

/**
 * a tab per step, labelled with its number and marked when something is wrong with it, its panel editing it; Add step
 * after the last tab, shown even without steps
 */
const ChaseStepTabs = ({steps, stepErrors, shownId, onSelect, onChange}: ChaseStepTabsProps) => {
  const {t, i18n} = useLingui();

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
          onChange={onChange}
          onDuplicate={() => {
            const copyId = crypto.randomUUID();
            onChange((draft) => withStepDuplicated(draft, index, copyId));
            onSelect(copyId);
          }}
          onDelete={() => {
            onSelect(stepIdAfterRemoval(steps, index));
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
      label={t`Steps`}
      tabs={steps.map(tabOf)}
      activeId={shownId}
      onSelect={onSelect}
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
