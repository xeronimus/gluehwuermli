import {Trans, useLingui} from '@lingui/react/macro';

import type {ChaseError} from '@shared/chases';
import {CHASE_HOLD_MAX_MS, CHASE_HOLD_MIN_MS} from '@shared/ipc';

import {
  type ChaseDraft,
  type ChaseStepDraft,
  withNewStepValue,
  withStepDuplicated,
  withStepHold,
  withStepMoved,
  withoutStep
} from '@/data/chaseDraft';
import {chaseErrorMessage} from '@/i18n/messages/chaseMessages';

import Button from '../commons/Button';
import MoveButtons from '../commons/MoveButtons';
import {AddIcon, DeleteIcon, DuplicateIcon} from '../commons/icons';
import {errorList, holdField, holdInput, stepEditor, stepHeader, stepNumber, stepValues} from './ChaseEditor.css';
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
}

/** one step of the chase: its hold, the channels it sets, moving, duplicating and deleting it */
const ChaseStepEditor = ({step, index, count, errors, onChange}: ChaseStepEditorProps) => {
  const {t, i18n} = useLingui();
  const stepNumberShown = index + 1;

  return (
    <li className={stepEditor} aria-label={t`Step ${stepNumberShown}`}>
      <div className={stepHeader}>
        <span className={stepNumber}>{stepNumberShown}</span>
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
          orientation="vertical"
          onMove={(direction) => onChange((draft) => withStepMoved(draft, index, direction))}
          titles={{earlier: t`Move step ${stepNumberShown} up`, later: t`Move step ${stepNumberShown} down`}}
        />
        <Button
          variant="icon"
          onClick={() => onChange((draft) => withStepDuplicated(draft, index, crypto.randomUUID()))}
          title={t`Duplicate step ${stepNumberShown}`}
        >
          <DuplicateIcon />
        </Button>
        <Button
          variant="icon"
          onClick={() => onChange((draft) => withoutStep(draft, index))}
          title={t`Delete step ${stepNumberShown}`}
        >
          <DeleteIcon />
        </Button>
      </div>
      <ul className={stepValues}>
        {step.values.map((value, valueIndex) => (
          // by place: the rows aren't reordered, and a removed row's inputs show the next row's values
          <ChaseStepValueRow
            key={valueIndex}
            value={value}
            stepIndex={index}
            valueIndex={valueIndex}
            onChange={onChange}
          />
        ))}
      </ul>
      <span>
        <Button size="compact" onClick={() => onChange((draft) => withNewStepValue(draft, index))}>
          <AddIcon />
          <Trans>Add channel</Trans>
        </Button>
      </span>
      {errors.length > 0 && (
        <ul className={errorList}>
          {errors.map((error) => (
            <li key={error.type}>{i18n._(chaseErrorMessage(error))}</li>
          ))}
        </ul>
      )}
    </li>
  );
};

export default ChaseStepEditor;
