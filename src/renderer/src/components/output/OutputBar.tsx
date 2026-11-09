import {ReactNode} from 'react';

import {useLingui} from '@lingui/react/macro';

import {projectNameOf} from '@shared/projects';

import fireflyLogo from '@assets/favicon/favicon-96x96.png';

import {outputStatusMessage} from '@/i18n/messages/outputMessages';
import {useAppStore} from '@/state/store';

import EmergencyOffButton from './EmergencyOffButton';
import LockIndicator from './LockIndicator';
import {appLogo, appTitle, outputBar, outputError, spacer, statusVariants} from './OutputBar.css';
import OutputConnection from './OutputConnection';

interface OutputBarProps {
  /** switches between the app's views, shown next to the title */
  viewToggle: ReactNode;
  /** a click on a lock reminder or the output status opens the Settings view, where their controls are */
  onShowSettings: () => void;
}

/**
 * the view switch, what is unlocked, the status of the DMX output, Connect / Disconnect and Emergency off; the port is
 * chosen in the Settings view
 */
const OutputBar = ({viewToggle, onShowSettings}: OutputBarProps) => {
  const {t, i18n} = useLingui();
  const outputStatus = useAppStore((state) => state.outputStatus);
  const error = useAppStore((state) => state.outputError);

  const projectName = useAppStore((state) =>
    state.project.type === 'open' ? projectNameOf(state.project.project.path) : ''
  );

  return (
    <header className={outputBar}>
      <div>
        <img className={appLogo} src={fireflyLogo} alt="" />
        <span className={appTitle}>Glühwürmli</span>
        <span>{projectName}</span>
      </div>
      <div>
        {viewToggle}
        <LockIndicator onClick={onShowSettings} />
      </div>
      <div>
        <span className={spacer} />
        <button
          className={statusVariants[outputStatus.type]}
          onClick={onShowSettings}
          title={t`Open the Settings to choose the port`}
        >
          {i18n._(outputStatusMessage(outputStatus))}
        </button>
        <OutputConnection />
        {error && <span className={outputError}>{i18n._(error)}</span>}
        <EmergencyOffButton />
      </div>
    </header>
  );
};

export default OutputBar;
