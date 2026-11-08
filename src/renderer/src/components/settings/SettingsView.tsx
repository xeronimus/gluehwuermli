import {ReactNode} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import {useAppStore} from '@/state/store';

import ChannelLockSection from './ChannelLockSection';
import LanguageSection from './LanguageSection';
import ModeSection from './ModeSection';
import OutputSection from './OutputSection';
import PasswordSection from './PasswordSection';
import {errorMessage, message, settingsColumn, settingsSection, settingsView} from './SettingsView.css';

interface SettingsViewProps {
  /** the project box, from the project feature; it gets the class of the boxes here */
  projectSection: (className: string) => ReactNode;
}

/**
 * Two columns: the open project, the output port and the language; the two locks, the mode (changing the rig) and the channel lock
 * (e.g. the laser), each with its own controls, and changing the password in Setup mode. The port doesn't wait for the
 * lock status, it needs no password.
 */
const SettingsView = ({projectSection}: SettingsViewProps) => {
  const {i18n} = useLingui();
  const lockStatus = useAppStore((state) => state.lockStatus);
  const error = useAppStore((state) => state.lockError);

  return (
    <div className={settingsView}>
      <div className={settingsColumn}>
        {projectSection(settingsSection)}
        <OutputSection />
        <LanguageSection />
      </div>
      <div className={settingsColumn}>
        {error && <span className={errorMessage}>{i18n._(error)}</span>}
        {lockStatus.mode === 'loading' ? (
          <span className={message}>
            <Trans>Asking whether the app is locked…</Trans>
          </span>
        ) : (
          <>
            <ModeSection lockStatus={lockStatus} />
            <ChannelLockSection lockStatus={lockStatus} />
            {lockStatus.mode === 'setup' && <PasswordSection />}
          </>
        )}
      </div>
    </div>
  );
};

export default SettingsView;
