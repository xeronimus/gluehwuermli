import {useLingui} from '@lingui/react/macro';

import type {Chase} from '@shared/ipc';

import {type ChaseControl, type ChaseRowState, chaseRowControls, repeatLabel, showsPass} from '@/data/chaseRows';
import type {MoveDirection} from '@/data/listOrder';

import Button from '../commons/Button';
import MoveButtons from '../commons/MoveButtons';
import {DeleteIcon, EditIcon, PauseChaseIcon, ResumeChaseIcon, StartChaseIcon, StopChaseIcon} from '../commons/icons';
import {chaseRow, rowActions, rowControls, rowName, rowPass, rowRepeat} from './ChaseRow.css';
import ChaseSteps from './ChaseSteps';

/** changing the chase, only in Setup mode */
export interface ChaseRowActions {
  onEdit: () => void;
  onDelete: () => void;
  onMove: (direction: MoveDirection) => void;
  /** where the chase is in the list, of `count` chases */
  index: number;
  count: number;
  /** while an editor is open */
  disabled: boolean;
}

interface ChaseRowProps {
  chase: Chase;
  rowState: ChaseRowState;
  onControl: (control: ChaseControl) => void;
  /** undefined in Show mode: the chase can be played, not changed */
  actions: ChaseRowActions | undefined;
}

const ICONS = {
  start: StartChaseIcon,
  pause: PauseChaseIcon,
  resume: ResumeChaseIcon,
  stop: StopChaseIcon
} as const;

const rowVariant = (rowState: ChaseRowState) =>
  rowState.type === 'playing' ? (rowState.paused ? 'paused' : 'running') : rowState.type;

/**
 * One chase: its controls, name, steps and repeat, and while it plays its pass. Highlighted while it runs or is paused,
 * dimmed while another one does (its Start still replaces that one).
 */
const ChaseRow = ({chase, rowState, onControl, actions}: ChaseRowProps) => {
  const {t} = useLingui();
  const chaseName = chase.name;
  const titles: Record<ChaseControl, string> = {
    start: t`Start the chase ${chaseName}`,
    pause: t`Pause the chase ${chaseName}`,
    resume: t`Resume the chase ${chaseName}`,
    stop: t`Stop the chase ${chaseName}`
  };
  const position = rowState.type === 'playing' ? rowState.position : undefined;

  const passText = () => {
    if (!position || !showsPass(position)) {
      return undefined;
    }
    const {passNumber, passCount} = position;
    return Number.isFinite(passCount) ? t`pass ${passNumber} / ${passCount}` : t`pass ${passNumber}`;
  };

  return (
    <li className={chaseRow[rowVariant(rowState)]}>
      <span className={rowControls}>
        {chaseRowControls(rowState).map((control) => {
          const Icon = ICONS[control];
          return (
            <Button key={control} variant="icon" onClick={() => onControl(control)} title={titles[control]}>
              <Icon />
            </Button>
          );
        })}
      </span>
      <span className={rowName}>{chase.name}</span>
      <ChaseSteps steps={chase.steps} currentIndex={position && position.stepNumber - 1} />
      <span className={rowPass}>{passText()}</span>
      <span className={rowRepeat}>{repeatLabel(chase.repeat)}</span>
      {actions && (
        <span className={rowActions}>
          <MoveButtons
            index={actions.index}
            count={actions.count}
            onMove={actions.onMove}
            disabled={actions.disabled}
            orientation="vertical"
            titles={{earlier: t`Move the chase ${chaseName} up`, later: t`Move the chase ${chaseName} down`}}
          />
          <Button
            variant="icon"
            onClick={actions.onEdit}
            disabled={actions.disabled}
            title={t`Edit the chase ${chaseName}`}
          >
            <EditIcon />
          </Button>
          <Button
            variant="icon"
            onClick={actions.onDelete}
            disabled={actions.disabled}
            title={t`Delete the chase ${chaseName}`}
          >
            <DeleteIcon />
          </Button>
        </span>
      )}
    </li>
  );
};

export default ChaseRow;
