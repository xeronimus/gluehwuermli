import {useAppStore} from '@/state/store';

import ChannelLockSection from './ChannelLockSection';
import ModeSection from './ModeSection';
import OutputSection from './OutputSection';
import {errorMessage, message, settingsView} from './SettingsView.css';

/**
 * The output port, and the two locks: the mode (changing the rig) and the channel lock (e.g. the laser), each with its
 * own controls. The port doesn't wait for the lock status, it needs no password.
 */
const SettingsView = () => {
  const lockStatus = useAppStore((state) => state.lockStatus);
  const error = useAppStore((state) => state.lockError);

  return (
    <div className={settingsView}>
      <OutputSection />
      {error && <span className={errorMessage}>{error}</span>}
      {lockStatus.mode === 'loading' ? (
        <span className={message}>Asking whether the app is locked…</span>
      ) : (
        <>
          <ModeSection lockStatus={lockStatus} />
          <ChannelLockSection lockStatus={lockStatus} />
        </>
      )}
    </div>
  );
};

export default SettingsView;
