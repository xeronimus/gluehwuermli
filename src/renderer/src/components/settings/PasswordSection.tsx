import {useState} from 'react';

import {Trans} from '@lingui/react/macro';

import Button from '../commons/Button';
import {PasswordIcon} from '../commons/icons';
import ChangePasswordForm from './ChangePasswordForm';
import {message, settingsSection} from './SettingsView.css';

/** changing the password, shown in Setup mode only; main refuses it in Show mode */
const PasswordSection = () => {
  const [changing, setChanging] = useState(false);
  const [changed, setChanged] = useState(false);

  return (
    <section className={settingsSection}>
      <h2>
        <Trans>Password</Trans>
      </h2>
      <p className={message}>
        {changed ? (
          <Trans>
            The password is changed. From now on, the new one unlocks Setup mode and lifts the channel lock.
          </Trans>
        ) : (
          <Trans>The password unlocks Setup mode and lifts the channel lock. Changing it needs the current one.</Trans>
        )}
      </p>
      {changing ? (
        <ChangePasswordForm
          onChanged={() => {
            setChanged(true);
            setChanging(false);
          }}
          onClose={() => setChanging(false)}
        />
      ) : (
        <Button
          onClick={() => {
            setChanged(false);
            setChanging(true);
          }}
        >
          <PasswordIcon /> <Trans>Change password</Trans>
        </Button>
      )}
    </section>
  );
};

export default PasswordSection;
