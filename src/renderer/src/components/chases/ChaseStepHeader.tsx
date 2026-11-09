import {Trans, useLingui} from '@lingui/react/macro';

import {type ChaseDraft, withStepHold, withStepMoved} from '@/data/chaseDraft';
import {HOLD_INPUT_STEP_SECONDS, HOLD_MAX_SECONDS, HOLD_MIN_SECONDS} from '@/data/chaseHold';

import Button from '../commons/Button';
import MoveButtons from '../commons/MoveButtons';
import {DeleteIcon, DuplicateIcon} from '../commons/icons';
import {deleteAction, holdField, holdInput, stepActions, stepHeader} from './ChaseStepEditor.css';

interface ChaseStepHeaderProps {
  hold: string;
  /** where the step is in the chase, of `count` steps */
  index: number;
  count: number;
  onChange: (change: (draft: ChaseDraft) => ChaseDraft) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

/** the step's hold on the left; moving and duplicating it on the right, deleting it set apart from them */
const ChaseStepHeader = ({hold, index, count, onChange, onDuplicate, onDelete}: ChaseStepHeaderProps) => {
  const {t} = useLingui();
  const stepNumberShown = index + 1;

  return (
    <div className={stepHeader}>
      <label className={holdField}>
        <Trans>Hold</Trans>
        <input
          className={holdInput}
          type="number"
          min={HOLD_MIN_SECONDS}
          max={HOLD_MAX_SECONDS}
          step={HOLD_INPUT_STEP_SECONDS}
          value={hold}
          onChange={(event) => {
            const typed = event.target.value;
            onChange((draft) => withStepHold(draft, index, typed));
          }}
        />
        <Trans>s</Trans>
      </label>
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
