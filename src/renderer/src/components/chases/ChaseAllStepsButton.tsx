import type {ReactNode} from 'react';

import Button from '../commons/Button';
import {actionButton} from './ChaseAllSteps.css';

interface ChaseAllStepsButtonProps {
  title: string;
  children: ReactNode;
  /** the action can't run: its field is empty or invalid; it says nothing when hovered then */
  disabled: boolean;
  onApply: () => void;
  /** hovered or focused, false once it no longer is */
  onPreview: (active: boolean) => void;
}

/** an action's button of the All steps panel: hovering or focusing it says what it would do, a click does it */
const ChaseAllStepsButton = ({title, children, disabled, onApply, onPreview}: ChaseAllStepsButtonProps) => (
  <span
    className={actionButton}
    onMouseEnter={() => onPreview(!disabled)}
    onMouseLeave={() => onPreview(false)}
    onFocus={() => onPreview(!disabled)}
    onBlur={() => onPreview(false)}
  >
    <Button size="compact" onClick={onApply} title={title} disabled={disabled}>
      {children}
    </Button>
  </span>
);

export default ChaseAllStepsButton;
