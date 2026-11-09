import type {ReactNode} from 'react';

import type {SetChannelRequest} from '@shared/ipc';

import Button from '../commons/Button';
import {fillButton} from './ChaseFillPanel.css';

interface ChaseFillButtonProps {
  /** the absolute channels and values the button takes, read when it is hovered and again when it is clicked */
  values: () => readonly SetChannelRequest[];
  title: string;
  children: ReactNode;
  onTake: (values: readonly SetChannelRequest[]) => void;
  /** the values it would take while it is hovered or focused, undefined once it no longer is */
  onPreview: (values: readonly SetChannelRequest[] | undefined) => void;
}

/** a button of the fill panel: hovering or focusing it shows which rows it would change, a click takes the values */
const ChaseFillButton = ({values, title, children, onTake, onPreview}: ChaseFillButtonProps) => (
  <span
    className={fillButton}
    onMouseEnter={() => onPreview(values())}
    onMouseLeave={() => onPreview(undefined)}
    onFocus={() => onPreview(values())}
    onBlur={() => onPreview(undefined)}
  >
    <Button size="compact" onClick={() => onTake(values())} title={title}>
      {children}
    </Button>
  </span>
);

export default ChaseFillButton;
