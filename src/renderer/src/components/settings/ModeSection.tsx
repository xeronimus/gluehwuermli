import {useState} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import type {LockStatus} from '@shared/ipc';

import {useActionLock, useActionUnlock} from '@/state/actionHooks/lockActions';

import Button from '../commons/Button';
import {LockIcon, UnlockIcon} from '../commons/icons';
import PasswordForm from './PasswordForm';
import {message, settingsSection, statusVariants} from './SettingsView.css';

interface ModeSectionProps {
  lockStatus: LockStatus;
}

/** Show mode or Setup mode, unlocking it with the password and locking it again */
const ModeSection = ({lockStatus}: ModeSectionProps) => {
  const {t} = useLingui();
  const unlock = useActionUnlock();
  const lock = useActionLock();
  const [unlocking, setUnlocking] = useState(false);
  const setupMode = lockStatus.mode === 'setup';

  return (
    <section className={settingsSection}>
      <h2>
        <Trans>Mode</Trans>
      </h2>
      <span className={statusVariants[setupMode ? 'attention' : 'calm']}>
        {setupMode ? <UnlockIcon /> : <LockIcon />} {setupMode ? <Trans>Setup mode</Trans> : <Trans>Show mode</Trans>}
      </span>
      <p className={message}>
        {setupMode ? (
          <Trans>
            Fixtures, presets and scenes can be changed, and the Channels view is open. Back to Show mode with Lock,
            after 10 minutes without input, or on restart.
          </Trans>
        ) : (
          <Trans>Fixtures, presets and scenes can be played, not changed. Unlock Setup mode to change them.</Trans>
        )}
      </p>
      {setupMode && (
        <Button variant="primary" onClick={() => void lock()}>
          <LockIcon /> <Trans>Lock</Trans>
        </Button>
      )}
      {!setupMode && !unlocking && (
        <Button onClick={() => setUnlocking(true)}>
          <UnlockIcon /> <Trans>Unlock Setup mode</Trans>
        </Button>
      )}
      {!setupMode && unlocking && (
        <PasswordForm
          isNewPassword={!lockStatus.passwordSet}
          submitLabel={lockStatus.passwordSet ? t`Unlock` : t`Set password and unlock`}
          onSubmit={unlock}
          onClose={() => setUnlocking(false)}
        />
      )}
    </section>
  );
};

export default ModeSection;
