import {FormEvent, useState} from 'react';

import {PASSWORD_MAX_LENGTH} from '@shared/ipc';

import {changePasswordFormError} from '@/data/passwordForm';
import {useActionChangePassword} from '@/state/actionHooks/lockActions';

import Button from '../commons/Button';
import {PasswordIcon} from '../commons/icons';
import {changePasswordForm, errorMessage, passwordForm, passwordInput} from './SettingsView.css';

interface ChangePasswordFormProps {
  onChanged: () => void;
  onClose: () => void;
}

const EMPTY_FORM = {currentPassword: '', newPassword: '', confirmation: ''};

type FormField = keyof typeof EMPTY_FORM;

const FIELD_LABELS: Record<FormField, string> = {
  currentPassword: 'Current password',
  newPassword: 'New password',
  confirmation: 'Repeat the new password'
};

/** a row per step: the current password, then the new one twice */
const FIELD_ROWS: readonly (readonly FormField[])[] = [['currentPassword'], ['newPassword', 'confirmation']];

/** the current password and the new one twice, inline like PasswordForm; a failed save shows in lockError */
const ChangePasswordForm = ({onChanged, onClose}: ChangePasswordFormProps) => {
  const changePassword = useActionChangePassword();
  const [form, setForm] = useState(EMPTY_FORM);
  const [wrongPassword, setWrongPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const error = changePasswordFormError(form);
  // nothing to complain about before the new password is typed
  const shownError = wrongPassword ? 'Wrong current password' : form.newPassword ? error : undefined;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (error || submitting) {
      return;
    }
    setSubmitting(true);
    const outcome = await changePassword(form.currentPassword, form.newPassword);
    setSubmitting(false);
    if (outcome === 'accepted') {
      onChanged();
    } else if (outcome === 'wrong-password') {
      setWrongPassword(true);
      setForm({...form, currentPassword: ''});
    }
  };

  return (
    <form
      className={changePasswordForm}
      onSubmit={(event) => void submit(event)}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !submitting) {
          onClose();
        }
      }}
    >
      {FIELD_ROWS.map((fields) => (
        <div key={fields.join()} className={passwordForm}>
          {fields.map((field) => (
            <input
              key={field}
              className={passwordInput}
              type="password"
              value={form[field]}
              maxLength={PASSWORD_MAX_LENGTH}
              placeholder={FIELD_LABELS[field]}
              aria-label={FIELD_LABELS[field]}
              autoFocus={field === 'currentPassword'}
              disabled={submitting}
              onChange={(event) => {
                setWrongPassword(false);
                setForm({...form, [field]: event.target.value});
              }}
            />
          ))}
        </div>
      ))}
      <div className={passwordForm}>
        <Button variant="primary" type="submit" disabled={Boolean(error) || submitting}>
          <PasswordIcon /> Change password
        </Button>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        {shownError && <span className={errorMessage}>{shownError}</span>}
      </div>
    </form>
  );
};

export default ChangePasswordForm;
