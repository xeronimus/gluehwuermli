import {ReactNode} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import fireflyLogo from '@resources/favicon/favicon-96x96.png';

import {outputStatusMessage} from '@/i18n/messages/outputMessages';
import {selectActiveChannelCount} from '@/state/channels/channelsSelectors';
import {useAppStore} from '@/state/store';

import LocaleSwitch from './LocaleSwitch';
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
  const {t, i18n} = useLingui();
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
        title={t`Open the Settings to choose the port, connect or disconnect`}
      >
        {i18n._(outputStatusMessage(outputStatus))}
      </button>
      {error && <span className={outputError}>{i18n._(error)}</span>}
      <span className={activeChannels}>
        <Trans>{activeChannelCount} channels above 0</Trans>
      </span>
      <LocaleSwitch />
    </header>
  );
};

export default OutputBar;
