import {ComponentType} from 'react';

import {modeToggle, modeVariants} from './ModeToggle.css';

export interface Mode<Id extends string> {
  id: Id;
  label: string;
  Icon: ComponentType;
  /** shown, but can't be selected, e.g. a view not available in Show mode */
  disabled?: boolean;
}

interface ModeToggleProps<Id extends string> {
  modes: readonly Mode<Id>[];
  activeId: Id;
  onSelect: (id: Id) => void;
}

/** buttons joined side by side, exactly one of them on; showing what the active mode stands for is up to the caller */
const ModeToggle = <Id extends string>({modes, activeId, onSelect}: ModeToggleProps<Id>) => (
  <div className={modeToggle} role="radiogroup">
    {modes.map(({id, label, Icon, disabled}) => (
      <button
        key={id}
        role="radio"
        aria-checked={id === activeId}
        className={modeVariants[id === activeId ? 'active' : 'inactive']}
        disabled={disabled}
        onClick={() => onSelect(id)}
      >
        <Icon /> {label}
      </button>
    ))}
  </div>
);

export default ModeToggle;
