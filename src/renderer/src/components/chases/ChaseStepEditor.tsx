import {useLayoutEffect, useRef} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import type {ChaseError} from '@shared/chases';
import {CHASE_HOLD_MAX_MS, CHASE_HOLD_MIN_MS} from '@shared/ipc';

import {
  type ChaseDraft,
  type ChaseStepDraft,
  isSortedByChannel,
  withNewStepValue,
  withStepHold,
  withStepMoved,
  withStepValuesSorted
} from '@/data/chaseDraft';
import {withStepValuesTaken} from '@/data/chaseStepFill';
import {chaseErrorMessage} from '@/i18n/messages/chaseMessages';

import Button from '../commons/Button';
import MoveButtons from '../commons/MoveButtons';
import {DeleteIcon, DuplicateIcon} from '../commons/icons';
import {errorList, holdField, holdInput, stepEditor, stepHeader, stepValues} from './ChaseEditor.css';
import ChaseStepFill from './ChaseStepFill';
import ChaseStepValueRow from './ChaseStepValueRow';

const MS_PER_SECOND = 1000;
/** two decimals: the hold is typed in hundredths of a second */
const HOLD_INPUT_STEP = 0.01;

interface ChaseStepEditorProps {
  step: ChaseStepDraft;
  /** where the step is in the chase, of `count` steps */
  index: number;
  count: number;
  /** what is wrong with this step */
  errors: readonly ChaseError[];
  onChange: (change: (draft: ChaseDraft) => ChaseDraft) => void;
  /** the tabs pick the step shown after these */
  onDuplicate: () => void;
  onDelete: () => void;
}

/** one step of the chase, the panel of its tab: its hold, the channels it sets, moving, duplicating and deleting it */
const ChaseStepEditor = ({step, index, count, errors, onChange, onDuplicate, onDelete}: ChaseStepEditorProps) => {
  const {t, i18n} = useLingui();
  const stepNumberShown = index + 1;
  // where the focus went when a channel field was left: sorting may move that element in the list (this row's value
  // field, reached with Tab), and a moved element loses its focus in the browser
  const focusAfterSort = useRef<HTMLElement | undefined>(undefined);

  useLayoutEffect(() => {
    const target = focusAfterSort.current;
    focusAfterSort.current = undefined;
    if (target?.isConnected && document.activeElement !== target) {
      target.focus();
    }
  });

  // a channel is sorted in once it is left, not while it is typed
  const onChannelLeft = (nextFocus: EventTarget | null) => {
    if (isSortedByChannel(step.values)) {
      return;
    }
    focusAfterSort.current = nextFocus instanceof HTMLElement ? nextFocus : undefined;
    onChange((draft) => withStepValuesSorted(draft, index));
  };

  return (
    <div className={stepEditor}>
      <div className={stepHeader}>
        <label className={holdField}>
          <Trans>Hold</Trans>
          <input
            className={holdInput}
            type="number"
            min={CHASE_HOLD_MIN_MS / MS_PER_SECOND}
            max={CHASE_HOLD_MAX_MS / MS_PER_SECOND}
            step={HOLD_INPUT_STEP}
            value={step.hold}
            onChange={(event) => {
              const hold = event.target.value;
              onChange((draft) => withStepHold(draft, index, hold));
            }}
          />
          <Trans>s</Trans>
        </label>
        <MoveButtons
          index={index}
          count={count}
          orientation="horizontal"
          onMove={(direction) => onChange((draft) => withStepMoved(draft, index, direction))}
          titles={{
            earlier: t`Move step ${stepNumberShown} to the left`,
            later: t`Move step ${stepNumberShown} to the right`
          }}
        />
        <Button variant="icon" onClick={onDuplicate} title={t`Duplicate step ${stepNumberShown}`}>
          <DuplicateIcon />
        </Button>
        <Button variant="icon" onClick={onDelete} title={t`Delete step ${stepNumberShown}`}>
          <DeleteIcon />
        </Button>
      </div>
      <ul className={stepValues}>
        {step.values.map((value, valueIndex) => (
          // by id: the rows are sorted by channel when one is left, and each row moves with its fields
          <ChaseStepValueRow
            key={value.id}
            value={value}
            stepIndex={index}
            valueIndex={valueIndex}
            onChange={onChange}
            onChannelLeft={onChannelLeft}
          />
        ))}
      </ul>
      <ChaseStepFill
        onAddChannel={() => onChange((draft) => withNewStepValue(draft, index, crypto.randomUUID()))}
        onTake={(values) => onChange((draft) => withStepValuesTaken(draft, index, values, () => crypto.randomUUID()))}
      />
      {errors.length > 0 && (
        <ul className={errorList}>
          {errors.map((error) => (
            <li key={error.type}>{i18n._(chaseErrorMessage(error))}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChaseStepEditor;
