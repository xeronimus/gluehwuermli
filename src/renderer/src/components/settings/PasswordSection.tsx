import {useState} from 'react';

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
      <h2>Password</h2>
      <p className={message}>
        {changed
          ? 'The password is changed. From now on, the new one unlocks Setup mode and lifts the channel lock.'
          : 'The password unlocks Setup mode and lifts the channel lock. Changing it needs the current one.'}
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
          <PasswordIcon /> Change password
        </Button>
      )}
    </section>
  );
};

export default PasswordSection;
