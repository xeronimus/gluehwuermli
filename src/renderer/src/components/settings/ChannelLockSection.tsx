import {useState} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import type {LockStatus} from '@shared/ipc';

import {useActionLiftChannelLock, useActionLockChannels} from '@/state/actionHooks/lockActions';

import Button from '../commons/Button';
import {LockIcon, UnlockIcon} from '../commons/icons';
import PasswordForm from './PasswordForm';
import {message, settingsSection, statusVariants} from './SettingsView.css';

interface ChannelLockSectionProps {
  lockStatus: LockStatus;
}

/**
 * The channel lock, independent of the mode: lifting it needs the password in Show mode (in Setup mode it was typed
 * already, a confirmation is enough). It stays lifted until turned on again or the app restarts.
 */
const ChannelLockSection = ({lockStatus}: ChannelLockSectionProps) => {
  const {t} = useLingui();
  const liftChannelLock = useActionLiftChannelLock();
  const lockChannels = useActionLockChannels();
  const [askingPassword, setAskingPassword] = useState(false);

  const onLift = () => {
    if (lockStatus.mode === 'show') {
      setAskingPassword(true);
    } else if (window.confirm(t`Lift the channel lock? Locked channels, e.g. a laser, can then be set to any value.`)) {
      void liftChannelLock(undefined);
    }
  };

  return (
    <section className={settingsSection}>
      <h2>
        <Trans>Channel lock</Trans>
      </h2>
      <span className={statusVariants[lockStatus.channelLocked ? 'calm' : 'danger']}>
        {lockStatus.channelLocked ? <LockIcon /> : <UnlockIcon />}{' '}
        {lockStatus.channelLocked ? <Trans>Channel lock on</Trans> : <Trans>Channel lock lifted</Trans>}
      </span>
      <p className={message}>
        {lockStatus.channelLocked ? (
          <Trans>
            Channels with a "Max while locked" (e.g. a laser) never go above it, whichever fader or preset sets them.
          </Trans>
        ) : (
          <Trans>
            Locked channels can be set to any value, also in Show mode, until the lock is turned on again or the app
            restarts.
          </Trans>
        )}
      </p>
      {!lockStatus.channelLocked && (
        <Button variant="primary" onClick={() => void lockChannels()}>
          <LockIcon /> <Trans>Turn channel lock on</Trans>
        </Button>
      )}
      {lockStatus.channelLocked && !askingPassword && (
        <Button onClick={onLift}>
          <UnlockIcon /> <Trans>Lift channel lock</Trans>
        </Button>
      )}
      {lockStatus.channelLocked && askingPassword && (
        <PasswordForm
          isNewPassword={!lockStatus.passwordSet}
          submitLabel={t`Lift channel lock`}
          onSubmit={liftChannelLock}
          onClose={() => setAskingPassword(false)}
        />
      )}
    </section>
  );
};

export default ChannelLockSection;
