import {useLingui} from '@lingui/react/macro';

import type {Chase} from '@shared/ipc';

import {type ChaseControl, type ChaseRowState, chaseRowControls, repeatLabel, showsPass} from '@/data/chaseRows';

import Button from '../commons/Button';
import {PauseChaseIcon, ResumeChaseIcon, StartChaseIcon, StopChaseIcon} from '../commons/icons';
import {chaseRow, rowControls, rowName, rowPass, rowRepeat} from './ChaseRow.css';
import ChaseSteps from './ChaseSteps';

interface ChaseRowProps {
  chase: Chase;
  rowState: ChaseRowState;
  onControl: (control: ChaseControl) => void;
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
const ChaseRow = ({chase, rowState, onControl}: ChaseRowProps) => {
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
    return passCount === undefined ? t`pass ${passNumber}` : t`pass ${passNumber} / ${passCount}`;
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
    </li>
  );
};

export default ChaseRow;
