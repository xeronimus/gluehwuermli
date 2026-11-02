import {PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH} from '@shared/ipc';

/** what keeps a password form from being sent, as a code the UI says in its language (i18n/messages) */
export type PasswordFormError = 'too-short' | 'too-long' | 'mismatch' | 'current-missing' | 'same-as-current';

const lengthError = (password: string): PasswordFormError | undefined => {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return 'too-short';
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return 'too-long';
  }
  return undefined;
};

/** what keeps a password change from being sent; undefined when it can be */
export function changePasswordFormError(form: {
  currentPassword: string;
  newPassword: string;
  confirmation: string;
}): PasswordFormError | undefined {
  // the main process checks the current password, its length doesn't matter here
  const error =
    (form.currentPassword ? undefined : 'current-missing') ??
    passwordFormError({password: form.newPassword, confirmation: form.confirmation}, true);
  if (error) {
    return error;
  }
  return form.newPassword === form.currentPassword ? 'same-as-current' : undefined;
}

/** what keeps the password from being sent; undefined when it can be. A new one is typed twice, to catch a typo */
export function passwordFormError(
  form: {password: string; confirmation: string},
  isNewPassword: boolean
): PasswordFormError | undefined {
  const error = lengthError(form.password);
  if (error || !isNewPassword) {
    return error;
  }
  return form.password === form.confirmation ? undefined : 'mismatch';
}
