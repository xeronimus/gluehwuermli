import {ReactNode} from 'react';

import fireflyLogo from '@resources/favicon/favicon-96x96.png';

import {describeOutputStatus} from '@/data/outputStatus';
import {selectActiveChannelCount} from '@/state/channels/channelsSelectors';
import {useAppStore} from '@/state/store';

import LockIndicator from './LockIndicator';
import {activeChannels, appLogo, appTitle, outputBar, outputError, spacer, statusVariants} from './OutputBar.css';

interface OutputBarProps {
  /** switches between the app's views, shown next to the title */
  viewToggle: ReactNode;
  /** a click on a lock reminder or the output status opens the Settings view, where their controls are */
  onShowSettings: () => void;
}

/** the view switch, what is unlocked and the status of the DMX output; the port is chosen in the Settings view */
const OutputBar = ({viewToggle, onShowSettings}: OutputBarProps) => {
  const outputStatus = useAppStore((state) => state.outputStatus);
  const error = useAppStore((state) => state.outputError);
  const activeChannelCount = useAppStore(selectActiveChannelCount);

  return (
    <header className={outputBar}>
      <img className={appLogo} src={fireflyLogo} alt="" />
      <span className={appTitle}>Glühwürmli</span>
      {viewToggle}
      <LockIndicator onClick={onShowSettings} />
      <span className={spacer} />
      <button
        className={statusVariants[outputStatus.type]}
        onClick={onShowSettings}
        title="Open the Settings to choose the port and connect"
      >
        {describeOutputStatus(outputStatus)}
      </button>
      {error && <span className={outputError}>{error}</span>}
      <span className={activeChannels}>{activeChannelCount} channels above 0</span>
    </header>
  );
};

export default OutputBar;
