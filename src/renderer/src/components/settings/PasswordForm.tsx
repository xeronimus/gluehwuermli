import {FormEvent, useState} from 'react';

import {PASSWORD_MAX_LENGTH} from '@shared/ipc';

import {passwordFormError} from '@/data/passwordForm';
import type {PasswordOutcome} from '@/state/actionHooks/lockActions';

import Button from '../commons/Button';
import {UnlockIcon} from '../commons/icons';
import {errorMessage, passwordForm, passwordInput} from './SettingsView.css';

interface PasswordFormProps {
  /** no password set yet: the one typed (twice) becomes the password */
  isNewPassword: boolean;
  submitLabel: string;
  onSubmit: (password: string) => Promise<PasswordOutcome>;
  onClose: () => void;
}

const EMPTY_FORM = {password: '', confirmation: ''};

/** the password, inline; Electron has no window.prompt. Closes once the main process accepted it */
const PasswordForm = ({isNewPassword, submitLabel, onSubmit, onClose}: PasswordFormProps) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [wrongPassword, setWrongPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const error = passwordFormError(form, isNewPassword);
  // nothing to complain about before anything is typed
  const shownError = wrongPassword ? 'Wrong password' : form.password ? error : undefined;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (error || submitting) {
      return;
    }
    setSubmitting(true);
    const outcome = await onSubmit(form.password);
    setSubmitting(false);
    if (outcome === 'accepted') {
      onClose();
    } else if (outcome === 'wrong-password') {
      setWrongPassword(true);
      setForm(EMPTY_FORM);
    }
  };

  return (
    <form
      className={passwordForm}
      onSubmit={(event) => void submit(event)}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !submitting) {
          onClose();
        }
      }}
    >
      <input
        className={passwordInput}
        type="password"
        value={form.password}
        maxLength={PASSWORD_MAX_LENGTH}
        placeholder={isNewPassword ? 'New password' : 'Password'}
        aria-label={isNewPassword ? 'New password' : 'Password'}
        autoFocus
        disabled={submitting}
        onChange={(event) => {
          setWrongPassword(false);
          setForm({...form, password: event.target.value});
        }}
      />
      {isNewPassword && (
        <input
          className={passwordInput}
          type="password"
          value={form.confirmation}
          maxLength={PASSWORD_MAX_LENGTH}
          placeholder="Repeat it"
          aria-label="Repeat the new password"
          disabled={submitting}
          onChange={(event) => setForm({...form, confirmation: event.target.value})}
        />
      )}
      <Button variant="primary" type="submit" disabled={Boolean(error) || submitting}>
        <UnlockIcon /> {submitLabel}
      </Button>
      <Button onClick={onClose} disabled={submitting}>
        Cancel
      </Button>
      {shownError && <span className={errorMessage}>{shownError}</span>}
    </form>
  );
};

export default PasswordForm;
