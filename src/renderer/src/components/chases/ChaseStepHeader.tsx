import type {ReactNode} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import {type ChaseDraft, withStepFade, withStepHold, withStepMoved} from '@/data/chaseDraft';
import {
  FADE_MAX_SECONDS,
  FADE_MIN_SECONDS,
  HOLD_MAX_SECONDS,
  HOLD_MIN_SECONDS,
  TIME_INPUT_STEP_SECONDS
} from '@/data/chaseHold';

import Button from '../commons/Button';
import MoveButtons from '../commons/MoveButtons';
import {DeleteIcon, DuplicateIcon} from '../commons/icons';
import {deleteAction, stepActions, stepHeader, timeField, timeInput} from './ChaseStepEditor.css';

interface StepTimeFieldProps {
  label: ReactNode;
  value: string;
  minSeconds: number;
  maxSeconds: number;
  onChange: (typed: string) => void;
}

/** Label [ X ] s: the step's fade in or hold in seconds */
const StepTimeField = ({label, value, minSeconds, maxSeconds, onChange}: StepTimeFieldProps) => (
  <label className={timeField}>
    {label}
    <input
      className={timeInput}
      type="number"
      min={minSeconds}
      max={maxSeconds}
      step={TIME_INPUT_STEP_SECONDS}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
    <Trans>s</Trans>
  </label>
);

interface ChaseStepHeaderProps {
  fade: string;
  hold: string;
  /** where the step is in the chase, of `count` steps */
  index: number;
  count: number;
  onChange: (change: (draft: ChaseDraft) => ChaseDraft) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

/** the step's fade in and hold on the left; moving and duplicating it on the right, deleting it set apart from them */
const ChaseStepHeader = ({fade, hold, index, count, onChange, onDuplicate, onDelete}: ChaseStepHeaderProps) => {
  const {t} = useLingui();
  const stepNumberShown = index + 1;

  return (
    <div className={stepHeader}>
      <StepTimeField
        label={<Trans>Fade in</Trans>}
        value={fade}
        minSeconds={FADE_MIN_SECONDS}
        maxSeconds={FADE_MAX_SECONDS}
        onChange={(typed) => onChange((draft) => withStepFade(draft, index, typed))}
      />
      <StepTimeField
        label={<Trans>Hold</Trans>}
        value={hold}
        minSeconds={HOLD_MIN_SECONDS}
        maxSeconds={HOLD_MAX_SECONDS}
        onChange={(typed) => onChange((draft) => withStepHold(draft, index, typed))}
      />
      <div className={stepActions}>
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
        <span className={deleteAction}>
          <Button variant="icon" onClick={onDelete} title={t`Delete step ${stepNumberShown}`}>
            <DeleteIcon />
          </Button>
        </span>
      </div>
    </div>
  );
};

export default ChaseStepHeader;
