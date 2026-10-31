import {useState} from 'react';

import type {LockStatus} from '@shared/ipc';

import {useActionLiftChannelLock, useActionLockChannels} from '@/state/actionHooks/lockActions';

import Button from '../commons/Button';
import {LockIcon, UnlockIcon} from '../commons/icons';
import PasswordForm from './PasswordForm';
import {message, settingsSection, statusVariants} from './SettingsView.css';

interface ChannelLockSectionProps {
  lockStatus: LockStatus;
}

const LIFT_CONFIRMATION = 'Lift the channel lock? Locked channels, e.g. a laser, can then be set to any value.';

/**
 * The channel lock, independent of the mode: lifting it needs the password in Show mode (in Setup mode it was typed
 * already, a confirmation is enough). It stays lifted until turned on again or the app restarts.
 */
const ChannelLockSection = ({lockStatus}: ChannelLockSectionProps) => {
  const liftChannelLock = useActionLiftChannelLock();
  const lockChannels = useActionLockChannels();
  const [askingPassword, setAskingPassword] = useState(false);

  const onLift = () => {
    if (lockStatus.mode === 'show') {
      setAskingPassword(true);
    } else if (window.confirm(LIFT_CONFIRMATION)) {
      void liftChannelLock(undefined);
    }
  };

  return (
    <section className={settingsSection}>
      <h2>Channel lock</h2>
      <span className={statusVariants[lockStatus.channelLocked ? 'calm' : 'danger']}>
        {lockStatus.channelLocked ? <LockIcon /> : <UnlockIcon />}{' '}
        {lockStatus.channelLocked ? 'Channel lock on' : 'Channel lock lifted'}
      </span>
      <p className={message}>
        {lockStatus.channelLocked
          ? 'Channels with a "Max while locked" (e.g. a laser) never go above it, whichever fader or preset sets them.'
          : 'Locked channels can be set to any value, also in Show mode, until the lock is turned on again or the app restarts.'}
      </p>
      {!lockStatus.channelLocked && (
        <Button variant="primary" onClick={() => void lockChannels()}>
          <LockIcon /> Turn channel lock on
        </Button>
      )}
      {lockStatus.channelLocked && !askingPassword && (
        <Button onClick={onLift}>
          <UnlockIcon /> Lift channel lock
        </Button>
      )}
      {lockStatus.channelLocked && askingPassword && (
        <PasswordForm
          isNewPassword={!lockStatus.passwordSet}
          submitLabel="Lift channel lock"
          onSubmit={liftChannelLock}
          onClose={() => setAskingPassword(false)}
        />
      )}
    </section>
  );
};

export default ChannelLockSection;
