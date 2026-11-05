import type {ReactNode} from 'react';

import {HelpIcon} from '../commons/icons';
import {editorHelp, helpBody, helpSummary} from './EditorHelp.css';

interface EditorHelpProps {
  /** what the help explains, next to the help icon */
  title: ReactNode;
  /** open when adding, where the help is needed most; the user can still toggle it */
  initiallyOpen: boolean;
  children: ReactNode;
}

/** a help text in an editor, folded away behind its title */
const EditorHelp = ({title, initiallyOpen, children}: EditorHelpProps) => (
  <details className={editorHelp} open={initiallyOpen}>
    <summary className={helpSummary}>
      <HelpIcon /> {title}
    </summary>
    <div className={helpBody}>{children}</div>
  </details>
);

export default EditorHelp;
