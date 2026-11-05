import {FormEvent, useState} from 'react';

import {Trans, useLingui} from '@lingui/react/macro';

import {PASSWORD_MAX_LENGTH} from '@shared/ipc';

import {passwordFormError} from '@/data/passwordForm';
import {passwordFormErrorMessage} from '@/i18n/messages/passwordMessages';
import type {PasswordOutcome} from '@/state/actionHooks/lockActions';

import Button from './Button';
import {errorMessage, passwordForm, passwordInput} from './PasswordForm.css';
import {UnlockIcon} from './icons';

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
  const {t, i18n} = useLingui();
  const [form, setForm] = useState(EMPTY_FORM);
  const [wrongPassword, setWrongPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const error = passwordFormError(form, isNewPassword);
  // nothing to complain about before anything is typed
  const shownError = wrongPassword
    ? t`Wrong password`
    : form.password && error
      ? i18n._(passwordFormErrorMessage(error))
      : undefined;

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
        placeholder={isNewPassword ? t`New password` : t`Password`}
        aria-label={isNewPassword ? t`New password` : t`Password`}
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
          placeholder={t`Repeat it`}
          aria-label={t`Repeat the new password`}
          disabled={submitting}
          onChange={(event) => setForm({...form, confirmation: event.target.value})}
        />
      )}
      <Button variant="primary" type="submit" disabled={Boolean(error) || submitting}>
        <UnlockIcon /> {submitLabel}
      </Button>
      <Button onClick={onClose} disabled={submitting}>
        <Trans>Cancel</Trans>
      </Button>
      {shownError && <span className={errorMessage}>{shownError}</span>}
    </form>
  );
};

export default PasswordForm;
