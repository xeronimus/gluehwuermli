import {FormEvent, useState} from 'react';

import type {MessageDescriptor} from '@lingui/core';
import {msg} from '@lingui/core/macro';
import {Trans, useLingui} from '@lingui/react/macro';

import {PASSWORD_MAX_LENGTH} from '@shared/ipc';

import {changePasswordFormError} from '@/data/passwordForm';
import {passwordFormErrorMessage} from '@/i18n/messages/passwordMessages';
import {useActionChangePassword} from '@/state/actionHooks/lockActions';
import {useAppStore} from '@/state/store';

import Button from '../commons/Button';
import {passwordForm, passwordInput} from '../commons/PasswordForm.css';
import {PasswordIcon} from '../commons/icons';
import {changePasswordForm, errorMessage} from './SettingsView.css';

interface ChangePasswordFormProps {
  onChanged: () => void;
  onClose: () => void;
}

const EMPTY_FORM = {currentPassword: '', newPassword: '', confirmation: ''};

type FormField = keyof typeof EMPTY_FORM;

const FIELD_LABELS: Record<FormField, MessageDescriptor> = {
  currentPassword: msg`Current password`,
  newPassword: msg`New password`,
  confirmation: msg`Repeat the new password`
};

/** a row per step: the current password, then the new one twice */
const FIELD_ROWS: readonly (readonly FormField[])[] = [['currentPassword'], ['newPassword', 'confirmation']];

/**
 * the current password and the new one twice, inline like PasswordForm; a failed save shows here too, not only in
 * lockError at the top of the view
 */
const ChangePasswordForm = ({onChanged, onClose}: ChangePasswordFormProps) => {
  const {t, i18n} = useLingui();
  const changePassword = useActionChangePassword();
  const lockError = useAppStore((state) => state.lockError);
  const [form, setForm] = useState(EMPTY_FORM);
  const [refusal, setRefusal] = useState<'wrong-password' | 'failed'>();
  const [submitting, setSubmitting] = useState(false);

  const error = changePasswordFormError(form);
  const refusalMessage =
    refusal === 'wrong-password' ? t`Wrong current password` : refusal && lockError && i18n._(lockError);
  // nothing to complain about before the new password is typed
  const shownError =
    refusalMessage || (form.newPassword && error ? i18n._(passwordFormErrorMessage(error)) : undefined);

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
      return;
    }
    setRefusal(outcome);
    if (outcome === 'wrong-password') {
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
              placeholder={i18n._(FIELD_LABELS[field])}
              aria-label={i18n._(FIELD_LABELS[field])}
              autoFocus={field === 'currentPassword'}
              disabled={submitting}
              onChange={(event) => {
                setRefusal(undefined);
                setForm({...form, [field]: event.target.value});
              }}
            />
          ))}
        </div>
      ))}
      <div className={passwordForm}>
        <Button variant="primary" type="submit" disabled={Boolean(error) || submitting}>
          <PasswordIcon /> <Trans>Change password</Trans>
        </Button>
        <Button onClick={onClose} disabled={submitting}>
          <Trans>Cancel</Trans>
        </Button>
        {shownError && <span className={errorMessage}>{shownError}</span>}
      </div>
    </form>
  );
};

export default ChangePasswordForm;
