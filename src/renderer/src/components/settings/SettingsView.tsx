import {Trans, useLingui} from '@lingui/react/macro';

import {useAppStore} from '@/state/store';

import ChannelLockSection from './ChannelLockSection';
import ModeSection from './ModeSection';
import OutputSection from './OutputSection';
import PasswordSection from './PasswordSection';
import {errorMessage, message, settingsView} from './SettingsView.css';

/**
 * The output port, and the two locks: the mode (changing the rig) and the channel lock (e.g. the laser), each with its
 * own controls, and changing the password in Setup mode. The port doesn't wait for the lock status, it needs no
 * password.
 */
const SettingsView = () => {
  const {i18n} = useLingui();
  const lockStatus = useAppStore((state) => state.lockStatus);
  const error = useAppStore((state) => state.lockError);

  return (
    <div className={settingsView}>
      <OutputSection />
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
  );
};

export default SettingsView;
