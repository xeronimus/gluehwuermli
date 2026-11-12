import {useState} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import type {ChaseError} from '@shared/chases';
import type {SetChannelRequest} from '@shared/ipc';

import {
  type ChaseDraft,
  type ChaseStepDraft,
  isSortedByChannel,
  withNewStepValue,
  withStepValuesSorted
} from '@/data/chaseDraft';
import {type StepFillEffect, stepFillEffect, withStepValuesTaken} from '@/data/chaseStepFill';
import {stepOnRigValues} from '@/data/chaseStepOnRig';
import {type ChannelBeingTyped, chaseStepGroups, stepWideErrors} from '@/data/chaseStepTable';
import {chaseErrorMessage} from '@/i18n/messages/chaseMessages';
import {useStepOnRig} from '@/state/actionHooks/stepOnRig';
import {selectFixtures} from '@/state/fixtures/fixturesSelectors';
import {useAppStore} from '@/state/store';

import Button from '../commons/Button';
import {AddIcon} from '../commons/icons';
import ChaseFillPanel from './ChaseFillPanel';
import {emptyStepHint, errorList, stepEditor, stepMain} from './ChaseStepEditor.css';
import ChaseStepHeader from './ChaseStepHeader';
import ChaseStepTable from './ChaseStepTable';
import {useFocusKept} from './useFocusKept';
import type {StepRowMarks} from './useStepRowMarks';

interface ChaseStepEditorProps {
  step: ChaseStepDraft;
  /** where the step is in the chase, of `count` steps */
  index: number;
  count: number;
  /** what is wrong with this step */
  errors: readonly ChaseError[];
  /** the marks on the step's rows, kept above the tabs */
  rowMarks: StepRowMarks;
  onChange: (change: (draft: ChaseDraft) => ChaseDraft) => void;
  /** the tabs pick the step shown after these */
  onDuplicate: () => void;
  onDelete: () => void;
}

/**
 * one step of the chase, the panel of its tab: its header, the channels it sets as a table grouped by fixture, and the
 * fill panel beside it
 */
const ChaseStepEditor = ({
  step,
  index,
  count,
  errors,
  rowMarks,
  onChange,
  onDuplicate,
  onDelete
}: ChaseStepEditorProps) => {
  const {i18n} = useLingui();
  const fixtures = useAppStore(selectFixtures);
  const {editorRef, keepFocusOn} = useFocusKept<HTMLDivElement>();
  const [beingTyped, setBeingTyped] = useState<ChannelBeingTyped | undefined>(undefined);
  // what the hovered fill button would do, for the panel's text; the rows it marks are in rowMarks
  const [preview, setPreview] = useState<StepFillEffect | undefined>(undefined);
  const groups = chaseStepGroups(fixtures, step.values, beingTyped);
  const ownErrors = stepWideErrors(errors);
  useStepOnRig(stepOnRigValues(step.values, beingTyped));

  // a channel is sorted in and grouped once it is left, not while it is typed
  const onChannelLeft = (nextFocus: EventTarget | null) => {
    keepFocusOn(nextFocus);
    setBeingTyped(undefined);
    if (!isSortedByChannel(step.values)) {
      onChange((draft) => withStepValuesSorted(draft, index));
    }
  };

  const onTake = (values: readonly SetChannelRequest[]) => {
    const effect = stepFillEffect(step.values, values);
    // made here, not in the change: a change may run twice (React's strict mode), and must add the same rows each time
    const addedIds = Array.from({length: effect.addedCount}, () => crypto.randomUUID());
    onChange((draft) => {
      let next = 0;
      return withStepValuesTaken(draft, index, values, () => addedIds[next++] ?? crypto.randomUUID());
    });
    setPreview(undefined);
    rowMarks.took({stepId: step.id, valueIds: [...effect.changedIds, ...addedIds]});
  };

  return (
    <div className={stepEditor} ref={editorRef}>
      <ChaseStepHeader
        hold={step.hold}
        index={index}
        count={count}
        onChange={onChange}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />
      <div className={stepMain}>
        {step.values.length === 0 ? (
          <p className={emptyStepHint}>
            <Trans>This step sets no channel yet: fill it from the panel, or add a channel.</Trans>
          </p>
        ) : (
          <ChaseStepTable
            groups={groups}
            stepIndex={index}
            errors={errors}
            markOf={(valueId) => rowMarks.markOf(step.id, valueId)}
            onChange={onChange}
            onChannelFocus={({id, channel}) => setBeingTyped({id, channel})}
            onChannelLeft={onChannelLeft}
          />
        )}
        <Button size="compact" onClick={() => onChange((draft) => withNewStepValue(draft, index, crypto.randomUUID()))}>
          <AddIcon />
          <Trans>Add channel</Trans>
        </Button>
        {ownErrors.length > 0 && (
          <ul className={errorList}>
            {ownErrors.map((error) => (
              <li key={error.type}>{i18n._(chaseErrorMessage(error))}</li>
            ))}
          </ul>
        )}
      </div>
      <ChaseFillPanel
        preview={preview}
        onTake={onTake}
        onPreview={(values) => {
          const effect = values && stepFillEffect(step.values, values);
          setPreview(effect);
          rowMarks.preview(effect && {stepId: step.id, valueIds: effect.changedIds});
        }}
      />
    </div>
  );
};

export default ChaseStepEditor;
